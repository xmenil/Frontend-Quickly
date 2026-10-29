import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import type { PaymentMethod } from '../../domain/types';
import { useAuthStore } from '../../store/authStore';
import { useRealCartStore, intent as cartIntent } from '../../store/realCartStore';
import { orderingApi, type GroupQuote, type PurchaseInput } from '../../services/api/orderingApi';
import { billingApi } from '../../services/api/billingApi';
import { ApiError } from '../../services/api/apiClient';
import { useRemote } from '../operations/shared';
import { useCustomerAddresses } from '../customer/customerAddressModel';
import { checkoutJournalKey, pendingFor, saveCheckoutIntent, type PendingCheckout } from './checkoutIntent';
import { parseCashCents } from './checkoutFlow';
import { formatCents } from '../../lib/currency';

const quoteKey = (quote?: GroupQuote | null) => JSON.stringify(quote && { ...quote, stores: quote.stores.map(({ cashTenderCents, cashChangeCents, ...store }) => store) });
async function quotePurchase(body: PurchaseInput, multi: boolean, signal?: AbortSignal): Promise<GroupQuote> {
  const single = multi ? null : await orderingApi.quote(body, signal);
  const quote = single ? { stores: [single], subtotalCents: single.subtotalCents, deliveryFeeCents: single.deliveryFeeCents, totalCents: single.totalCents }
    : await orderingApi.groupQuote(body, signal);
  const lines = quote.stores.flatMap(store => store.items);
  const valid = lines.length === body.items.length && new Set(lines.map(line => line.skuId)).size === lines.length
    && lines.every(line => body.items.some(item => item.skuId === line.skuId && item.quantity === line.quantity && (item.note || '') === line.note))
    && quote.stores.every(store => store.subtotalCents === store.items.reduce((total, line) => total + line.quantity * line.unitPriceCents, 0)
      && store.totalCents === store.subtotalCents + store.deliveryFeeCents && Number.isSafeInteger(store.totalCents))
    && (['subtotalCents', 'deliveryFeeCents', 'totalCents'] as const).every(field => quote[field] === quote.stores.reduce((total, store) => total + store[field], 0) && Number.isSafeInteger(quote[field]));
  if (!valid) throw new ApiError('La cotización no coincide con los productos seleccionados. Vuelve a consultar el pedido.', 0, 'INVALID_RESPONSE');
  return quote;
}

