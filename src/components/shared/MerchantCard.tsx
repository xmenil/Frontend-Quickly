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
    <div className="relative group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
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
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" fill="%23FFF1F6"><rect width="600" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23C60050" font-family="sans-serif" font-weight="bold" font-size="24">Comercio Quickly</text></svg>';
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
          className="absolute top-2.5 right-2.5 touch-target w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-colors z-10"
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
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-900/90 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
              Cerrado en este momento
            </span>
          </div>
        ) : (
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-ink flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{merchant.rating.toFixed(1)}</span>
            <span className="text-gray-400 font-normal">({merchant.ratingCount})</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link
              to={`/negocios/${merchant.id}`}
              className="font-bold text-ink text-base group-hover:text-primary transition-colors line-clamp-1"
            >
              {merchant.name}
            </Link>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {merchant.description}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{merchant.prepTimeMinutes + 10}-{merchant.prepTimeMinutes + 20} min</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-ink">
            <Bike className="w-3.5 h-3.5 text-primary" />
            <span>Envío: {formatCents(merchant.deliveryFeeCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
