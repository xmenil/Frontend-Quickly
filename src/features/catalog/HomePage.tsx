import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { catalogPlaceholder, catalogImage } from '../../lib/catalogImage';
import { catalogApi, CatalogProduct, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { useRemote } from '../operations/shared';
import { ProductDetailModal } from './ProductDetailModal';
import { SearchBar } from '../../components/shared/SearchBar';
import {
  Store,
  Sparkles,
  ArrowRight,
  Check,
  ChevronRight,
  Bike,
  Tag,
  Loader2,
  MapPin,
  Banknote,
  ShoppingCart,
} from 'lucide-react';

function extractBrandOrStore(p: CatalogProduct): string {
  if (p.brand && p.brand.trim()) return p.brand.toUpperCase();
  const name = (p.name || '').toUpperCase();
  const brands = ['XIAOMI', 'SAMSUNG', 'APPLE', 'HONOR', 'HUAWEI', 'LENOVO', 'LG', 'OSTER', 'PHILIPS', 'VANS', 'MABE', 'INDURAMA', 'HAYLOU'];
  for (const b of brands) {
    if (name.includes(b)) return b;
  }
  return (p.storeName || 'TIENDA LOCAL').toUpperCase();
}

function getProductSpecBadges(p: CatalogProduct): [string, string] {
  const name = (p.name || '').toLowerCase();

  if (name.includes('celular') || name.includes('smartphone') || name.includes('redmi') || name.includes('samsung') || name.includes('galaxy') || name.includes('xiaomi') || name.includes('honor')) {
    if (name.includes('256gb')) return ['256GB ROM', '8GB RAM'];
    if (name.includes('128gb')) return ['128GB ROM', '6GB RAM'];
    return ['PANTALLA AMOLED', 'OCTA CORE'];
  }
  if (name.includes('smartwatch') || name.includes('reloj') || name.includes('band')) {
    return ['BLUETOOTH', 'RESISTENTE AL AGUA'];
  }
  if (name.includes('laptop') || name.includes('notebook')) {
    return ['16GB RAM', '512GB SSD'];
  }
  if (name.includes('tv') || name.includes('televisor')) {
    return ['4K ULTRA HD', 'SMART TV'];
  }
  if (name.includes('zapatillas') || name.includes('polo') || name.includes('pantalon') || name.includes('denim')) {
    return ['ORIGINAL', 'ALTA CALIDAD'];
  }
  if (name.includes('bloqueador') || name.includes('repelente')) {
    return ['DERMATOLÓGICO', 'PROTECCIÓN UV'];
  }
  return ['ENVÍO EXPRESS', 'EN STOCK'];
}

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Recursos remotos conectados a PostgreSQL
  const categoriesResource = useRemote('home-categories', signal => catalogApi.categories(signal));
  const storesResource = useRemote('home-stores', signal => catalogApi.stores(signal));
  const productsResource = useRemote('home-products', signal => catalogApi.search({ limit: 40 }, signal));
  const coverageResource = useRemote('home-zones', signal => operationsApi.zones(signal));

  const categories = categoriesResource.data || [];
  const stores = storesResource.data || [];
  const allProducts = productsResource.data?.items || [];

  // Modal y agregados
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  // Productos generales destacados (tecnología, electrohogar, calzado, etc.) - NO sólo comida
  const sponsoredProducts = useMemo(() => {
    // 1. Priorizamos productos generales fuera de comida que tengan imagen y SKU
    const nonFood = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const isFood = name.includes('pollo a la brasa') || name.includes('juane') || name.includes('tacacho') || name.includes('chaufa') || name.includes('costillas') || name.includes('patarashca') || name.includes('cecina');
      return !isFood && !!purchasableSku(p) && p.images && p.images.length > 0;
    });

    if (nonFood.length >= 3) return nonFood.slice(0, 3);

    // 2. Fallback: Cualquier producto no gastronómico con SKU
    const anyNonFood = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const isFood = name.includes('pollo a la brasa') || name.includes('juane') || name.includes('tacacho') || name.includes('chaufa');
      return !isFood && !!purchasableSku(p);
    });

    if (anyNonFood.length >= 3) return anyNonFood.slice(0, 3);

    // 3. Fallback general
    const withImages = allProducts.filter(p => p.images && p.images.length > 0 && !!purchasableSku(p));
    return withImages.length >= 3 ? withImages.slice(0, 3) : allProducts.slice(0, 3);
  }, [allProducts]);

  // Manejo de agregar al carrito
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

  return (
    <div className="w-full flex flex-col bg-[#f8f9fa] select-none min-h-screen">

      {/* 1. Banner Promocional Oechsle / Falabella - De esquina a esquina y con productos generales grandes sin fondo */}
      <section className="w-full bg-[#f3f4f6] border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row min-h-[440px] lg:min-h-[480px]">
          {/* Columna Izquierda: Fondo Verde Selva Oscuro con Tipografía Promocional en Texto Plano (Sin Emojis) */}
          <div className="bg-[#042817] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between lg:w-[32%] xl:w-[28%] flex-shrink-0">
            <div className="space-y-4">
              <div className="space-y-0.5">
                <p className="text-amber-300 text-sm sm:text-base font-serif italic tracking-wide">
                  Tingo María
                </p>
                <p className="text-[10px] sm:text-[11px] font-black tracking-widest text-emerald-300 uppercase">
                  COMERCIO LOCAL
                </p>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                PRODUCTOS DESTACADOS
              </h2>

              {/* Tarjeta de beneficio tipo recuadro cyan en Oechsle */}
              <div className="bg-[#00a8e8] text-white p-4 rounded-xl shadow-xs space-y-1">
                <p className="text-[10px] font-black tracking-wider uppercase text-sky-100">
                  ENVÍOS EXPRESS EN EL DÍA
                </p>
                <p className="text-sm sm:text-base font-black leading-snug">
                  Pago contra entrega en efectivo
                </p>
                <p className="text-[11px] text-sky-100 font-medium">
                  En productos seleccionados de comercios locales
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/negocios"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#042817] hover:bg-gray-100 px-7 py-3 rounded-full font-black text-xs sm:text-sm shadow-md transition-all group"
              >
                <span>Ver más</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarima Clara con los Productos Grandes sin fondo que cubren la tarima */}
          <div className="flex-1 bg-gradient-to-r from-[#eceef1] via-[#f3f4f6] to-[#eceef1] p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200/80 items-stretch">
              {sponsoredProducts.map((p) => {
                const sku = preferredSku(p);
                const price = sku ? sku.priceCents : 0;
                const rawImg = p.images[0]?.url;
                const img = catalogImage(rawImg);
                const isJustAdded = addedProductId === p.id;
                const [spec1, spec2] = getProductSpecBadges(p);
                const brand = extractBrandOrStore(p);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="flex flex-col justify-between items-center text-center p-4 sm:p-5 lg:p-6 cursor-pointer group transition-all duration-200 hover:bg-white/50"
                  >
                    {/* Badges superiores tipo especificación en negro claro (Imagen Oechsle) */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2 w-full">
                      <span className="bg-[#18181b] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-2xs">
                        {spec1}
                      </span>
                      <span className="bg-[#18181b] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-2xs">
                        {spec2}
                      </span>
                    </div>

                    {/* Imagen grande sin fondo que cubre la tarima con sombra suave en la base */}
                    <div className="relative w-full h-56 sm:h-64 lg:h-72 flex items-center justify-center my-2">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="h-full w-auto max-w-full object-contain mix-blend-multiply filter drop-shadow-[0_12px_14px_rgba(0,0,0,0.18)] group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Información debajo de la foto: Marca, Nombre y Pastilla de Precio */}
                    <div className="w-full space-y-1.5 mt-2 flex flex-col items-center">
                      <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 line-clamp-1">
                        {brand}
                      </span>

                      <h3 className="font-bold text-xs sm:text-sm text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-snug max-w-[220px]">
                        {p.name}
                      </h3>

                      {/* Pastilla de precio en cyan brillante estilo Oechsle */}
                      <div className="pt-1 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#00a8e8] text-white font-black text-xs sm:text-sm px-3 py-1 rounded-sm shadow-2xs tabular-nums">
                            {sku ? money(price) : 'S/ --'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, p)}
                            className={`p-1.5 rounded-sm transition-all cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                            }`}
                            aria-label={`Agregar ${p.name}`}
                          >
                            {isJustAdded ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Alerta de error de carrito */}
      {addError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <p role="alert" className="text-xs font-bold text-destructive bg-red-50 p-3 rounded-xl border border-red-200">
            {addError}
          </p>
        </div>
      )}

      {/* 2. Barra de Garantías y Beneficios (Estilo Imagen 4 de Oechsle) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Pago en efectivo</p>
              <p className="text-[11px] text-gray-500">Contra entrega al recibir</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Envíos express</p>
              <p className="text-[11px] text-gray-500">En moto a tu dirección</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Comercios formales</p>
              <p className="text-[11px] text-gray-500">Tiendas verificadas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Cobertura local</p>
              <p className="text-[11px] text-gray-500">Tingo María y Castillo Grande</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tiendas y Comercios Oficiales de la Ciudad (Pocas nomás + botón ver más como en Imagen 4) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-gray-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              Tiendas oficiales de la ciudad
            </h2>
            <p className="text-xs text-gray-500">
              Comercios destacados en Rupa Rupa y Castillo Grande
            </p>
          </div>

          <Link
            to="/negocios"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver más tiendas</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Tiendas principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stores.slice(0, 4).map((st) => (
            <Link
              key={st.id}
              to={`/negocios/${st.id}`}
              className="bg-white rounded-2xl border border-gray-200/90 hover:border-primary p-3.5 sm:p-4 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between gap-3 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform flex-shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors truncate">
                    {st.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 capitalize truncate">
                    {st.category_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  st.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {st.isOpen ? 'Abierto ahora' : 'Cerrado'}
                </span>
                <span className="font-bold text-primary flex items-center">
                  Entrar <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Productos de Interés / Recomendados para ti (Tarjetas cuadradas bien nítidas, poca información) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              Recomendados para ti en Tingo María
            </h2>
            <p className="text-xs text-gray-500">
              Productos de interés con entrega rápida y pago contra entrega
            </p>
          </div>

          <Link
            to="/negocios"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todo el catálogo</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading state */}
        {productsResource.loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-gray-500 bg-white rounded-2xl border border-gray-200">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span>Cargando productos de Tingo María...</span>
          </div>
        ) : allProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
            <p className="font-bold text-sm text-gray-800">No hay productos disponibles por el momento</p>
            <p className="text-gray-500">Pronto agregaremos más comercios a la plataforma.</p>
          </div>
        ) : (
          <>
            {/* Grid de 8 productos seleccionados con imágenes cuadradas nítidas y poca información */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {allProducts.slice(0, 8).map((item) => {
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
                    {/* Imagen Cuadrada Nítida */}
                    <div className="relative aspect-square w-full bg-gray-100 overflow-hidden border-b border-gray-100">
                      <img
                        src={productImg}
                        alt={item.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Contenido Limpio con Poco Texto: Tienda, Nombre y Precio */}
                    <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-2.5">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-emerald-800 truncate">
                          {item.storeName}
                        </p>
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="font-black text-sm sm:text-base text-gray-900 tabular-nums">
                          {sku ? money(price) : 'S/ --'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, item)}
                          disabled={!hasStock}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
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

            {/* Botón para ver más productos */}
            <div className="flex justify-center pt-2 pb-2">
              <Link
                to="/negocios"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-800 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>Explorar todos los productos del catálogo ({allProducts.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 5. Secciones Informativas: Afiliar Comercio y Ser Repartidor */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8">
        <section className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/registro/comercio"
            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-2 hover:border-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">¿Tienes un negocio en Tingo María?</h3>
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
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Reparte en tu ciudad</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Genera ingresos entregando pedidos en moto, bicicleta o mototaxi en todo el valle del Huallaga.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-xs text-primary pt-1">
              Solicitar afiliación como repartidor <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </section>
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
