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
import { Dialog } from '../../components/ui/Dialog';
import {
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShoppingBag,
  ShoppingCart,
  AlertCircle,
  ChevronLeft,
  Loader2,
  RotateCw,
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
  const { isAuthenticated, activeRole } = useAuthStore();
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

  if (activeRole === 'comercio') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Modo Comercio Activo</h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Has iniciado sesión con una cuenta de comercio. Las tiendas gestionan sus publicaciones y pedidos desde su propio panel y no realizan pedidos como clientes.
        </p>
        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/comercio/tienda')}>
            Ir a mi Panel de Tienda
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Ver Catálogo General
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <div className="bg-[#eaeff2] rounded-3xl p-8 sm:p-12 text-center space-y-4 select-none">
          <div className="w-14 h-14 rounded-2xl bg-gray-950 text-white flex items-center justify-center mx-auto shadow-xs">
            <ShoppingBag className="w-7 h-7 text-white stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
              Tu carrito está vacío
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed max-w-md mx-auto">
              Explora las tiendas y productos oficiales de Tingo María y agrega lo que necesites para pedirlo hoy mismo.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full bg-gray-950 hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              Explorar productos de Tingo María
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-32 sm:px-6 lg:px-8">
      {/* Barra superior de navegación rápida y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-950 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          Seguir comprando
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-950 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg shadow-2xs"
            onClick={catalog.reload}
          >
            <RotateCw className={`h-3.5 w-3.5 ${loadingProducts ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualizar disponibilidad
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Vaciar carrito
          </Button>
        </div>
      </div>

      {/* Encabezado con tipografía moderna limpia estilo Imagen 2 y 3 */}
      <header className="space-y-1 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950">
            Carrito de compras
          </h1>
          <span className="text-sm font-bold text-gray-500">
            {totalCount} {totalCount === 1 ? 'Producto' : 'Productos'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed font-medium">
          Productos de comercios oficiales de Tingo María. Pago contra entrega en efectivo o transferencia.
        </p>
        <p role="status" className="text-xs tabular-nums text-gray-500">
          <span className="font-bold text-gray-950">{selectedCount}</span> {selectedCount === 1 ? 'producto seleccionado' : 'productos seleccionados'} ·{' '}
          <span className="font-bold text-gray-950">{totalCount - selectedCount}</span> para después
        </p>
      </header>

      {notice && (
        <div role="status" className="rounded-xl border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">
          {actionError}
        </div>
      )}

      <RemoteState loading={loadingProducts} error={catalog.error} retry={catalog.reload} />

      {/* Grid principal: Items a la izquierda, Resumen a la derecha */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          {storeGroups.map((group) => {
            const allSelected = group.items.every((it) => it.intent.selected !== false);

            return (
              <section
                key={group.storeId}
                aria-label={`Productos de ${group.storeName}`}
                className="min-w-0 rounded-xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden"
              >
                {/* Cabecera integrada de la tienda */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="flex items-center gap-2">
                    <Store className="h-4.5 w-4.5 text-zinc-500" aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Tienda:</span>
                    <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                      {group.storeId !== 'unknown' ? (
                        <Link to={`/negocios/${group.storeId}`} className="hover:text-primary transition-colors">
                          {group.storeName}
                        </Link>
                      ) : (
                        group.storeName
                      )}
                    </h2>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-semibold px-3 border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 shadow-2xs"
                    onClick={() => selectStoreItems(group.storeId, !allSelected)}
                  >
                    {allSelected ? 'Desmarcar tienda' : 'Seleccionar tienda'}
                  </Button>
                </header>

                {/* Lista de productos de la tienda sin bordes redundantes */}
                <ul className="divide-y divide-zinc-100">
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
                        className={`p-4 sm:p-5 transition-colors ${
                          included ? 'bg-white' : 'bg-zinc-50/40 opacity-70'
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          {/* Checkbox de selección */}
                          <label
                            className="flex items-center cursor-pointer pt-1"
                            htmlFor={`cart-select-${intent.skuId}`}
                          >
                            <input
                              id={`cart-select-${intent.skuId}`}
                              type="checkbox"
                              checked={included}
                              aria-label={`Seleccionar ${productName}`}
                              className="h-4.5 w-4.5 rounded border-zinc-300 text-primary accent-primary focus:ring-primary cursor-pointer"
                              onChange={(e) => update(intent.skuId, { selected: e.target.checked })}
                            />
                          </label>

                          {/* Imagen del producto */}
                          {imageUrlSrc ? (
                            <img
                              src={imageUrlSrc}
                              alt={productName}
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = catalogPlaceholder; }}
                              className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl border border-zinc-100 bg-zinc-50 object-cover"
                            />
                          ) : (
                            <span className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-400">
                              <ShoppingBag className="h-7 w-7" aria-hidden="true" />
                            </span>
                          )}

                          {/* Info del producto & Controles */}
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="min-w-0 space-y-1">
                                <h3 className="break-words text-sm sm:text-base font-bold text-zinc-900 leading-snug">
                                  {product ? (
                                    <Link to={`/producto/${product.id}`} className="hover:text-primary transition-colors">
                                      {productName}
                                    </Link>
                                  ) : (
                                    productName
                                  )}
                                </h3>

                                {sku?.variantName && (
                                  <p className="break-words text-xs text-zinc-500">
                                    Presentación: <span className="font-semibold text-zinc-700">{sku.variantName}</span>
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="font-medium text-zinc-600">
                                    {sku ? money(unitPriceCents) + ' c/u' : 'Precio por verificar'}
                                  </span>
                                  {sku && (
                                    <span className="tabular-nums text-zinc-400">
                                      · {sku.availableStock} disponibles
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Bloque de precio visible en pantallas medianas y grandes */}
                              <div className="hidden sm:block text-right shrink-0">
                                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Precio</p>
                                <p className="text-base font-bold tabular-nums text-zinc-900" aria-label={`Subtotal de ${productName}`}>
                                  {sku ? money(unitPriceCents * intent.quantity) : 'Por verificar'}
                                </p>
                              </div>
                            </div>

                            {/* Campo de nota personalizada para el comercio */}
                            <div className="pt-1">
                              <input
                                type="text"
                                placeholder="Nota para el comercio (opcional)..."
                                maxLength={500}
                                value={intent.note || ''}
                                onChange={(e) => update(intent.skuId, { note: e.target.value })}
                                className="w-full max-w-md rounded-lg border border-zinc-200/90 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                              />
                            </div>

                            {/* Alertas de stock insuficiente o producto no disponible */}
                            {unavailable && !loadingProducts && (
                              <p role="alert" className="text-xs sm:text-sm font-medium text-destructive pt-1">
                                Esta presentación no está disponible. Retírala o elígela nuevamente desde el catálogo.
                              </p>
                            )}
                            {hasStockError && (
                              <div className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-soft p-2.5 text-xs text-warning-strong mt-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>
                                  Solo quedan {stockAvailable} unidades disponibles en inventario. Por favor, ajusta la cantidad.
                                </span>
                              </div>
                            )}

                            {/* Fila de controles: Stepper tipo Imagen 2, Subtotal móvil y Eliminar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <div
                                className="inline-flex items-center rounded-lg border border-zinc-200 bg-white shadow-2xs overflow-hidden"
                                role="group"
                                aria-label={`Cantidad de ${productName}`}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 min-h-0 min-w-0 p-0 rounded-none text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-white border-r border-zinc-200"
                                  disabled={intent.quantity <= 1}
                                  aria-label={`Disminuir cantidad de ${productName}`}
                                  onClick={() => update(intent.skuId, { quantity: intent.quantity - 1 })}
                                >
                                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                                <span className="min-w-9 px-2 text-center text-xs sm:text-sm font-semibold tabular-nums text-zinc-900">
                                  {intent.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 min-h-0 min-w-0 p-0 rounded-none text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-white border-l border-zinc-200"
                                  disabled={unavailable || intent.quantity >= stockAvailable || intent.quantity >= 10000}
                                  aria-label={`Aumentar cantidad de ${productName}`}
                                  onClick={() => update(intent.skuId, { quantity: intent.quantity + 1 })}
                                >
                                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-3">
                                <p className="block sm:hidden text-sm font-bold tabular-nums text-zinc-900" aria-label={`Subtotal de ${productName}`}>
                                  {sku ? money(unitPriceCents * intent.quantity) : 'Por verificar'}
                                </p>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-destructive hover:bg-destructive-soft px-2 py-1 rounded-md transition-colors"
                                  aria-label={`Eliminar ${productName}`}
                                  onClick={() => remove(intent.skuId)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Pie de tienda estilo Oechsle / Falabella */}
                <footer className="px-4 py-2.5 sm:px-5 bg-zinc-50/80 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                  <span>
                    Vendido y despachado por <strong className="text-zinc-900 font-bold">{group.storeName}</strong>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">Garantía oficial y entrega local</span>
                </footer>
              </section>
            );
          })}
        </div>

        {/* Barra lateral: Tarjeta plomo estilo Imagen 2 */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-28">
          <section
            aria-label="Resumen del pedido"
            className="rounded-xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden"
          >
            {/* Cabecera plomo distintiva con icono de carrito de compras */}
            <div className="bg-[#5D636A] px-5 py-3.5 flex items-center gap-2.5 text-white">
              <ShoppingCart className="h-5 w-5 text-white shrink-0" aria-hidden="true" />
              <h2 className="text-base font-bold text-white tracking-wide">Resumen de la compra</h2>
            </div>

            <div className="p-5 space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-zinc-600">Productos seleccionados</dt>
                  <dd className="font-semibold tabular-nums text-zinc-900">
                    {loadingProducts || catalog.error || stockErrors.length ? 'Por verificar' : money(selectedSubtotalCents)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 text-xs text-zinc-500">
                  <dt>Tarifa de envío</dt>
                  <dd className="font-medium text-zinc-500">Se calcula en el checkout</dd>
                </div>

                <div className="flex items-baseline justify-between gap-4 border-t border-zinc-200 pt-3">
                  <dt className="text-base font-bold text-zinc-900">Subtotal estimado</dt>
                  <dd className="text-xl font-extrabold tabular-nums text-zinc-900">
                    {loadingProducts || catalog.error || stockErrors.length ? 'Por verificar' : money(selectedSubtotalCents)}
                  </dd>
                </div>
              </dl>

              {/* Módulo de cupón con líneas simples estilo Oechsle (Imagen 3) */}
              <div className="pt-3 border-t border-zinc-200">
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  ¿Tienes un cupón de descuento?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingresa tu cupón"
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs uppercase font-bold text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal focus:bg-white focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 transition-colors"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-black text-white font-black text-xs transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {stockErrors.length > 0 && (
                <div role="alert" className="rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning-strong space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Atención con el stock:
                  </p>
                  {stockErrors.map((err, idx) => (
                    <p key={idx} className="pl-5">• {err}</p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Botón de compra y acciones debajo de la tarjeta plomo como en la imagen 2 */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="primary"
              className="min-h-12 w-full gap-2 text-base font-bold shadow-xs rounded-xl"
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

            <div className="text-center pt-1">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
              >
                Ver más productos
              </Link>
            </div>

            <div className="space-y-2 pt-2 text-center text-xs text-zinc-500 leading-relaxed">
              {!isAuthenticated && (
                <p className="rounded-lg border border-zinc-200/80 bg-zinc-50 p-2.5 text-zinc-600">
                  Iniciarás sesión con tu cuenta de cliente para elegir tu dirección de entrega en Tingo María.
                </p>
              )}

              <p className="text-zinc-400">
                Pago 100% contra entrega en efectivo. Puedes comprar de varias tiendas; cada una coordinará su entrega independiente.
              </p>
            </div>
          </div>
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
          <p className="text-sm tabular-nums text-zinc-600">
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
