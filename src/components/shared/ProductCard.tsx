import React from 'react';
import { Product, Merchant } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { Plus, Heart, AlertCircle, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';

interface ProductCardProps {
  product: Product;
  merchant?: Merchant;
  onOpenDetail?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  merchant,
  onOpenDetail,
}) => {
  const { addItem } = useCartStore();
  const { favoriteProductIds, toggleFavoriteProduct } = useDataStore();

  const isFavorite = favoriteProductIds.includes(product.id);
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    if (product.hasVariants && onOpenDetail) {
      onOpenDetail(product);
      return;
    }

    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      quantity: 1,
      unitPriceCents: product.priceCents,
    });
  };

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(product)}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
          onError={(e) => {
            // Stable SVG fallback
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23FFF1F6"><rect width="400" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23C60050" font-family="sans-serif" font-weight="bold" font-size="20">Quickly Delivery</text></svg>';
          }}
        />

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteProduct(product.id);
          }}
          className="absolute top-2.5 right-2.5 touch-target w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-primary text-primary' : ''
            }`}
          />
        </button>

        {/* Stock / Variant Badges */}
        {isOutOfStock ? (
          <div className="absolute bottom-2.5 left-2.5 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3 h-3" /> Agotado
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2.5 left-2.5 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            ¡Últimos {product.stock}!
          </div>
        ) : product.hasVariants ? (
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Variantes
          </div>
        ) : null}
      </div>

      {/* Info Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 justify-between">
        <div>
          {merchant && (
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1 line-clamp-1">
              {merchant.name}
            </p>
          )}
          <h3 className="font-bold text-ink text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-50">
          <div>
            <span className="text-base sm:text-lg font-extrabold text-ink">
              {formatCents(product.priceCents)}
            </span>
            {product.hasVariants && (
              <span className="text-[11px] text-gray-400 block -mt-0.5">Desde</span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className={`touch-target w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-150 ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-95'
            }`}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
