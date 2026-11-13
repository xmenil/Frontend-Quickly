import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StorefrontProduct as Product, StorefrontMerchant as Merchant } from '../../features/catalog/storefrontModel';
import { useCatalogFavorite } from '../../features/catalog/useCatalogFavorite';
import { addCatalogProduct } from '../../store/realCartStore';
import { purchasableSku } from '../../domain/catalogRules';
import { formatCents } from '../../lib/currency';
import { getCategoryFallbackSvg } from '../../lib/imageFallback';
import { useAuthStore } from '../../store/authStore';
import { ShoppingCart, Heart, AlertCircle, Sparkles, Check, Utensils, Coffee, Pill, ShoppingBag, BadgeCheck, Building2, Eye } from 'lucide-react';

interface ProductCardProps<T extends Product> {
  product: T;
  merchant?: Merchant;
  onOpenDetail?: (product: T) => void;
  showFullButton?: boolean;
}

export function ProductCard<T extends Product>({
  product,
  merchant,
  onOpenDetail,
  showFullButton = true,
}: ProductCardProps<T>) {
  const navigate = useNavigate();
  const favorite = useCatalogFavorite('product', product.id);
  const [actionError, setActionError] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const { activeRole } = useAuthStore();
  const isMerchant = activeRole === 'comercio';

  const isFavorite = favorite.isFavorite;
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const category = (product.category || merchant?.category || '').toLowerCase();
  const brand = (product.brand || merchant?.name || 'TIENDA LOCAL').toUpperCase();
  const hasDiscount =
    Boolean(product.originalPriceCents && product.originalPriceCents > product.priceCents);
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPriceCents! - product.priceCents) /
          product.originalPriceCents!) *
          100
      )
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMerchant) {
      if (onOpenDetail) onOpenDetail(product); else navigate(`/producto/${product.id}`);
      return;
    }
    if (isOutOfStock) return;

    if (product.hasVariants || !product.source) {
      if (onOpenDetail) onOpenDetail(product); else navigate(`/producto/${product.id}`);
      return;
    }
    const sku = purchasableSku(product.source);
    if (!sku) return;
    try { addCatalogProduct(product.source, sku.id, 1); setActionError(''); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo agregar.'); return; }

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
      className="group cursor-pointer flex flex-col justify-between text-left p-1.5 sm:p-2.5 transition-all duration-200 hover:bg-gray-50/60 rounded-xl bg-transparent"
    >
      <div>
        {/* Image Container with Fallback & Shimmer Loader */}
        <div className="relative aspect-square w-full bg-transparent overflow-hidden rounded-xl mb-2">
          {/* Shimmer skeleton while loading */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
          )}

          {imgError ? (
            // Elegant SVG/Vector Branded Fallback
            <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-50/50 flex flex-col items-center justify-center p-4 text-center select-none">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-emerald-100/80">
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
              void favorite.toggle();
            }}
            className="absolute top-2 right-2 touch-target w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-2xs flex items-center justify-center text-gray-500 hover:text-primary transition-colors z-10"
            disabled={favorite.busy}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorite ? 'fill-primary text-primary' : ''
              }`}
            />
          </button>
        </div>

        {/* Badge ENVÍO HOY */}
        <div className="mb-1">
          <span className="bg-[#4b5563] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs inline-block">
            ENVÍO HOY
          </span>
        </div>

        {/* Brand */}
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-900 line-clamp-1">
          {brand}
        </p>

        {/* Title */}
        <h3 className="text-xs sm:text-[13px] text-gray-700 font-medium line-clamp-2 leading-snug my-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
      </div>

      {/* Price row */}
      <div className="pt-1 mt-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-gray-900 tabular-nums">
              {product.hasPrice === false ? 'Sin presentaciones' : formatCents(product.priceCents)}
            </span>
            {discountPercent > 0 && (
              <span className="bg-[#1f2937] text-white text-[10px] font-bold px-1 py-0.5 rounded-xs">
                -{discountPercent}%
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock && !isMerchant}
            onClick={handleQuickAdd}
            className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : isMerchant
                ? 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-primary border border-gray-200'
                : !isOutOfStock
                ? 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label={isMerchant ? 'Ver vista previa del producto' : 'Agregar al pedido'}
            title={isMerchant ? 'Vista previa (Modo tienda)' : undefined}
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : isMerchant ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {hasDiscount && (
          <p className="text-[11px] text-gray-400 line-through tabular-nums mt-0.5">
            {formatCents(product.originalPriceCents!)}
          </p>
        )}

        {merchant && (
          <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
            {merchant.name}
          </p>
        )}
      </div>

      {(actionError || favorite.error) && (
        <p role="alert" className="text-xs text-destructive mt-1">
          {actionError || favorite.error}
        </p>
      )}
    </div>
  );
};
