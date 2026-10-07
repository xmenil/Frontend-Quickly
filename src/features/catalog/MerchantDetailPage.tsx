import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Product } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import {
  Star,
  Clock,
  Bike,
  MapPin,
  Phone,
  Heart,
  ChevronLeft,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';

export const MerchantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { merchants, products, favoriteMerchantIds, toggleFavoriteMerchant } = useDataStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const merchant = merchants.find((m) => m.id === id);

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

  const isFavorite = favoriteMerchantIds.includes(merchant.id);
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  // Available unique categories in this merchant's products
  const productCategories = Array.from(new Set(merchantProducts.map((p) => p.category)));

  const filteredProducts =
    activeCategoryFilter === 'all'
      ? merchantProducts
      : merchantProducts.filter((p) => p.category === activeCategoryFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/negocios"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary transition-colors bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a todos los comercios</span>
        </Link>
      </div>

      {/* Banner & Header Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full bg-gray-100 overflow-hidden">
          <img
            src={merchant.bannerUrl}
            alt={merchant.name}
            className={`w-full h-full object-cover ${
              !merchant.isOpen ? 'grayscale contrast-75 opacity-70' : ''
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" fill="%23FFF1F6"><rect width="800" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23C60050" font-family="sans-serif" font-weight="bold" font-size="28">Quickly Tingo María</text></svg>';
            }}
          />

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => toggleFavoriteMerchant(merchant.id)}
            className="absolute top-4 right-4 touch-target w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`}
            />
          </button>

          {!merchant.isOpen && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-gray-900/95 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-xl">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Comercio cerrado en este momento. Horario: {merchant.schedule}</span>
              </div>
            </div>
          )}
        </div>

        {/* Merchant Meta Info */}
        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs font-bold capitalize text-primary bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                  {merchant.category}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    merchant.isOpen
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      merchant.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  {merchant.isOpen ? 'Abierto para pedidos' : 'Cerrado temporalmente'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-ink">{merchant.name}</h1>
              <p className="text-sm text-ink-light max-w-2xl mt-2 leading-relaxed">
                {merchant.description}
              </p>
            </div>

            {/* Rating Box */}
            <div className="flex md:flex-col items-center md:items-end justify-between bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl">
              <div className="flex items-center gap-1.5 text-ink font-black text-lg">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{merchant.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500 font-medium tabular-nums">
                  ({merchant.ratingCount} valoraciones)
                </span>
              </div>
              <span className="text-xs text-ink-light font-medium mt-1">Horario: {merchant.schedule}</span>
            </div>
          </div>

          {/* Quick Details Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs text-ink-light">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium">Tiempo estimado</span>
                <span className="font-bold text-ink tabular-nums">
                  {merchant.prepTimeMinutes + 10}-{merchant.prepTimeMinutes + 20} min
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium">Tarifa de envío</span>
                <span className="font-bold text-ink tabular-nums">
                  {formatCents(merchant.deliveryFeeCents)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-500 block text-[11px] font-medium">Pedido mínimo</span>
                <span className="font-bold text-ink">
                  {formatCents(merchant.minOrderCents)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Ubicación local</span>
                <span className="font-bold text-ink truncate max-w-[130px] block">
                  {merchant.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog & Products Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <h2 className="text-xl font-extrabold text-ink">
            Carta y Catálogo ({merchantProducts.length} productos)
          </h2>

          {/* Sub-filter chips if applicable */}
          {productCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`touch-target px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeCategoryFilter === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`touch-target px-3.5 py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
                    activeCategoryFilter === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              merchant={merchant}
              onOpenDetail={(prod) => setSelectedProduct(prod)}
            />
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        merchant={merchant}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
