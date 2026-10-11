import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { validateCashPayment } from '../../domain/pricingRules';
import { generateOrderNumber } from '../../lib/utils';
import { formatCents, centsToSoles } from '../../lib/currency';
import { PriceSummary } from '../../components/shared/PriceSummary';
import { AddressForm } from '../../components/shared/AddressForm';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { PaymentMethod, Purchase, MerchantOrder, TrackingEvent } from '../../domain/types';
import {
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  Plus,
  ChevronLeft,
  Store,
  Check,
} from 'lucide-react';

import { checkoutSnapshot, validateCheckoutContext, parseCashCents } from './checkoutFlow';

export const CheckoutPage: React.FC = () => {
  const { items, removeItems } = useCartStore();
  const { merchants, products, addresses, zones, createPurchase, ensureExampleAddresses } = useDataStore();
  const { currentUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const userAddresses = addresses.filter((address) => address.userId === currentUser?.id);
  const [selectedAddressId, setSelectedAddressId] = useState(userAddresses.find((address) => address.isDefault && zones.some((zone) => zone.id === address.zoneId && zone.isAvailable))?.id || userAddresses.find((address) => zones.some((zone) => zone.id === address.zoneId && zone.isAvailable))?.id || '');
  const [showNewAddressDialog, setShowNewAddressDialog] = useState(false);
  const [addressNotice, setAddressNotice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashAmountGivenSoles, setCashAmountGivenSoles] = useState('');
  const [cashTouched, setCashTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordedPurchaseId, setRecordedPurchaseId] = useState<string | null>(null);
  const checkoutLocked = isSubmitting || Boolean(recordedPurchaseId);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef<1 | 2 | 3>(1);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [acceptedAddressKey, setAcceptedAddressKey] = useState('');
  const [reviewedPaymentKey, setReviewedPaymentKey] = useState('');
  const [digitalAcknowledgementKey, setDigitalAcknowledgementKey] = useState('');
  const submissionRef = useRef(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const context = { userId: currentUser?.id || '', addressId: selectedAddressId, items, addresses, zones, merchants, products };
  const snapshot = checkoutSnapshot(context);
  const { selectedAddress, selectedZone, selectedItems, calculations: cartCalculations, key: contextKey } = snapshot;
  const contextError = validateCheckoutContext(context);
  const parsedCashCents = parseCashCents(cashAmountGivenSoles);
  const cashGivenCents = parsedCashCents || 0;
  const cashValidation = validateCashPayment(cashGivenCents, cartCalculations.grandTotalCents);
  const digitalKey = JSON.stringify([contextKey, paymentMethod]);
  const digitalAcknowledged = digitalAcknowledgementKey === digitalKey;
  const paymentReady = Boolean(paymentMethod) && (paymentMethod === 'efectivo'
    ? parsedCashCents !== null && cashValidation.isValid
    : digitalAcknowledged);
  const paymentKey = JSON.stringify([contextKey, paymentMethod, paymentMethod === 'efectivo' ? cashGivenCents : digitalAcknowledged]);
  const addressCompleted = acceptedAddressKey === contextKey && !contextError;
  const paymentCompleted = addressCompleted && paymentReady && reviewedPaymentKey === paymentKey;
  const previousContextKey = useRef(contextKey);

  useEffect(() => {
    if (isAuthenticated && currentUser) ensureExampleAddresses(currentUser);
  }, [isAuthenticated, currentUser, ensureExampleAddresses]);

  useEffect(() => {
    if (selectedAddressId || submissionRef.current) return;
    const available = userAddresses.filter((address) => zones.some((zone) => zone.id === address.zoneId && zone.isAvailable));
    const preferred = available.find((address) => address.isDefault) || available[0];
    if (preferred) setSelectedAddressId(preferred.id);
  }, [userAddresses, zones, selectedAddressId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login', { state: { from: '/checkout', message: 'Inicia sesión para finalizar tu pedido.' }, replace: true });
    } else if (!selectedItems.length && !submissionRef.current) {
      navigate('/carrito', { replace: true });
    }
  }, [isAuthenticated, currentUser, selectedItems.length, navigate, isSubmitting]);

  useEffect(() => {
    if (submissionRef.current) return;
    if (previousContextKey.current !== contextKey) {
      if (acceptedAddressKey) {
        setOrderError('Los datos del pedido cambiaron. Revisa la dirección, el total y el pago antes de continuar.');
        setCurrentStep(1);
      }
      setAcceptedAddressKey('');
      setReviewedPaymentKey('');
      setDigitalAcknowledgementKey('');
      previousContextKey.current = contextKey;
    }
  }, [contextKey, acceptedAddressKey, isSubmitting]);

  useEffect(() => {
    setReviewedPaymentKey('');
  }, [contextKey, paymentMethod, cashAmountGivenSoles, digitalAcknowledgementKey]);

  useEffect(() => {
    if (submissionRef.current) return;
    if (currentStep > 1 && !addressCompleted) setCurrentStep(1);
    else if (currentStep === 3 && !paymentCompleted) setCurrentStep(2);
  }, [currentStep, addressCompleted, paymentCompleted, isSubmitting]);

  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      stepHeadingRef.current?.focus();
      previousStepRef.current = currentStep;
    }
  }, [currentStep]);

  useEffect(() => () => {
    if (submitTimerRef.current !== null) clearTimeout(submitTimerRef.current);
  }, []);

  const liveContext = () => {
    const data = useDataStore.getState();
    return { userId: useAuthStore.getState().currentUser?.id || '', addressId: selectedAddressId,
      items: useCartStore.getState().items, addresses: data.addresses, zones: data.zones, merchants: data.merchants, products: data.products };
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (submissionRef.current) return;
    if (step === 1 || step === 2 && addressCompleted || step === 3 && paymentCompleted) {
      setOrderError(null);
      setCurrentStep(step);
    }
  };

  const chooseAddress = (id: string) => {
    if (submissionRef.current) return;
    setSelectedAddressId(id);
    setAcceptedAddressKey('');
    setReviewedPaymentKey('');
    setDigitalAcknowledgementKey('');
    setOrderError(null);
    setAddressNotice('');
    setCurrentStep(1);
  };

  const continueToPayment = () => {
    if (submissionRef.current) return;
    const fresh = liveContext();
    const error = validateCheckoutContext(fresh);
    if (error) { setOrderError(error); return; }
    setOrderError(null);
    setAcceptedAddressKey(checkoutSnapshot(fresh).key);
    setCurrentStep(2);
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    if (submissionRef.current || method === paymentMethod) return;
    setPaymentMethod(method);
    setCashTouched(false);
    setDigitalAcknowledgementKey('');
    setReviewedPaymentKey('');
    setOrderError(null);
  };

  const continueToReview = () => {
    if (submissionRef.current) return;
    const fresh = liveContext();
    const error = validateCheckoutContext(fresh);
    if (error || checkoutSnapshot(fresh).key !== acceptedAddressKey) {
      setOrderError(error || 'Revisa la dirección y el total antes de continuar.');
      setCurrentStep(1);
      return;
    }
    if (!paymentReady) {
      setOrderError(!paymentMethod ? 'Selecciona un método de pago.' :
        paymentMethod === 'efectivo' ? 'Ingresa un monto válido y suficiente para pagar el pedido.' :
        'Revisa las condiciones del método de pago antes de continuar.');
      return;
    }
    setOrderError(null);
    setReviewedPaymentKey(paymentKey);
    setCurrentStep(3);
  };

  const grandTotalSoles = centsToSoles(cartCalculations.grandTotalCents);
  const setCashAmount = (value: string) => {
    setCashTouched(true);
    setCashAmountGivenSoles(value);
    setOrderError(null);
  };
  const handleSetExactCash = () => setCashAmount(String(grandTotalSoles));
  const cashInputError = cashTouched
    ? parsedCashCents === null ? 'Ingresa un monto válido en soles, con hasta dos decimales.'
      : !cashValidation.isValid ? `El monto debe cubrir el total de ${formatCents(cartCalculations.grandTotalCents)}.` : undefined
    : undefined;
  const cashBills = [2000, 5000, 10000, 20000].filter((amount) => amount > cartCalculations.grandTotalCents);
  const paymentOptions: { method: PaymentMethod; label: string; description: string; icon: typeof Banknote }[] = [
    { method: 'yape_plin', label: 'Yape / Plin', description: 'Billetera digital; el pago requiere verificación.', icon: Smartphone },
    { method: 'efectivo', label: 'Efectivo contra entrega', description: 'Indica con cuánto pagarás al recibir el pedido.', icon: Banknote },
    { method: 'tarjeta', label: 'Tarjeta de débito o crédito', description: 'El pago requiere confirmación del servicio de cobro.', icon: CreditCard },
  ];


  const handleConfirmOrder = () => {
    if (submissionRef.current) return;
    const fresh = liveContext();
    const error = validateCheckoutContext(fresh);
    if (error || checkoutSnapshot(fresh).key !== acceptedAddressKey) {
      setOrderError(error || 'Los datos del pedido cambiaron. Revisa la dirección y el total.');
      setCurrentStep(1);
      return;
    }
    if (currentStep !== 3 || !paymentCompleted || !paymentMethod || !selectedAddress) {
      setOrderError('Completa el paso de pago antes de confirmar el pedido.');
      setCurrentStep(2);
      return;
    }
    submissionRef.current = true;
    setIsSubmitting(true);
    setOrderError(null);
    // Build suborders for each merchant
    const merchantOrders: MerchantOrder[] = cartCalculations.groups.map((grp, idx) => {
      const orderLines = grp.items.map((it) => {
        const prod = products.find((p) => p.id === it.productId);
        const unitPrice = it.unitPriceCents + (it.variantPriceDifferenceCents || 0);
        return {
          productId: it.productId,
          productName: prod?.name || 'Producto',
          productImage: prod?.imageUrl || '',
          quantity: it.quantity,
          unitPriceCents: unitPrice,
          variantName: it.selectedVariantName,
          note: it.note,
          subtotalCents: unitPrice * it.quantity,
        };
      });

      const initialTimeline: TrackingEvent[] = [
        {
          id: `tr_${Date.now()}_${idx}`,
          timestamp: new Date().toISOString(),
          status: 'pendiente',
          title: 'Pedido registrado',
          description: `Esperando confirmación de ${grp.merchant.name}`,
          actor: currentUser?.name || 'Cliente',
        },
      ];

      return {
        id: `mo_${Date.now()}_${idx}`,
        purchaseId: '', // populated below
        merchantId: grp.merchant.id,
        merchantName: grp.merchant.name,
        merchantPhone: grp.merchant.phone,
        merchantAddress: grp.merchant.address,
        status: 'pendiente',
        items: orderLines,
        subtotalCents: grp.subtotalCents,
        deliveryFeeCents: grp.deliveryFeeCents,
        totalCents: grp.totalCents,
        paymentStatus: 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: initialTimeline,
      };
    });

    const purchaseId = `pur_${Date.now()}`;
    const purchaseCode = generateOrderNumber();

    merchantOrders.forEach((mo) => (mo.purchaseId = purchaseId));

    const newPurchase: Purchase = {
      id: purchaseId,
      code: purchaseCode,
      customerId: currentUser?.id || 'u_cliente_demo',
      customerName: currentUser?.name || 'Cliente Demo',
      customerPhone: selectedAddress.phone,
      addressSnapshot: selectedAddress,
      paymentMethod,
      paymentStatus: 'pendiente',
      subtotalCents: cartCalculations.itemsSubtotalCents,
      totalDeliveryFeeCents: cartCalculations.totalDeliveryFeeCents,
      grandTotalCents: cartCalculations.grandTotalCents,
      merchantOrders,
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      cashAmountPaidCents: paymentMethod === 'efectivo' ? cashGivenCents : undefined,
      changeDueCents: paymentMethod === 'efectivo' ? cashValidation.changeDueCents : undefined,
    };

    submitTimerRef.current = setTimeout(() => {
      let created = false;
      try {
        const fresh = liveContext();
        const error = validateCheckoutContext(fresh);
        if (!useAuthStore.getState().isAuthenticated || !useAuthStore.getState().currentUser) {
          setOrderError('Tu sesión cambió. Inicia sesión antes de confirmar el pedido.');
          return;
        }
        if (error || checkoutSnapshot(fresh).key !== contextKey) {
          setOrderError(error || 'El pedido cambió durante la confirmación. Revisa los datos antes de continuar.');
          setAcceptedAddressKey('');
          setReviewedPaymentKey('');
          setCurrentStep(1);
          return;
        }
        const result = createPurchase(newPurchase);
        if (result.success) {
          created = true;
          setRecordedPurchaseId(purchaseId);
          removeItems(selectedItems.map((item) => item.id));
          navigate(`/cliente/pedidos/${purchaseId}`, { state: { isNewOrder: true } });
        } else {
          setOrderError(result.message || 'No se pudo registrar el pedido. Tus productos siguen en el carrito.');
        }
      } catch {
        setOrderError(created ? 'El pedido ya se registró. Revisa tus pedidos antes de volver a intentarlo.' :
          'No se pudo registrar el pedido. Revisa tus pedidos antes de volver a intentarlo.');
      } finally {
        submitTimerRef.current = null;
        if (!created) submissionRef.current = false;
        setIsSubmitting(false);
      }
    }, 450);
  };

  if (!isAuthenticated || !currentUser || !selectedItems.length) return null;

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
          {recordedPurchaseId && <Link className="inline-flex min-h-11 items-center rounded-xl border border-info px-4 py-2 font-medium" to={`/cliente/pedidos/${recordedPurchaseId}`}>Ver pedido registrado</Link>}
        </div>
      )}

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
              {userAddresses.length === 0 ? (
                <EmptyState icon={<MapPin className="h-8 w-8" aria-hidden="true" />} title="No tienes direcciones guardadas" description="Agrega una dirección para calcular el envío y continuar con el pago." />
              ) : (
                <fieldset className="space-y-3">
                  <legend className="sr-only">Elige una dirección de entrega</legend>
                  {userAddresses.map((address) => {
                    const zone = zones.find((entry) => entry.id === address.zoneId);
                    const available = Boolean(zone?.isAvailable);
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
                          {available && zone ? <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 text-xs text-ink-light"><span>{zone.name}</span><span className="tabular-nums">Envío: <strong>{formatCents(zone.baseFeeCents)}</strong> · {zone.estimatedMinutes} min estimados</span></div> : <p className="text-xs text-destructive">Selecciona otra dirección con cobertura para continuar.</p>}
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

              <fieldset className="space-y-3">
                <legend className="sr-only">Método de pago</legend>
                {paymentOptions.map((option) => (
                  <label key={option.method} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 ${paymentMethod === option.method ? 'border-primary bg-primary-50' : 'border-border hover:border-field'}`}>
                    <input type="radio" name="checkout-payment-method" value={option.method} aria-label={option.label}
                      checked={paymentMethod === option.method} onChange={() => selectPaymentMethod(option.method)}
                      className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                    <option.icon className="mt-1 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="min-w-0 space-y-1"><span className="block text-sm font-semibold text-ink">{option.label}</span><span className="block text-xs text-ink-light">{option.description}</span></span>
                  </label>
                ))}
              </fieldset>

              {!paymentMethod && <p className="text-sm text-ink-muted">Selecciona un método de pago para continuar.</p>}

              {paymentMethod === 'efectivo' && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-ink">Prepara el efectivo y tu vuelto</h3>
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
                    value={cashAmountGivenSoles} onChange={(event) => setCashAmount(event.target.value)}
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

              {paymentMethod && paymentMethod !== 'efectivo' && (
                <div className="space-y-3 rounded-xl border border-info-border bg-info-soft p-4">
                  <h3 className="text-sm font-semibold text-info-strong">{paymentMethod === 'yape_plin' ? 'Pago con Yape / Plin' : 'Pago con tarjeta'}</h3>
                  <p id="checkout-digital-help" className="text-sm text-info-strong">El pedido quedará con pago pendiente de verificación. Elegir este método no realiza un cargo ni confirma que hayas pagado.</p>
                  <p className="text-xs text-ink-light">{paymentMethod === 'yape_plin' ? 'Los datos de cobro deberán ser proporcionados por el comercio o el servicio de pago.' : 'Aún no hay una pasarela conectada. No ingreses datos de tu tarjeta en este formulario.'}</p>
                  <label htmlFor="checkout-digital-acknowledgement" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl text-sm text-ink">
                    <input id="checkout-digital-acknowledgement" type="checkbox" checked={digitalAcknowledged}
                      aria-describedby="checkout-digital-help" className="mt-1 h-5 w-5 shrink-0 accent-primary"
                      onChange={(event) => { setDigitalAcknowledgementKey(event.target.checked ? digitalKey : ''); setOrderError(null); }} />
                    <span>Entiendo que el pago quedará pendiente de verificación.</span>
                  </label>
                </div>
              )}

              <footer className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => goToStep(1)}>Volver a dirección</Button>
                <Button type="button" variant="primary" size="sm" className="min-h-12" disabled={!paymentReady || isSubmitting} onClick={continueToReview}>Revisar pedido</Button>
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
          <PriceSummary deliveryIsEstimate={!selectedZone} groups={cartCalculations.groups}
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
          userId={currentUser?.id || 'u_cliente_demo'}
          onSuccess={(address) => {
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
