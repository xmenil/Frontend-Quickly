import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Merchant } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { Plus, Heart, AlertCircle, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';

interface ProductCardProps {
  product: Product;
  merchant?: Merchant;
  onOpenDetail?: (product: Product) => void;
  showFullButton?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  merchant,
  onOpenDetail,
  showFullButton = true,
}) => {
  const navigate = useNavigate();
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

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      navigate(`/producto/${product.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
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
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23FFF1F6"><rect width="400" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-weight="bold" font-size="20">Quickly Delivery</text></svg>';
          }}
        />

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteProduct(product.id);
          }}
          className="absolute top-2.5 right-2.5 touch-target w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isFavorite ? 'fill-primary text-primary' : ''
            }`}
          />
        </button>

        {/* Stock / Variant Badges */}
        {isOutOfStock ? (
          <div className="absolute bottom-2 left-2 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3 h-3" /> Agotado
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2 left-2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            ¡Últimos {product.stock}!
          </div>
        ) : product.hasVariants ? (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Variantes
          </div>
        ) : null}
      </div>

      {/* Info Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 justify-between">
        <div>
          {merchant && (
            <p className="text-[11px] font-medium text-gray-500 mb-0.5 line-clamp-1">
              {merchant.name}
            </p>
          )}
          <h3 className="font-bold text-ink text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Add Button */}
        {showFullButton ? (
          <div className="pt-2 mt-2 border-t border-gray-100 flex flex-col gap-2">
            <div>
              <span className="text-sm sm:text-base font-extrabold text-ink">
                {formatCents(product.priceCents)}
              </span>
              {product.hasVariants && (
                <span className="text-[10px] text-gray-400 ml-1">desde</span>
              )}
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-98'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar al carrito</span>
            </button>
          </div>
        ) : (
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
              className={`touch-target w-9 h-9 rounded-xl flex items-center justify-center font-semibold transition-all duration-150 ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-95'
              }`}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
