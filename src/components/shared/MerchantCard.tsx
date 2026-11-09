import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StorefrontMerchant as Merchant } from '../../features/catalog/storefrontModel';
import { useCatalogFavorite } from '../../features/catalog/useCatalogFavorite';
import { formatCents } from '../../lib/currency';
import { getStoreCoverImage } from '../../lib/storeImage';
import { Star, MapPin, Heart } from 'lucide-react';

interface MerchantCardProps {
  merchant: Merchant;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({ merchant }) => {
  const favorite = useCatalogFavorite('store', merchant.id);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isFavorite = favorite.isFavorite;
  const storeImage = getStoreCoverImage(merchant);

  return (
    <Link
      to={`/negocios/${merchant.id}`}
      className="relative group bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:border-gray-950 transition-colors overflow-hidden flex flex-col cursor-pointer block select-none"
    >
      {/* Banner Container con foto real y sin títulos repetidos (Diseño Imagen 3) */}
      <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
        {/* Shimmer skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        )}

        <img
          src={storeImage}
          alt={merchant.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=700&auto=format&fit=crop&q=80';
          }}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !merchant.isOpen ? 'grayscale contrast-75 opacity-70' : ''
          } ${!imgLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
        />

        {/* Badge de Categoría sobre la foto estilo Imagen 3 */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm capitalize">
            {merchant.category || 'Comercio aliado'}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void favorite.toggle();
          }}
          className="absolute top-2.5 right-2.5 touch-target w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-subtle flex items-center justify-center text-gray-700 hover:text-primary transition-colors z-10 cursor-pointer"
          disabled={favorite.busy}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-primary text-primary' : ''
            }`}
          />
        </button>

        {/* Overlay si está cerrado */}
        {!merchant.isOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3 text-center z-15">
            <span className="bg-ink/90 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">
              Cerrado en este momento
            </span>
          </div>
        )}
      </div>

      {favorite.error && <p role="alert" className="px-3 pt-2 text-xs text-destructive">{favorite.error}</p>}

      {/* Info Section compacta y limpia estilo Imagen 3 */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between space-y-1.5">
        {/* Fila 1: Título de la tienda (solo 1 vez, sin redundancia) y Calificación */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-extrabold text-gray-950 text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1">
            {merchant.name}
          </h3>

          <div className="flex items-center gap-1 text-xs font-bold text-gray-700 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">
              {merchant.rating == null ? 'Sin valoraciones' : merchant.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Fila 2: Ubicación / Dirección */}
        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium truncate">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{merchant.address || 'Tingo María'}</span>
        </div>

        {/* Fila 3: Tarifa de envío y tiempo de preparación */}
        <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-0.5">
          <span className="tabular-nums">
            {merchant.deliveryFeeCents === undefined
              ? 'Envío en checkout'
              : `Envío desde ${formatCents(merchant.deliveryFeeCents)}`}
          </span>

          {merchant.prepTimeMinutes !== undefined && (
            <span className="text-[11px] font-medium text-gray-400 tabular-nums">
              {merchant.prepTimeMinutes} min
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
