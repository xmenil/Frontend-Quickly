import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  UtensilsCrossed,
  PlusCircle,
  Shirt,
  Sprout,
  Zap,
  Smartphone,
  Laptop,
  TrendingDown,
  BadgeCheck,
  Building2,
  Heart,
} from 'lucide-react';
import heroFamilyGroceries from '../../assets/img/image copy 2.png';
import heroMotorcycleDelivery from '../../assets/img/image copy 3.png';
import heroSmartphoneView from '../../assets/img/image copy 4.png';

export const HomePage: React.FC = () => {
  const { merchants, products, purchases } = useDataStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, currentUser, activeRole, loginDemo } = useAuthStore();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedFeaturedId, setAddedFeaturedId] = useState<string | null>(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3 Slides con fotos locales de Tingo María y micro-copys concisos estilo Rappi
  const heroSlides = [
    {
      id: 1,
      image: heroFamilyGroceries,
      badge: 'Restaurantes, Bodegas, Farmacias y más',
      title: 'Todo lo que necesitas, en un solo lugar',
      description: 'Comida típica, abarrotes de Minisol, medicamentos y productos de la selva al instante.',
      ctaText: 'Ver categorías',
      ctaLink: '/negocios',
    },
    {
      id: 2,
      image: heroMotorcycleDelivery,
      badge: 'Envíos Express Tingo María',
      title: 'Pollería Rubén & Sabores de la Selva',
      description: 'Pollo a la brasa con papas nativas, tacacho con cecina y comidas calientes en 20-35 min.',
      ctaText: 'Pedir comida caliente',
      ctaLink: '/negocios?categoria=restaurantes',
    },
    {
      id: 3,
      image: heroSmartphoneView,
      badge: 'Supermercado Minisol & Farmacias',
      title: 'Tus compras del hogar directo a tu puerta',
      description: 'Abarrotes frescos, boticas y productos locales con entrega rápida y pagos Yape/Plin.',
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

  // 5 Categorías destacadas del prototipo v2 (Restaurantes, Bodegas, Farmacias, Ropa, Emprendedores)
  const mainCategoryCards = [
    {
      id: 'restaurantes',
      name: 'Restaurantes',
      icon: <UtensilsCrossed className="w-6 h-6 text-primary stroke-[2.2]" />,
      link: '/negocios?categoria=restaurantes',
    },
    {
      id: 'bodegas',
      name: 'Bodegas',
      icon: <ShoppingCart className="w-6 h-6 text-primary stroke-[2.2]" />,
      link: '/negocios?categoria=bodegas',
    },
    {
      id: 'farmacias',
      name: 'Farmacias',
      icon: <PlusCircle className="w-6 h-6 text-primary stroke-[2.2]" />,
      link: '/negocios?categoria=farmacias',
    },
    {
      id: 'ropa',
      name: 'Ropa',
      icon: <Shirt className="w-6 h-6 text-primary stroke-[2.2]" />,
      link: '/negocios?categoria=ropa',
    },
    {
      id: 'emprendedores',
      name: 'Emprendedores',
      icon: <Sprout className="w-6 h-6 text-primary stroke-[2.2]" />,
      link: '/negocios?categoria=emprendedores',
    },
  ];

  // Atajos rápidos para el recuadro derecho (reemplazando el carrito, con iconos bien claros)
  const rightSidebarShortcuts = [
    {
      id: 'ofertas-relampago',
      label: 'Ofertas relámpago',
      subtitle: 'Hasta 40% OFF',
      icon: <Zap className="w-4 h-4 text-primary stroke-[2]" />,
      link: '/negocios?q=oferta',
    },
    {
      id: 'ofertas-del-dia',
      label: 'Ofertas del día',
      subtitle: 'Precios bomba 24h',
      icon: (
        <span className="w-4 h-4 rounded-full border-[1.5px] border-primary text-primary font-black text-[9px] flex items-center justify-center leading-none">
          24
        </span>
      ),
      link: '/negocios?q=descuento',
    },
    {
      id: 'celulares',
      label: 'Celulares',
      subtitle: 'Smartphones y más',
      icon: <Smartphone className="w-4 h-4 text-primary stroke-[2]" />,
      link: '/negocios?q=celulares',
    },
    {
      id: 'notebooks',
      label: 'Notebooks',
      subtitle: 'Laptops y PC',
      icon: <Laptop className="w-4 h-4 text-primary stroke-[2]" />,
      link: '/negocios?q=notebooks',
    },
    {
      id: 'menos-100',
      label: 'Menos de S/100',
      subtitle: 'Súper ahorro',
      icon: (
        <div className="flex flex-col items-center justify-center text-primary leading-none">
          <span className="font-extrabold text-[9px]">S/↓</span>
          <TrendingDown className="w-2.5 h-2.5 stroke-[2.5]" />
        </div>
      ),
      link: '/negocios?q=combo',
    },
    {
      id: 'envios-express',
      label: 'Envíos Express',
      subtitle: '20 a 35 min',
      icon: <Bike className="w-4 h-4 text-primary stroke-[2]" />,
      link: '/negocios',
    },
    {
      id: 'moda-selva',
      label: 'Moda Selva',
      subtitle: 'Tendencias locales',
      icon: <Shirt className="w-4 h-4 text-primary stroke-[2]" />,
      link: '/negocios?categoria=ropa',
    },
    {
      id: 'cacao-cafe',
      label: 'Cacao & Café',
      subtitle: 'Leoncio Prado',
      icon: <Sparkles className="w-4 h-4 text-primary stroke-[2]" />,
      link: '/negocios?categoria=emprendedores',
    },
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
    <div className="w-full flex flex-col bg-white">
      {/* Indicador de Entrega: Despachos en 20 - 35 min (exacto a prototipo v2) */}
      <div className="w-full bg-white select-none pt-2.5 pb-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs sm:text-sm">
          <div className="inline-flex items-center gap-2 text-ink font-bold">
            <Clock className="w-4 h-4 text-ink flex-shrink-0 stroke-[2.2]" />
            <span>Despachos en 20 - 35 min</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-ink-light">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Repartidores activos en Leoncio Prado</span>
          </div>
        </div>
      </div>

      {/* Top Section: Hero Banner Carousel & 5 Category Cards */}
      <section className="w-full bg-white pb-3 pt-1 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">
          {/* Hero Banner Carousel (estilo prototipo v2 con micro-copys concisos) */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm h-[200px] sm:h-[240px] lg:h-[260px] flex flex-col justify-end p-5 sm:p-7 text-white select-none group w-full bg-gradient-to-br from-emerald-900 to-emerald-950">
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
                    className="w-full h-full object-cover object-center filter brightness-[0.85] scale-100 group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
              );
            })}

            {/* Sombra y gradiente para contraste limpio sobre fondos naturales */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />

            {/* Slide Content */}
            <div className="relative z-20 space-y-2 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-[11px] sm:text-xs font-bold shadow-xs">
                <Sprout className="w-3.5 h-3.5 text-white" />
                <span>{heroSlides[currentHeroSlide].badge}</span>
              </span>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                {heroSlides[currentHeroSlide].title}
              </h1>

              <p className="text-xs sm:text-sm text-gray-100 font-medium leading-snug drop-shadow line-clamp-2 max-w-md">
                {heroSlides[currentHeroSlide].description}
              </p>

              <div className="pt-1 flex items-center gap-2">
                <Link
                  to={heroSlides[currentHeroSlide].ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{heroSlides[currentHeroSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="absolute bottom-3.5 right-3.5 sm:bottom-5 sm:right-6 z-20 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentHeroSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentHeroSlide
                      ? 'w-5 h-2 bg-white shadow-sm'
                      : 'w-2 h-2 bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 5 Main Category Cards directly below banner (exacto a prototipo v2) */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {mainCategoryCards.map((cat) => (
              <Link
                key={cat.id}
                to={cat.link}
                className="bg-white hover:bg-emerald-50/40 border border-gray-150/80 hover:border-primary/50 rounded-2xl py-3 px-1 sm:py-4 sm:px-3 flex flex-col items-center justify-center gap-1.5 group transition-all duration-200 shadow-xs hover:shadow-subtle hover:-translate-y-0.5 active:scale-95 text-center"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-white shadow-2xs transition-all duration-200">
                  {cat.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-ink group-hover:text-primary transition-colors truncate w-full">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Accesos directos con Switch de Rol (exacto a prototipo v2) */}
      <section className="w-full bg-white py-2 sm:py-3 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h2 className="text-sm sm:text-base font-extrabold text-ink">Accesos directos</h2>
            </div>

            {/* Switch de Rol: Panel: CLIENTE ⌃ */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-ink transition-all cursor-pointer shadow-2xs"
                aria-label="Cambiar modo de vista o panel de demostración"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-gray-500 font-normal">Panel:</span>
                <span className="text-primary font-black uppercase tracking-wide">{activeRole}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown de Roles */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-floating border border-gray-100 p-2 z-40 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Cambiar Modo de Vista
                  </div>
                  {[
                    { role: 'cliente', label: 'Cliente', desc: 'Catálogo y pedidos' },
                    { role: 'comercio', label: 'Comercio', desc: 'Panel de tienda y menú' },
                    { role: 'repartidor', label: 'Repartidor', desc: 'Rutas y entregas' },
                    { role: 'admin', label: 'Admin', desc: 'Supervisión y zonas' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => {
                        loginDemo(r.role as any);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        activeRole === r.role ? 'bg-emerald-50 text-primary font-bold' : 'hover:bg-gray-50 text-ink'
                      }`}
                    >
                      <div>
                        <p className="font-bold capitalize">{r.label}</p>
                        <p className="text-[10px] text-gray-400">{r.desc}</p>
                      </div>
                      {activeRole === r.role && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4 Action Pills (exacto a prototipo v2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              to="/negocios?q=oferta"
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-150/80 hover:border-primary/50 hover:bg-emerald-50/20 shadow-xs hover:shadow-subtle transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-2xs">
                  %
                </span>
                <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors">
                  Ofertas
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/negocios"
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-150/80 hover:border-primary/50 hover:bg-emerald-50/20 shadow-xs hover:shadow-subtle transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-primary flex items-center justify-center border border-emerald-100 shadow-2xs">
                  <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors">
                  Pedidos
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/cliente/pedidos"
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-150/80 hover:border-primary/50 hover:bg-emerald-50/20 shadow-xs hover:shadow-subtle transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shadow-2xs">
                  <Clock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors">
                  Mis pedidos
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/cliente/favoritos"
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-150/80 hover:border-primary/50 hover:bg-emerald-50/20 shadow-xs hover:shadow-subtle transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shadow-2xs">
                  <Heart className="w-4 h-4 fill-white stroke-[0]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors">
                  Favoritos
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* Grid Categorías de Tingo María (Full Width Edge-to-Edge) */}
      <CategoryGridSection />

      {/* Official Stores Section (Full Width Edge-to-Edge) */}
      <OfficialStoresSection />

      {/* Big Stores Products & Deals Showcase (Full Width Edge-to-Edge with emerald-50/20) */}
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

          {/* 4 Cards Grid con feedback táctil inmediato y diseño unificado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {featuredCards.map((item) => {
              const itemProd = products.find((p) => p.id === item.id);
              const itemStore = merchants.find(
                (m) => m.id === itemProd?.merchantId || m.name.toLowerCase().includes(item.merchantName.toLowerCase())
              );
              const isJustAdded = addedFeaturedId === item.id;

              return (
                <Link
                  key={item.id}
                  to={`/producto/${item.id}`}
                  className="group bg-white rounded-2xl border border-emerald-100/70 shadow-sm hover:border-primary-400 hover:shadow-card hover:-translate-y-1 overflow-hidden flex flex-col justify-between transition-all duration-200 text-left h-full"
                >
                  {/* Product Image: De esquina a esquina */}
                  <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100/70">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-primary/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Envío rápido
                    </span>
                  </div>

                  {/* Content Body */}
                  <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                    <div>
                      {/* Product Name */}
                      <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2rem]">
                        {item.name}
                      </h4>

                      {/* Row: Perfil de tienda verificada (nombre en negro) a lado de Stock disponible */}
                      <div className="flex items-center justify-between gap-1.5 mt-2">
                        {/* Perfil de la tienda */}
                        <div
                          className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 px-1.5 py-0.5 rounded-full transition-colors min-w-0 max-w-[58%]"
                          title={`${item.merchantName} • Tienda verificada`}
                        >
                          {itemStore?.logoUrl ? (
                            <img
                              src={itemStore.logoUrl}
                              alt={item.merchantName}
                              className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0 border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                          )}
                          <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                            {item.merchantName
                              .replace(/Supermercado\s+/i, 'Super ')
                              .replace(/\s+Tingo María$/i, '')}
                          </span>
                          <BadgeCheck className="w-3 h-3 text-sky-500 fill-sky-100 flex-shrink-0" />
                        </div>

                        {/* Stock disponible */}
                        <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-100/80 px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0 animate-pulse" />
                          <span>Stock disponible</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100">
                      <span className="text-sm sm:text-base font-black text-ink leading-tight block tabular-nums">
                        {formatCents(item.priceCents)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleAddFeatured(e, item)}
                        title="Agregar al carrito"
                        aria-label={`Agregar ${item.name} al carrito`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-xs flex-shrink-0 ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                            : 'bg-primary hover:bg-primary-hover text-white hover:shadow-md'
                        }`}
                      >
                        {isJustAdded ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom 3 Cards Row: Dirección de entrega | Estado de pedido dinámico | Mis pedidos */}
      <section className="w-full bg-emerald-50/20 border-b border-emerald-100/50 py-8 sm:py-10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Dirección de entrega */}
            <div className="bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-3">
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
            <div className="bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-3">
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
            <div className="bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-3">
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
