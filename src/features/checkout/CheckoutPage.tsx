import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { calculateCart, validateCashPayment } from '../../domain/pricingRules';
import { generateOrderNumber } from '../../lib/utils';
import { formatCents, solesToCents, centsToSoles } from '../../lib/currency';
import { PriceSummary } from '../../components/shared/PriceSummary';
import { AddressForm } from '../../components/shared/AddressForm';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PaymentMethod, Purchase, MerchantOrder, TrackingEvent } from '../../domain/types';
import {
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Plus,
  CheckCircle2,
  ChevronLeft,
  Store,
  Bike,
  Check,
  QrCode,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, clearCart } = useCartStore();
  const { merchants, products, addresses, zones, createPurchase } = useDataStore();
  const { currentUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Auth gatekeeper
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login', {
        state: {
          from: '/checkout',
          message: 'Inicia sesión para finalizar tu pedido de forma rápida y segura en Tingo María',
        },
        replace: true,
      });
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Steps: 1: Dirección -> 2: Pago -> 3: Revisión
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Selected address
  const userAddresses = addresses.filter((a) => a.userId === currentUser?.id);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    userAddresses.find((a) => a.isDefault)?.id || userAddresses[0]?.id || ''
  );
  const [showNewAddressDialog, setShowNewAddressDialog] = useState(false);

  // Step 2: Payment method & parameters
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape_plin');
  const [cashAmountGivenSoles, setCashAmountGivenSoles] = useState<string>('50');
  const [simulateCardFailure, setSimulateCardFailure] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const selectedZone = zones.find((z) => z.id === selectedAddress?.zoneId);

  const cartCalculations = calculateCart(items, merchants, selectedZone);

  if (items.length === 0) {
    navigate('/carrito');
    return null;
  }

  // Cash payment validation
  const cashGivenCents = solesToCents(parseFloat(cashAmountGivenSoles) || 0);
  const cashValidation = validateCashPayment(cashGivenCents, cartCalculations.grandTotalCents);

  // Quick cash buttons helper
  const grandTotalSoles = centsToSoles(cartCalculations.grandTotalCents);
  const handleSetExactCash = () => {
    setCashAmountGivenSoles(grandTotalSoles.toFixed(2));
  };

  const handleConfirmOrder = () => {
    if (!selectedAddress) {
      setOrderError('Por favor selecciona una dirección de entrega válida en Tingo María.');
      setCurrentStep(1);
      return;
    }

    if (paymentMethod === 'efectivo' && !cashValidation.isValid) {
      setOrderError(cashValidation.errorMessage || 'El monto de efectivo no es suficiente.');
      setCurrentStep(2);
      return;
    }

    // Check simulated card failure
    if (paymentMethod === 'tarjeta' && simulateCardFailure) {
      setOrderError(
        'Simulación de pago con tarjeta rechazada por el emisor (fondos insuficientes o denegada). Puedes cambiar de método o desactivar la opción de prueba.'
      );
      return;
    }

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
        paymentStatus: paymentMethod === 'efectivo' ? 'pendiente' : 'pagado',
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
      paymentStatus: paymentMethod === 'efectivo' ? 'pendiente' : 'pagado',
      subtotalCents: cartCalculations.itemsSubtotalCents,
      totalDeliveryFeeCents: cartCalculations.totalDeliveryFeeCents,
      grandTotalCents: cartCalculations.grandTotalCents,
      merchantOrders,
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      cashAmountPaidCents: paymentMethod === 'efectivo' ? cashGivenCents : undefined,
      changeDueCents: paymentMethod === 'efectivo' ? cashValidation.changeDueCents : undefined,
      cardLastFour: paymentMethod === 'tarjeta' ? '4242' : undefined,
    };

    setTimeout(() => {
      const result = createPurchase(newPurchase);
      setIsSubmitting(false);

      if (result.success) {
        clearCart();
        navigate(`/cliente/pedidos/${purchaseId}`, {
          state: { isNewOrder: true },
        });
      } else {
        setOrderError(result.message || 'Error al procesar el pedido.');
      }
    }, 450);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Return link */}
      <div>
        <Link
          to="/carrito"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al carrito de compras</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Finalizar Compra</h1>
          <span className="text-xs font-semibold text-gray-500">
            Entrega express en Tingo María
          </span>
        </div>
      </div>

      {/* Stepper with visual indicators */}
      <div className="bg-white rounded-3xl border border-gray-100 p-2 sm:p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              currentStep === 1
                ? 'bg-primary text-white shadow-md'
                : selectedAddress
                ? 'bg-primary-soft/60 text-primary hover:bg-primary-soft'
                : 'text-gray-500 hover:text-ink hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 1
                  ? 'bg-white text-primary'
                  : selectedAddress
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {selectedAddress && currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <span className="truncate">Dirección</span>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            disabled={!selectedAddress}
            onClick={() => selectedAddress && setCurrentStep(2)}
            className={`min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 2
                ? 'bg-primary text-white shadow-md'
                : currentStep === 3
                ? 'bg-primary-soft/60 text-primary hover:bg-primary-soft'
                : 'text-gray-500 hover:text-ink hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 2
                  ? 'bg-white text-primary'
                  : currentStep === 3
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {currentStep === 3 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </span>
            <span className="truncate">Pago</span>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            disabled={!selectedAddress}
            onClick={() => selectedAddress && setCurrentStep(3)}
            className={`min-h-[44px] py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 3
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-500 hover:text-ink hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 3
                  ? 'bg-white text-primary'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              3
            </span>
            <span className="truncate">Confirmar</span>
          </button>
        </div>
      </div>

      {orderError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-bold">No se pudo procesar el pedido</p>
            <p className="mt-0.5 text-red-600">{orderError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (Interactive Steps) */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: DIRECCIÓN */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Dirección de Entrega</span>
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Elige dónde deseas recibir tu pedido en Tingo María
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] font-bold"
                  onClick={() => setShowNewAddressDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nueva Dirección
                </Button>
              </div>

              {/* Address Cards List */}
              <div className="space-y-3">
                {userAddresses.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-3xl space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm">No tienes direcciones guardadas</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Registra tu primera dirección para calcular la tarifa exacta de reparto.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="min-h-[44px] font-bold"
                      onClick={() => setShowNewAddressDialog(true)}
                    >
                      Agregar mi dirección
                    </Button>
                  </div>
                ) : (
                  userAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const zone = zones.find((z) => z.id === addr.zoneId);

                    return (
                      <div
                        key={addr.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedAddressId(addr.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') setSelectedAddressId(addr.id);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 transition-colors ${
                                isSelected ? 'border-primary' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-ink">{addr.label}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-800 font-medium mt-1">
                                {addr.street} #{addr.number}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                Ref: {addr.reference}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Recibe: <strong className="text-gray-700">{addr.recipientName}</strong> • Cel: {addr.phone}
                              </p>
                            </div>
                          </div>

                          {zone && (
                            <div className="text-right flex-shrink-0">
                              <span className="inline-block text-xs font-bold text-ink bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200 shadow-sm">
                                {zone.name}
                              </span>
                              <span className="block text-[11px] font-bold text-primary mt-1 tabular-nums">
                                Tarifa: {formatCents(zone.baseFeeCents)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={!selectedAddress}
                  className="min-h-[46px] px-6 font-bold shadow-md"
                  onClick={() => setCurrentStep(2)}
                >
                  Continuar al Método de Pago
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: MÉTODO DE PAGO */}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Método de Pago</h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Elige cómo deseas abonar tu compra (aplica a todos los comercios del pedido)
                </p>
              </div>

              {/* Payment Options Radio Cards */}
              <div className="space-y-4">
                {/* 1. Yape / Plin */}
                <div
                  role="radio"
                  aria-checked={paymentMethod === 'yape_plin'}
                  tabIndex={0}
                  onClick={() => setPaymentMethod('yape_plin')}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setPaymentMethod('yape_plin');
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'yape_plin'
                      ? 'border-primary bg-primary-soft/30 ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'yape_plin' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {paymentMethod === 'yape_plin' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {/* Custom Brand Badges */}
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-[#742284] text-white font-black text-xs">
                            Yape
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-[#00B4D8] text-white font-black text-xs">
                            Plin
                          </span>
                        </div>
                        <span className="font-extrabold text-sm text-ink">
                          Billeteras Digitales
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full border border-primary/20">
                      Más rápido en Tingo María
                    </span>
                  </div>

                  {paymentMethod === 'yape_plin' && (
                    <div className="mt-4 pl-8 pt-3 border-t border-gray-100">
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                        {/* Realistic Mock QR for Tingo María */}
                        <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-2 text-center flex-shrink-0">
                          <QrCode className="w-10 h-10 text-gray-700 mb-1" />
                          <span className="text-[9px] font-bold text-gray-600 uppercase">
                            Escanea QR
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-700 flex-1">
                          <p className="font-bold text-ink text-sm">
                            Quickly Delivery E.I.R.L.
                          </p>
                          <p className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <Smartphone className="w-4 h-4 text-primary" />
                            <span>Número oficial:</span>
                            <span className="text-sm font-black text-ink bg-gray-100 px-2 py-0.5 rounded-md tabular-nums">
                              962 100 200
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-500">
                            En este prototipo interactivo, tu pago por billetera digital se confirma automáticamente al finalizar.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Efectivo Contra Entrega */}
                <div
                  role="radio"
                  aria-checked={paymentMethod === 'efectivo'}
                  tabIndex={0}
                  onClick={() => setPaymentMethod('efectivo')}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setPaymentMethod('efectivo');
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'border-primary bg-primary-soft/30 ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'efectivo' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {paymentMethod === 'efectivo' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-emerald-600" />
                        <span className="font-extrabold text-sm text-ink">
                          Pago Contra Entrega en Efectivo
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      Pagas al recibir
                    </span>
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <div className="mt-4 pl-8 pt-3 border-t border-gray-100 space-y-3.5">
                      <div>
                        <label className="text-xs font-bold text-ink block mb-2">
                          ¿Con cuánto dinero pagarás al repartidor?
                        </label>

                        {/* Quick Soles Bills Shortcuts */}
                        <div className="flex flex-wrap gap-2 mb-2.5">
                          <button
                            type="button"
                            onClick={handleSetExactCash}
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                              cashAmountGivenSoles === grandTotalSoles.toFixed(2)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            Monto exacto ({formatCents(cartCalculations.grandTotalCents)})
                          </button>
                          {grandTotalSoles <= 20 && (
                            <button
                              type="button"
                              onClick={() => setCashAmountGivenSoles('20')}
                              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                                cashAmountGivenSoles === '20'
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              S/ 20
                            </button>
                          )}
                          {grandTotalSoles <= 50 && (
                            <button
                              type="button"
                              onClick={() => setCashAmountGivenSoles('50')}
                              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                                cashAmountGivenSoles === '50'
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              S/ 50
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setCashAmountGivenSoles('100')}
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                              cashAmountGivenSoles === '100'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            S/ 100
                          </button>
                        </div>

                        <div className="max-w-xs">
                          <Input
                            type="number"
                            step="0.5"
                            inputMode="decimal"
                            value={cashAmountGivenSoles}
                            onChange={(e) => setCashAmountGivenSoles(e.target.value)}
                            placeholder="Monto en Soles"
                            helperText="Ingresa el billete con el que pagarás para preparar tu cambio."
                          />
                        </div>
                      </div>

                      {cashValidation.isValid ? (
                        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>Vuelto que llevará el repartidor:</span>
                          </span>
                          <span className="font-black text-sm text-emerald-800 tabular-nums">
                            {formatCents(cashValidation.changeDueCents)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>
                            {cashValidation.errorMessage}. Total a pagar:{' '}
                            <strong className="tabular-nums">
                              {formatCents(cartCalculations.grandTotalCents)}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Tarjeta de Débito / Crédito (Simulada) */}
                <div
                  role="radio"
                  aria-checked={paymentMethod === 'tarjeta'}
                  tabIndex={0}
                  onClick={() => setPaymentMethod('tarjeta')}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setPaymentMethod('tarjeta');
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'tarjeta'
                      ? 'border-primary bg-primary-soft/30 ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'tarjeta' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {paymentMethod === 'tarjeta' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span className="font-extrabold text-sm text-ink">
                          Tarjeta de Débito / Crédito
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold tabular-nums">
                      Visa •••• 4242
                    </span>
                  </div>

                  {paymentMethod === 'tarjeta' && (
                    <div className="mt-4 pl-8 pt-3 border-t border-gray-100 space-y-3">
                      <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl text-xs text-blue-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>Pasarela protegida SSL 256-bit (Tarjeta de prueba precargada)</span>
                        </div>
                      </div>

                      {/* Expandable test evaluation scenario without clutter */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDevOptions(!showDevOptions);
                          }}
                          className="text-[11px] font-bold text-gray-500 hover:text-ink flex items-center gap-1"
                        >
                          <span>Opciones de prueba</span>
                          {showDevOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {showDevOptions && (
                          <label className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-900 bg-amber-50 p-2.5 rounded-xl cursor-pointer border border-amber-200">
                            <input
                              type="checkbox"
                              checked={simulateCardFailure}
                              onChange={(e) => setSimulateCardFailure(e.target.checked)}
                              className="w-4 h-4 text-primary rounded"
                            />
                            <span>Simular rechazo de banco emisor (para validar manejo de error)</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="min-h-[46px] font-semibold"
                  onClick={() => setCurrentStep(1)}
                >
                  Volver a Dirección
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={paymentMethod === 'efectivo' && !cashValidation.isValid}
                  className="min-h-[46px] px-6 font-bold shadow-md"
                  onClick={() => setCurrentStep(3)}
                >
                  Revisar y Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVISIÓN Y CONFIRMACIÓN */}
          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Revisión Final de tu Pedido</h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Verifica que los datos de entrega y productos sean correctos antes de enviar a cocina
                </p>
              </div>

              {/* Delivery Details Snapshot */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-ink text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    Destino: {selectedAddress?.label} ({selectedZone?.name})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-primary hover:underline font-bold text-xs"
                  >
                    Cambiar
                  </button>
                </div>
                <p className="text-gray-700 font-medium">
                  {selectedAddress?.street} #{selectedAddress?.number} • Ref: {selectedAddress?.reference}
                </p>
                <p className="text-gray-600">
                  Recibe: <strong>{selectedAddress?.recipientName}</strong> • Tel: {selectedAddress?.phone}
                </p>
              </div>

              {/* Payment Details Snapshot */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-ink">
                  {paymentMethod === 'efectivo' ? (
                    <Banknote className="w-4 h-4 text-emerald-600" />
                  ) : paymentMethod === 'yape_plin' ? (
                    <Smartphone className="w-4 h-4 text-purple-600" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  )}
                  <span>
                    Método:{' '}
                    {paymentMethod === 'efectivo'
                      ? `Efectivo contra entrega (Pagas con S/ ${cashAmountGivenSoles}, vuelto ${formatCents(
                          cashValidation.changeDueCents
                        )})`
                      : paymentMethod === 'yape_plin'
                      ? 'Yape / Plin (Confirmación automática)'
                      : 'Tarjeta de Crédito / Débito'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-primary hover:underline font-bold text-xs"
                >
                  Cambiar
                </button>
              </div>

              {/* Stores involved breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Subpedidos por comercio ({cartCalculations.groups.length})
                  </p>
                  <span className="text-[11px] text-gray-500">
                    Despacho independiente desde cada local
                  </span>
                </div>

                {cartCalculations.groups.map((group) => (
                  <div
                    key={group.merchant.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-extrabold text-ink text-sm">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-primary" />
                        {group.merchant.name}
                      </span>
                      <span className="text-primary font-black tabular-nums">
                        {formatCents(group.totalCents)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-gray-700 pl-5">
                      {group.items.map((it) => {
                        const prod = products.find((p) => p.id === it.productId);
                        return (
                          <div key={it.id} className="flex justify-between items-center">
                            <span>
                              <strong>{it.quantity}x</strong> {prod?.name}{' '}
                              {it.selectedVariantName ? `(${it.selectedVariantName})` : ''}
                            </span>
                            <span className="tabular-nums font-semibold">
                              {formatCents(
                                (it.unitPriceCents + (it.variantPriceDifferenceCents || 0)) *
                                  it.quantity
                              )}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5 text-primary" /> Delivery asignado:
                        </span>
                        <span className="tabular-nums font-semibold">
                          {formatCents(group.deliveryFeeCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="min-h-[48px] font-semibold"
                  onClick={() => setCurrentStep(2)}
                >
                  Volver a Pago
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1 min-h-[50px] shadow-xl font-black text-base"
                  isLoading={isSubmitting}
                  onClick={handleConfirmOrder}
                >
                  <span>Confirmar Pedido</span>
                  <span className="mx-1">•</span>
                  <span className="tabular-nums">{formatCents(cartCalculations.grandTotalCents)}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Column */}
        <div className="space-y-4 sticky top-24">
          <PriceSummary
            groups={cartCalculations.groups}
            itemsSubtotalCents={cartCalculations.itemsSubtotalCents}
            totalDeliveryFeeCents={cartCalculations.totalDeliveryFeeCents}
            grandTotalCents={cartCalculations.grandTotalCents}
          />

          <div className="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p>
              ¡Recibirás actualizaciones en tiempo real y el contacto directo con tu repartidor tingalés!
            </p>
          </div>
        </div>
      </div>

      {/* New Address Dialog */}
      <Dialog
        isOpen={showNewAddressDialog}
        onClose={() => setShowNewAddressDialog(false)}
        title="Nueva Dirección en Tingo María"
        description="Ingresa tu dirección y referencia para que el repartidor ubique tu puerta rápidamente"
        maxWidth="md"
      >
        <AddressForm
          userId={currentUser?.id || 'u_cliente_demo'}
          onSuccess={() => setShowNewAddressDialog(false)}
          onCancel={() => setShowNewAddressDialog(false)}
        />
      </Dialog>
    </div>
  );
};
