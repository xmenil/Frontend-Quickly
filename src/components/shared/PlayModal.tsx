import React from 'react';
import { Play, X } from 'lucide-react';

interface PlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayModal: React.FC<PlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-floating border border-gray-100 space-y-4 animate-in zoom-in-95 text-ink">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="bg-[#00a650] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
              GRATIS
            </span>
            <h3 className="font-extrabold text-base text-ink">Mercado Play en Quickly</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal de entretenimiento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview Card */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center shadow-inner group">
          <img
            src="https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=800&auto=format&fit=crop&q=80"
            alt="Quickly Play Selva"
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          <div className="absolute flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 ml-1 fill-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow">
              Documental: La Bella Durmiente y el Cacao Nativo
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Disfruta de películas, tutoriales de gastronomía amazónica y documentales de la selva central sin pagar ninguna suscripción.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            Ver ahora gratis
          </button>
        </div>
      </div>
    </div>
  );
};
