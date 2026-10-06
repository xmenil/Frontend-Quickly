import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { calculateCart, validateCashPayment } from '../../domain/pricingRules';
import { generateOrderNumber } from '../../lib/utils';
import { formatCents, solesToCents } from '../../lib/currency';
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
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, clearCart } = useCartStore();
  const { merchants, products, addresses, zones, createPurchase } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

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
  const [simulateCardFailure, setSimulateCardFailure] = useState(false); // Demo scenario test!

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

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

  const handleConfirmOrder = () => {
    if (!selectedAddress) {
      setOrderError('Por favor selecciona una dirección de entrega válida.');
      setCurrentStep(1);
      return;
    }

    if (paymentMethod === 'efectivo' && !cashValidation.isValid) {
      setOrderError(cashValidation.errorMessage || 'El monto de efectivo no es suficiente.');
      setCurrentStep(2);
      return;
    }

    // Check simulated card failure scenario
    if (paymentMethod === 'tarjeta' && simulateCardFailure) {
      setOrderError(
        'Simulación de pago con tarjeta rechazada por el emisor (fondos insuficientes o tarjeta denegada). Puedes cambiar de método o desactivar la simulación de error.'
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

    // Assign purchaseId to suborders
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
    }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Return link */}
      <div>
        <Link
          to="/carrito"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al carrito</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">Finalizar Compra</h1>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 bg-gray-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            currentStep === 1
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-ink'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs">
            1
          </span>
          <span className="truncate">Dirección</span>
        </button>

        <button
          type="button"
          onClick={() => selectedAddress && setCurrentStep(2)}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            currentStep === 2
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-ink'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs">
            2
          </span>
          <span className="truncate">Pago</span>
        </button>

        <button
          type="button"
          onClick={() => selectedAddress && setCurrentStep(3)}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            currentStep === 3
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-ink'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs">
            3
          </span>
          <span className="truncate">Confirmar</span>
        </button>
      </div>

      {orderError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">No se pudo procesar el pedido</p>
            <p className="mt-0.5">{orderError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Interactive Steps Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: DIRECCIÓN */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">Dirección de Entrega</h2>
                  <p className="text-xs text-gray-500">
                    Selecciona dónde deseas recibir tus pedidos en Tingo María
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewAddressDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nueva Dirección
                </Button>
              </div>

              {/* Address Cards List */}
              <div className="space-y-3">
                {userAddresses.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <p className="text-xs text-gray-500 mb-3">No tienes direcciones registradas aún.</p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setShowNewAddressDialog(true)}
                    >
                      Agregar mi primera dirección
                    </Button>
                  </div>
                ) : (
                  userAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const zone = zones.find((z) => z.id === addr.zoneId);

                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                                isSelected ? 'border-primary' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-ink">{addr.label}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-700 font-medium mt-0.5">
                                {addr.street} #{addr.number}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">Ref: {addr.reference}</p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                Recibe: {addr.recipientName} • Tel: {addr.phone}
                              </p>
                            </div>
                          </div>

                          {zone && (
                            <span className="text-[11px] font-semibold text-ink bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-subtle">
                              {zone.name}
                            </span>
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
                  onClick={() => setCurrentStep(2)}
                >
                  Continuar al Método de Pago
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: MÉTODO DE PAGO */}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-lg font-bold text-ink">Método de Pago</h2>
                <p className="text-xs text-gray-500">
                  Elige cómo deseas abonar tu compra (1 solo método para toda la orden agrupadora)
                </p>
              </div>

              {/* Payment Options Radio Cards */}
              <div className="space-y-3">
                {/* Yape / Plin */}
                <div
                  onClick={() => setPaymentMethod('yape_plin')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'yape_plin'
                      ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === 'yape_plin' ? 'border-primary' : 'border-gray-300'
                        }`}
                      >
                        {paymentMethod === 'yape_plin' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-purple-600" />
                        <span className="font-extrabold text-sm text-ink">Yape / Plin</span>
                      </div>
                    </div>
                    <span className="text-xs text-purple-700 bg-purple-50 font-bold px-2.5 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </div>
                  {paymentMethod === 'yape_plin' && (
                    <div className="mt-3 pl-8 text-xs text-gray-600 space-y-1">
                      <p className="font-medium text-ink">
                        Número Quickly para simulación: <strong>962 100 200</strong>
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        En este prototipo frontend el pago se aprueba y confirma automáticamente.
                      </p>
                    </div>
                  )}
                </div>

                {/* Efectivo */}
                <div
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <div className="mt-3 pl-8 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-ink block mb-1">
                          ¿Con cuánto dinero pagarás en efectivo? (S/)
                        </label>
                        <Input
                          type="number"
                          step="0.5"
                          value={cashAmountGivenSoles}
                          onChange={(e) => setCashAmountGivenSoles(e.target.value)}
                          placeholder="Ej: 50 o 100"
                        />
                      </div>

                      {cashValidation.isValid ? (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center justify-between font-semibold">
                          <span>Vuelto que llevará el repartidor:</span>
                          <span className="font-bold text-sm">
                            {formatCents(cashValidation.changeDueCents)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 font-semibold">
                          ⚠️ {cashValidation.errorMessage} Total a pagar:{' '}
                          {formatCents(cartCalculations.grandTotalCents)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tarjeta Simulación */}
                <div
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'tarjeta'
                      ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                          Tarjeta de Débito / Crédito (Simulada)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">•••• 4242</span>
                  </div>

                  {paymentMethod === 'tarjeta' && (
                    <div className="mt-3 pl-8 space-y-2">
                      <p className="text-xs text-gray-500">
                        No se solicitan números reales de tarjeta. Puedes probar escenarios de prueba:
                      </p>
                      <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-50 p-2 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={simulateCardFailure}
                          onChange={(e) => setSimulateCardFailure(e.target.checked)}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <span>Simular rechazo de tarjeta (para probar manejo de error)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <Button type="button" variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                  Atrás
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={paymentMethod === 'efectivo' && !cashValidation.isValid}
                  onClick={() => setCurrentStep(3)}
                >
                  Revisar y Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVISIÓN Y CONFIRMACIÓN */}
          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div>
                <h2 className="text-lg font-bold text-ink">Revisión Final de tu Pedido</h2>
                <p className="text-xs text-gray-500">
                  Verifica que los datos de entrega y productos sean correctos antes de enviar
                </p>
              </div>

              {/* Delivery Details Snapshot */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-ink text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    Destino: {selectedAddress?.label} ({selectedZone?.name})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-primary hover:underline font-semibold"
                  >
                    Cambiar
                  </button>
                </div>
                <p className="text-gray-600">
                  {selectedAddress?.street} #{selectedAddress?.number} • Ref:{' '}
                  {selectedAddress?.reference}
                </p>
                <p className="text-gray-500">
                  Destinatario: {selectedAddress?.recipientName} • Tel: {selectedAddress?.phone}
                </p>
              </div>

              {/* Payment Details Snapshot */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
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
                      ? `Efectivo (Paga con S/ ${cashAmountGivenSoles}, vuelto ${formatCents(
                          cashValidation.changeDueCents
                        )})`
                      : paymentMethod === 'yape_plin'
                      ? 'Yape / Plin (Simulado)'
                      : 'Tarjeta de Crédito/Débito'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-primary hover:underline font-semibold"
                >
                  Cambiar
                </button>
              </div>

              {/* Stores involved breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Subpedidos independientes ({cartCalculations.groups.length})
                </p>
                {cartCalculations.groups.map((group) => (
                  <div
                    key={group.merchant.id}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-white space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-primary" />
                        {group.merchant.name}
                      </span>
                      <span className="text-primary">{formatCents(group.totalCents)}</span>
                    </div>

                    <div className="space-y-1 text-gray-600 pl-5">
                      {group.items.map((it) => {
                        const prod = products.find((p) => p.id === it.productId);
                        return (
                          <div key={it.id} className="flex justify-between">
                            <span>
                              {it.quantity}x {prod?.name}{' '}
                              {it.selectedVariantName ? `(${it.selectedVariantName})` : ''}
                            </span>
                            <span>
                              {formatCents(
                                (it.unitPriceCents + (it.variantPriceDifferenceCents || 0)) *
                                  it.quantity
                              )}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-50">
                        <span className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" /> Envío:
                        </span>
                        <span>{formatCents(group.deliveryFeeCents)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
                <Button type="button" variant="outline" size="md" onClick={() => setCurrentStep(2)}>
                  Atrás
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1 shadow-xl font-black text-base"
                  isLoading={isSubmitting}
                  onClick={handleConfirmOrder}
                >
                  Confirmar Pedido • {formatCents(cartCalculations.grandTotalCents)}
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
        </div>
      </div>

      {/* New Address Dialog */}
      <Dialog
        isOpen={showNewAddressDialog}
        onClose={() => setShowNewAddressDialog(false)}
        title="Nueva Dirección en Tingo María"
        description="Ingresa la referencia para que el repartidor ubique tu puerta"
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
