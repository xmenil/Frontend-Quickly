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

import heroFamilyGroceries from '../../assets/img/image copy 2.png';

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

  // 3 Productos patrocinados/destacados con imágenes nítidas de la base de datos (Estilo Imagen 2 y 3)
  const sponsoredProducts = useMemo(() => {
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

      {/* 1. Banner Principal Promocional Patrocinando Productos (Estilo Imagen 2 de AliExpress e Imagen 3 de Oechsle) */}
      <section className="relative w-full bg-gradient-to-r from-emerald-950 via-primary-dark to-emerald-900 text-white overflow-hidden py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-primary-dark/20">
        {/* Fondo sutil con imagen local integrada suavemente */}
        <div className="absolute inset-0 z-0 opacity-15 mix-blend-luminosity pointer-events-none">
          <img
            src={heroFamilyGroceries}
            alt="Fondo Tingo María"
            className="w-full h-full object-cover object-center filter blur-[1px]"
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda: Mensaje Promocional y Buscador */}
          <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Promociones en Tingo María · Envíos Express</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
              Lo mejor de tu ciudad,{' '}
              <span className="text-emerald-300 underline decoration-emerald-400/40">directo a tu mesa</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
              Pide de tus restaurantes favoritos, pollerías, boticas y bodegas de Rupa Rupa y Castillo Grande con entrega rápida y pago contra entrega en efectivo.
            </p>

            {/* Buscador Integrado en el Banner */}
            <div className="pt-1 max-w-md mx-auto lg:mx-0">
              <SearchBar
                placeholder="¿Qué estás buscando? Restaurantes, boticas..."
                className="shadow-xl"
              />
            </div>

            {/* Botones de acción rápida */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs">
              <Link
                to="/negocios"
                className="px-5 py-2.5 rounded-xl bg-white text-primary font-black hover:bg-emerald-50 shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Ver ofertas</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/negocios"
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold border border-white/20 transition-all"
              >
                Ver comercios
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarjetas de Productos Patrocinados (Como en Imagen 3 de Oechsle) */}
          <div className="lg:col-span-7 w-full">
            <div className="flex items-center justify-between pb-2 text-white">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                <Tag className="w-3.5 h-3.5" />
                <span>Productos patrocinados de comercios locales</span>
              </div>
              <span className="text-[11px] text-emerald-100 font-semibold">Tingo María</span>
            </div>

            {/* Grid de 3 productos patrocinados en tarjetas nítidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {sponsoredProducts.map((p) => {
                const sku = preferredSku(p);
                const price = sku ? sku.priceCents : 0;
                const rawImg = p.images[0]?.url;
                const img = catalogImage(rawImg);
                const isJustAdded = addedProductId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="bg-white rounded-2xl p-3 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 text-left cursor-pointer flex flex-col justify-between border border-gray-150 group"
                  >
                    {/* Imagen Cuadrada Nítida */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 mb-2 border border-gray-100">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs truncate max-w-[110px]">
                        {p.storeName}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2.25rem]">
                        {p.name}
                      </h4>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="font-black text-sm sm:text-base text-gray-900 tabular-nums">
                          {sku ? money(price) : 'S/ --'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, p)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary hover:bg-primary-hover text-white shadow-xs active:scale-95'
                          }`}
                          aria-label={`Agregar ${p.name}`}
                        >
                          {isJustAdded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                        </button>
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
                  {st.isOpen ? '● Abierto ahora' : '○ Cerrado'}
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
