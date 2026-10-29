import React from 'react';
import { Ticket, X, Copy } from 'lucide-react';
interface CouponsModalProps { isOpen: boolean; onClose: () => void }
export const CouponsModal: React.FC<CouponsModalProps> = ({ isOpen, onClose }) => {
 if (!isOpen) return null;
 return <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-floating border border-gray-100 space-y-4 animate-in zoom-in-95">
  <div className="flex items-center justify-between pb-2 border-b border-gray-100"><div className="flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /><h3 className="font-extrabold text-base text-ink">Cupones de Descuento</h3></div><button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Cerrar modal de cupones"><X className="w-5 h-5" /></button></div>
  <p className="text-xs text-gray-500 leading-relaxed">Los cupones y descuentos no están habilitados actualmente.</p>
  <div role="status" className="p-3.5 rounded-2xl border border-dashed border-primary/40 bg-primary-50/60 flex items-center justify-between gap-3"><p className="text-xs font-medium text-gray-700">No hay códigos disponibles para aplicar a tu pedido.</p><button type="button" disabled className="flex items-center gap-1 text-xs font-bold text-primary bg-white border border-primary/30 px-3 py-1.5 rounded-lg shadow-sm opacity-50"><Copy className="w-3.5 h-3.5" />Copiar</button></div>
  <div className="pt-2"><button type="button" disabled className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm opacity-50">Descuentos no disponibles</button></div>
 </div></div>;
};
