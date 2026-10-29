import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRealCartStore } from '../../store/realCartStore';
import { catalogApi, CatalogProduct, imageUrl, money } from '../../services/api/catalogApi';
import { operationsApi, Zone } from '../../services/api/operationsApi';
import { ProductDetailModal } from './ProductDetailModal';
import { OfficialStoresSection } from '../../components/shared/OfficialStoresSection';
import { BigStoreProductsSection } from '../../components/shared/BigStoreProductsSection';
import {
  ArrowRight,
  Clock,
  Check,
  Bike,
  ShoppingCart,
  Store,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  PlusCircle,
  Shirt,
  Sprout,
  Heart,
  ChevronRight,
  ChevronDown,
  Loader2,
  Building2,
} from 'lucide-react';

import heroFamilyGroceries from '../../assets/img/image copy 2.png';
import heroMotorcycleDelivery from '../../assets/img/image copy 3.png';
import heroSmartphoneView from '../../assets/img/image copy 4.png';

export function HomePage() {
  const { isAuthenticated, currentUser, activeRole, switchRole, loginDemo } = useAuthStore();
  const add = useRealCartStore((s) => s.add);
  const navigate = useNavigate();

  const [featuredProducts, setFeaturedProducts] = useState<CatalogProduct[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [addedFeaturedId, setAddedFeaturedId] = useState<string | null>(null);

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

  // 3 Slides con fotografías locales de Tingo María y micro-copys concisos estilo Rappi
  const heroSlides = [
    {
      id: 1,
      image: heroFamilyGroceries,
      badge: 'Restaurantes, Bodegas, Farmacias y más',
      title: 'Todo lo que necesitas, en un solo lugar',
      description:
        'Comida típica, abarrotes de Minisol, medicamentos y productos de la selva al instante.',
      ctaText: 'Ver categorías',
      ctaLink: '/negocios',
    },
    {
      id: 2,
      image: heroMotorcycleDelivery,
      badge: 'Envíos Express Tingo María',
      title: 'Pollería Rubén & Sabores de la Selva',
      description:
        'Pollo a la brasa con papas nativas, tacacho con cecina y comidas calientes en 20-35 min.',
      ctaText: 'Pedir comida caliente',
      ctaLink: '/negocios?categoria=restaurantes',
    },
    {
      id: 3,
      image: heroSmartphoneView,
      badge: 'Supermercado Minisol & Farmacias',
      title: 'Tus compras del hogar directo a tu puerta',
      description:
        'Abarrotes frescos, boticas y productos locales con entrega rápida y pago contra entrega en efectivo.',
      ctaText: 'Explorar comercios',
      ctaLink: '/negocios',
    },
  ];

  // Auto-advance banner carousel
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

  // Load real featured products and zones from PostgreSQL
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      catalogApi.search({ limit: 4 }),
      operationsApi.zones(),
    ])
      .then(([prodRes, zonesRes]) => {
        if (isMounted) {
          setFeaturedProducts(prodRes.items);
          setZones(zonesRes.filter((z) => z.isActive));
          setLoadingFeatured(false);
        }
      })
      .catch((err) => {
        console.error('Error al cargar datos de portada:', err);
        if (isMounted) setLoadingFeatured(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddFeatured = (e: React.MouseEvent, product: CatalogProduct) => {
    e.stopPropagation();
    e.preventDefault();

    const sku = product.skus.find((s) => s.isActive && s.availableStock > 0) || product.skus[0];
    if (!sku) return;

    try {
      add(
        {
          skuId: sku.id,
          productId: product.id,
          storeId: product.storeId,
        },
        1
      );

      setAddedFeaturedId(product.id);
      setTimeout(() => {
        setAddedFeaturedId((curr) => (curr === product.id ? null : curr));
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white select-none">
      {/* Indicador de Entrega: Despachos en 20 - 35 min */}
      <div className="w-full bg-white pt-2.5 pb-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs sm:text-sm">
          <div className="inline-flex items-center gap-2 text-ink font-bold">
            <Clock className="w-4 h-4 text-ink flex-shrink-0 stroke-[2.2]" />
            <span>Despachos en 20 - 35 min</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-ink-light">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Repartidores activos en Leoncio Prado</span>
          </div>
        </div>
      </div>

      {/* Top Section: Hero Banner Carousel & Category Cards */}
      <section className="w-full bg-white pb-3 pt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">
          {/* Hero Banner Carousel */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm h-[200px] sm:h-[240px] lg:h-[260px] flex flex-col justify-end p-5 sm:p-7 text-white select-none group w-full bg-gradient-to-br from-emerald-900 to-emerald-950">
            {/* Background Slides */}
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

            {/* Sombra y gradiente para contraste limpio */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-10" />

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
      <section className="w-full bg-white pt-2 pb-5 sm:pt-3 sm:pb-6 select-none">
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
                        switchRole(r.role as any);
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

      {/* Official Stores Section (Connected to catalogApi.stores()) */}
      <OfficialStoresSection />

      {/* Big Stores Products & Deals Showcase (Connected to catalogApi.search()) */}
      <BigStoreProductsSection />

      {/* Featured Products Section: Platos y Productos de Tingo María */}
      <section className="w-full bg-white border-y border-gray-150/70 py-8 sm:py-10">
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
                  Gastronomía amazónica tradicional y productos de alta demanda en Leoncio Prado
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

          {loadingFeatured ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-ink-light">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Cargando productos recomendados...</span>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-light">
              No hay productos destacados disponibles en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.map((item) => {
                const isJustAdded = addedFeaturedId === item.id;
                const sku = item.skus[0];
                const price = sku ? sku.priceCents : 0;
                const hasStock = (sku?.availableStock || 0) > 0;
                const productImg = item.images[0]?.url
                  ? imageUrl(item.images[0].url)
                  : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className="group bg-white rounded-2xl border border-emerald-100/70 shadow-sm hover:border-primary-400 hover:shadow-card hover:-translate-y-1 overflow-hidden flex flex-col justify-between transition-all duration-200 text-left h-full cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100/70">
                      <img
                        src={productImg}
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

                        {/* Store badge & Stock */}
                        <div className="flex items-center justify-between gap-1.5 mt-2">
                          <div
                            className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 border border-gray-200/80 px-1.5 py-0.5 rounded-full min-w-0 max-w-[58%]"
                            title={`${item.storeName} • Tienda verificada`}
                          >
                            <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                              {item.storeName}
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold ${hasStock ? 'text-primary' : 'text-gray-400'}`}>
                            {hasStock ? 'En stock' : 'Agotado'}
                          </span>
                        </div>
                      </div>

                      {/* Price & Add to Cart button */}
                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100/70">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-ink-light">Precio contado</span>
                          <span className="font-black text-sm sm:text-base text-ink">
                            {money(price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddFeatured(e, item)}
                          disabled={!hasStock}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white scale-105'
                              : hasStock
                              ? 'bg-primary hover:bg-primary-hover text-white shadow-xs active:scale-95'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          aria-label={`Agregar ${item.name} al carrito`}
                        >
                          {isJustAdded ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Information Cards: Cobertura, Entrega y Seguridad */}
      <section className="w-full bg-emerald-50/30 py-8 sm:py-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-ink">
              Compras seguras en la Bella Durmiente
            </h3>
            <p className="text-xs text-ink-light">
              Logística local transparente para comercios, repartidores y familias tingalesas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Dirección */}
            <div className="bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-ink">Direcciones guardadas</span>
                <Link to="/cliente/direcciones" className="text-primary hover:underline font-semibold">
                  Gestionar <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>

              <div className="space-y-2 py-1 text-xs">
                <p className="text-gray-600 leading-relaxed">
                  Registra tus puntos de entrega frecuentes (casa, trabajo o negocio) con referencias
                  claras de tu barrio en Tingo María.
                </p>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-ink flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium truncate">Centro, Castillo Grande, Supte San Jorge</span>
                </div>
              </div>
            </div>

            {/* Card 2: Cobertura PostgreSQL */}
            <div className="bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <Bike className="w-4 h-4 text-primary" />
                  <span>Cobertura & Tarifas de Entrega</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  PostgreSQL
                </span>
              </div>

              <div className="space-y-2 py-1 text-xs">
                <p className="text-[11px] text-ink-light leading-relaxed">
                  Repartidores locales conectando todos los sectores de Tingo María:
                </p>
                <div className="space-y-1.5 text-[11px]">
                  {zones.slice(0, 3).map((z) => (
                    <div
                      key={z.id}
                      className="flex justify-between items-center py-1 border-b border-gray-50"
                    >
                      <span className="font-medium text-ink truncate max-w-[170px]">{z.name}</span>
                      <span className="font-bold text-primary tabular-nums">
                        {money(z.baseFeeCents)} • ~{z.estimatedMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Mis compras */}
            <div className="bg-white rounded-2xl border border-emerald-100/70 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-ink">Tus pedidos y seguimiento</span>
                <Link to="/cliente/pedidos" className="text-primary hover:underline font-semibold">
                  Ver compras <ArrowRight className="w-3 h-3 inline" />
                </Link>
              </div>

              <div className="space-y-3 py-2 text-xs">
                <p className="text-gray-600 leading-relaxed">
                  Consulta el avance de tu orden en tiempo real, desde la aceptación del comercio
                  hasta la entrega contra entrega en efectivo.
                </p>
                <Link
                  to="/cliente/pedidos"
                  className="w-full py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold text-center block hover:bg-primary-hover shadow-subtle transition-all cursor-pointer"
                >
                  Ir al historial de pedidos →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliation Section: Tu negocio & Reparte */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid sm:grid-cols-2 gap-4">
        <Link
          to="/registro/comercio"
          className="bg-primary text-white rounded-2xl p-6 space-y-3 hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Store aria-hidden className="w-7 h-7" />
          <h2 className="text-xl font-bold">Tu negocio en Quickly</h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Afilia tu restaurante, bodega o tienda de Tingo María y recibe comandas al instante.
          </p>
          <span className="inline-flex items-center gap-2 font-bold text-sm">
            Afiliar mi negocio <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/registro/repartidor"
          className="bg-surface-subtle border border-border rounded-2xl p-6 space-y-3 hover:border-primary-dark transition-colors shadow-sm"
        >
          <Bike aria-hidden className="w-7 h-7 text-primary" />
          <h2 className="text-xl font-bold text-ink">Reparte en tu ciudad</h2>
          <p className="text-xs sm:text-sm text-ink-light">
            Genera ingresos entregando pedidos en moto, bicicleta o mototaxi en todo el valle.
          </p>
          <span className="inline-flex items-center gap-2 font-bold text-sm text-primary">
            Solicitar afiliación como repartidor <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </section>

      {/* Footer matching Quickly Branding */}
      <footer className="w-full bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-light">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center p-1 text-white shadow-subtle">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-extrabold text-ink">Quickly Tingo María</span>
              <span className="text-[11px] text-primary ml-1.5 font-bold">
                Plataforma de delivery y compras de la Selva Alta
              </span>
            </div>
          </div>

          <div className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            <span>Rupa Rupa • Castillo Grande • Naranjillo • Leoncio Prado</span>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
