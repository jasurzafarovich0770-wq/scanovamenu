import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export type VerifyTarget = 'email' | 'phone';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface VerificationState {
  pending: boolean;
  target: string;
  type: VerifyTarget;
  expiresAt: number;
}

export function useVerification() {
  const [state, setState] = useState<VerificationState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = (seconds: number) => {
    clearTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearTimer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async (target: string, type: VerifyTarget): Promise<void> => {
    const toastId = toast.loading(
      type === 'email' ? 'Email yuborilmoqda...' : 'SMS yuborilmoqda...'
    );
    try {
      const res = await fetch(`${API_URL}/verify/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target }),
      });
      const data = await res.json() as { success: boolean; sent: boolean; dev?: string; message: string };

      if (!res.ok) {
        toast.error(data.message || 'Xatolik yuz berdi', { id: toastId });
        return;
      }

      setState({ pending: true, target, type, expiresAt: Date.now() + 120_000 });
      startTimer(120);

      if (data.sent) {
        toast.success(
          type === 'email'
            ? `Kod ${target} emailiga yuborildi`
            : `Kod ${target} raqamiga SMS yuborildi`,
          { id: toastId, duration: 5000 }
        );
      } else if (data.dev) {
        // Dev mode — kod toast da ko'rinadi, clipboard ga ham ko'chiriladi
        try { await navigator.clipboard.writeText(data.dev); } catch { /* ignore */ }
        toast.success(
          `📋 Test kodi: ${data.dev}`,
          { id: toastId, duration: 30000, style: { fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold', background: '#1e293b', color: '#f1f5f9' } }
        );
        // Dev mode da kodni avtomatik input ga kiritish uchun event dispatch
        window.dispatchEvent(new CustomEvent('dev-verification-code', { detail: { code: data.dev } }));
      } else {
        toast.success('Kod serverda saqlandi', { id: toastId });
      }
    } catch {
      toast.error('Server bilan aloqa yo\'q', { id: toastId });
    }
  };

  const verify = async (inputCode: string): Promise<boolean> => {
    if (!state) return false;
    if (Date.now() > state.expiresAt) {
      toast.error('Kod muddati tugadi. Qayta yuboring.');
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/verify/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: state.type, target: state.target, code: inputCode.trim() }),
      });
      const data = await res.json() as { success: boolean; message: string };
      if (data.success) {
        clearTimer();
        setState(null);
        return true;
      }
      toast.error(data.message || 'Kod noto\'g\'ri');
      return false;
    } catch {
      toast.error('Server bilan aloqa yo\'q');
      return false;
    }
  };

  const reset = () => {
    clearTimer();
    setState(null);
    setTimeLeft(0);
  };

  return { state, timeLeft, sendCode, verify, reset };
}
