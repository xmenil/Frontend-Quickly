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

export const QuickCategoryStrip: React.FC = () => {
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
