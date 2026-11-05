import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRealCartStore, addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { catalogPlaceholder, catalogImage } from '../../lib/catalogImage';
import { catalogApi, CatalogProduct, PublicStore, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { RemoteState, useRemote } from '../operations/shared';
import { ProductDetailModal } from './ProductDetailModal';
import { SearchBar } from '../../components/shared/SearchBar';
import {
  Store,
  ShoppingBag,
  Sparkles,
  Clock,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Heart,
  ChevronRight,
  ChevronLeft,
  Bike,
  Truck,
  RotateCcw,
  Tag,
  Loader2,
  MapPin,
  UtensilsCrossed,
  ShoppingCart,
  PlusCircle,
  Shirt,
  Sprout,
  Share2,
} from 'lucide-react';

import heroFamilyGroceries from '../../assets/img/image copy 2.png';
import heroMotorcycleDelivery from '../../assets/img/image copy 3.png';
import heroSmartphoneView from '../../assets/img/image copy 4.png';

export function HomePage() {
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  // Recursos remotos conectados a PostgreSQL
  const categoriesResource = useRemote('home-categories', signal => catalogApi.categories(signal));
  const storesResource = useRemote('home-stores', signal => catalogApi.stores(signal));
  const productsResource = useRemote('home-products', signal => catalogApi.search({ limit: 40 }, signal));
  const coverageResource = useRemote('home-zones', signal => operationsApi.zones(signal));

  const categories = categoriesResource.data || [];
  const stores = storesResource.data || [];
  const allProducts = productsResource.data?.items || [];
  const zones = coverageResource.data?.filter(zone => zone.isActive) || [];

  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc'>('recommended');

  // Slider de banner
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

  // Modal y agregados
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  // 3 Slides con fotografías locales de Tingo María
  const heroSlides = [
    {
      id: 1,
      image: heroFamilyGroceries,
      badge: 'Restaurantes, Bodegas y Farmacias',
      title: 'Todo lo que necesitas, en un solo lugar',
      description: 'Pide de tus comercios locales favoritos con entrega rápida a domicilio.',
      ctaText: 'Ver comercios',
      ctaLink: '/negocios',
    },
    {
      id: 2,
      image: heroMotorcycleDelivery,
      badge: 'Envíos Express Selva Alta',
      title: 'Comida caliente y compras en minutos',
      description: 'Gastronomía amazónica, pollerías y farmacias con pago contra entrega en efectivo.',
      ctaText: 'Pedir ahora',
      ctaLink: '/negocios',
    },
    {
      id: 3,
      image: heroSmartphoneView,
      badge: 'Comercios de tu ciudad',
      title: 'Tus compras del hogar directo a tu puerta',
      description: 'Abarrotes frescos, boticas y productos locales en Rupa Rupa y Castillo Grande.',
      ctaText: 'Explorar catálogo',
      ctaLink: '/negocios',
    },
  ];

  // Auto-advance banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Filtrado y ordenamiento de productos en tiempo real
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Filtro por tienda específica
    if (selectedStoreId !== 'all') {
      result = result.filter(p => p.storeId === selectedStoreId);
    }

    // Filtro por tiendas abiertas
    if (onlyOpen) {
      const openStoreIds = new Set(stores.filter(s => s.isOpen && s.accepting_orders).map(s => s.id));
      result = result.filter(p => openStoreIds.has(p.storeId));
    }

    // Ordenamiento (Recomendados / Menor precio / Mayor precio)
    if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        const priceA = preferredSku(a)?.priceCents ?? 0;
        const priceB = preferredSku(b)?.priceCents ?? 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        const priceA = preferredSku(a)?.priceCents ?? 0;
        const priceB = preferredSku(b)?.priceCents ?? 0;
        return priceB - priceA;
      });
    }

    return result;
  }, [allProducts, selectedCategory, selectedStoreId, onlyOpen, sortBy, stores]);

  const handleAddToCart = (e: React.MouseEvent, product: CatalogProduct) => {
    e.stopPropagation();
    e.preventDefault();

    const sku = purchasableSku(product);
    if (!sku) return;

    try {
      addCatalogProduct(product, sku.id, 1);
      setAddError('');
      setAddedProductId(product.id);
      setTimeout(() => {
        setAddedProductId((curr) => (curr === product.id ? null : curr));
      }, 1500);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'No se pudo agregar al carrito.');
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedStoreId('all');
    setOnlyOpen(false);
    setDeliveryType('all');
    setSortBy('recommended');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedStoreId !== 'all' || onlyOpen || deliveryType !== 'all';

  return (
    <div className="w-full flex flex-col bg-[#f8f9fa] select-none min-h-screen">

      {/* 1. Hero Panoramic Banner (Estilo de la segunda imagen: Fotografía panorámica con texto centrado, buscador integrado y pastillas) */}
      <section className="relative w-full bg-emerald-950 text-white overflow-hidden py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]">
        {/* Slides de Fondo Panorámico */}
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
                className="w-full h-full object-cover object-center filter brightness-[0.75]"
              />
            </div>
          );
        })}

        {/* Gradiente sutil uniforme para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70 z-10" />

        {/* Contenido Central Inspirado en el Segundo Ejemplo */}
        <div className="relative z-20 max-w-3xl w-full mx-auto text-center space-y-4">
          {/* Título Principal */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            {heroSlides[currentHeroSlide].title}.{' '}
            <span className="font-extrabold text-emerald-400">en Tingo María</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-200 font-normal max-w-xl mx-auto drop-shadow-sm line-clamp-2">
            {heroSlides[currentHeroSlide].description}
          </p>

          {/* Buscador Centrado Sobre el Paisaje (Exacto a la segunda imagen de ejemplo) */}
          <div className="w-full max-w-2xl mx-auto pt-2">
            <SearchBar
              placeholder="¿Qué estás buscando? Restaurantes, boticas, productos..."
              className="shadow-2xl"
            />
          </div>

          {/* Pastillas de Categorías Rápidas bajo el Buscador (Estilo segunda imagen) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap pt-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20'
              }`}
            >
              Todos
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Paginación de slides */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentHeroSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentHeroSlide
                    ? 'w-6 h-1.5 bg-emerald-400 shadow-xs'
                    : 'w-2 h-1.5 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">

        {/* 2. Tarjeta Promocional Limpia (Directamente debajo del Hero, como en la segunda imagen) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                ¡Pide seguro en Tingo María! Comercios formales y entregas rápidas
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Restaurantes, bodegas y boticas de la ciudad</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Envíos express y pago contra entrega en efectivo</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            <Link
              to="/negocios"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explorar comercios</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/cliente/favoritos"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Ver mis favoritos"
              title="Mis favoritos"
            >
              <Heart className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3. Encabezado de la Sección de Catálogo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-200/80">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              Comercios y Productos en Tingo María
            </h2>
            <p className="text-xs text-gray-500">
              Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto disponible' : 'productos disponibles'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              aria-label="Ordenar productos"
            >
              <option value="recommended">Recomendados</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>
        </div>

        {/* 4. Estructura de 2 Columnas (Sidebar Filtros + Catálogo Principal) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Barra Lateral de Filtros */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            
            {/* Disponibilidad y Tipo de Entrega */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 space-y-4">
              {/* Switch: Solo abiertos ahora */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-150">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Solo abiertos ahora</span>
                  <span className="text-[10px] text-gray-500">Comercios recibiendo pedidos</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOnlyOpen(!onlyOpen)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                    onlyOpen ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'
                  }`}
                  aria-pressed={onlyOpen}
                  aria-label="Filtrar solo comercios abiertos"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Tipo de Entrega */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Tipo de Entrega
                </span>

                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryType(deliveryType === 'delivery' ? 'all' : 'delivery')}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      deliveryType === 'delivery' ? 'bg-emerald-50 text-primary font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>Envío a domicilio</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-primary font-bold px-1.5 py-0.5 rounded">
                      Express
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType(deliveryType === 'pickup' ? 'all' : 'pickup')}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      deliveryType === 'pickup' ? 'bg-emerald-50 text-primary font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-500" />
                      <span>Retiro en tienda</span>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded">
                      Sin costo
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Categorías */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Categorías
                </span>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    Ver todas
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>Todas las categorías</span>
                  <span className="text-[10px] opacity-80">{allProducts.length}</span>
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catProductsCount = allProducts.filter(p => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white font-bold shadow-2xs'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] opacity-80">{catProductsCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comercios Locales */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Comercios
                </span>
                {selectedStoreId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStoreId('all')}
                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    Ver todos
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedStoreId('all')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    selectedStoreId === 'all'
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>Todos los comercios</span>
                  <span className="text-[10px] opacity-80">{stores.length}</span>
                </button>

                {stores.slice(0, 10).map((st) => {
                  const isSelected = selectedStoreId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStoreId(st.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white font-bold shadow-2xs'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate max-w-[130px]">{st.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        st.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {st.isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Limpiar Filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </aside>

          {/* Catálogo de Productos y Comercios */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Strip de Tiendas Oficiales */}
            {stores.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Tiendas oficiales de la ciudad</span>
                  </div>
                  <Link
                    to="/negocios"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Ver todas</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {stores.slice(0, 8).map((st) => (
                    <Link
                      key={st.id}
                      to={`/negocios/${st.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-150 hover:border-primary hover:bg-emerald-50/30 transition-all flex-shrink-0 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-primary flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors truncate max-w-[120px]">
                          {st.name}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize truncate max-w-[120px]">
                          {st.category_code}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Error de carrito */}
            {addError && <p role="alert" className="text-xs font-bold text-destructive bg-red-50 p-3 rounded-xl">{addError}</p>}

            {/* Grid de Productos (Estilo limpio como en la segunda imagen: Imágenes que cubren bien la parte superior y badges en las esquinas) */}
            {productsResource.loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-gray-500 bg-white rounded-2xl border border-gray-200">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span>Cargando productos de Tingo María...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-sm text-gray-800">No se encontraron productos con estos filtros</p>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Prueba cambiando la categoría, la tienda seleccionada o limpia los filtros.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                >
                  Mostrar todos los productos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((item) => {
                  const isJustAdded = addedProductId === item.id;
                  const sku = preferredSku(item);
                  const price = sku ? sku.priceCents : 0;
                  const hasStock = !!purchasableSku(item);
                  const rawImg = item.images[0]?.url;
                  const productImg = catalogImage(rawImg);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProduct(item)}
                      className="group bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:border-primary hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col justify-between text-left h-full cursor-pointer"
                    >
                      {/* Imagen con Badges de Esquina (Estilo de la segunda imagen: badges en esquina izquierda y derecha) */}
                      <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden border-b border-gray-100">
                        <img
                          src={productImg}
                          alt={item.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Badge Izquierdo: Estado de Envío (Verde como en el ejemplo) */}
                        <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          {hasStock ? 'Disponible ahora' : 'Agotado'}
                        </span>

                        {/* Badge Derecho: Nombre/Tipo de Tienda (Blanco como en el ejemplo) */}
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs truncate max-w-[100px]">
                          {item.storeName}
                        </span>
                      </div>

                      {/* Cuerpo de información */}
                      <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                        <div>
                          {/* Categoría / Tienda */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5 truncate">
                            <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="font-semibold text-gray-600 truncate">{item.storeName}</span>
                          </div>

                          {/* Nombre del producto */}
                          <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
                            {item.name}
                          </h3>
                        </div>

                        {/* Precio & Botón de Compra */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 block">Precio online</span>
                            <span className="font-black text-sm sm:text-base text-gray-900 tabular-nums">
                              {sku ? money(price) : 'S/ --'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, item)}
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
          </main>
        </div>

        {/* 5. Secciones Informativas */}
        <section className="grid sm:grid-cols-2 gap-4 pt-4">
          <Link
            to="/registro/comercio"
            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-2 hover:border-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">¿Tienes un negocio en Tingo María?</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Afilia tu restaurante, bodega o tienda a Quickly y recibe pedidos en línea de toda la ciudad.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-xs text-primary pt-1">
              Afiliar mi negocio <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/registro/repartidor"
            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-2 hover:border-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Bike className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Reparte en tu ciudad</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Genera ingresos entregando pedidos en moto, bicicleta o mototaxi en todo el valle del Huallaga.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-xs text-primary pt-1">
              Solicitar afiliación como repartidor <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </section>

        {/* Footer */}
        <footer className="w-full bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-6 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900">Quickly Tingo María</span>
              <span className="text-[11px] text-primary ml-1.5 font-bold">
                Plataforma de delivery y compras de la Selva Alta
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Rupa Rupa • Castillo Grande • Naranjillo • Leoncio Prado
          </p>
        </footer>

      </div>

      {/* Modal de Detalle de Producto */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
