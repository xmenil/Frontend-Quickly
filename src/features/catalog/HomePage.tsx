import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { ProductDetailModal } from './ProductDetailModal';
import { QuickCategoryStrip } from '../../components/shared/QuickCategoryStrip';
import { CategoryGridSection } from '../../components/shared/CategoryGridSection';
import { OfficialStoresSection } from '../../components/shared/OfficialStoresSection';
import { BigStoreProductsSection } from '../../components/shared/BigStoreProductsSection';
import { Product, MerchantCategory } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { formatDate } from '../../lib/date';
import {
  ArrowRight,
  MapPin,
  Clock,
  Check,
  Bike,
  Truck,
  ShoppingCart,
  Store,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import heroFamilyGroceries from '../../assets/img/image copy 2.png';
import heroMotorcycleDelivery from '../../assets/img/image copy 3.png';
import heroSmartphoneView from '../../assets/img/image copy 4.png';

export const HomePage: React.FC = () => {
  const { merchants, products, purchases } = useDataStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedFeaturedId, setAddedFeaturedId] = useState<string | null>(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  // 3 Slides con fotos locales de Tingo María y textos según la notación de cada imagen
  const heroSlides = [
    {
      id: 1,
      image: heroFamilyGroceries,
      badge: 'Supermercados & Bodegas en Tingo María',
      title: 'Tus compras del hogar, frescas y completas',
      description: 'Frutas, verduras frescas, abarrotes y productos de la selva alta directo a la puerta de tu hogar.',
      ctaText: 'Ver supermercados',
      ctaLink: '/negocios?categoria=supermercados',
    },
    {
      id: 2,
      image: heroMotorcycleDelivery,
      badge: 'Envíos Express en Leoncio Prado',
      title: 'Lo mejor de la selva en tu puerta en minutos',
      description: 'Tacacho con cecina, juanes, farmacias y antojos con motorizados locales en Rupa Rupa y Castillo Grande.',
      ctaText: 'Pedir comida caliente',
      ctaLink: '/negocios?categoria=restaurantes',
    },
    {
      id: 3,
      image: heroSmartphoneView,
      badge: 'Fácil, Rápido y Seguro',
      title: 'Todo Tingo María al alcance de tu celular',
      description: 'Pide desde donde estés con delivery centralizado, rastreo en vivo y pagos al instante con Yape, Plin o efectivo.',
      ctaText: 'Explorar comercios',
      ctaLink: '/negocios',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Categorías locales de la selva
  const categories: {
    id: MerchantCategory;
    name: string;
  }[] = [
    { id: 'restaurantes', name: 'Restaurantes' },
    { id: 'farmacias', name: 'Farmacias y Boticas' },
    { id: 'bodegas', name: 'Bodegas y Abarrotes' },
    { id: 'emprendedores', name: 'Cacao & Café' },
    { id: 'ropa', name: 'Textil Local' },
  ];

  // 4 Platos y productos bandera 100% de Tingo María
  const featuredCards = [
    {
      id: 'p_tacacho_cecina',
      name: 'Tacacho con Cecina y Chorizo Amazónico',
      merchantName: 'La Selva Gourmet',
      priceCents: 2800,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_juane_gallina',
      name: 'Juane Tradicional de Gallina de Chacra',
      merchantName: 'La Selva Gourmet',
      priceCents: 2200,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_repelente_selva',
      name: 'Repelente Extra Fuerte para Selva Spray 150ml',
      merchantName: 'Farmacia Vida',
      priceCents: 1850,
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_chocolate_70',
      name: 'Chocolate 70% Cacao Nativo Leoncio Prado',
      merchantName: 'Cacao & Café Tingo',
      priceCents: 1400,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const handleAddFeatured = (e: React.MouseEvent, item: typeof featuredCards[0]) => {
    e.stopPropagation();
    e.preventDefault();
    const foundProd = products.find((p) => p.id === item.id) || products[0];
    if (foundProd) {
      addItem({
        productId: foundProd.id,
        merchantId: foundProd.merchantId,
        quantity: 1,
        unitPriceCents: item.priceCents,
      });
      setAddedFeaturedId(item.id);
      setTimeout(() => {
        setAddedFeaturedId((curr) => (curr === item.id ? null : curr));
      }, 1500);
    }
  };

  // Find active purchase for realistic status card
  const activePurchase = purchases.find((p) =>
    ['pendiente', 'en_proceso', 'entrega_parcial'].includes(p.status)
  );

  return (
    <div className="w-full flex flex-col">
      {/* Location & Coverage Strip */}
      <div className="w-full bg-white/95 border-b border-gray-100 py-2 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-200/90 shadow-xs text-ink">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-bold">Tingo María • Zona Centro</span>
            <span className="text-ink-light hidden sm:inline">• Tarifa S/ 4.00</span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-light font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="tabular-nums">Despachos en 20-35 min</span>
          </div>
        </div>
      </div>

      {/* Top Section: Quick Category Strip & Hero Banner */}
      <section className="w-full bg-white pb-8 pt-3 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Quick Category Buttons Strip */}
          <div className="bg-[#FAF5F8]/70 rounded-2xl border border-pink-100/70 px-3 sm:px-6 py-2.5">
            <QuickCategoryStrip />
          </div>

          {/* Hero Banner: Carousel de 3 imágenes de Tingo María (altura amplia ~50vh, toque moradito claro medio) */}
          <div className="relative rounded-3xl overflow-hidden shadow-card h-[380px] sm:h-[460px] lg:h-[500px] min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] flex flex-col justify-end p-6 sm:p-10 text-white select-none group w-full">
            {/* Background Slides with crossfade transition */}
            {heroSlides.map((slide, idx) => {
              const isActive = idx === currentHeroSlide;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center filter blur-[0.5px] scale-100 group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
              );
            })}

            {/* Toque medio moradito claro: gradiente sutil y armónico de marca (medio no oscuro) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2c0517]/85 via-[#590a2d]/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b030e]/85 via-[#450723]/30 to-transparent" />
            <div className="absolute inset-0 bg-[#be185d]/10 mix-blend-color pointer-events-none" />

            {/* Slide Content */}
            <div className="relative z-10 space-y-3 sm:space-y-4 max-w-xl sm:max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/90 backdrop-blur-xs text-[11px] sm:text-xs font-bold text-white shadow-subtle">
                <Sparkles className="w-3.5 h-3.5 text-pink-200" />
                {heroSlides[currentHeroSlide].badge}
              </span>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-white drop-shadow-md">
                {heroSlides[currentHeroSlide].title}
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-gray-100 font-medium leading-relaxed drop-shadow max-w-xl">
                {heroSlides[currentHeroSlide].description}
              </p>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <Link
                  to={heroSlides[currentHeroSlide].ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-primary font-black text-xs sm:text-sm shadow-card hover:shadow-hover transition-all active:scale-95 cursor-pointer"
                >
                  <span>{heroSlides[currentHeroSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Prev & Next subtle buttons */}
            <button
              type="button"
              onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel Pagination Dots */}
            <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentHeroSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentHeroSlide
                      ? 'w-7 h-2.5 bg-primary shadow-sm'
                      : 'w-2.5 h-2.5 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Categories Row: Botones limpios de texto */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/negocios?categoria=${cat.id}`}
                className="py-2 px-4 sm:px-5 rounded-xl bg-white hover:bg-primary hover:text-white border border-gray-200 hover:border-primary text-ink text-xs sm:text-sm font-bold transition-all shadow-subtle active:scale-[0.98]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Categorías de Tingo María (Full Width Edge-to-Edge) */}
      <CategoryGridSection />

      {/* Official Stores Section (Full Width Edge-to-Edge) */}
      <OfficialStoresSection />

      {/* Big Stores Products & Deals Showcase (Full Width Edge-to-Edge with #FAF5F8) */}
      <BigStoreProductsSection />

      {/* Productos Destacados Section: Gastronomía & Tradición Tingalesa (Full Width Edge-to-Edge) */}
      <section className="w-full bg-white border-y border-gray-150/70 py-8 sm:py-10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black text-ink tracking-tight">
                    Platos y productos más pedidos
                  </h2>
                  <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    100% Selva Alta
                  </span>
                </div>
                <p className="text-xs text-ink-light">
                  Gastronomía amazónica tradicional y productos indispensables en Tingo María
                </p>
              </div>
            </div>
            <Link
              to="/negocios"
              className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 hover:underline"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 4 Cards Grid con feedback táctil inmediato */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {featuredCards.map((item) => (
              <Link
                key={item.id}
                to={`/producto/${item.id}`}
                className="group bg-white rounded-2xl border border-gray-200/75 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between hover:shadow-card hover:border-primary-300 hover:-translate-y-1 transition-all text-left"
              >
                <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Despacho veloz
                  </span>
                </div>

                <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-2">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-primary font-semibold mt-0.5 flex items-center gap-1">
                      <Store className="w-3 h-3 flex-shrink-0" />
                      {item.merchantName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs sm:text-sm font-black text-ink tabular-nums">
                      {formatCents(item.priceCents)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleAddFeatured(e, item)}
                      title="Agregar al pedido"
                      aria-label={`Agregar ${item.name} al pedido`}
                      className={`min-w-[36px] min-h-[36px] px-2 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-subtle active:scale-95 touch-target ${
                        addedFeaturedId === item.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-primary hover:bg-primary-hover text-white'
                      }`}
                    >
                      {addedFeaturedId === item.id ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom 3 Cards Row: Dirección de entrega | Estado de pedido dinámico | Mis pedidos */}
      <section className="w-full bg-[#FAF5F8]/60 border-b border-pink-100/50 py-8 sm:py-10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Dirección de entrega */}
            <div className="bg-white rounded-2xl border border-pink-100/80 shadow-[0_2px_8px_rgba(190,24,93,0.03)] p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Dirección de entrega</span>
                </div>
                <Link to="/cliente/direcciones" className="text-primary hover:underline font-semibold">
                  Cambiar
                </Link>
              </div>

              <p className="text-xs text-ink font-medium">Jr. Amazonas 123, Tingo María (Zona Centro)</p>

              {/* Stylized Schematic Mini Map */}
              <div className="rounded-xl overflow-hidden border border-gray-100 relative h-32 bg-sky-50/50 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 300 150" fill="none">
                  <rect width="300" height="150" fill="#f8fafc" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="#e2e8f0" strokeWidth="12" />
                  <line x1="150" y1="0" x2="150" y2="150" stroke="#e2e8f0" strokeWidth="10" />
                  <line x1="50" y1="0" x2="250" y2="150" stroke="#f1f5f9" strokeWidth="8" />
                  <path
                    d="M 230 0 Q 250 80 270 150"
                    stroke="#bae6fd"
                    strokeWidth="16"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="px-2 py-0.5 rounded-full bg-white shadow-subtle border border-gray-100 text-[10px] font-bold text-ink flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Río Huallaga • Centro
                  </div>
                  <MapPin className="w-5 h-5 text-primary fill-primary-100 -mt-0.5 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Card 2: Estado del Pedido DINÁMICO (o Cobertura si no hay pedido activo) */}
            <div className="bg-white rounded-2xl border border-pink-100/80 shadow-[0_2px_8px_rgba(190,24,93,0.03)] p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <Bike className="w-4 h-4 text-primary" />
                  <span>{activePurchase ? 'Seguimiento de tu pedido' : 'Cobertura & Tarifas'}</span>
                </div>
                {activePurchase && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary font-bold text-[10px]">
                    En curso
                  </span>
                )}
              </div>

              {activePurchase ? (
                <div className="space-y-3 py-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-ink">#{activePurchase.code}</span>
                    <span className="text-primary font-bold tabular-nums">
                      {formatCents(activePurchase.grandTotalCents)}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-light">
                    {activePurchase.merchantOrders.length} comercio(s) preparan tu pedido.
                  </p>
                  <div className="p-2.5 bg-primary-50 rounded-xl flex items-center gap-2 text-xs text-primary font-semibold">
                    <Truck className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span>Tiempo estimado: ~25 min</span>
                  </div>
                  <Link
                    to={`/pedidos/${activePurchase.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold text-center block hover:bg-primary-hover shadow-subtle transition-all"
                  >
                    Ver seguimiento en vivo →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 py-1 text-xs">
                  <p className="text-[11px] text-ink-light leading-relaxed">
                    Repartidores locales en moto y bici conectando todos los sectores de Tingo María:
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-medium text-ink">Centro (Plaza de Armas / Raymondi)</span>
                      <span className="font-bold text-primary tabular-nums">S/ 4.00 • 20 min</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-medium text-ink">Rupa Rupa Norte / UNAS</span>
                      <span className="font-bold text-primary tabular-nums">S/ 5.00 • 25 min</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="font-medium text-ink">Castillo Grande (Puente Corpac)</span>
                      <span className="font-bold text-primary tabular-nums">S/ 6.50 • 35 min</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Mis pedidos recientes */}
            <div className="bg-white rounded-2xl border border-pink-100/80 shadow-[0_2px_8px_rgba(190,24,93,0.03)] p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-ink">Mis pedidos recientes</span>
                <Link to="/cliente/pedidos" className="text-primary hover:underline font-semibold">
                  Ver todos <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                {purchases.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    to={`/pedidos/${p.id}`}
                    className="p-2.5 bg-gray-50 hover:bg-primary-50/50 rounded-xl flex items-center justify-between transition-colors block border border-gray-100"
                  >
                    <div>
                      <span className="font-bold text-ink">#{p.code}</span>
                      <p className="text-gray-600 font-semibold text-[11px] tabular-nums mt-0.5">
                        {formatCents(p.grandTotalCents)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.status === 'completado' ? 'Entregado' : 'Procesado'}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                        {formatDate(p.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer matching Quickly Branding */}
      <footer className="w-full bg-white border-t border-gray-200 py-6 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-light">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center p-1 text-white shadow-subtle">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-extrabold text-ink">Quickly Tingo María</span>
              <span className="text-[11px] text-primary ml-1.5 font-bold">
                Plataforma de delivery de la Selva Alta
              </span>
            </div>
          </div>

          <div className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            <span>Rupa Rupa • Castillo Grande • Leoncio Prado</span>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        merchant={merchants.find((m) => m.id === selectedProduct?.merchantId)}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
