import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRealCartStore, CartIntent } from '../../store/realCartStore';
import { useAuthStore } from '../../store/authStore';
import { catalogApi, CatalogProduct, CatalogSku, imageUrl, money } from '../../services/api/catalogApi';
import { catalogImage, catalogPlaceholder } from '../../lib/catalogImage';
import { ApiError } from '../../services/api/apiClient';
import { RemoteState, useRemote } from '../operations/shared';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import {
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  ChevronLeft,
  Loader2,
  Check,
} from 'lucide-react';

interface LoadedItem {
  intent: CartIntent;
  product?: CatalogProduct;
  sku?: CatalogSku;
}

interface StoreGroup {
  storeId: string;
  storeName: string;
  items: LoadedItem[];
}

export const CartPage: React.FC = () => {
  const { items, notice, update, remove, clear, selectStoreItems } = useRealCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();


  const [showClearDialog, setShowClearDialog] = useState(false);
  const [actionError, setActionError] = useState('');

  const productIds = [...new Set(items.map(item => item.productId))].sort().join(',');
  const catalog = useRemote(`cart-products:${productIds}`, async signal => {
    const entries = await Promise.all(productIds.split(',').filter(Boolean).map(async id => {
      try { return [id, await catalogApi.product(id, signal)] as const; }
      catch (error) {
        if (error instanceof ApiError && error.status === 404) return [id, null] as const;
        throw error;
      }
    }));
    return Object.fromEntries(entries) as Record<string, CatalogProduct | null>;
  });
  const productsMap = catalog.data || {};
  const loadingProducts = catalog.loading;
  useEffect(() => {
    window.addEventListener('focus', catalog.reload);
    return () => window.removeEventListener('focus', catalog.reload);
  }, [catalog.reload]);

  // Agrupar items por tienda
  const storeGroups = useMemo<StoreGroup[]>(() => {
    const groups = new Map<string, StoreGroup>();

    items.forEach((item) => {
      const product = productsMap[item.productId];
      const sku = product?.skus?.find((s) => s.id === item.skuId);
      const storeId = item.storeId || product?.storeId || 'unknown';
      const storeName = product?.storeName || 'Tienda';

      if (!groups.has(storeId)) {
        groups.set(storeId, {
          storeId,
          storeName,
          items: [],
        });
      }

      groups.get(storeId)!.items.push({
        intent: item,
        product: product || undefined,
        sku,
      });
    });

    return Array.from(groups.values());
  }, [items, productsMap]);

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

  // Subtotal de los productos seleccionados
  const selectedSubtotalCents = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const product = productsMap[item.productId];
      const sku = product?.skus?.find((s) => s.id === item.skuId);
      const unitPrice = sku?.priceCents || 0;
      return acc + unitPrice * item.quantity;
    }, 0);
  }, [selectedItems, productsMap]);

  // Validaciones de stock y disponibilidad
  const stockErrors = useMemo(() => {
    const errors: string[] = [];
    selectedItems.forEach((item) => {
      const product = productsMap[item.productId];
      const sku = product?.skus?.find((s) => s.id === item.skuId);
      if (!product || !sku || !product.isActive || !sku.isActive || product.storeId !== item.storeId) {
        errors.push('Un producto o presentación seleccionada ya no está disponible. Retíralo o vuelve a seleccionarlo desde el catálogo.');
      } else if (sku.availableStock < item.quantity) {
        errors.push(
          `"${product?.name || 'Producto'} (${sku.variantName})": solo quedan ${sku.availableStock} unidades.`
        );
      }
    });
    return errors;
  }, [selectedItems, productsMap]);

  const canProceed =
    selectedItems.length > 0 &&
    stockErrors.length === 0 &&
    !loadingProducts && !catalog.error;

  const handleProceed = () => {
    if (!canProceed) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <EmptyState
          icon={<ShoppingBag className="h-10 w-10 text-primary" aria-hidden="true" />}
          title="Tu carrito está vacío"
          description="Explora los comercios y productos de Tingo María y agrega lo que necesites."
          actionText="Explorar productos"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-32 sm:px-6 lg:px-8">
      {/* Barra superior de navegación rápida */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-primary hover:text-primary-hover"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Seguir comprando
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-destructive hover:bg-destructive-soft"
          onClick={() => setShowClearDialog(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Vaciar carrito
        </Button>
      </div>

      {/* Encabezado */}
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">Tu carrito</h1>
          <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ink-muted">
            {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <p className="text-sm text-ink-light">
          Puedes comprar de una o varias tiendas. Cada comercio cuenta con su propio envío y cobro contra entrega en efectivo.
        </p>
        <p role="status" className="text-xs tabular-nums text-ink-muted">
          {selectedCount} {selectedCount === 1 ? 'producto seleccionado' : 'productos seleccionados'} ·{' '}
          {totalCount - selectedCount} para después
        </p>
      </header>

      {notice && (
        <div role="status" className="rounded-xl border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong">
          {notice}
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">
          {actionError}
        </div>
      )}

      <RemoteState loading={loadingProducts} error={catalog.error} retry={catalog.reload}/>
      <Button type="button" variant="outline" onClick={catalog.reload}>Actualizar disponibilidad</Button>
      {/* Grid principal: Items a la izquierda, Resumen a la derecha */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {storeGroups.map((group) => {
            const allSelected = group.items.every((it) => it.intent.selected !== false);
            const someSelected = group.items.some((it) => it.intent.selected !== false);

            return (
              <section
                key={group.storeId}
                aria-label={`Productos de ${group.storeName}`}
                className={`min-w-0 rounded-2xl border bg-surface shadow-subtle transition-colors ${
                  someSelected ? 'border-primary/50' : 'border-border'
                }`}
              >
                {/* Cabecera de la tienda */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-subtle/50 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Store className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="text-base font-bold text-ink">
                      {group.storeId !== 'unknown' ? (
                        <Link to={`/negocios/${group.storeId}`} className="hover:text-primary">
                          {group.storeName}
                        </Link>
                      ) : (
                        group.storeName
                      )}
                    </h2>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => selectStoreItems(group.storeId, !allSelected)}
                  >
                    {allSelected ? 'Desmarcar tienda' : 'Seleccionar tienda'}
                  </Button>
                </header>

                {/* Lista de productos de la tienda */}
                <ul className="divide-y divide-border">
                  {group.items.map(({ intent, product, sku }) => {
                    const included = intent.selected !== false;
                    const productName = product?.name || (loadingProducts ? 'Cargando producto...' : 'Producto no disponible');
                    const unitPriceCents = sku?.priceCents || 0;
                    const stockAvailable = sku?.availableStock ?? 0;
                    const hasStockError = sku !== undefined && intent.quantity > stockAvailable;
                    const unavailable = !product || !sku || !product.isActive || !sku.isActive || product.storeId !== intent.storeId;
                    const rawImg = product?.images?.[0]?.url;
                    const imageUrlSrc = rawImg ? catalogImage(rawImg) : '';

                    return (
                      <li
                        key={intent.skuId}
                        className={`space-y-3 p-4 sm:p-5 transition-colors ${
                          included ? 'bg-primary-50/20' : 'opacity-80'
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          {/* Checkbox de selección */}
                          <label
                            className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl"
                            htmlFor={`cart-select-${intent.skuId}`}
                          >
                            <input
                              id={`cart-select-${intent.skuId}`}
                              type="checkbox"
                              checked={included}
                              aria-label={`Seleccionar ${productName}`}
                              className="h-5 w-5 rounded accent-primary"
                              onChange={(e) => update(intent.skuId, { selected: e.target.checked })}
                            />
                          </label>

                          {/* Imagen */}
                          {imageUrlSrc ? (
                            <img
                              src={imageUrlSrc}
                              alt={productName}
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = catalogPlaceholder; }}
                              className="h-16 w-16 shrink-0 rounded-xl border border-border bg-surface-subtle object-cover sm:h-20 sm:w-20"
                            />
                          ) : (
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-ink-muted sm:h-20 sm:w-20">
                              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
                            </span>
                          )}

                          {/* Info del producto */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="break-words text-sm font-bold text-ink sm:text-base">
                              {product ? (
                                <Link to={`/producto/${product.id}`} className="hover:text-primary">
                                  {productName}
                                </Link>
                              ) : (
                                productName
                              )}
                            </h3>

                            {sku?.variantName && (
                              <p className="break-words text-xs font-medium text-ink-light">
                                Presentación: <span className="text-ink">{sku.variantName}</span>
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold tabular-nums text-primary">
                                {sku ? money(unitPriceCents) + ' c/u' : 'Precio por verificar'}
                              </span>
                              {sku && (
                                <span className="tabular-nums text-ink-muted">
                                  · {sku.availableStock} disponibles
                                </span>
                              )}
                            </div>

                            {/* Campo de nota personalizada */}
                            <div className="pt-1">
                              <input
                                type="text"
                                placeholder="Nota para el comercio (opcional)..."
                                maxLength={500}
                                value={intent.note || ''}
                                onChange={(e) => update(intent.skuId, { note: e.target.value })}
                                className="w-full rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Alerta de stock insuficiente */}
                        {unavailable && !loadingProducts && <p role="alert" className="text-sm text-destructive">Esta presentación no está disponible. Retírala o elígela nuevamente desde el catálogo.</p>}
                        {hasStockError && (
                          <div className="flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning-strong">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>
                              Solo quedan {stockAvailable} unidades disponibles en inventario. Por favor, ajusta la cantidad.
                            </span>
                          </div>
                        )}

                        {/* Fila de controles: Cantidad, Subtotal y Eliminar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div
                            className="inline-flex items-center rounded-xl border border-border bg-surface"
                            role="group"
                            aria-label={`Cantidad de ${productName}`}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={intent.quantity <= 1}
                              aria-label={`Disminuir cantidad de ${productName}`}
                              onClick={() => update(intent.skuId, { quantity: intent.quantity - 1 })}
                            >
                              <Minus className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-ink">
                              {intent.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={unavailable || intent.quantity >= stockAvailable || intent.quantity >= 10000}
                              aria-label={`Aumentar cantidad de ${productName}`}
                              onClick={() => update(intent.skuId, { quantity: intent.quantity + 1 })}
                            >
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="text-base font-bold tabular-nums text-ink" aria-label={`Subtotal de ${productName}`}>
                              {sku ? money(unitPriceCents * intent.quantity) : 'Por verificar'}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive-soft"
                              aria-label={`Eliminar ${productName}`}
                              onClick={() => remove(intent.skuId)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Barra lateral: Resumen y Checkout */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-28">
          <section aria-label="Resumen del pedido" className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-subtle">
            <h2 className="text-lg font-bold text-ink">Resumen de compra</h2>

            <dl className="space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-light">Productos seleccionados</dt>
                <dd className="font-semibold tabular-nums text-ink">{loadingProducts || catalog.error || stockErrors.length ? 'Por verificar' : money(selectedSubtotalCents)}</dd>
              </div>

              <div className="flex justify-between gap-4 text-xs text-ink-muted">
                <dt>Tarifa de envío</dt>
                <dd className="font-medium">Se calcula en el checkout</dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-3">
                <dt className="text-base font-bold text-ink">Subtotal estimado</dt>
                <dd className="text-xl font-bold tabular-nums text-primary">{loadingProducts || catalog.error || stockErrors.length ? 'Por verificar' : money(selectedSubtotalCents)}</dd>
              </div>
            </dl>

            {stockErrors.length > 0 && (
              <div role="alert" className="rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning-strong space-y-1">
                <p className="font-semibold">Atención con el stock:</p>
                {stockErrors.map((err, idx) => (
                  <p key={idx}>• {err}</p>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              className="min-h-12 w-full gap-2 text-base font-semibold shadow-md"
              disabled={!canProceed}
              onClick={handleProceed}
            >
              {loadingProducts ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Continuar con la compra
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-center text-xs text-ink-muted">
                Iniciarás sesión con tu cuenta de cliente para elegir tu dirección de entrega en Tingo María.
              </p>
            )}

            <p className="text-xs text-ink-muted leading-relaxed border-t border-border/60 pt-3">
              Pago 100% contra entrega en efectivo. Puedes comprar de varias tiendas; cada una coordinará su entrega independiente.
            </p>
          </section>
        </aside>
      </div>

      {/* Diálogo para vaciar el carrito */}
      <Dialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        title="Vaciar carrito"
        description="Se eliminarán todos los productos de tu carrito, incluidos los guardados para después."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm tabular-nums text-ink-light">
            {totalCount} {totalCount === 1 ? 'producto se eliminará' : 'productos se eliminarán'} de forma permanente.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                clear();
                setShowClearDialog(false);
              }}
            >
              Vaciar carrito
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CartPage;
