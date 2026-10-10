import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Merchant } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { getCategoryFallbackSvg } from '../../lib/imageFallback';
import { ShoppingCart, Heart, AlertCircle, Sparkles, Check, Utensils, Coffee, Pill, ShoppingBag, BadgeCheck, Building2 } from 'lucide-react';
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
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isFavorite = favoriteProductIds.includes(product.id);
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const category = (product.category || merchant?.category || '').toLowerCase();

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

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      navigate(`/producto/${product.id}`);
    }
  };

  // Helper for category icon on fallback
  const renderCategoryIcon = () => {
    if (category.includes('farmacia') || category.includes('medicin')) {
      return <Pill className="w-8 h-8 text-emerald-600" />;
    }
    if (category.includes('cafe') || category.includes('café') || category.includes('cacao')) {
      return <Coffee className="w-8 h-8 text-amber-600" />;
    }
    if (category.includes('tienda') || category.includes('bodega') || category.includes('mercado')) {
      return <ShoppingBag className="w-8 h-8 text-emerald-600" />;
    }
    return <Utensils className="w-8 h-8 text-primary" />;
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-subtle hover:shadow-md hover:border-primary-200 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Image Container with Fallback & Shimmer Loader */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden border-b border-gray-100/70">
        {/* Shimmer skeleton while loading */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        )}

        {imgError ? (
          // Elegant SVG/Vector Branded Fallback
          <div className="w-full h-full bg-gradient-to-br from-pink-50 via-rose-50/70 to-amber-50/50 flex flex-col items-center justify-center p-4 text-center select-none">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-pink-100/80">
              {renderCategoryIcon()}
            </div>
            <span className="text-xs font-bold text-ink line-clamp-1 max-w-[90%]">
              {product.name}
            </span>
            <span className="text-[10px] font-semibold text-primary mt-0.5">
              Quickly • Tingo María
            </span>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              setImgError(true);
              (e.target as HTMLImageElement).src = getCategoryFallbackSvg(category, product.name);
            }}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            } ${!imgLoaded ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
          />
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteProduct(product.id);
          }}
          className="absolute top-2.5 right-2.5 touch-target w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-subtle flex items-center justify-center text-gray-600 hover:text-primary transition-colors z-10"
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
          <div className="absolute bottom-2 left-2 bg-red-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10">
            <AlertCircle className="w-3 h-3" /> Agotado
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2 left-2 bg-amber-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
            ¡Últimos {product.stock}!
          </div>
        ) : product.hasVariants ? (
          <div className="absolute bottom-2 left-2 bg-ink/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <Sparkles className="w-3 h-3 text-amber-300" /> Variantes
          </div>
        ) : null}
      </div>

      {/* Info Content */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3 justify-between space-y-2">
        <div>
          <h3 className="font-bold text-ink text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2rem]">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-ink-light mt-0.5 line-clamp-1 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Row: Perfil de tienda verificada (nombre en negro) a lado de Stock disponible */}
          <div className="flex items-center justify-between gap-1.5 mt-2">
            {merchant ? (
              <div
                className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 px-1.5 py-0.5 rounded-full transition-colors min-w-0 max-w-[58%]"
                title={`${merchant.name} • Tienda verificada`}
              >
                {merchant.logoUrl ? (
                  <img
                    src={merchant.logoUrl}
                    alt={merchant.name}
                    className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0 border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                )}
                <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                  {merchant.name
                    .replace(/Supermercado\s+/i, 'Super ')
                    .replace(/\s+Tingo María$/i, '')}
                </span>
                <BadgeCheck className="w-3 h-3 text-sky-500 fill-sky-100 flex-shrink-0" />
              </div>
            ) : (
              <div />
            )}

            {/* Stock disponible */}
            <div
              className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                isOutOfStock
                  ? 'text-red-700 bg-red-50 border border-red-200/80'
                  : isLowStock
                  ? 'text-amber-800 bg-amber-50 border border-amber-200/80'
                  : 'text-emerald-700 bg-emerald-50/90 border border-emerald-100/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${
                  isOutOfStock
                    ? 'bg-red-500'
                    : isLowStock
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>
                {isOutOfStock ? 'Agotado' : isLowStock ? `Últimos ${product.stock}` : 'Stock disponible'}
              </span>
            </div>
          </div>
        </div>

        {/* Price and Add Button */}
        {showFullButton ? (
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-extrabold text-ink tabular-nums">
                {formatCents(product.priceCents)}
              </span>
              {product.hasVariants && (
                <span className="text-[10px] text-gray-500 font-medium">desde</span>
              )}
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`w-full min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-target select-none ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-subtle active:scale-[0.98]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Agregar al pedido</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
            <div>
              <span className="text-base sm:text-lg font-extrabold text-ink tabular-nums">
                {formatCents(product.priceCents)}
              </span>
              {product.hasVariants && (
                <span className="text-[11px] text-gray-500 block -mt-0.5">Desde</span>
              )}
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`touch-target min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center font-bold transition-all select-none ${
                isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-subtle active:scale-95'
              }`}
              aria-label={`Agregar ${product.name} al pedido`}
            >
              {isAdded ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
