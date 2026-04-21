import { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon } from './Icons';

interface Props {
  isOpen: boolean;
  target: string;
  type: 'email' | 'phone';
  timeLeft: number;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => void;
  onCancel: () => void;
}

export default function VerificationModal({ isOpen, target, type, timeLeft, onVerify, onResend, onCancel }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Dev mode: avtomatik kod kiritish
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail?.code as string;
      if (code && code.length === 6) {
        const arr = code.split('');
        setDigits(arr);
        setTimeout(() => {
          const finalCode = code;
          if (finalCode.length < 6) return;
          setLoading(true);
          onVerify(finalCode).then(ok => {
            setLoading(false);
            if (!ok) {
              setError('Kod noto\'g\'ri yoki muddati tugagan');
              setDigits(['', '', '', '', '', '']);
              setTimeout(() => inputRefs.current[0]?.focus(), 50);
            }
          });
        }, 300);
      }
    };
    window.addEventListener('dev-verification-code', handler);
    return () => window.removeEventListener('dev-verification-code', handler);
  }, [isOpen, onVerify]);

  if (!isOpen) return null;

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    // Auto-submit when all 6 digits filled
    if (v && i === 5 && next.every(d => d !== '')) {
      handleSubmit(next.join(''));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (code?: string) => {
    const finalCode = code || digits.join('');
    if (finalCode.length < 6) { setError('6 xonali kodni kiriting'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const ok = await onVerify(finalCode);
    setLoading(false);
    if (!ok) {
      setError('Kod noto\'g\'ri yoki muddati tugagan');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const label = type === 'email' ? 'Email' : 'Telefon';
  const icon = type === 'email' ? '📧' : '📱';
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 border-2 border-blue-200 rounded-2xl mx-auto flex items-center justify-center mb-3 text-2xl">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{label} tasdiqlash</h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">{target}</span> ga yuborilgan 6 xonali kodni kiriting
          </p>
        </div>

        {/* 6-digit input */}
        <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-900'
              } ${error ? 'border-red-400 bg-red-50' : ''} focus:border-blue-500`}
            />
          ))}
        </div>

        {error && <p className="text-center text-sm text-red-500 mb-3">{error}</p>}

        {/* Timer */}
        <div className="text-center mb-4">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-500">
              Kod amal qilish vaqti: <span className={`font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-gray-700'}`}>{mins}:{String(secs).padStart(2, '0')}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Kod muddati tugadi</p>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleSubmit()}
            disabled={loading || digits.join('').length < 6}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
            Tasdiqlash
          </button>
          <div className="flex gap-2">
            <button
              onClick={onResend}
              disabled={timeLeft > 90}
              className="flex-1 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Qayta yuborish
            </button>
            <button onClick={onCancel} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
              Bekor qilish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
