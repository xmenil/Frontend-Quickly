import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import {
  Building2,
  Star,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

export const OfficialStoresSection: React.FC = () => {
  const { merchants } = useDataStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Big stores & supermarkets from Tingo María
  const bigStoreIds = [
    'm_super_lukita',
    'm_super_baraton',
    'm_minisol',
    'm_minimarket_rupa',
    'm_tiendas_efe',
    'm_la_curacao',
    'm_carsa',
    'm_el_balcon',
    'm_galeria_san_benito',
    'm_bodega_tingo',
  ];

  // Prioritize big stores list, plus any other supermarkets
  const officialStores = merchants
    .filter((m) => bigStoreIds.includes(m.id) || m.category === 'supermercados' || m.category === 'electrohogar')
    .sort((a, b) => {
      const idxA = bigStoreIds.indexOf(a.id);
      const idxB = bigStoreIds.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.rating - a.rating;
    });

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [officialStores.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = 260;
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="w-full bg-white border-y border-gray-150/70 py-6 sm:py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Section Header with Slider Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-ink tracking-tight">
                  Grandes Tiendas y Supermercados
                </h2>
                <span className="hidden sm:inline-flex text-[9px] uppercase font-extrabold bg-primary-50 text-primary border border-primary-100 px-2 py-0.5 rounded-full">
                  Oficiales
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-ink-light">
                Surtido completo de tiendas departamentales y supermercados en Tingo María
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            {/* Slide Arrows to slide right/left */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Deslizar a la izquierda"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'border-gray-300 text-ink hover:border-primary hover:text-primary hover:bg-pink-50 cursor-pointer shadow-2xs'
                    : 'border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Deslizar a la derecha"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'border-gray-300 text-ink hover:border-primary hover:text-primary hover:bg-pink-50 cursor-pointer shadow-2xs'
                    : 'border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/negocios?categoria=supermercados"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline ml-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Horizontal Slider: Achicado de tarjetas, sin mini imágenes, deslizable a la derecha */}
        <div className="relative group">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1 px-0.5"
          >
            {officialStores.map((store) => (
              <Link
                key={store.id}
                to={`/negocios/${store.id}`}
                className="group/card w-[210px] sm:w-[230px] md:w-[240px] flex-shrink-0 bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:border-primary-300 hover:shadow-card hover:-translate-y-1 overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer"
              >
                {/* Store Banner */}
                <div>
                  <div className="relative h-20 sm:h-22 overflow-hidden bg-gray-100">
                    <img
                      src={store.bannerUrl}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-ink text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Verificado</span>
                    </span>
                  </div>

                  {/* Store Body: Achicado y limpio sin artículos destacados pequeños */}
                  <div className="p-3 pt-0 relative">
                    {/* Floating Logo Badge */}
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-100 p-0.5 flex items-center justify-center -mt-5 mb-1.5 relative z-10">
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Store Name & Description */}
                    <h3 className="font-bold text-xs sm:text-[13px] text-ink group-hover/card:text-primary transition-colors truncate">
                      {store.name}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {store.description}
                    </p>

                    {/* Rating & Delivery Prep Time */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mt-2 font-medium pt-1.5 border-t border-gray-100/70">
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{store.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{store.prepTimeMinutes} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Action */}
                <div className="px-3 py-2 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-primary group-hover/card:bg-primary group-hover/card:text-white transition-colors">
                  <span className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    <span>Ver catálogo</span>
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>

          {/* Floating Right Arrow on hover for desktop slide */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Deslizar supermercados a la derecha"
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Floating Left Arrow on hover */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Deslizar supermercados a la izquierda"
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all z-10 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
