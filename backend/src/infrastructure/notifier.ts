import nodemailer from 'nodemailer';
import { logger } from './logger';

// ─── Email (Nodemailer / Gmail / SMTP) ───────────────────────────────────────

function createMailTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || user.trim() === '' || pass.trim() === '') return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

export async function sendEmailCode(email: string, code: string): Promise<boolean> {
  const transport = createMailTransport();
  if (!transport) {
    logger.warn('[Email] SMTP sozlanmagan — kod konsolda: ' + code);
    return false;
  }
  try {
    await transport.sendMail({
      from: `"QR Menu" <${process.env.SMTP_USER === 'resend' ? 'onboarding@resend.dev' : process.env.SMTP_USER}>`,
      to: email,
      subject: 'Tasdiqlash kodi',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#1d4ed8;margin-bottom:8px">Tasdiqlash kodi</h2>
          <p style="color:#6b7280;margin-bottom:16px">Quyidagi kodni kiriting:</p>
          <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:8px;padding:16px;text-align:center">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1d4ed8">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px">Kod 2 daqiqa davomida amal qiladi. Agar siz so'ramagan bo'lsangiz, e'tibor bermang.</p>
        </div>
      `,
    });
    logger.info(`[Email] Kod yuborildi: ${email}`);
    return true;
  } catch (err) {
    logger.error('[Email] Yuborishda xatolik:', err);
    return false;
  }
}

// ─── SMS (Eskiz.uz — O'zbekiston) ────────────────────────────────────────────

export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  const login = process.env.ESKIZ_LOGIN;
  const password = process.env.ESKIZ_PASSWORD;
  const from = process.env.ESKIZ_FROM || '4546';

  const isConfigured = login && password
    && login.trim() !== ''
    && password.trim() !== '';

  if (!isConfigured) {
    logger.warn('[SMS] Eskiz sozlanmagan — kod konsolda: ' + code);
    return false;
  }

  try {
    // 1. Token olish
    const tokenRes = await fetch('https://notify.eskiz.uz/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: login, password }),
    });
    const tokenData = await tokenRes.json() as any;
    const token = tokenData?.data?.token;
    if (!token) throw new Error('Eskiz token olinmadi');

    // 2. SMS yuborish
    const normalized = phone.replace(/\D/g, '');
    const to = normalized.startsWith('998') ? normalized : '998' + normalized.replace(/^0/, '');

    const smsRes = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        mobile_phone: to,
        message: `QR Menu tasdiqlash kodi: ${code}. Kod 2 daqiqa amal qiladi.`,
        from,
      }),
    });
    const smsData = await smsRes.json() as any;
    if (smsData?.status === 'waiting' || smsData?.id) {
      logger.info(`[SMS] Kod yuborildi: ${to}`);
      return true;
    }
    throw new Error(JSON.stringify(smsData));
  } catch (err) {
    logger.error('[SMS] Yuborishda xatolik:', err);
    return false;
  }
}
