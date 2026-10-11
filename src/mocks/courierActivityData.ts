import { Courier, MerchantOrder, OrderStatus, Purchase } from '../domain/types';
import { INITIAL_ADDRESSES, INITIAL_COURIERS, INITIAL_PURCHASES } from './initialData';

const referenceTime = Date.now();
const stageLabels: Partial<Record<OrderStatus, string>> = {
  pendiente: 'Pedido recibido', confirmado: 'Confirmado por el comercio', en_preparacion: 'Pedido en preparación',
  listo_recoger: 'Listo para recojo', en_camino: 'Pedido recogido, en camino al cliente', entregado: 'Pedido entregado al cliente',
};

function activityPurchase(index: number, status: 'listo_recoger' | 'en_camino' | 'entregado', minutesAgo: number): Purchase {
  const template = INITIAL_PURCHASES[index % INITIAL_PURCHASES.length];
  const source = template.merchantOrders[index % template.merchantOrders.length];
  const id = `pur_courier_activity_${3000 + index}`;
  const code = `QK-${630100 + index}`;
  const courier = INITIAL_COURIERS[0];
  const updatedAt = new Date(referenceTime - minutesAgo * 60000).toISOString();
  const stages: OrderStatus[] = ['pendiente', 'confirmado', 'en_preparacion', 'listo_recoger', 'en_camino', 'entregado'];
  const endIndex = stages.indexOf(status);
  const createdAt = new Date(referenceTime - (minutesAgo + endIndex * 5) * 60000).toISOString();
  const cash = index % 2 === 1;
  const total = source.subtotalCents + source.deliveryFeeCents;
  const cashPaid = Math.ceil(total / 1000) * 1000;
  const address = INITIAL_ADDRESSES[index % INITIAL_ADDRESSES.length];
  const order: MerchantOrder = {
    ...source, id: `${id}_order`, purchaseId: id, status,
    courierId: status === 'listo_recoger' ? undefined : courier.id,
    courierName: status === 'listo_recoger' ? undefined : courier.name,
    courierPhone: status === 'listo_recoger' ? undefined : courier.phone,
    totalCents: total, paymentStatus: cash && status !== 'entregado' ? 'pendiente' : 'pagado',
    createdAt, updatedAt, items: source.items.map((item) => ({ ...item })),
    timeline: stages.slice(0, endIndex + 1).map((stage, step) => ({
      id: `${id}_event_${step}`, status: stage,
      timestamp: new Date(new Date(createdAt).getTime() + step * 5 * 60000).toISOString(),
      title: stageLabels[stage] || stage,
      description: stage === 'en_camino' ? `Entrega hacia ${address.street} ${address.number}` : stageLabels[stage] || stage,
      actor: step === 0 ? template.customerName : step < 4 ? source.merchantName : courier.name,
    })),
  };
  return {
    id, code, customerId: template.customerId, customerName: template.customerName, customerPhone: template.customerPhone,
    addressSnapshot: { ...address }, paymentMethod: cash ? 'efectivo' : 'yape_plin', paymentStatus: order.paymentStatus,
    subtotalCents: source.subtotalCents, totalDeliveryFeeCents: source.deliveryFeeCents, grandTotalCents: total,
    createdAt, status: status === 'entregado' ? 'completado' : 'en_proceso', merchantOrders: [order],
    ...(cash ? { cashAmountPaidCents: cashPaid, changeDueCents: cashPaid - total } : {}),
  };
}

export const COURIER_ACTIVITY_PURCHASES: Purchase[] = [
  activityPurchase(1, 'listo_recoger', 4),
  activityPurchase(2, 'listo_recoger', 9),
  activityPurchase(3, 'listo_recoger', 14),
  activityPurchase(4, 'en_camino', 3),
  activityPurchase(5, 'entregado', 75),
  activityPurchase(6, 'entregado', 160),
  activityPurchase(7, 'entregado', 1440),
  activityPurchase(8, 'entregado', 2880),
];

// Add examples once, preserving all existing records and any active delivery.
export function mergeCourierActivity(purchases: Purchase[], couriers: Courier[]) {
  const existingIds = new Set(purchases.map((purchase) => purchase.id));
  const activeCourierIds = new Set(purchases.flatMap((purchase) => purchase.merchantOrders)
    .filter((order) => order.courierId && ['listo_recoger', 'en_camino'].includes(order.status))
    .map((order) => order.courierId));
  const missing = COURIER_ACTIVITY_PURCHASES.filter((purchase) => !existingIds.has(purchase.id) &&
    !purchase.merchantOrders.some((order) => order.status === 'en_camino' && activeCourierIds.has(order.courierId)));
  const mergedPurchases = [...purchases, ...missing];
  const mergedCouriers = couriers.map((courier) => {
    const addedActive = missing.flatMap((purchase) => purchase.merchantOrders)
      .find((order) => order.courierId === courier.id && order.status === 'en_camino');
    return addedActive ? { ...courier, activeDeliveryId: addedActive.id } : courier;
  });
  return { purchases: mergedPurchases, couriers: mergedCouriers };
}
