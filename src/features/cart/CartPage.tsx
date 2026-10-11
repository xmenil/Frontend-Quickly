import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { calculateCart } from '../../domain/pricingRules';
import { formatCents } from '../../lib/currency';
import { validateCartSelection } from '../checkout/checkoutFlow';
import { PriceSummary } from '../../components/shared/PriceSummary';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { CartItem } from '../../domain/types';
import { Trash2, Plus, Minus, Store, ArrowRight, ShoppingBag, AlertCircle, ChevronLeft } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, toggleSelectItem, selectMerchantItems } = useCartStore();
  const { merchants, products } = useDataStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [actionError, setActionError] = useState('');
  const groups = useMemo(() => {
    const grouped = new Map<string, CartItem[]>();
    items.forEach((item) => grouped.set(item.merchantId, [...(grouped.get(item.merchantId) || []), item]));
    return Array.from(grouped, ([merchantId, entries]) => ({ merchantId, merchant: merchants.find((merchant) => merchant.id === merchantId), items: entries }));
  }, [items, merchants]);
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const totalCount = items.reduce((total, item) => total + item.quantity, 0);
  const activeMerchantId = selectedItems[0]?.merchantId;
  const calculations = calculateCart(selectedItems, merchants);
  const selectionError = validateCartSelection({ items, merchants, products });
  const selectedQuantities = new Map<string, number>();
  selectedItems.forEach((item) => selectedQuantities.set(item.productId, (selectedQuantities.get(item.productId) || 0) + item.quantity));

  const proceed = () => {
    const data = useDataStore.getState();
    const error = validateCartSelection({ items: useCartStore.getState().items, merchants: data.merchants, products: data.products });
    if (error) { setActionError(error); return; }
    if (!useAuthStore.getState().isAuthenticated) navigate('/login', { state: { from: '/checkout' } });
    else navigate('/checkout');
  };

  if (items.length === 0) return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <EmptyState icon={<ShoppingBag className="h-8 w-8" aria-hidden="true" />} title="Tu carrito está vacío"
        description="Explora los comercios de Tingo María y agrega los productos que necesitas." actionText="Explorar comercios" onAction={() => navigate('/negocios')} />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-32 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/negocios" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-primary hover:text-primary-hover"><ChevronLeft className="h-4 w-4" aria-hidden="true" />Seguir comprando</Link>
        <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive hover:bg-destructive-soft" onClick={() => setShowClearDialog(true)}><Trash2 className="h-4 w-4" aria-hidden="true" />Vaciar carrito</Button>
      </div>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-xl font-bold text-ink sm:text-2xl">Tu carrito</h1><span className="text-xs tabular-nums text-ink-muted">{totalCount} {totalCount === 1 ? 'producto' : 'productos'}</span></div>
        <p className="text-sm text-ink-light">Compra de un comercio a la vez. Los productos que no selecciones seguirán guardados en tu carrito.</p>
        <p role="status" className="text-xs tabular-nums text-ink-muted">{selectedCount} {selectedCount === 1 ? 'producto seleccionado' : 'productos seleccionados'} · {totalCount - selectedCount} para después</p>
      </header>
      {actionError && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">{actionError}</p>}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {groups.map((group) => {
            const merchant = group.merchant;
            const available = Boolean(merchant?.isOpen && merchant.status === 'activo');
            const selected = group.merchantId === activeMerchantId;
            const chosen = group.items.filter((item) => item.selected !== false);
            const subtotal = chosen.reduce((total, item) => total + (item.unitPriceCents + (item.variantPriceDifferenceCents || 0)) * item.quantity, 0);
            const minimumGap = selected && merchant ? Math.max(0, merchant.minOrderCents - subtotal) : 0;
            const name = merchant?.name || 'Comercio no disponible';
            return (
              <section key={group.merchantId} aria-label={`Productos de ${name}`} className={`min-w-0 rounded-2xl border bg-surface shadow-subtle ${selected ? 'border-primary' : 'border-border'}`}>
                <header className="space-y-3 border-b border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <h2 className="flex items-start gap-2 text-base font-semibold text-ink"><Store className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />{merchant ? <Link className="min-w-0 break-words hover:text-primary" to={`/negocios/${merchant.id}`}>{name}</Link> : name}</h2>
                      <div className="flex flex-wrap gap-2"><Badge variant={available ? 'success' : 'danger'}>{available ? 'Abierto' : merchant?.status === 'activo' ? 'Cerrado' : 'No disponible'}</Badge>{selected && <Badge variant="primary">Comercio seleccionado</Badge>}</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" aria-label={`Comprar de ${name}`} onClick={() => { setActionError(''); selectMerchantItems(group.merchantId, true); }}>{selected ? chosen.length === group.items.length ? 'Todos seleccionados' : 'Seleccionar todos' : 'Comprar de este comercio'}</Button>
                  </div>
                  {merchant && <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs tabular-nums text-ink-light"><span>Preparación: {merchant.prepTimeMinutes} min</span><span>Pedido mínimo: {formatCents(merchant.minOrderCents)}</span></div>}
                  {!available && <p className="text-xs text-destructive">Este comercio no está atendiendo. Puedes conservar sus productos para después.</p>}
                  {selected && <Button type="button" variant="ghost" size="sm" className="text-xs text-ink-light" onClick={() => { setActionError(''); selectMerchantItems(group.merchantId, false); }}>Quitar selección de este comercio</Button>}
                </header>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId && entry.merchantId === item.merchantId);
                    const variant = product?.variants?.find((entry) => entry.id === item.selectedVariantId);
                    const included = item.selected !== false;
                    const unitPrice = item.unitPriceCents + (item.variantPriceDifferenceCents || 0);
                    const requested = included ? selectedQuantities.get(item.productId) || item.quantity : item.quantity;
                    const stockError = product && requested > product.stock;
                    const unavailable = !product || !product.isAvailable || Boolean(item.selectedVariantId && (!variant || !variant.isAvailable));
                    const priceChanged = product && (item.unitPriceCents !== product.priceCents || (item.variantPriceDifferenceCents || 0) !== (variant?.priceDifferenceCents || 0));
                    const productName = product?.name || 'Producto no disponible';
                    return (
                      <li key={item.id} className={`space-y-3 p-4 ${included ? 'bg-primary-50/30' : ''}`}>
                        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                          <label className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl" htmlFor={`cart-select-${item.id}`}>
                            <input id={`cart-select-${item.id}`} type="checkbox" checked={included} aria-label={`Seleccionar ${productName}`}
                              className="h-5 w-5 accent-primary" onChange={() => { setActionError(''); toggleSelectItem(item.id); }} />
                          </label>
                          {product && !failedImages.includes(product.id) ? <img src={product.imageUrl} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl border border-border bg-surface-subtle object-cover sm:h-16 sm:w-16" onError={() => setFailedImages((ids) => ids.includes(product.id) ? ids : [...ids, product.id])} /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-ink-muted"><ShoppingBag className="h-5 w-5" aria-hidden="true" /></span>}
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="break-words text-sm font-semibold text-ink">{product ? <Link className="hover:text-primary" to={`/producto/${product.id}`}>{productName}</Link> : productName}</h3>
                            {item.selectedVariantName && <p className="break-words text-xs text-ink-light">Opción: {item.selectedVariantName}</p>}
                            {item.note && <p className="break-words text-xs text-ink-muted">Nota: {item.note}</p>}
                            <p className="text-xs tabular-nums text-ink-light">{formatCents(unitPrice)} por unidad</p>
                            <p className="text-xs text-ink-muted">{included ? 'Incluido en esta compra' : 'Guardado para después'}</p>
                          </div>
                        </div>
                        {(unavailable || stockError || priceChanged) && <p className="flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning-strong"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{unavailable ? 'Este producto u opción ya no está disponible. Retíralo o déjalo sin seleccionar.' : stockError ? `Solo quedan ${product?.stock} unidades para todas las opciones de este producto. Ajusta la cantidad.` : 'El precio cambió. Retira el producto y vuelve a agregarlo desde su página.'}</span></p>}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-xl border border-border bg-surface" role="group" aria-label={`Cantidad de ${productName}`}>
                            <Button type="button" variant="ghost" size="icon" disabled={item.quantity <= 1} aria-label={`Disminuir cantidad de ${productName}`} onClick={() => { setActionError(''); updateQuantity(item.id, item.quantity - 1); }}><Minus className="h-4 w-4" aria-hidden="true" /></Button>
                            <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-ink">{item.quantity}</span>
                            <Button type="button" variant="ghost" size="icon" disabled={unavailable || Boolean(product && requested >= product.stock)} aria-label={`Aumentar cantidad de ${productName}`} onClick={() => { setActionError(''); updateQuantity(item.id, item.quantity + 1); }}><Plus className="h-4 w-4" aria-hidden="true" /></Button>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-ink" aria-label={`Subtotal de ${productName}`}>{formatCents(unitPrice * item.quantity)}</p>
                          <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive-soft" aria-label={`Eliminar ${productName}`} onClick={() => { setActionError(''); removeItem(item.id); }}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {selected && <footer className="space-y-2 border-t border-border p-4"><p className="flex flex-wrap justify-between gap-3 text-sm text-ink-light">Productos seleccionados de este comercio <span className="font-semibold tabular-nums text-ink">{formatCents(subtotal)}</span></p>{minimumGap > 0 && <p className="text-xs text-warning">Agrega {formatCents(minimumGap)} en productos para alcanzar el pedido mínimo.</p>}</footer>}
              </section>
            );
          })}
        </div>
        <aside aria-label="Continuar con la compra" className="min-w-0 space-y-4 lg:sticky lg:top-40">
          <PriceSummary groups={calculations.groups} itemsSubtotalCents={calculations.itemsSubtotalCents} totalDeliveryFeeCents={calculations.totalDeliveryFeeCents} grandTotalCents={calculations.grandTotalCents} deliveryIsEstimate />
          {selectionError ? <p role="status" className="rounded-xl border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong">{selectionError}</p> : <p className="text-xs text-ink-light">Solo comprarás los productos seleccionados. El resto seguirá en el carrito.</p>}
          <Button type="button" variant="primary" className="min-h-12 w-full gap-2 text-sm" disabled={Boolean(selectionError)} onClick={proceed}>Continuar con la dirección<ArrowRight className="h-5 w-5" aria-hidden="true" /></Button>
          {!isAuthenticated && <p className="text-xs text-ink-muted">Primero iniciarás sesión; después elegirás la dirección y el pago.</p>}
        </aside>
      </div>

      <Dialog isOpen={showClearDialog} onClose={() => setShowClearDialog(false)} title="Vaciar carrito" description="Se eliminarán todos los productos, incluidos los guardados para después." maxWidth="sm">
        <div className="space-y-4"><p className="text-sm tabular-nums text-ink-light">{totalCount} {totalCount === 1 ? 'producto se eliminará' : 'productos se eliminarán'} del carrito.</p><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setShowClearDialog(false)}>Cancelar</Button><Button type="button" variant="danger" onClick={() => { clearCart(); setShowClearDialog(false); }}>Vaciar carrito</Button></div></div>
      </Dialog>
    </div>
  );
};
