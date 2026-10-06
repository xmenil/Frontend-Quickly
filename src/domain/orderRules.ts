import { OrderStatus, ParentPurchaseStatus, PaymentMethod, PaymentStatus, MerchantOrder } from './types';

/**
 * Valid state transitions for a suborder
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ['confirmado', 'rechazado', 'cancelado'],
  confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo_recoger'],
  listo_recoger: ['en_camino'],
  en_camino: ['entregado'],
  entregado: [],
  cancelado: [],
  rechazado: [],
};

export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

/**
 * Customer is only allowed to cancel an order if it is in 'pendiente' or 'confirmado' state
 * (before merchant starts preparation).
 */
export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return status === 'pendiente' || status === 'confirmado';
}

/**
 * Derives parent Purchase status based on the statuses of all its suborders
 */
export function derivePurchaseStatus(suborders: MerchantOrder[]): ParentPurchaseStatus {
  if (!suborders || suborders.length === 0) return 'pendiente';

  const statuses = suborders.map(o => o.status);
  const allDelivered = statuses.every(s => s === 'entregado');
  const allTerminalCancelled = statuses.every(s => s === 'cancelado' || s === 'rechazado');
  const anyDelivered = statuses.some(s => s === 'entregado');
  const anyCancelled = statuses.some(s => s === 'cancelado' || s === 'rechazado');
  const allPending = statuses.every(s => s === 'pendiente');

  if (allDelivered) return 'completado';
  if (allTerminalCancelled) return 'cancelado';
  if (anyDelivered && anyCancelled) {
    const hasActive = statuses.some(s => !['entregado', 'cancelado', 'rechazado'].includes(s));
    return hasActive ? 'entrega_parcial' : 'finalizado_con_cancelaciones';
  }
  if (anyDelivered) return 'entrega_parcial';
  if (allPending) return 'pendiente';

  return 'en_proceso';
}

/**
 * Determines whether a refund is required when an order is cancelled or rejected
 */
export function calculateOrderRefund(
  order: MerchantOrder,
  paymentMethod: PaymentMethod
): { refundCents: number; paymentStatus: PaymentStatus } {
  // If payment method is cash (efectivo), money hasn't been collected yet if not delivered
  if (paymentMethod === 'efectivo') {
    return {
      refundCents: 0,
      paymentStatus: 'pendiente',
    };
  }

  // Pre-paid methods (Yape/Plin, Tarjeta): refund both products and delivery fee
  return {
    refundCents: order.totalCents,
    paymentStatus: 'reembolsado',
  };
}

/**
 * Human-readable order status labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente de aceptación',
  confirmado: 'Confirmado por la tienda',
  en_preparacion: 'En preparación',
  listo_recoger: 'Listo para recojo',
  en_camino: 'En camino con repartidor',
  entregado: 'Entregado con éxito',
  cancelado: 'Cancelado por el cliente',
  rechazado: 'Rechazado por el comercio',
};

export const PURCHASE_STATUS_LABELS: Record<ParentPurchaseStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  entrega_parcial: 'Entrega parcial en curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
  finalizado_con_cancelaciones: 'Finalizado con cancelaciones',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  fallido: 'Pago fallido',
  reembolso_pendiente: 'Reembolso en proceso',
  reembolsado: 'Reembolsado',
};
