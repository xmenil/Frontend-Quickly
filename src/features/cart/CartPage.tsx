import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { calculateCart } from '../../domain/pricingRules';
import { formatCents } from '../../lib/currency';
import { PriceSummary } from '../../components/shared/PriceSummary';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { CartItem, Merchant } from '../../domain/types';
import {
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
  ChevronLeft,
  Clock,
  UtensilsCrossed,
  Pill,
  ShoppingBasket,
  Check,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    toggleSelectItem,
    selectAllItems,
    selectMerchantItems,
  } = useCartStore();
  const { merchants, products } = useDataStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [closedStoreModalOpen, setClosedStoreModalOpen] = useState(false);

  // Group all items by merchant so all stores in the cart remain visible
  const allMerchantGroups = useMemo(() => {
    const map = new Map<string, { merchant: Merchant; items: CartItem[] }>();
    for (const item of items) {
      if (!map.has(item.merchantId)) {
        const merchant = merchants.find((m) => m.id === item.merchantId);
        if (merchant) {
          map.set(item.merchantId, { merchant, items: [] });
        }
      }
      const grp = map.get(item.merchantId);
      if (grp) grp.items.push(item);
    }
    return Array.from(map.values());
  }, [items, merchants]);

  // Selected items filtering
  const selectedItems = useMemo(
    () => items.filter((it) => it.selected !== false),
    [items]
  );
  const selectedItemCount = useMemo(
    () => selectedItems.reduce((acc, it) => acc + it.quantity, 0),
    [selectedItems]
  );
  const totalItemCount = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items]
  );
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  // Cart calculations only for the selected items
  const cartCalculations = useMemo(
    () => calculateCart(selectedItems, merchants),
    [selectedItems, merchants]
  );

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12 text-primary" />}
          title="Tu carrito está vacío"
          description="Explora los restaurantes amazónicos, farmacias y bodegas locales de Tingo María para agregar tus productos favoritos."
          actionText="Explorar Comercios"
          onAction={() => navigate('/negocios')}
        />

        {/* Quick Suggestion Chips for Tingo María */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-center space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            ¿No sabes qué pedir hoy en Tingo María?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/negocios?categoria=restaurantes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors border border-amber-200 cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-600" />
              <span>Tacacho, Juane y Parrillas</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/negocios?categoria=farmacias')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors border border-emerald-200 cursor-pointer"
            >
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Boticas y Medicinas</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/negocios?categoria=bodegas')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs transition-colors border border-blue-200 cursor-pointer"
            >
              <ShoppingBasket className="w-4 h-4 text-blue-600" />
              <span>Bodegas y Abarrotes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if any merchant with SELECTED items is currently closed
  const hasClosedSelectedMerchants = cartCalculations.groups.some(
    (g) => !g.merchant.isOpen
  );

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;

    if (hasClosedSelectedMerchants) {
      setClosedStoreModalOpen(true);
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  const handleRemoveMerchantItems = (merchantId: string) => {
    items
      .filter((it) => it.merchantId === merchantId)
      .forEach((it) => removeItem(it.id));
  };

  return (
    <div className="w-full pb-20 select-none">
      {/* Barra de navegación estática/fija de esquina a esquina (Full-width, Slim & Sticky) */}
      <nav
        aria-label="Barra de navegación de carrito"
        className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-[125px] md:top-[106px] z-20 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Lado izquierdo: Volver solo en letras + Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Link
              to="/negocios"
              className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer text-xs group py-0.5"
              title="Seguir comprando"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Volver a la tienda</span>
            </Link>

            <span className="text-gray-300 font-light">|</span>

            <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs flex-wrap">
              <span className="uppercase text-[11px] font-bold tracking-wider text-gray-500">
                MI PEDIDO
              </span>
              <span className="text-gray-300 text-[10px]">&gt;</span>
              <span className="text-ink font-semibold">
                Carrito de compras ({totalItemCount} {totalItemCount === 1 ? 'ítem' : 'ítems'})
              </span>
            </div>
          </div>

          {/* Lado derecho: Vaciar carrito */}
          <div className="flex items-center gap-3 text-xs font-semibold ml-auto">
            <button
              type="button"
              onClick={() => setShowClearDialog(true)}
              className="text-red-500 hover:text-red-700 hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer py-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar carrito</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
                Tu Carrito de Compras
              </h1>
              <span className="text-xs font-bold bg-primary-soft text-primary px-3 py-1 rounded-full border border-primary/20">
                {totalItemCount} {totalItemCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona con la casilla los productos que deseas pagar en este pedido.
            </p>
          </div>
        </div>

        {/* Barra superior de Selección Global (Master Selection Bar) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => selectAllItems(!allSelected)}
            className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-ink hover:text-primary transition-colors cursor-pointer"
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                allSelected
                  ? 'bg-primary border-primary text-white shadow-xs'
                  : selectedItems.length > 0
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-gray-300 bg-white hover:border-primary'
              }`}
            >
              {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              {selectedItems.length > 0 && !allSelected && (
                <Minus className="w-3 h-3 stroke-[3]" />
              )}
            </div>
            <span>
              Seleccionar todos los productos ({totalItemCount})
            </span>
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-gray-600 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100">
              <strong className="text-primary font-bold">{selectedItemCount}</strong> de {totalItemCount} seleccionados para pagar
            </span>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => selectAllItems(false)}
                className="text-gray-400 hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                Deseleccionar todos
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items Grouped by Merchant */}
          <div className="lg:col-span-2 space-y-6">
            {allMerchantGroups.map((group) => {
              const isStoreClosed = !group.merchant.isOpen;

              // Check merchant selection state
              const merchantSelectedItems = group.items.filter(
                (it) => it.selected !== false
              );
              const isMerchantFullySelected =
                group.items.length > 0 &&
                merchantSelectedItems.length === group.items.length;
              const isMerchantPartiallySelected =
                merchantSelectedItems.length > 0 && !isMerchantFullySelected;

              // Calculate store subtotal for selected items
              const merchantSelectedSubtotalCents = merchantSelectedItems.reduce(
                (acc, it) => {
                  const unitPrice =
                    it.unitPriceCents + (it.variantPriceDifferenceCents || 0);
                  return acc + unitPrice * it.quantity;
                },
                0
              );

              return (
                <div
                  key={group.merchant.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all"
                >
                  {/* Merchant Subheader with Store Checkbox */}
                  <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Checkbox de tienda para marcar/desmarcar todos sus productos */}
                      <button
                        type="button"
                        onClick={() =>
                          selectMerchantItems(
                            group.merchant.id,
                            !isMerchantFullySelected
                          )
                        }
                        className="p-1 rounded-lg hover:bg-gray-200/60 transition-colors flex-shrink-0 cursor-pointer"
                        title={
                          isMerchantFullySelected
                            ? `Desmarcar todos los productos de ${group.merchant.name}`
                            : `Seleccionar todos los productos de ${group.merchant.name}`
                        }
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isMerchantFullySelected
                              ? 'bg-primary border-primary text-white shadow-xs'
                              : isMerchantPartiallySelected
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'border-gray-300 bg-white hover:border-primary'
                          }`}
                        >
                          {isMerchantFullySelected && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                          {isMerchantPartiallySelected && (
                            <Minus className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                      </button>

                      <img
                        src={group.merchant.logoUrl}
                        alt={group.merchant.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-gray-200 flex-shrink-0"
                      />
                      <div>
                        <Link
                          to={`/negocios/${group.merchant.id}`}
                          className="font-extrabold text-base text-ink hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <Store className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{group.merchant.name}</span>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>~{group.merchant.prepTimeMinutes || 25} min</span>
                          </span>
                          <span>•</span>
                          <span>
                            Envío estimado:{' '}
                            <strong className="text-ink tabular-nums">
                              {formatCents(group.merchant.deliveryFeeCents || 500)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {isStoreClosed ? (
                        <>
                          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Cerrado ahora
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMerchantItems(group.merchant.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                          >
                            Quitar local
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Abierto para entrega
                        </span>
                      )}
                    </div>
                  </div>

                  {isStoreClosed && isMerchantPartiallySelected && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p>
                        <strong>{group.merchant.name}</strong> está cerrado en este horario. Desmárcalo para poder tramitar la orden de inmediato con los negocios abiertos.
                      </p>
                    </div>
                  )}

                  {/* Items in this merchant order */}
                  <div className="divide-y divide-gray-100 p-4 sm:p-5 space-y-4">
                    {group.items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      const itemUnitPrice =
                        item.unitPriceCents + (item.variantPriceDifferenceCents || 0);
                      const itemSubtotal = itemUnitPrice * item.quantity;
                      const isOutOfStock = product
                        ? product.stock < item.quantity
                        : false;
                      const isItemSelected = item.selected !== false;

                      return (
                        <div
                          key={item.id}
                          className={`pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
                            isItemSelected
                              ? 'opacity-100'
                              : 'opacity-65 bg-gray-50/60 rounded-2xl p-2.5 -mx-1 border border-dashed border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            {/* Checkbox individual del producto */}
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(item.id)}
                              className="p-1 rounded-lg hover:bg-gray-200/60 transition-colors flex-shrink-0 cursor-pointer"
                              title={
                                isItemSelected
                                  ? 'Desmarcar para este pedido'
                                  : 'Seleccionar para comprar'
                              }
                            >
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  isItemSelected
                                    ? 'bg-primary border-primary text-white shadow-xs'
                                    : 'border-gray-300 bg-white hover:border-primary'
                                }`}
                              >
                                {isItemSelected && (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                )}
                              </div>
                            </button>

                            {product && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-16 h-16 rounded-2xl object-cover bg-gray-100 flex-shrink-0 border border-gray-100"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-bold text-ink text-sm sm:text-base truncate">
                                  {product ? product.name : 'Producto'}
                                </h2>
                                {!isItemSelected && (
                                  <span className="text-[10px] font-bold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full">
                                    Guardado para después
                                  </span>
                                )}
                              </div>

                              {item.selectedVariantName && (
                                <p className="text-xs text-primary font-semibold mt-0.5">
                                  Opción: {item.selectedVariantName}
                                </p>
                              )}
                              {item.note && (
                                <p className="text-xs text-gray-600 italic mt-0.5 truncate">
                                  Nota: "{item.note}"
                                </p>
                              )}
                              <p className="text-xs text-gray-600 font-semibold mt-1 tabular-nums">
                                {formatCents(itemUnitPrice)} c/u
                              </p>

                              {isOutOfStock && (
                                <div className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold mt-1 border border-amber-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>
                                    Stock limitado en tienda ({product?.stock} unid.)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity and Line Total */}
                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3.5">
                            {/* Stepper with minimum 44px hit targets */}
                            <div className="flex items-center border border-gray-200 rounded-2xl p-1 bg-gray-50/80 shadow-inner">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-gray-700 hover:text-ink hover:bg-white transition-colors cursor-pointer"
                                aria-label="Disminuir cantidad"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="min-w-[32px] text-center font-black text-sm text-ink tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={
                                  product ? item.quantity >= product.stock : false
                                }
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-gray-700 hover:text-ink hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-right min-w-[80px]">
                              <span className="font-black text-base text-ink tabular-nums block">
                                {formatCents(itemSubtotal)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal of this store (selected only) */}
                  <div className="px-5 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-primary" />
                      <span>Subtotal {group.merchant.name} (seleccionado):</span>
                    </span>
                    <span className="font-extrabold text-ink text-sm tabular-nums">
                      {formatCents(merchantSelectedSubtotalCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Summary & Proceed to Checkout */}
          <div className="space-y-4 sticky top-24">
            <PriceSummary
              groups={cartCalculations.groups}
              itemsSubtotalCents={cartCalculations.itemsSubtotalCents}
              totalDeliveryFeeCents={cartCalculations.totalDeliveryFeeCents}
              grandTotalCents={cartCalculations.grandTotalCents}
            />

            {selectedItems.length === 0 ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  No has seleccionado ningún producto. Marca la casilla de los artículos que deseas pagar hoy.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-pink-50/70 border border-primary-200 rounded-2xl text-[11px] text-primary flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Solo pagarás los productos marcados con ✓</span>
              </div>
            )}

            <Button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleProceedToCheckout}
              variant="primary"
              size="lg"
              className="w-full shadow-lg min-h-[50px] font-black text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {selectedItems.length === 0 ? (
                <span>Selecciona al menos 1 producto</span>
              ) : (
                <>
                  <span>
                    Continuar al Checkout ({selectedItemCount}{' '}
                    {selectedItemCount === 1 ? 'ítem' : 'ítems'})
                  </span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {!isAuthenticated ? (
              <p className="text-center text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                Podrás iniciar sesión o entrar con tu cuenta de demostración en el siguiente paso para confirmar tu dirección de entrega.
              </p>
            ) : (
              <p className="text-center text-xs text-gray-500">
                Entrega rápida garantizada en Tingo María.
              </p>
            )}
          </div>
        </div>

        {/* Confirmation Dialog for Empty Cart */}
        <Dialog
          isOpen={showClearDialog}
          onClose={() => setShowClearDialog(false)}
          title="¿Deseas vaciar tu carrito?"
          description="Esta acción eliminará todos los platos y productos seleccionados."
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-gray-500">
              Se eliminarán todos los {totalItemCount} productos de tu carrito de compras.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  clearCart();
                  setShowClearDialog(false);
                }}
              >
                Vaciar Carrito
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Modal when trying to checkout with a closed store */}
        <Dialog
          isOpen={closedStoreModalOpen}
          onClose={() => setClosedStoreModalOpen(false)}
          title="Uno de los comercios seleccionados está cerrado"
          description="Para continuar, desmarca los productos del local cerrado o quítalos de tu pedido."
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-gray-600">
              Al menos una tienda seleccionada no se encuentra atendiendo en este momento en Tingo María. Puedes desmarcar su casilla de compra para pagar solo los productos de las tiendas abiertas.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setClosedStoreModalOpen(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};
