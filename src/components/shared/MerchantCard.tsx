import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Merchant } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { getMerchantFallbackBanner } from '../../lib/imageFallback';
import { Star, Clock, Bike, Heart, Store } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';

interface MerchantCardProps {
  merchant: Merchant;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({ merchant }) => {
  const { favoriteMerchantIds, toggleFavoriteMerchant } = useDataStore();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isFavorite = favoriteMerchantIds.includes(merchant.id);

  return (
    <div className="relative group bg-white rounded-2xl border border-gray-100 shadow-subtle hover:shadow-md hover:border-primary-200 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Banner Container */}
      <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
        {/* Shimmer skeleton */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        )}

        {imgError ? (
          // Vector fallback banner
          <div className="w-full h-full bg-gradient-to-br from-pink-50 via-rose-50/70 to-amber-50/50 flex flex-col items-center justify-center p-4 text-center select-none">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-1.5 border border-pink-100/80">
              <Store className="w-7 h-7 text-primary" />
            </div>
            <span className="text-sm font-bold text-ink line-clamp-1 max-w-[90%]">
              {merchant.name}
            </span>
            <span className="text-[11px] font-semibold text-primary">
              Comercio Aliado • Tingo María
            </span>
          </div>
        ) : (
          <img
            src={merchant.bannerUrl}
            alt={merchant.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgError(true);
              (e.target as HTMLImageElement).src = getMerchantFallbackBanner(
                merchant.category,
                merchant.name
              );
            }}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              !merchant.isOpen ? 'grayscale contrast-75 opacity-70' : ''
            } ${!imgLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
          />
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavoriteMerchant(merchant.id);
          }}
          className="absolute top-2.5 right-2.5 touch-target w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-subtle flex items-center justify-center text-gray-600 hover:text-primary transition-colors z-10"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-primary text-primary' : ''
            }`}
          />
        </button>

        {/* Status Badge */}
        {!merchant.isOpen ? (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-3 text-center">
            <span className="bg-ink/90 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-md">
              Cerrado en este momento
            </span>
          </div>
        ) : (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
              Abierto ahora
            </span>
            <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-ink flex items-center gap-1 shadow-subtle">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{merchant.rating.toFixed(1)}</span>
              <span className="text-gray-500 font-medium tabular-nums">({merchant.ratingCount})</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link
              to={`/negocios/${merchant.id}`}
              className="font-bold text-ink text-base group-hover:text-primary transition-colors line-clamp-1"
            >
              {merchant.name}
            </Link>
          </div>

          <p className="text-xs text-ink-light line-clamp-2 leading-relaxed">
            {merchant.description}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="tabular-nums">{merchant.prepTimeMinutes + 5}-{merchant.prepTimeMinutes + 20} min</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <Bike className="w-3.5 h-3.5 text-primary" />
            <span className="tabular-nums">Envío: {formatCents(merchant.deliveryFeeCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