export function useCheckout() {
  const auth = useAuthStore();
  const userId = auth.currentUser?.id || '';
  const navigate = useNavigate();
  const { items, consume } = useRealCartStore();
  const selectedItems = useMemo(() => items.filter(item => item.selected), [items]);
  const addressesResource = useCustomerAddresses();
  const addresses = addressesResource.data?.addresses || [];
  const zones = addressesResource.data?.zones || [];
  const methods = useRemote('checkout-payment-methods', signal => billingApi.methods(signal));
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const selectedAddress = addresses.find(address => address.id === selectedAddressId);
  const selectedZone = zones.find(zone => zone.id === selectedAddress?.zoneId);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashAmountGivenSoles, setCashAmountGivenSoles] = useState('');
  const [cashTouched, setCashTouched] = useState(false);
  const [showNewAddressDialog, setShowNewAddressDialog] = useState(false);
  const [addressNotice, setAddressNotice] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [acceptedAddressKey, setAcceptedAddressKey] = useState('');
  const [reviewedPaymentKey, setReviewedPaymentKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [recordedDestination, setRecordedDestination] = useState('');
  const [recordedPurchaseId, setRecordedPurchaseId] = useState<string | null>(null);
  const stored = useMemo(() => userId ? pendingFor(userId) : null, [userId]);
  const [journal, setJournal] = useState<{ owner: string; value: PendingCheckout | null | 'invalid' }>({ owner: '', value: null });
  const journalValue = journal.owner === userId ? journal.value : stored;
  const pending = journalValue === 'invalid' ? null : journalValue;
  const invalidIntent = journalValue === 'invalid';
  const submissionRef = useRef(false);
  const reviewingRef = useRef(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(currentStep);
  const multi = new Set(selectedItems.map(item => item.storeId)).size > 1;
  const cartKey = JSON.stringify(selectedItems);
  const inputKey = JSON.stringify([userId, selectedAddress, cartKey]);
  const canQuote = !!userId && auth.isAuthenticated && auth.sessionStatus === 'ready' && !!selectedAddress?.zoneActive && !!selectedZone?.isAvailable
    && selectedItems.length > 0 && selectedItems.length <= 100 && selectedItems.every(item => cartIntent.safeParse(item).success) && !pending && !invalidIntent;
  const baseBody: PurchaseInput = { addressId: selectedAddressId, paymentMethod: 'cash',
    items: selectedItems.map(item => ({ skuId: item.skuId, quantity: item.quantity, note: item.note })), cashTenderCents: null };
  const baseQuote = useRemote(`checkout-quote:${inputKey}:${canQuote}`, signal => canQuote ? quotePurchase(baseBody, multi, signal) : Promise.resolve(null));
  const [reviewQuote, setReviewQuote] = useState<{ input: string; quote: GroupQuote } | null>(null);
  const quote = reviewQuote?.input === inputKey ? reviewQuote.quote : baseQuote.data;
  const contextKey = JSON.stringify([inputKey, quoteKey(quote)]);
  const parsedCashCents = multi && quote ? quote.totalCents : parseCashCents(cashAmountGivenSoles);
  const cashGivenCents = parsedCashCents ?? 0;
  const cashValidation = { isValid: !!quote && parsedCashCents !== null && cashGivenCents >= quote.totalCents && cashGivenCents <= 100000000000000,
    changeDueCents: quote ? cashGivenCents - quote.totalCents : 0 };
  const cashMethod = methods.data?.find(method => method.code === 'cash');
  const cashAvailable = cashMethod?.available
    && quote?.stores.every(store => store.paymentMethods.includes('cash'));
  const contextError = addressesResource.error || (!selectedAddress ? 'Selecciona una dirección de entrega de tu cuenta.'
    : !selectedAddress.zoneActive || !selectedZone?.isAvailable ? 'Esta dirección está fuera de cobertura. Selecciona otra dirección.'
    : baseQuote.error || (!quote || baseQuote.loading ? 'Estamos comprobando los importes y la disponibilidad.' : null));
  const paymentReady = paymentMethod === 'efectivo' && !!cashAvailable && cashValidation.isValid && !methods.error;
  const paymentKey = JSON.stringify([contextKey, paymentMethod, parsedCashCents]);
  const addressCompleted = !!acceptedAddressKey && acceptedAddressKey === contextKey && !contextError;
  const paymentCompleted = addressCompleted && paymentReady && reviewedPaymentKey === paymentKey;
  const checkoutLocked = isSubmitting || reviewBusy || !!pending || invalidIntent || !!recordedPurchaseId;
  const live = useRef({ inputKey, contextKey, paymentKey, userId });
  live.current = { inputKey, contextKey, paymentKey, userId };

  useEffect(() => {
    if (auth.sessionStatus !== 'ready') return;
    if (!auth.isAuthenticated || !userId) navigate('/login', { state: { from: '/checkout' }, replace: true });
    else if (!selectedItems.length && !pending && !invalidIntent && !submissionRef.current && !recordedPurchaseId) navigate('/carrito', { replace: true });
  }, [auth.sessionStatus, auth.isAuthenticated, userId, selectedItems.length, pending, invalidIntent, recordedPurchaseId, navigate]);
  useEffect(() => {
    if (selectedAddressId || checkoutLocked) return;
    const available = addresses.filter(address => address.zoneActive && zones.some(zone => zone.id === address.zoneId && zone.isAvailable));
    const preferred = available.find(address => address.isDefault) || available[0];
    if (preferred) setSelectedAddressId(preferred.id);
  }, [addresses, zones, selectedAddressId, checkoutLocked]);
  useEffect(() => {
    if (checkoutLocked) return;
    if (acceptedAddressKey && acceptedAddressKey !== contextKey) {
      setAcceptedAddressKey(''); setReviewedPaymentKey(''); setCurrentStep(1);
      setOrderError('Los datos del pedido cambiaron. Revisa la dirección, los importes y el pago antes de continuar.');
    }
  }, [contextKey, acceptedAddressKey, checkoutLocked]);
  useEffect(() => { if (previousStep.current !== currentStep) { stepHeadingRef.current?.focus(); previousStep.current = currentStep; } }, [currentStep]);

  function chooseAddress(id: string) {
    if (checkoutLocked) return;
    setSelectedAddressId(id); setAcceptedAddressKey(''); setReviewedPaymentKey(''); setReviewQuote(null); setCurrentStep(1); setOrderError(null); setAddressNotice('');
  }
  function goToStep(step: 1 | 2 | 3) {
    if (checkoutLocked) return;
    if (step === 1 || step === 2 && addressCompleted || step === 3 && paymentCompleted) { setCurrentStep(step); setOrderError(null); }
  }
  function continueToPayment() {
    if (checkoutLocked || contextError) { setOrderError(contextError); return; }
    setAcceptedAddressKey(contextKey); setCurrentStep(2); setOrderError(null);
  }
  function selectPaymentMethod(method: PaymentMethod) {
    if (checkoutLocked || method !== 'efectivo' || !cashAvailable) return;
    setPaymentMethod(method); setReviewedPaymentKey(''); setOrderError(null);
  }
  function setCashAmount(value: string) {
    if (checkoutLocked || multi) return;
    setCashTouched(true); setCashAmountGivenSoles(value); setReviewedPaymentKey(''); setOrderError(null);
  }
  async function continueToReview() {
    if (checkoutLocked || reviewingRef.current || !addressCompleted || !paymentReady || !quote) return;
    reviewingRef.current = true; setReviewBusy(true); setOrderError(null);
    const started = { ...live.current };
    try {
      const verified = await quotePurchase({ ...baseBody, cashTenderCents: multi ? null : cashGivenCents }, multi);
      if (useAuthStore.getState().currentUser?.id !== userId || live.current.inputKey !== started.inputKey || live.current.paymentKey !== started.paymentKey) return;
      setReviewQuote({ input: inputKey, quote: verified });
      if (quoteKey(verified) !== quoteKey(quote)) { setAcceptedAddressKey(''); setCurrentStep(1); setOrderError('Los importes cambiaron. Revisa la nueva cotización antes de continuar.'); return; }
      setReviewedPaymentKey(paymentKey); setCurrentStep(3);
    } catch (error) { setOrderError(error instanceof Error ? error.message : 'No se pudo comprobar el pedido.'); baseQuote.reload(); }
    finally { reviewingRef.current = false; setReviewBusy(false); }
  }
  async function send(recover: boolean) {
    if (submissionRef.current || invalidIntent || !userId || useAuthStore.getState().currentUser?.id !== userId) return;
    if (!recover && (!paymentCompleted || currentStep !== 3 || !quote || checkoutLocked || baseQuote.loading)) return;
    submissionRef.current = true; setIsSubmitting(true); setOrderError(null);
    let attempt = pending;
    try {
      if (!attempt) {
        attempt = saveCheckoutIntent(userId, { key: crypto.randomUUID(), group: multi,
          body: { ...baseBody, cashTenderCents: multi ? null : cashGivenCents, expectedTotalCents: quote!.totalCents }, snapshot: selectedItems.map(item => ({ ...item })) });
        setJournal({ owner: userId, value: attempt });
      }
      let destination: string; let id: string;
      if (attempt.group) {
        let result;
        if (recover) { try { result = await orderingApi.groupAttempt(attempt.key); } catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; } }
        result ||= await orderingApi.groupCreate(attempt.body, attempt.key);
        id = result.id; destination = `/cliente/compras/${id}`;
      } else {
        let result;
        if (recover) { try { result = await orderingApi.attempt(attempt.key); } catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; } }
        id = result?.id || (await orderingApi.create(attempt.body, attempt.key)).orderId;
        destination = `/cliente/pedidos/${id}`;
      }
      if (useAuthStore.getState().currentUser?.id !== userId) return;
      setRecordedPurchaseId(id); setRecordedDestination(destination);
      consume(attempt.snapshot);
      if (useRealCartStore.getState().notice) throw new Error('El pedido está registrado, pero no se pudo actualizar el carrito guardado. Abre el pedido registrado antes de continuar.');
      sessionStorage.removeItem(checkoutJournalKey(userId));
      navigate(destination, { replace: true, state: { isNewOrder: true } });
    } catch (error) {
      if (useAuthStore.getState().currentUser?.id !== userId) return;
      setOrderError(error instanceof Error ? error.message : 'No pudimos confirmar la respuesta. Conservamos la solicitud para recuperarla.');
      if (error instanceof ApiError && [400, 404, 409, 422].includes(error.status) && error.code !== 'IDEMPOTENCY_CONFLICT') {
        try { sessionStorage.removeItem(checkoutJournalKey(userId)); setJournal({ owner: userId, value: null }); }
        catch { return; }
        setAcceptedAddressKey(''); setReviewedPaymentKey(''); setReviewQuote(null); setCurrentStep(1); baseQuote.reload();
      }
    } finally { submissionRef.current = false; setIsSubmitting(false); }
  }

  const cartCalculations = {
    groups: (quote?.stores || []).map(store => ({ merchant: { id: store.storeId, name: store.storeName }, subtotalCents: store.subtotalCents,
      deliveryFeeCents: store.deliveryFeeCents, totalCents: store.totalCents,
      items: store.items.map(line => ({ id: line.skuId, productId: selectedItems.find(item => item.skuId === line.skuId)?.productId || '',
        unitPriceCents: line.unitPriceCents, quantity: line.quantity, selectedVariantName: line.variantName, note: line.note, variantPriceDifferenceCents: 0 })) })),
    itemsSubtotalCents: quote?.subtotalCents ?? null, totalDeliveryFeeCents: quote?.deliveryFeeCents ?? null, grandTotalCents: quote?.totalCents ?? null,
  };
  const products = quote?.stores.flatMap(store => store.items.map(line => ({ id: selectedItems.find(item => item.skuId === line.skuId)?.productId, name: line.productName }))) || [];
  const paymentOptions = [
    { method: 'yape_plin' as const, label: 'Yape / Plin', description: 'El pago digital todavía no está habilitado.', icon: Smartphone, available: false },
    { method: 'efectivo' as const, label: 'Efectivo contra entrega', description: methods.error || (methods.loading ? 'Estamos comprobando la disponibilidad del pago.' : cashAvailable ? 'Indica con cuánto pagarás al recibir el pedido.' : cashMethod?.unavailableReason || 'El efectivo no está disponible para este pedido.'), icon: Banknote, available: !!cashAvailable },
    { method: 'tarjeta' as const, label: 'Tarjeta de débito o crédito', description: 'El pago con tarjeta todavía no está habilitado.', icon: CreditCard, available: false },
  ];
  return { ...auth, currentStep, userAddresses: addresses, zones, selectedAddressId, selectedAddress, selectedZone,
    showNewAddressDialog, setShowNewAddressDialog, addressNotice, setAddressNotice, paymentMethod, cashAmountGivenSoles, cashTouched, setCashTouched,
    isSubmitting, recordedPurchaseId, recordedDestination, checkoutLocked, stepHeadingRef, orderError, acceptedAddressKey, reviewedPaymentKey,
    items, selectedItems, products, cartCalculations, contextError, parsedCashCents, cashGivenCents, cashValidation,
    paymentReady, addressCompleted, paymentCompleted, chooseAddress, goToStep, continueToPayment, selectPaymentMethod, continueToReview, setCashAmount,
    handleSetExactCash: () => setCashAmount(String((quote?.totalCents || 0) / 100)),
    cashInputError: cashTouched && !cashValidation.isValid ? `Ingresa un monto válido que cubra ${quote ? formatCents(quote.totalCents) : 'el total cotizado'}.` : undefined,
    cashBills: multi ? [] : [2000, 5000, 10000, 20000].filter(amount => quote && amount > quote.totalCents), paymentOptions,
    handleConfirmOrder: () => void send(false), recover: () => void send(true), pending, invalidIntent, multi, quote,
    reviewBusy, addressesResource, baseQuote, methods,
    refreshAddresses: addressesResource.reload,
  };
}
