import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRealCartStore, addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { catalogPlaceholder, catalogImage } from '../../lib/catalogImage';
import { catalogApi, CatalogProduct, PublicStore, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { RemoteState, useRemote } from '../operations/shared';
import { ProductDetailModal } from './ProductDetailModal';
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
  SlidersHorizontal,
  RotateCcw,
  Tag,
  Loader2,
  MapPin,
  UtensilsCrossed,
  ShoppingCart,
  PlusCircle,
  Shirt,
  Sprout,
  CheckCircle,
} from 'lucide-react';

import heroFamilyGroceries from '../../assets/img/image copy 2.png';
import heroMotorcycleDelivery from '../../assets/img/image copy 3.png';
import heroSmartphoneView from '../../assets/img/image copy 4.png';

export function HomePage() {
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  // Recursos remotos oficiales conectados a PostgreSQL Supabase
  const categoriesResource = useRemote('home-categories', signal => catalogApi.categories(signal));
  const storesResource = useRemote('home-stores', signal => catalogApi.stores(signal));
  const productsResource = useRemote('home-products', signal => catalogApi.search({ limit: 40 }, signal));
  const coverageResource = useRemote('home-zones', signal => operationsApi.zones(signal));

  const categories = categoriesResource.data || [];
  const stores = storesResource.data || [];
  const allProducts = productsResource.data?.items || [];
  const zones = coverageResource.data?.filter(zone => zone.isActive) || [];

  // Estados de filtros (Estilo Falabella)
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
      title: 'Todo lo que necesitas en Tingo María',
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
    }, 5500);
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
      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">

        {/* 1. Hero Promo Banner (Proporción horizontal limpia estilo Falabella) */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs h-[180px] sm:h-[220px] lg:h-[240px] flex flex-col justify-end p-5 sm:p-7 text-white select-none group w-full bg-gradient-to-r from-emerald-900 to-emerald-950">
          {heroSlides.map((slide, idx) => {
            const isActive = idx === currentHeroSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center filter brightness-[0.88]"
                />
              </div>
            );
          })}

          {/* Gradiente sutil para lectura sin saturación */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />

          {/* Contenido del Banner */}
          <div className="relative z-20 space-y-2 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-xs">
              <Sprout className="w-3.5 h-3.5 text-white" />
              <span>{heroSlides[currentHeroSlide].badge}</span>
            </span>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
              {heroSlides[currentHeroSlide].title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-200 font-normal leading-snug line-clamp-1 max-w-md">
              {heroSlides[currentHeroSlide].description}
            </p>

            <div className="pt-1">
              <Link
                to={heroSlides[currentHeroSlide].ctaLink}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>{heroSlides[currentHeroSlide].ctaText}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Dots de paginación */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-6 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentHeroSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentHeroSlide
                    ? 'w-4 h-1.5 bg-white shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 2. Estructura de 2 Columnas Estilo Falabella (Sidebar Filtros + Catálogo Principal) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Barra Lateral de Filtros (Sidebar limpio estilo Falabella) */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            
            {/* Tarjeta 1: Tipo de Entrega & Disponibilidad (Como Falabella Image 1) */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 space-y-4">
              
              {/* Switch Tipo CYBER WOW: Solo abiertos ahora */}
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

            {/* Tarjeta 2: Categorías (Conectadas a la API) */}
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

            {/* Tarjeta 3: Comercios Locales Verificados */}
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

            {/* Botón Limpiar Filtros si hay alguno activo */}
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

          {/* Área Principal (Productos y Comercios estilo Falabella) */}
          <main className="flex-1 min-w-0 space-y-4">

            {/* Barra Superior de Catálogo: Ordenar por + Paginación / Conteo */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  aria-label="Ordenar productos"
                >
                  <option value="recommended">Recomendados</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                </select>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 self-end sm:self-auto">
                <span className="font-bold text-gray-800">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1 text-primary font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Tingo María</span>
                </span>
              </div>
            </div>

            {/* Strip de Tiendas Oficiales (Logos / Accesos rápidos) */}
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

            {/* Feedback de error de carrito */}
            {addError && <p role="alert" className="text-xs font-bold text-destructive bg-red-50 p-3 rounded-xl">{addError}</p>}

            {/* Estado de Carga */}
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
              /* Grid de Productos estilo Falabella: Limpio, espacioso y sin saturación */
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
                      {/* Imagen Cuadrada con Badge sutil */}
                      <div className="relative aspect-square w-full bg-white overflow-hidden border-b border-gray-100 flex items-center justify-center p-2">
                        <img
                          src={productImg}
                          alt={item.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                          }}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                          Envío local
                        </span>
                      </div>

                      {/* Cuerpo de información */}
                      <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                        <div>
                          {/* Tienda */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1 truncate" title={item.storeName}>
                            <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="font-semibold text-gray-700 truncate">{item.storeName}</span>
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

        {/* 3. Secciones Informativas Limpias (Logística y Afiliaciones) */}
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
