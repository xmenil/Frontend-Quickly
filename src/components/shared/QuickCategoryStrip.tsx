import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Smartphone,
  Laptop,
  ChevronRight,
  TrendingDown,
  UtensilsCrossed,
  Pill,
  ShoppingBasket,
  Shirt,
  Sparkles,
} from 'lucide-react';

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

interface QuickCategoryStripProps {
  variant?: 'strip' | 'sidebar' | 'integrated';
}

export const QuickCategoryStrip: React.FC<QuickCategoryStripProps> = ({ variant = 'strip' }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const quickItems: QuickActionItem[] = [
    {
      id: 'ofertas-relampago',
      label: 'Ofertas relámpago',
      icon: <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?q=oferta'),
    },
    {
      id: 'ofertas-del-dia',
      label: 'Ofertas del día',
      icon: (
        <div className="relative flex items-center justify-center">
          {/* Circular 24 clock badge matching Mercado Libre style in brand berry */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-primary flex items-center justify-center font-black text-[10px] sm:text-[11px] text-primary leading-none">
            24
          </div>
        </div>
      ),
      action: () => navigate('/negocios?q=descuento'),
    },
    {
      id: 'celulares',
      label: 'Celulares',
      icon: <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?q=celulares'),
    },
    {
      id: 'notebooks',
      label: 'Notebooks',
      icon: <Laptop className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?q=notebooks'),
    },
    {
      id: 'menos-100',
      label: 'Menos de S/100',
      icon: (
        <div className="flex flex-col items-center justify-center text-primary">
          <span className="font-extrabold text-[11px] sm:text-xs leading-none">S/↓</span>
          <TrendingDown className="w-3.5 h-3.5 mt-0.5 stroke-[2.5]" />
        </div>
      ),
      action: () => navigate('/negocios?q=combo'),
    },
    {
      id: 'restaurantes',
      label: 'Restaurantes',
      icon: <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?categoria=restaurantes'),
    },
    {
      id: 'farmacias',
      label: 'Farmacias',
      icon: <Pill className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?categoria=farmacias'),
    },
    {
      id: 'bodegas',
      label: 'Bodegas',
      icon: <ShoppingBasket className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?categoria=bodegas'),
    },
    {
      id: 'ropa',
      label: 'Moda Selva',
      icon: <Shirt className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?categoria=ropa'),
    },
    {
      id: 'cacao-cafe',
      label: 'Cacao & Café',
      icon: <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary stroke-[1.75]" />,
      action: () => navigate('/negocios?categoria=emprendedores'),
    },
  ];

  if (variant === 'sidebar' || variant === 'integrated') {
    const isIntegrated = variant === 'integrated';
    return (
      <div
        className={`h-full flex flex-col justify-between select-none ${
          isIntegrated
            ? 'bg-[#FAF5F8]/75 p-3.5 sm:p-5'
            : 'bg-[#FAF5F8]/90 rounded-3xl border border-pink-100/90 p-3.5 sm:p-4 shadow-subtle'
        }`}
      >
        {/* Recuadro Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-pink-100/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs sm:text-sm font-black text-ink">Accesos directos</span>
            <span className="text-[10px] bg-pink-100 text-primary font-bold px-2 py-0.5 rounded-full">
              Tingo María
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/negocios')}
            className="text-[11px] sm:text-xs text-primary hover:text-primary-hover font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver comercios</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 10 Icons Complete Grid */}
        <div className="grid grid-cols-5 gap-y-3 sm:gap-y-4 gap-x-1.5 sm:gap-x-3 my-auto py-2">
          {quickItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="flex flex-col items-center group cursor-pointer focus:outline-none transition-all active:scale-95 p-1 rounded-xl hover:bg-white/70"
            >
              {/* Circular / Rounded-2xl icon container */}
              <div
                className={`rounded-2xl border border-pink-200/90 bg-white group-hover:border-primary group-hover:bg-primary-50/70 shadow-xs group-hover:shadow-sm flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 ${
                  isIntegrated
                    ? 'w-11 h-11 sm:w-13 sm:h-13 [&_svg]:w-5 sm:[&_svg]:w-6 [&_svg]:h-5 sm:[&_svg]:h-6'
                    : 'w-10 h-10 sm:w-11 sm:h-11 [&_svg]:w-5 [&_svg]:h-5'
                }`}
              >
                {item.icon}
              </div>

              {/* Full readable label */}
              <span
                className={`text-gray-700 font-semibold text-center leading-tight mt-1.5 group-hover:text-primary transition-colors ${
                  isIntegrated
                    ? 'text-[11px] sm:text-xs max-w-[95px] sm:max-w-[110px] line-clamp-2'
                    : 'text-[10px] sm:text-[11px] max-w-[65px] line-clamp-1'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Recuadro Footer strip */}
        {isIntegrated && (
          <div className="pt-2 border-t border-pink-100/70 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-ink-light truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Envíos en 20-35 min en Rupa Rupa y Castillo Grande</span>
            </span>
            <span className="text-primary font-semibold hidden md:inline flex-shrink-0 ml-2">
              Tarifa local desde S/ 4.00
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full py-2 select-none">
      <div className="relative flex items-center">
        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-start gap-4 sm:gap-8 overflow-x-auto scrollbar-none py-2 px-1 w-full scroll-smooth"
        >
          {quickItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="flex flex-col items-center group cursor-pointer focus:outline-none flex-shrink-0"
              style={{ minWidth: '76px' }}
            >
              {/* Circular Icon Container matching brand berry */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-pink-200/90 bg-white group-hover:border-primary group-hover:bg-primary-50/60 shadow-sm group-hover:shadow-md flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95">
                {item.icon}
              </div>

              {/* Text Label */}
              <span className="text-[11px] sm:text-xs text-gray-700 font-medium text-center leading-tight mt-2 max-w-[85px] line-clamp-2 group-hover:text-primary transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Carousel Arrow Button */}
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Ver más categorías y ofertas"
          className="hidden sm:flex absolute right-0 top-6 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-primary hover:bg-primary-50 hover:border-primary-300 hover:scale-110 active:scale-95 transition-all z-10"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
