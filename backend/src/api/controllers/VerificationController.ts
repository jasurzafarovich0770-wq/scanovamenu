import { Request, Response } from 'express';
import { sendEmailCode, sendSmsCode } from '../../infrastructure/notifier';
import { logger } from '../../infrastructure/logger';
import { redisManager } from '../../infrastructure/redis';

// Redis mavjud bo'lmasa in-memory fallback
const memStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeKey(type: string, target: string) {
  return `verify:${type}:${target.toLowerCase().trim()}`;
}

function rateLimitKey(type: string, target: string) {
  return `verify:rate:${type}:${target.toLowerCase().trim()}`;
}

async function storeCode(key: string, code: string): Promise<void> {
  const data = { code, expiresAt: Date.now() + 120_000, attempts: 0 };
  const ok = await redisManager.setJson(key, data, 120);
  if (!ok) memStore.set(key, data);
}

async function getCode(key: string): Promise<{ code: string; expiresAt: number; attempts: number } | null> {
  const fromRedis = await redisManager.getJson<{ code: string; expiresAt: number; attempts: number }>(key);
  if (fromRedis) return fromRedis;
  return memStore.get(key) || null;
}

async function updateAttempts(key: string, entry: { code: string; expiresAt: number; attempts: number }): Promise<void> {
  const ttl = Math.ceil((entry.expiresAt - Date.now()) / 1000);
  if (ttl > 0) {
    const ok = await redisManager.setJson(key, entry, ttl);
    if (!ok) memStore.set(key, entry);
  }
}

async function deleteCode(key: string): Promise<void> {
  await redisManager.del(key);
  memStore.delete(key);
}

async function isRateLimited(key: string): Promise<boolean> {
  const val = await redisManager.get(key);
  if (val) return true;
  const mem = memStore.get(key);
  return !!(mem && mem.expiresAt > Date.now());
}

async function setRateLimit(key: string): Promise<void> {
  const ok = await redisManager.set(key, '1', 60);
  if (!ok) memStore.set(key, { code: '1', expiresAt: Date.now() + 60_000, attempts: 0 });
}

export const VerificationController = {
  // POST /api/verify/send
  async send(req: Request, res: Response) {
    const { type, target } = req.body as { type: 'email' | 'phone'; target: string };

    if (!type || !target) {
      return res.status(400).json({ success: false, message: 'type va target majburiy' });
    }
    if (type !== 'email' && type !== 'phone') {
      return res.status(400).json({ success: false, message: "type 'email' yoki 'phone' bo'lishi kerak" });
    }

    // Input sanitize
    const cleanTarget = target.toLowerCase().trim();
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTarget)) {
      return res.status(400).json({ success: false, message: "Email formati noto'g'ri" });
    }
    if (type === 'phone' && cleanTarget.replace(/\D/g, '').length < 9) {
      return res.status(400).json({ success: false, message: "Telefon raqam noto'g'ri" });
    }

    const rateKey = rateLimitKey(type, cleanTarget);
    if (await isRateLimited(rateKey)) {
      return res.status(429).json({ success: false, message: 'Iltimos, 1 daqiqa kuting' });
    }

    const code = genCode();
    const key = storeKey(type, cleanTarget);
    await storeCode(key, code);
    await setRateLimit(rateKey);

    let sent = false;
    if (type === 'email') {
      sent = await sendEmailCode(cleanTarget, code);
    } else {
      sent = await sendSmsCode(cleanTarget, code);
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (!sent && isDev) {
      logger.info(`[DEV] Tasdiqlash kodi (${type} → ${cleanTarget}): ${code}`);
    }

    return res.json({
      success: true,
      sent,
      dev: !sent && isDev ? code : undefined,
      message: sent
        ? `Kod ${type === 'email' ? 'emailga' : 'telefonga'} yuborildi`
        : 'Kod serverda saqlandi (servis sozlanmagan)',
    });
  },

  // POST /api/verify/check
  async check(req: Request, res: Response) {
    const { type, target, code } = req.body as { type: string; target: string; code: string };

    if (!type || !target || !code) {
      return res.status(400).json({ success: false, message: 'type, target va code majburiy' });
    }

    const cleanTarget = target.toLowerCase().trim();
    const key = storeKey(type, cleanTarget);
    const entry = await getCode(key);

    if (!entry) {
      return res.status(400).json({ success: false, message: 'Kod topilmadi. Qayta yuboring.' });
    }
    if (Date.now() > entry.expiresAt) {
      await deleteCode(key);
      return res.status(400).json({ success: false, message: 'Kod muddati tugagan. Qayta yuboring.' });
    }
    if (entry.attempts >= 5) {
      await deleteCode(key);
      return res.status(400).json({ success: false, message: "Juda ko'p urinish. Qayta yuboring." });
    }
    if (entry.code !== code.trim()) {
      entry.attempts++;
      await updateAttempts(key, entry);
      return res.status(400).json({
        success: false,
        message: "Kod noto'g'ri",
        attemptsLeft: 5 - entry.attempts,
      });
    }

    await deleteCode(key);
    return res.json({ success: true, message: 'Tasdiqlandi' });
  },
};
