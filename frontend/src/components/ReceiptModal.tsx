import { useRef } from 'react';
import toast from 'react-hot-toast';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptProps {
  order: {
    id: string;
    orderNumber: string;
    tableNumber: string;
    items: ReceiptItem[];
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    serviceFeePercent?: number;
  };
  restaurantName?: string;
  onClose: () => void;
}

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const STATUS_UZ: Record<string, string> = {
  PENDING: 'Kutilmoqda', CONFIRMED: 'Tasdiqlandi', PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor', SERVED: 'Berildi', COMPLETED: 'Yakunlandi', CANCELLED: 'Bekor qilindi',
};

export default function ReceiptModal({ order, restaurantName = 'Restoran', onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const serviceFee = order.serviceFeePercent
    ? Math.round(order.total * order.serviceFeePercent / (100 + order.serviceFeePercent))
    : 0;
  const subtotal = order.total - serviceFee;

  const handlePrint = () => {
    const content = receiptRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) { toast.error('Popup bloklangan. Brauzer sozlamalarini tekshiring.'); return; }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Chek #${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; padding: 16px; }
          .receipt { max-width: 300px; margin: 0 auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 16px; }
          .xlarge { font-size: 20px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 4px 0; }
          .badge { display: inline-block; padding: 2px 8px; border: 1px solid #000; border-radius: 4px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center bold xlarge">${restaurantName}</div>
          <div class="center" style="margin-top:4px; font-size:10px;">Buyurtma cheki</div>
          <div class="divider"></div>
          <div class="row"><span>Chek #</span><span class="bold">${order.orderNumber}</span></div>
          <div class="row"><span>Stol</span><span>${order.tableNumber}</span></div>
          <div class="row"><span>Vaqt</span><span>${fmt(order.createdAt)}</span></div>
          <div class="row"><span>To'lov</span><span>${order.paymentMethod === 'CASH' ? 'Naqd pul' : 'Plastik karta'}</span></div>
          <div class="divider"></div>
          <div class="bold" style="margin-bottom:6px;">Buyurtma tarkibi:</div>
          ${order.items.map(item => `
            <div class="row">
              <span>${item.name} × ${item.quantity}</span>
              <span>${(item.price * item.quantity).toLocaleString()} so'm</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          ${serviceFee > 0 ? `
            <div class="row"><span>Subtotal</span><span>${subtotal.toLocaleString()} so'm</span></div>
            <div class="row"><span>Xizmat haqi (${order.serviceFeePercent}%)</span><span>${serviceFee.toLocaleString()} so'm</span></div>
          ` : ''}
          <div class="total-row"><span>JAMI</span><span>${order.total.toLocaleString()} so'm</span></div>
          <div class="divider"></div>
          <div class="center" style="margin-top:8px; font-size:10px;">Xaridingiz uchun rahmat!</div>
          <div class="center" style="font-size:10px; margin-top:4px;">Yana tashrif buyuring 🙏</div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleDownload = () => {
    const lines = [
      `=============================`,
      `       ${restaurantName}`,
      `       BUYURTMA CHEKI`,
      `=============================`,
      `Chek #: ${order.orderNumber}`,
      `Stol:   ${order.tableNumber}`,
      `Vaqt:   ${fmt(order.createdAt)}`,
      `To'lov: ${order.paymentMethod === 'CASH' ? 'Naqd pul' : 'Plastik karta'}`,
      `-----------------------------`,
      `BUYURTMA TARKIBI:`,
      ...order.items.map(i => `  ${i.name} x${i.quantity}  ${(i.price * i.quantity).toLocaleString()} so'm`),
      `-----------------------------`,
      ...(serviceFee > 0 ? [
        `Subtotal:     ${subtotal.toLocaleString()} so'm`,
        `Xizmat haqi:  ${serviceFee.toLocaleString()} so'm`,
      ] : []),
      `JAMI:         ${order.total.toLocaleString()} so'm`,
      `=============================`,
      `  Xaridingiz uchun rahmat!`,
      `=============================`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chek-${order.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chek yuklab olindi');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Buyurtma cheki</p>
            <p className="text-gray-400 text-xs">#{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors">
              <PrintIcon /> Chop etish
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-colors">
              <DownloadIcon /> Yuklab olish
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-lg">✕</button>
          </div>
        </div>

        {/* Receipt body */}
        <div ref={receiptRef} className="p-5 font-mono text-sm bg-white">
          {/* Restaurant name */}
          <div className="text-center mb-4">
            <p className="font-bold text-base text-gray-900">{restaurantName}</p>
            <p className="text-gray-500 text-xs">Buyurtma cheki</p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Order info */}
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex justify-between"><span className="text-gray-500">Chek #</span><span className="font-bold">{order.orderNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Stol</span><span>{order.tableNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Vaqt</span><span>{fmt(order.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">To'lov</span>
              <span className={`font-semibold ${order.paymentMethod === 'CASH' ? 'text-green-700' : 'text-blue-700'}`}>
                {order.paymentMethod === 'CASH' ? 'Naqd pul' : 'Plastik karta'}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Holat</span>
              <span className="font-semibold">{STATUS_UZ[order.status] || order.status}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Items */}
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Buyurtma tarkibi</p>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-700 flex-1 truncate pr-2">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                <span className="font-semibold text-gray-900 shrink-0">{(item.price * item.quantity).toLocaleString()} so'm</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            {serviceFee > 0 && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{subtotal.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Xizmat haqi ({order.serviceFeePercent}%)</span>
                  <span>{serviceFee.toLocaleString()} so'm</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
              <span>JAMI</span>
              <span>{order.total.toLocaleString()} so'm</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="text-center text-xs text-gray-500">
            <p>Xaridingiz uchun rahmat!</p>
            <p className="mt-0.5">Yana tashrif buyuring 🙏</p>
          </div>
        </div>
      </div>
    </div>
  );
}
