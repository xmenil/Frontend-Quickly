import React, { useState, useEffect } from 'react';
import { Product, Merchant } from '../../domain/types';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { formatCents } from '../../lib/currency';
import { useCartStore } from '../../store/cartStore';
import { Plus, Minus, AlertCircle, ShoppingCart } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  merchant?: Merchant;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  merchant,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [note, setNote] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNote('');
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
      } else {
        setSelectedVariantId(undefined);
      }
    }
  }, [product]);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0 || !product.isAvailable;

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const unitPriceCents = product.priceCents + (selectedVariant?.priceDifferenceCents || 0);
  const totalPriceCents = unitPriceCents * quantity;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      quantity,
      selectedVariantId: selectedVariant?.id,
      selectedVariantName: selectedVariant?.name,
      variantPriceDifferenceCents: selectedVariant?.priceDifferenceCents,
      note: note.trim() || undefined,
      unitPriceCents: product.priceCents,
    });

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 400);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-4">
        {/* Product Image */}
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" fill="%23FFF1F6"><rect width="600" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23C60050" font-family="sans-serif" font-weight="bold" font-size="24">Quickly Delivery</text></svg>';
            }}
          />
          {merchant && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-ink shadow-sm">
              {merchant.name}
            </div>
          )}
        </div>

        {/* Title, Stock & Price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
              {product.name}
            </h2>
            <span className="text-xl font-black text-primary whitespace-nowrap">
              {formatCents(unitPriceCents)}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
            {product.description}
          </p>

          {/* Stock state */}
          <div className="mt-2 flex items-center gap-2">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Producto Agotado
              </span>
            ) : product.stock <= 4 ? (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                ⚠️ Quedan solo {product.stock} disponibles
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                ✓ Stock disponible ({product.stock} unid.)
              </span>
            )}
          </div>
        </div>

        {/* Variations selection if exists */}
        {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              Elige una opción:
            </label>
            <div className="space-y-1.5">
              {product.variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`touch-target w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-light/50 font-bold text-ink ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span>{v.name}</span>
                    </div>
                    {v.priceDifferenceCents > 0 && (
                      <span className="text-primary font-semibold">
                        +{formatCents(v.priceDifferenceCents)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions Note */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <label htmlFor="productNote" className="text-xs font-bold text-ink">
            Instrucciones especiales para el local (opcional)
          </label>
          <input
            id="productNote"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Sin cebolla, ají de cocona aparte, bien caliente..."
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
          />
        </div>

        {/* Quantity and Add Button */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-gray-200 rounded-xl p-1 bg-gray-50">
            <button
              type="button"
              disabled={quantity <= 1 || isOutOfStock}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="touch-target w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-bold text-sm text-ink">{quantity}</span>
            <button
              type="button"
              disabled={quantity >= product.stock || isOutOfStock}
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="touch-target w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button */}
          <Button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            variant="primary"
            size="lg"
            className="flex-1 shadow-md"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            <span>
              {addedAnimation ? '¡Agregado!' : `Agregar • ${formatCents(totalPriceCents)}`}
            </span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
