import React from 'react';
import { Link } from 'react-router-dom';
import { formatCents as formatMoney, centsToSoles } from '../../lib/currency';
import { PriceSummary } from '../../components/shared/PriceSummary';
import { AddressForm } from '../../components/shared/AddressForm';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { MapPin, AlertCircle, Plus, ChevronLeft, Store, Check } from 'lucide-react';
import { RemoteState } from '../operations/shared';
import { useCheckout } from './useCheckout';
const formatCents = (value: number | null | undefined) => value == null ? 'Por cotizar' : formatMoney(value);

export const CheckoutPage: React.FC = () => {
  const { currentUser, isAuthenticated, sessionStatus, sessionError, initialize, currentStep, userAddresses, zones,
    selectedAddressId, selectedAddress, selectedZone, showNewAddressDialog, setShowNewAddressDialog, addressNotice, setAddressNotice,
    paymentMethod, cashAmountGivenSoles, isSubmitting, recordedPurchaseId, recordedDestination, checkoutLocked, stepHeadingRef,
    orderError, items, selectedItems, products, cartCalculations, contextError, parsedCashCents, cashGivenCents, cashValidation,
    paymentReady, addressCompleted, paymentCompleted, chooseAddress, goToStep, continueToPayment, selectPaymentMethod, continueToReview,
    setCashAmount, setCashTouched, handleSetExactCash, cashInputError, cashBills, paymentOptions, handleConfirmOrder, recover, pending, invalidIntent,
    multi, quote, reviewBusy, addressesResource, baseQuote, methods, refreshAddresses } = useCheckout();
  if (sessionStatus === 'checking' || sessionStatus === 'error') return <div className="mx-auto max-w-7xl px-4 py-6"><RemoteState loading={sessionStatus === 'checking'} error={sessionError || undefined} retry={() => void initialize()}/></div>;
  if (!isAuthenticated || !currentUser || (!selectedItems.length && !pending && !invalidIntent && !recordedPurchaseId)) return null;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 pb-32 sm:px-6 lg:px-8">
      <Link to="/carrito" aria-disabled={checkoutLocked} onClick={(event) => { if (checkoutLocked) event.preventDefault(); }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-medium text-primary hover:text-primary-hover">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />Volver al carrito
      </Link>
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Finalizar pedido</h1>
        <p className="text-sm text-ink-light">Completa la dirección y el pago; después revisa los datos antes de confirmar.</p>
      </header>

      <nav aria-label="Pasos del pedido" className="rounded-2xl border border-border bg-surface p-2">
        <ol className="grid grid-cols-3 gap-2">
          {([[1, 'Dirección'], [2, 'Pago'], [3, 'Revisión']] as const).map(([step, label]) => {
            const completed = step === 1 ? addressCompleted : step === 2 ? paymentCompleted : false;
            const unlocked = step === 1 || step === 2 && addressCompleted || step === 3 && paymentCompleted;
            return (
              <li key={step}>
                <Button type="button" variant="ghost" size="sm" disabled={!unlocked || checkoutLocked}
                  aria-label={`Paso ${step}: ${label}`} aria-current={currentStep === step ? 'step' : undefined}
                  className={`w-full flex-col gap-1 text-xs sm:flex-row sm:gap-2 sm:text-sm ${currentStep === step ? 'bg-primary-50 text-primary' : 'text-ink-light'}`}
                  onClick={() => goToStep(step)}>
                  <span className="inline-flex items-center gap-2">{completed ? <Check className="h-4 w-4" aria-hidden="true" /> : <span className="tabular-nums">{step}</span>}{label}</span>
                  <span className="text-xs">{currentStep === step ? 'Actual' : completed ? 'Completado' : 'Pendiente'}</span>
                </Button>
              </li>
            );
          })}
        </ol>
      </nav>

      {orderError && (
        <div role="alert" className={`space-y-3 rounded-xl border p-4 text-sm ${recordedPurchaseId ? 'border-info-border bg-info-soft text-info-strong' : 'border-destructive-border bg-destructive-soft text-destructive-strong'}`}>
          <div className="flex items-start gap-3"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><div className="min-w-0 space-y-1"><p className="font-semibold">{recordedPurchaseId ? 'Tu pedido ya está registrado' : 'Revisa los datos del pedido'}</p><p>{orderError}</p></div></div>
          {recordedPurchaseId && <Link className="inline-flex min-h-11 items-center rounded-xl border border-info px-4 py-2 font-medium" to={recordedDestination}>Ver pedido registrado</Link>}
        </div>
      )}

      {(pending || invalidIntent) && !recordedPurchaseId && <section role="status" className="space-y-3 rounded-xl border border-info-border bg-info-soft p-4 text-sm text-info-strong">
        <h2 className="font-semibold">{invalidIntent ? 'No se pudo recuperar la confirmación guardada' : 'Tu confirmación necesita comprobarse'}</h2>
        <p>{invalidIntent ? 'Revisa tus pedidos antes de iniciar otra compra. No enviaremos una solicitud nueva con estos datos dañados.' : 'Conservamos la misma solicitud para consultar si el pedido se registró. Si aún no existe, podrás reintentarlo sin duplicar la compra.'}</p>
        {pending && <Button type="button" disabled={isSubmitting} isLoading={isSubmitting} onClick={recover}>Recuperar o reintentar confirmación</Button>}
        <Link to="/cliente/pedidos" className="inline-flex min-h-11 items-center px-3 font-semibold">Consultar mis pedidos</Link>
      </section>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Interactive Steps) */}
        <fieldset disabled={checkoutLocked} aria-busy={isSubmitting} className="min-w-0 lg:col-span-2 space-y-6">
          <legend className="sr-only">Datos del pedido</legend>
          {/* STEP 1: DIRECCIÓN */}
          {currentStep === 1 && (
            <section aria-labelledby="checkout-address-heading" className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h2 ref={stepHeadingRef} tabIndex={-1} id="checkout-address-heading" className="text-base font-semibold text-ink">Dirección de entrega</h2>
                  <p className="text-sm text-ink-light">Selecciona dónde recibirás el pedido y revisa la tarifa de envío.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => { setAddressNotice(''); setShowNewAddressDialog(true); }}>
                  <Plus className="h-4 w-4" aria-hidden="true" />Nueva dirección
                </Button>
              </header>
              {addressNotice && <p role="status" className="rounded-xl border border-selva-border bg-selva-soft p-3 text-sm text-selva-strong">{addressNotice}</p>}
              <RemoteState loading={addressesResource.loading} error={addressesResource.error} retry={addressesResource.reload}/>
              <RemoteState loading={baseQuote.loading && !!selectedAddress} error={baseQuote.error} retry={baseQuote.reload}/>
              {addressesResource.loading || addressesResource.error ? null : userAddresses.length === 0 ? (
                <EmptyState icon={<MapPin className="h-8 w-8" aria-hidden="true" />} title="No tienes direcciones guardadas" description="Agrega una dirección para calcular el envío y continuar con el pago." />
              ) : (
                <fieldset className="space-y-3">
                  <legend className="sr-only">Elige una dirección de entrega</legend>
                  {userAddresses.map((address) => {
                    const zone = zones.find((entry) => entry.id === address.zoneId);
                    const available = address.zoneActive && Boolean(zone?.isAvailable);
                    const selected = selectedAddressId === address.id;
                    return (
                      <label key={address.id} className={`flex min-h-11 items-start gap-3 rounded-xl border p-4 ${selected ? 'border-primary bg-primary-50' : 'border-border'} ${available ? 'cursor-pointer hover:border-field' : 'bg-surface-subtle'}`}>
                        <input type="radio" name="checkout-address" value={address.id} checked={selected} disabled={!available}
                          onChange={() => chooseAddress(address.id)} aria-label={`Entregar en ${address.label}: ${address.street} ${address.number}`}
                          className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink">{address.label}</span>{address.isDefault && <Badge>Principal</Badge>}{!available && <Badge variant="danger">Sin cobertura</Badge>}</div>
                          <p className="break-words text-sm font-medium text-ink">{address.street} #{address.number}</p>
                          <p className="break-words text-xs text-ink-light">Referencia: {address.reference}</p>
                          <p className="break-words text-xs text-ink-muted">Recibe: {address.recipientName} · <span className="tabular-nums">{address.phone}</span></p>
                          {available && zone ? <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-xs text-ink-light"><span>{zone.name}</span><span className="tabular-nums">Tarifa base por tienda: <strong>{formatCents(zone.baseFeeCents)}</strong> · {zone.estimatedMinutes} min estimados</span></div> : <p className="text-xs text-destructive">Selecciona otra dirección con cobertura para continuar.</p>}
                        </div>
                      </label>
                    );
                  })}
                </fieldset>
              )}
              {contextError && selectedAddress && <p className="text-sm text-destructive">{contextError}</p>}
              <footer className="flex justify-end border-t border-border pt-4">
                <Button type="button" variant="primary" className="min-h-12 w-full text-sm sm:w-auto" disabled={!selectedAddress || Boolean(contextError)} onClick={continueToPayment}>Continuar al pago</Button>
              </footer>
            </section>
          )}

          {/* STEP 2: MÉTODO DE PAGO */}
          {currentStep === 2 && (
            <section aria-labelledby="checkout-payment-heading" className="space-y-5 rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <header className="space-y-2">
                <h2 ref={stepHeadingRef} tabIndex={-1} id="checkout-payment-heading" className="text-base font-semibold text-ink">Cómo pagarás</h2>
                <p className="text-sm text-ink-light">Selecciona un método y completa sus datos antes de revisar el pedido.</p>
                <p className="flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-3 text-sm text-ink-light">Total del pedido <span className="text-lg font-bold tabular-nums text-ink">{formatCents(cartCalculations.grandTotalCents)}</span></p>
              </header>

              <RemoteState loading={methods.loading} error={methods.error} retry={methods.reload}/>
              <fieldset className="space-y-3">
                <legend className="sr-only">Método de pago</legend>
                {paymentOptions.map((option) => (
                  <label key={option.method} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentMethod === option.method ? 'border-primary bg-primary-50' : 'border-border hover:border-field'}`}>
                    <input type="radio" name="checkout-payment-method" value={option.method} aria-label={option.label}
                      disabled={!option.available}
                      checked={paymentMethod === option.method} onChange={() => selectPaymentMethod(option.method)}
                      className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                    <option.icon className="mt-1 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="min-w-0 space-y-1"><span className="block text-sm font-semibold text-ink">{option.label}{!option.available && <Badge variant="warning">No disponible</Badge>}</span><span className="block text-xs text-ink-light">{option.description}</span></span>
                  </label>
                ))}
              </fieldset>

              {!paymentMethod && <p className="text-sm text-ink-muted">Selecciona un método de pago para continuar.</p>}

              {paymentMethod === 'efectivo' && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-ink">Prepara el efectivo y tu vuelto</h3>
                  {multi && <p className="rounded-xl border border-info-border bg-info-soft p-3 text-sm text-info-strong">Cada tienda cobrará su propio pedido. Prepara el importe exacto de cada entrega que aparece en el resumen.</p>}
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Montos rápidos de efectivo">
                    <Button type="button" variant="outline" size="sm" aria-pressed={parsedCashCents === cartCalculations.grandTotalCents}
                      className={parsedCashCents === cartCalculations.grandTotalCents ? 'bg-primary-50' : ''}
                      onClick={handleSetExactCash}>Monto exacto ({formatCents(cartCalculations.grandTotalCents)})</Button>
                    {cashBills.map((amount) => (
                      <Button key={amount} type="button" variant="outline" size="sm" aria-pressed={parsedCashCents === amount}
                        className={parsedCashCents === amount ? 'bg-primary-50' : ''}
                        onClick={() => setCashAmount(String(centsToSoles(amount)))}>{formatCents(amount)}</Button>
                    ))}
                  </div>
                  <Input id="checkout-cash-amount" label="Monto con el que pagarás" type="text" inputMode="decimal"
                    disabled={multi}
                    value={multi && quote ? String(quote.totalCents / 100) : cashAmountGivenSoles} onChange={(event) => setCashAmount(event.target.value)}
                    onBlur={() => setCashTouched(true)} placeholder="Ej. 50,00" error={cashInputError}
                    helperText="Escribe el monto disponible en soles. Puedes usar coma o punto decimal." />
                  {parsedCashCents !== null && cashValidation.isValid && (
                    <div role="status" className="rounded-xl border border-selva-border bg-selva-soft p-3 text-sm text-selva-strong">
                      <dl className="space-y-2"><div className="flex flex-wrap justify-between gap-3"><dt>Pagas con</dt><dd className="font-semibold tabular-nums">{formatCents(cashGivenCents)}</dd></div><div className="flex flex-wrap justify-between gap-3"><dt>Vuelto</dt><dd className="font-semibold tabular-nums">{formatCents(cashValidation.changeDueCents)}</dd></div></dl>
                      <p className="mt-2 text-xs">{cashValidation.changeDueCents === 0 ? 'Pagarás el monto exacto, sin vuelto.' : 'El monto y el vuelto quedarán registrados en tu pedido.'}</p>
                    </div>
                  )}
                </div>
              )}


              <footer className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => goToStep(1)}>Volver a dirección</Button>
                <Button type="button" variant="primary" size="sm" className="min-h-12" isLoading={reviewBusy}
                  disabled={!paymentReady || isSubmitting || baseQuote.loading} onClick={continueToReview}>Revisar pedido</Button>
              </footer>
            </section>
          )}

          {/* STEP 3: REVISIÓN */}
          {currentStep === 3 && (
            <section aria-labelledby="checkout-review-heading" className="space-y-5 rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <header className="space-y-2">
                <h2 ref={stepHeadingRef} tabIndex={-1} id="checkout-review-heading" className="text-base font-semibold text-ink">Revisa tu pedido</h2>
                <p className="text-sm text-ink-light">Verifica los productos, la dirección y el pago. El comercio revisará el pedido cuando lo registres.</p>
              </header>

              <section aria-labelledby="checkout-review-products" className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id="checkout-review-products" className="text-sm font-semibold text-ink">Productos seleccionados</h3>
                  <Link to="/carrito" aria-disabled={checkoutLocked} onClick={(event) => { if (checkoutLocked) event.preventDefault(); }}
                    className="inline-flex min-h-11 items-center rounded-xl text-sm font-medium text-primary hover:text-primary-hover">Cambiar productos</Link>
                </div>
                {cartCalculations.groups.map((group) => (
                  <div key={group.merchant.id} className="space-y-3">
                    <p className="flex items-start gap-2 text-sm font-medium text-ink-light"><Store className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{group.merchant.name}</span></p>
                    <ul className="divide-y divide-border">
                      {group.items.map((item) => {
                        const product = products.find((entry) => entry.id === item.productId);
                        const unitPrice = item.unitPriceCents + (item.variantPriceDifferenceCents || 0);
                        return (
                          <li key={item.id} className="flex items-start gap-3 py-3 text-sm">
                            <span className="shrink-0 font-semibold tabular-nums text-ink">{item.quantity} ×</span>
                            <div className="min-w-0 flex-1 space-y-1"><p className="break-words font-medium text-ink">{product?.name || 'Producto no disponible'}</p>{item.selectedVariantName && <p className="break-words text-xs text-ink-light">Opción: {item.selectedVariantName}</p>}{item.note && <p className="break-words text-xs text-ink-muted">Nota: {item.note}</p>}<p className="text-xs tabular-nums text-ink-muted">{formatCents(unitPrice)} por unidad</p></div>
                            <span className="break-words text-right font-medium tabular-nums text-ink">{formatCents(unitPrice * item.quantity)}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="flex flex-wrap justify-between gap-3 text-sm text-ink-light">Envío a tu dirección <span className="font-medium tabular-nums text-ink">{formatCents(group.deliveryFeeCents)}</span></p>
                  </div>
                ))}
                {items.some((item) => item.selected === false) && <p className="text-xs text-ink-muted">Los productos que dejaste sin seleccionar seguirán en tu carrito después de esta compra.</p>}
              </section>

              <section aria-labelledby="checkout-review-address" className="space-y-2 border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="checkout-review-address" className="text-sm font-semibold text-ink">Dirección de entrega</h3><Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => goToStep(1)}>Cambiar dirección</Button></div>
                <p className="break-words text-sm font-medium text-ink">{selectedAddress?.street} #{selectedAddress?.number}</p>
                <p className="break-words text-xs text-ink-light">Referencia: {selectedAddress?.reference}</p>
                <p className="break-words text-xs text-ink-light">Recibe: {selectedAddress?.recipientName} · <span className="tabular-nums">{selectedAddress?.phone}</span></p>
                <p className="text-xs text-ink-muted">{selectedZone?.name} · <span className="tabular-nums">{selectedZone?.estimatedMinutes} min de reparto estimados</span></p>
              </section>

              <section aria-labelledby="checkout-review-payment" className="space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="checkout-review-payment" className="text-sm font-semibold text-ink">Pago</h3><Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => goToStep(2)}>Cambiar pago</Button></div>
                <p className="text-sm font-medium text-ink">{paymentOptions.find((option) => option.method === paymentMethod)?.label || 'No seleccionado'}</p>
                {paymentMethod === 'efectivo' ? (
                  <dl className="space-y-2 text-sm text-ink-light"><div className="flex flex-wrap justify-between gap-3"><dt>Pagas con</dt><dd className="font-medium tabular-nums text-ink">{formatCents(cashGivenCents)}</dd></div><div className="flex flex-wrap justify-between gap-3"><dt>Vuelto</dt><dd className="font-medium tabular-nums text-ink">{formatCents(cashValidation.changeDueCents)}</dd></div><div><dt className="sr-only">Estado del pago</dt><dd className="text-xs text-ink-muted">Pagarás cuando recibas el pedido.</dd></div></dl>
                ) : <p className="rounded-xl border border-info-border bg-info-soft p-3 text-sm text-info-strong">El pago digital quedará pendiente de verificación. Registrar el pedido no realiza un cargo.</p>}
              </section>

              <footer className="space-y-3 border-t border-border pt-4">
                <Button type="button" variant="primary" className="min-h-12 w-full flex-wrap gap-2 text-sm" isLoading={isSubmitting}
                  disabled={!paymentCompleted || checkoutLocked} onClick={handleConfirmOrder}>
                  <span>{isSubmitting ? 'Registrando pedido…' : recordedPurchaseId ? 'Pedido registrado' : 'Confirmar pedido'}</span><span aria-hidden="true">·</span><span className="tabular-nums">{formatCents(cartCalculations.grandTotalCents)}</span>
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full text-ink-light" onClick={() => goToStep(2)}>Volver a pago</Button>
                <p className="text-xs text-ink-muted">Podrás consultar el estado del pedido después de registrarlo.</p>
              </footer>
            </section>
          )}
        </fieldset>

        <aside aria-label="Importe del pedido" className="min-w-0 space-y-4 lg:sticky lg:top-40">
          <PriceSummary deliveryIsEstimate={!quote} groups={cartCalculations.groups}
            itemsSubtotalCents={cartCalculations.itemsSubtotalCents} totalDeliveryFeeCents={cartCalculations.totalDeliveryFeeCents}
            grandTotalCents={cartCalculations.grandTotalCents} />
          <p className="text-xs text-ink-muted">El resumen incluye únicamente los productos seleccionados en el carrito.</p>
        </aside>
      </div>

      {/* New Address Dialog */}
      <Dialog
        isOpen={showNewAddressDialog}
        onClose={() => setShowNewAddressDialog(false)}
        title="Nueva dirección"
        description="Indica quién recibe el pedido, la ubicación y una referencia para la entrega."
        maxWidth="lg"
      >
        <AddressForm
          userId={currentUser.id}
          onSuccess={(address) => {
            refreshAddresses();
            chooseAddress(address.id);
            setAddressNotice('Dirección guardada y seleccionada.');
            setShowNewAddressDialog(false);
          }}
          onCancel={() => setShowNewAddressDialog(false)}
        />
      </Dialog>
    </div>
  );
};
