import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { useRealCartStore } from '../../store/realCartStore';
import { catalogApi, CatalogProduct, imageUrl, money } from '../../services/api/catalogApi';
import { Plus, Minus, AlertCircle, ShoppingCart, Loader2, Store, Check } from 'lucide-react';

interface ProductDetailModalProps {
  productId?: string | null;
  product?: CatalogProduct | any;
  merchant?: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId: propProductId,
  product: propProduct,
  isOpen,
  onClose,
}) => {
  const add = useRealCartStore((s) => s.add);

  const [productData, setProductData] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSkuId, setSelectedSkuId] = useState<string>('');
  const [note, setNote] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const targetId = propProduct?.id || propProductId;

  useEffect(() => {
    if (!isOpen || !targetId) {
      setProductData(null);
      setLoading(false);
      return;
    }

    if (propProduct && 'skus' in propProduct && Array.isArray(propProduct.skus) && propProduct.id === targetId) {
      setProductData(propProduct as CatalogProduct);
      setQuantity(1);
      setNote('');
      setErrorMessage('');
      if (propProduct.skus.length > 0) {
        setSelectedSkuId(propProduct.skus[0].id);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage('');

    catalogApi
      .product(targetId)
      .then((data) => {
        if (isMounted) {
          setProductData(data);
          setQuantity(1);
          setNote('');
          if (data.skus.length > 0) {
            setSelectedSkuId(data.skus[0].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error al cargar detalle del producto:', err);
          setErrorMessage('No se pudo cargar la información del producto.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetId, propProduct]);

  if (!isOpen) return null;

  const currentProduct = productData;
  const activeSkus = currentProduct?.skus.filter((s) => s.isActive) || [];
  const selectedSku = activeSkus.find((s) => s.id === selectedSkuId) || activeSkus[0];
  const stock = selectedSku?.availableStock || 0;
  const isOutOfStock = stock <= 0;
  const unitPrice = selectedSku ? selectedSku.priceCents : 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!currentProduct || !selectedSku || isOutOfStock) return;

    try {
      add(
        {
          skuId: selectedSku.id,
          productId: currentProduct.id,
          storeId: currentProduct.storeId,
        },
        quantity
      );

      setAddedAnimation(true);
      setTimeout(() => {
        setAddedAnimation(false);
        onClose();
      }, 450);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo agregar al carrito');
    }
  };

  const primaryImage = currentProduct?.images[0]?.url
    ? imageUrl(currentProduct.images[0].url)
    : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-ink-light">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-semibold">Cargando producto de Tingo María...</span>
        </div>
      ) : errorMessage && !currentProduct ? (
        <div className="py-10 text-center space-y-3">
          <p className="text-sm text-red-600 font-semibold">{errorMessage}</p>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : currentProduct ? (
        <div className="space-y-4">
          {/* Product Image */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
            <img
              src={primaryImage}
              alt={currentProduct.name}
              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" fill="%23ECFDF5"><rect width="600" height="300" fill="%23ECFDF5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2300A859" font-family="sans-serif" font-weight="bold" font-size="24">Quickly Delivery</text></svg>';
              }}
            />
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-ink shadow-sm flex items-center gap-1.5 border border-gray-100">
              <Store className="w-3.5 h-3.5 text-primary" />
              <span>{currentProduct.storeName}</span>
            </div>
          </div>

          {/* Title, Brand & Price */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
                  {currentProduct.name}
                </h2>
                {currentProduct.brand && (
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Marca: <span className="font-bold text-ink">{currentProduct.brand}</span>
                  </p>
                )}
              </div>
              <span className="text-xl sm:text-2xl font-black text-primary whitespace-nowrap tabular-nums">
                {money(unitPrice)}
              </span>
            </div>

            {currentProduct.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                {currentProduct.description}
              </p>
            )}

            {/* Stock indicator */}
            <div className="mt-2.5 flex items-center gap-2">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                  <AlertCircle className="w-3.5 h-3.5" /> Producto Agotado
                </span>
              ) : stock <= 5 ? (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  ⚠️ Quedan solo {stock} unidades
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Stock disponible ({stock} unid.)</span>
                </span>
              )}
            </div>
          </div>

          {/* Presentation / Variant Selector (if multiple SKUs exist) */}
          {activeSkus.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Selecciona la presentación:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeSkus.map((sku) => {
                  const isSelected = selectedSku?.id === sku.id;
                  return (
                    <button
                      key={sku.id}
                      type="button"
                      onClick={() => {
                        setSelectedSkuId(sku.id);
                        setQuantity(1);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs sm:text-sm transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary-soft/60 font-bold text-ink ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-primary' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <span className="truncate">{sku.variantName}</span>
                      </div>
                      <span className="font-extrabold text-primary tabular-nums flex-shrink-0 pl-1">
                        {money(sku.priceCents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional instructions note */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <label htmlFor="modalProductNote" className="text-xs font-bold text-ink">
              Instrucciones para el comercio (opcional)
            </label>
            <input
              id="modalProductNote"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Ají de cocona aparte, bien caliente, etc."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-bold">{errorMessage}</p>
          )}

          {/* Quantity and Add Button */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-200 rounded-xl p-1 bg-gray-50">
              <button
                type="button"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-bold text-sm text-ink tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= stock || isOutOfStock}
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add Button */}
            <Button
              type="button"
              disabled={isOutOfStock || stock < 1}
              onClick={handleAddToCart}
              variant="primary"
              size="lg"
              className="flex-1 shadow-md"
            >
              {addedAnimation ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>¡Agregado al carrito!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isOutOfStock ? 'Sin existencias' : `Agregar • ${money(totalPrice)}`}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};
