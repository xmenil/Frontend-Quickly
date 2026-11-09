import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStorefrontStore } from './useStorefront';
import { useCatalogFavorite } from './useCatalogFavorite';
import { RemoteState } from '../operations/shared';
import { ProductCard } from '../../components/shared/ProductCard';
import { formatCents } from '../../lib/currency';
import { getStoreCoverImage } from '../../lib/storeImage';
import {
  Star,
  Clock,
  Bike,
  MapPin,
  Heart,
  ChevronLeft,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';

export const MerchantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const resource = useStorefrontStore(id || '');
  const favorite = useCatalogFavorite('store', id || '');
  const products = resource.data?.products || [];

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const merchant = resource.data?.merchant;
  if (resource.loading || resource.error) return <div className="max-w-4xl mx-auto py-16 px-4"><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/><Link to="/negocios" className="text-primary font-bold">Volver a Comercios</Link></div>;

  if (!merchant) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Comercio no encontrado</h1>
        <p className="text-gray-500 text-sm mb-6">El comercio solicitado no existe o fue retirado.</p>
        <Link
          to="/negocios"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          Volver a Comercios
        </Link>
      </div>
    );
  }

  const isFavorite = favorite.isFavorite;
  const storeImage = getStoreCoverImage(merchant);
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  // Available unique categories in this merchant's products
  const productCategories = Array.from(new Set(merchantProducts.map((p) => p.categoryId || p.category)));

  const filteredProducts =
    activeCategoryFilter === 'all'
      ? merchantProducts
      : merchantProducts.filter((p) => (p.categoryId || p.category) === activeCategoryFilter);

  return (
    <div className="w-full pb-20">
      {/* Barra de navegación estática/fija de esquina a esquina (Full-width, Slim & Sticky) */}
      <nav
        aria-label="Barra de navegación de tienda"
        className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-[125px] md:top-[106px] z-20 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Lado izquierdo: Volver solo en letras (sin botones bordeados) + Breadcrumbs limpios */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Link
              to="/negocios"
              className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer text-xs group py-0.5"
              title="Volver a todos los comercios"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Volver a comercios</span>
            </Link>

            <span className="text-gray-300 font-light">|</span>

            <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs flex-wrap">
              <Link
                to={`/negocios?categoria=${merchant.category}`}
                className="hover:text-primary hover:underline transition-colors uppercase text-[11px] font-bold tracking-wider text-gray-500"
              >
                {merchant.category}
              </Link>
              <span className="text-gray-300 text-[10px]">&gt;</span>
              <span className="text-ink font-semibold truncate max-w-[200px] sm:max-w-none">
                {merchant.name}
              </span>
            </div>
          </div>

          {/* Lado derecho: Estado y categoría en texto limpio */}
          <div className="flex items-center gap-3 text-xs font-semibold ml-auto text-gray-500">
            <span className={`inline-flex items-center gap-1.5 ${merchant.isOpen ? 'text-emerald-600' : 'text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${merchant.isOpen ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {merchant.isOpen ? 'Abierto ahora' : 'Cerrado temporalmente'}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 space-y-5">

      {/* Banner & Header Card: Layout Horizontal (Lado izquierdo imagen, Lado derecho información) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden p-3.5 sm:p-5 flex flex-col md:flex-row items-center md:items-stretch gap-4 sm:gap-6">
        {/* Lado izquierdo: Imagen compacta de la tienda */}
        <div className="relative w-full md:w-72 lg:w-80 aspect-[16/10] md:aspect-auto md:h-auto rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <img
            src={storeImage}
            alt={merchant.name}
            className={`w-full h-full object-cover ${
              !merchant.isOpen ? 'grayscale contrast-75 opacity-70' : ''
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=700&auto=format&fit=crop&q=80';
            }}
          />

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => void favorite.toggle()}
            disabled={favorite.busy}
            aria-pressed={isFavorite}
            className="absolute top-2.5 right-2.5 touch-target w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-subtle flex items-center justify-center text-gray-700 hover:text-primary transition-colors cursor-pointer z-10"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : ''}`}
            />
          </button>

          {!merchant.isOpen && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 text-center z-10">
              <div className="bg-gray-900/95 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs shadow-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Cerrado ahora</span>
              </div>
            </div>
          )}
        </div>

        {/* Lado derecho: Información organizada, sin redundancia y compacta */}
        <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
          <div>
            {/* Categoría y Estado */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold capitalize text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {merchant.category}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                    merchant.isOpen
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      merchant.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {merchant.isOpen ? 'Abierto para pedidos' : 'Cerrado temporalmente'}
                </span>
              </div>

              {/* Calificación */}
              <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">
                  {merchant.rating == null ? 'Sin valoraciones' : merchant.rating.toFixed(1)}
                </span>
                {merchant.rating != null && (
                  <span className="text-gray-400 font-medium tabular-nums">({merchant.ratingCount})</span>
                )}
              </div>
            </div>

            {/* Nombre del comercio */}
            <h1 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight">
              {merchant.name}
            </h1>

            {/* Descripción breve si existe */}
            {merchant.description && (
              <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-1 leading-relaxed">
                {merchant.description}
              </p>
            )}
          </div>

          {/* Fila de detalles compactos: Dirección, tiempo, envío, horario */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-gray-400 block font-medium">Ubicación local</span>
                <span className="font-bold text-gray-900 truncate block">
                  {merchant.address}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Tiempo</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {merchant.prepTimeMinutes === undefined ? 'Consultar' : `${merchant.prepTimeMinutes} min de preparación`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Envío</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {merchant.deliveryFeeCents === undefined ? 'En checkout' : `Desde ${formatCents(merchant.deliveryFeeCents)}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="truncate">
                <span className="text-[10px] text-gray-400 block font-medium">Atención</span>
                <span className="font-bold text-gray-900 text-[11px] truncate block" title={merchant.schedule}>
                  Horario: {merchant.schedule}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {favorite.error && <p role="alert" className="text-destructive">{favorite.error}</p>}
      {/* Catalog & Products Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <h2 className="text-xl font-extrabold text-ink">
            Carta y Catálogo ({merchantProducts.length} {merchantProducts.length === 1 ? 'producto' : 'productos'})
          </h2>

          {/* Sub-filter chips if applicable */}
          {productCategories.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`touch-target px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer border shadow-2xs ${
                  activeCategoryFilter === 'all'
                    ? 'bg-white text-primary border-primary ring-2 ring-primary/20 font-bold'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                Todos
              </button>
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`touch-target px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl capitalize transition-all cursor-pointer border shadow-2xs ${
                    activeCategoryFilter === cat
                      ? 'bg-white text-primary border-primary ring-2 ring-primary/20 font-bold'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {merchantProducts.find(product => product.categoryId === cat)?.categoryName || cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary-50 flex items-center justify-center text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-ink">No hay productos en esta categoría</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Prueba seleccionando "Todos" para ver todos los artículos disponibles en {merchant.name}.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                merchant={merchant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
