import { describe, it, expect } from 'vitest';
import {
  canTransitionOrder,
  canCustomerCancelOrder,
  derivePurchaseStatus,
  calculateOrderRefund,
} from '../domain/orderRules';
import { MerchantOrder } from '../domain/types';

describe('Order State Transitions & Business Rules', () => {
  it('allows legal forward transitions', () => {
    expect(canTransitionOrder('pendiente', 'confirmado')).toBe(true);
    expect(canTransitionOrder('confirmado', 'en_preparacion')).toBe(true);
    expect(canTransitionOrder('en_preparacion', 'listo_recoger')).toBe(true);
    expect(canTransitionOrder('listo_recoger', 'en_camino')).toBe(true);
    expect(canTransitionOrder('en_camino', 'entregado')).toBe(true);
  });

  it('rejects illegal status jumps', () => {
    expect(canTransitionOrder('pendiente', 'entregado')).toBe(false);
    expect(canTransitionOrder('pendiente', 'en_camino')).toBe(false);
    expect(canTransitionOrder('en_preparacion', 'confirmado')).toBe(false);
    expect(canTransitionOrder('entregado', 'pendiente')).toBe(false);
    expect(canTransitionOrder('cancelado', 'en_preparacion')).toBe(false);
  });

  it('enforces cancellation rules for customer', () => {
    // Only allowed while pendiente or confirmado (before prep)
    expect(canCustomerCancelOrder('pendiente')).toBe(true);
    expect(canCustomerCancelOrder('confirmado')).toBe(true);
    expect(canCustomerCancelOrder('en_preparacion')).toBe(false);
    expect(canCustomerCancelOrder('listo_recoger')).toBe(false);
    expect(canCustomerCancelOrder('en_camino')).toBe(false);
    expect(canCustomerCancelOrder('entregado')).toBe(false);
  });

  it('derives parent purchase status correctly from suborders', () => {
    const dummyOrder = (status: any): MerchantOrder => ({
      id: 'mo',
      purchaseId: 'p',
      merchantId: 'm',
      merchantName: 'Store',
      merchantPhone: '',
      merchantAddress: '',
      status,
      items: [],
      subtotalCents: 1000,
      deliveryFeeCents: 500,
      totalCents: 1500,
      createdAt: '',
      updatedAt: '',
      timeline: [],
      paymentStatus: 'pagado',
    });

    // All delivered -> completado
    expect(derivePurchaseStatus([dummyOrder('entregado'), dummyOrder('entregado')])).toBe('completado');

    // All cancelled -> cancelado
    expect(derivePurchaseStatus([dummyOrder('cancelado'), dummyOrder('rechazado')])).toBe('cancelado');

    // Partial delivery
    expect(derivePurchaseStatus([dummyOrder('entregado'), dummyOrder('en_camino')])).toBe('entrega_parcial');

    // Completed with cancellations
    expect(derivePurchaseStatus([dummyOrder('entregado'), dummyOrder('cancelado')])).toBe(
      'finalizado_con_cancelaciones'
    );
  });

  it('calculates refund for prepaid orders and handles cash orders', () => {
    const mockOrder: MerchantOrder = {
      id: 'mo_1',
      purchaseId: 'p1',
      merchantId: 'm1',
      merchantName: 'Store',
      merchantPhone: '',
      merchantAddress: '',
      status: 'cancelado',
      items: [],
      subtotalCents: 3000,
      deliveryFeeCents: 500,
      totalCents: 3500,
      createdAt: '',
      updatedAt: '',
      timeline: [],
      paymentStatus: 'pagado',
    };

    // Yape / Card -> refunds total (products + delivery)
    const prepaidRefund = calculateOrderRefund(mockOrder, 'yape_plin');
    expect(prepaidRefund.refundCents).toBe(3500);
    expect(prepaidRefund.paymentStatus).toBe('reembolsado');

    // Cash -> 0 refund since customer had not paid yet
    const cashRefund = calculateOrderRefund(mockOrder, 'efectivo');
    expect(cashRefund.refundCents).toBe(0);
    expect(cashRefund.paymentStatus).toBe('pendiente');
  });
});
