import React from 'react';
import { Link } from 'react-router-dom';
import { Merchant } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { Star, Clock, Bike, Heart } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';

interface MerchantCardProps {
  merchant: Merchant;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({ merchant }) => {
  const { favoriteMerchantIds, toggleFavoriteMerchant } = useDataStore();
  const isFavorite = favoriteMerchantIds.includes(merchant.id);

  return (
    <div className="relative group bg-white rounded-2xl border border-gray-100 shadow-subtle hover:shadow-md hover:border-primary-200 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
        <img
          src={merchant.bannerUrl}
          alt={merchant.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !merchant.isOpen ? 'grayscale contrast-75 opacity-70' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" fill="%23FFF1F6"><rect width="600" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-weight="bold" font-size="24">Comercio Quickly Tingo María</text></svg>';
          }}
        />

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
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
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
