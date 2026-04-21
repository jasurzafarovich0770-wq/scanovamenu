import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import jsQR from 'jsqr';

export default function QRScanner() {
  const [scannedData, setScannedData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = localStorage.getItem('qr-scan-history');
    if (h) setScanHistory(JSON.parse(h));
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const saveAndNavigate = useCallback((data: string) => {
    setScannedData(data);
    setScanHistory(prev => {
      const next = [data, ...prev.filter(i => i !== data)].slice(0, 10);
      localStorage.setItem('qr-scan-history', JSON.stringify(next));
      return next;
    });
    toast.success('QR kod skanerlandi!');
    const match = data.match(/\/r\/([^/]+)\/t\/(\d+)/);
    if (match) navigate(`/r/${match[1]}/t/${match[2]}`);
  }, [navigate]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code) {
      stopCamera();
      saveAndNavigate(code.data);
      return;
    }
    animFrameRef.current = requestAnimationFrame(tick);
  }, [saveAndNavigate, stopCamera]);

  const startCamera = useCallback(async () => {
    setError('');

    if (
      location.protocol !== 'https:' &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1'
    ) {
      const msg = 'Kamera faqat HTTPS yoki localhost da ishlaydi.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Brauzeringiz kamerani qo\'llab-quvvatlamaydi.';
      setError(msg);
      toast.error(msg);
      return;
    }

    // Avval orqa kamera (mobil), keyin istalgan kamera (desktop)
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: 'environment' } } },
      { video: { facingMode: 'environment' } },
      { video: true },
    ];

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    for (const c of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!stream) {
      let msg = 'Kamera yoqishda xatolik.';
      if (lastErr?.name === 'NotAllowedError' || lastErr?.name === 'PermissionDeniedError') {
        msg = 'Kameraga ruxsat berilmadi. Brauzer manzil satridagi 🔒 belgisini bosib ruxsat bering.';
      } else if (lastErr?.name === 'NotFoundError' || lastErr?.name === 'DevicesNotFoundError') {
        msg = 'Kamera qurilmasi topilmadi.';
      } else if (lastErr?.name === 'NotReadableError') {
        msg = 'Kamera boshqa dastur tomonidan ishlatilmoqda. Boshqa ilovalarni yoping.';
      } else if (lastErr?.message) {
        msg = 'Xatolik: ' + lastErr.message;
      }
      setError(msg);
      toast.error(msg);
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
    setIsScanning(true);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) saveAndNavigate(code.data);
      else toast.error('Rasmda QR kod topilmadi');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14h1v1h-1zM17 17h3v3h-3zM20 20h1v1h-1z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white">QR Scanner</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Bosh sahifa
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-blue-200 font-medium mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Restoran QR kodini skanerlang
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">QR Kod Skanerlash</h1>
          <p className="text-blue-200/70">Kamerani yoqing yoki rasm yuklang</p>
        </div>

        {/* Scanner Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-6">
          {/* Video area */}
          <div className="relative bg-black/50" style={{ aspectRatio: '1/1' }}>
            <video ref={videoRef} className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`} playsInline muted />

            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Corner brackets */}
                <div className="w-56 h-56 relative">
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-blue-400 rounded-tl-lg" style={{ borderWidth: '3px' }} />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-blue-400 rounded-tr-lg" style={{ borderWidth: '3px' }} />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-blue-400 rounded-bl-lg" style={{ borderWidth: '3px' }} />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-blue-400 rounded-br-lg" style={{ borderWidth: '3px' }} />
                  {/* Scan line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan-line shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                </div>
                {/* Status */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-medium">Skanerlanyapti...</span>
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <p className="text-white/40 text-sm">Kamerani yoqish uchun tugmani bosing</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="p-4 flex gap-3">
            {!isScanning ? (
              <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
                Kamerani Yoqish
              </button>
            ) : (
              <button onClick={stopCamera} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-2xl border border-red-500/30 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                To'xtatish
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl border border-white/20 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Rasm
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>
        </div>

        {/* Scanned result */}
        {scannedData && (
          <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">Skanerlandi</span>
            </div>
            <p className="text-white/80 break-all font-mono text-sm bg-black/20 rounded-xl p-3">{scannedData}</p>
          </div>
        )}

        {/* History */}
        {scanHistory.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white/70 text-sm font-semibold">Tarix</span>
              <button onClick={() => { setScanHistory([]); localStorage.removeItem('qr-scan-history'); toast.success('Tozalandi'); }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors">Tozalash</button>
            </div>
            <div className="p-2 space-y-1">
              {scanHistory.map((item, i) => (
                <button key={i} onClick={() => saveAndNavigate(item)}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <p className="text-white/60 break-all font-mono text-xs">{item}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
