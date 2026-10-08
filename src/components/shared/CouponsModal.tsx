import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, X, Check, Copy } from 'lucide-react';

interface CouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CouponsModal: React.FC<CouponsModalProps> = ({ isOpen, onClose }) => {
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const coupons = [
    {
      code: 'TINGO20',
      discount: '20% OFF',
      desc: 'Válido para tu primer pedido en Quickly',
      min: 'Compra mínima S/ 25',
    },
    {
      code: 'ENVIOSELVA',
      discount: 'ENVÍO GRATIS',
      desc: 'Envío sin costo en Rupa Rupa y Caseríos',
      min: 'Sin mínimo de compra',
    },
    {
      code: 'CACAO10',
      discount: 'S/ 10 DCTO',
      desc: 'En chocolates nativos, café y derivados',
      min: 'Compra mínima S/ 40',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-floating border border-gray-100 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-ink">Cupones de Descuento</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal de cupones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Aprovecha estos cupones válidos para comercios y productos de Tingo María:
        </p>

        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="p-3.5 rounded-2xl border border-dashed border-primary/40 bg-pink-50/50 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-primary tracking-wider">
                    {coupon.code}
                  </span>
                  <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded">
                    {coupon.discount}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-700">{coupon.desc}</p>
                <p className="text-[10px] text-gray-400">{coupon.min}</p>
              </div>

              <button
                type="button"
                onClick={() => copyCouponCode(coupon.code)}
                className="flex items-center gap-1 text-xs font-bold text-primary bg-white border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm flex-shrink-0"
              >
                {copiedCoupon === coupon.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/negocios');
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            Explorar productos con descuento
          </button>
        </div>
      </div>
    </div>
  );
};
