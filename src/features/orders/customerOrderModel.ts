import { useEffect } from 'react';
import { ORDER_STATUS_LABELS } from '../../domain/orderRules';
import type { OrderStatus, ParentPurchaseStatus, PaymentStatus, Purchase } from '../../domain/types';
import { orderingApi, type Order, type OrderSummary, type GroupCheckout } from '../../services/api/orderingApi';
import { useAuthStore } from '../../store/authStore';
import { useRemote } from '../operations/shared';

export const customerOrderStatus: Record<string, OrderStatus> = { pending: 'pendiente', confirmed: 'confirmado', preparing: 'en_preparacion', ready: 'listo_recoger', in_transit: 'en_camino', delivered: 'entregado', cancelled: 'cancelado', rejected: 'rechazado' };
export function purchaseStatus(statuses: string[]): ParentPurchaseStatus {
  if (statuses.every(status => status === 'delivered')) return 'completado';
  if (statuses.every(status => ['cancelled', 'rejected'].includes(status))) return 'cancelado';
  if (statuses.every(status => ['delivered', 'cancelled', 'rejected'].includes(status))) return 'finalizado_con_cancelaciones';
  if (statuses.some(status => status === 'delivered')) return 'entrega_parcial';
  return statuses.every(status => status === 'pending') ? 'pendiente' : 'en_proceso';
}
function paymentStatus(statuses: string[]): PaymentStatus {
  if (statuses.every(status => status === 'cancelled')) return 'cancelado';
  if (statuses.every(status => ['succeeded', 'cancelled'].includes(status))) return 'pagado';
  return statuses.some(status => status === 'failed') ? 'fallido' : 'pendiente';
}
export type CustomerPurchase = Purchase & { isGroup: boolean; detailPath: string; sources: Order[] };

export function customerPurchase(orders: (Order | OrderSummary)[], owner: string, group?: GroupCheckout): CustomerPurchase {
  const first = orders[0];
  const details = orders.filter((order): order is Order => 'items' in order);
  const destination = details[0]?.destination;
  const isGroup = !!group || !!first.checkoutGroupId;
  const id = group?.id || first.checkoutGroupId || first.id;
  const sum = (field: 'subtotalCents' | 'deliveryFeeCents' | 'totalCents') => orders.reduce((total, order) => total + order[field], 0);
  return {
    id, isGroup, detailPath: isGroup ? `/cliente/compras/${id}` : `/cliente/pedidos/${id}`, sources: details,
    code: isGroup ? `${orders.length} pedidos · ${first.code}` : first.code,
    customerId: owner, customerName: destination?.recipientName || '', customerPhone: destination?.phone || '',
    createdAt: group?.createdAt || first.createdAt, status: purchaseStatus(orders.map(order => order.status)),
    paymentMethod: 'efectivo', paymentStatus: paymentStatus(orders.map(order => order.paymentStatus)),
    subtotalCents: group?.subtotalCents ?? sum('subtotalCents'), totalDeliveryFeeCents: group?.deliveryFeeCents ?? sum('deliveryFeeCents'),
    grandTotalCents: group?.totalCents ?? sum('totalCents'),
    cashAmountPaidCents: !isGroup ? first.cashTenderCents ?? undefined : undefined,
    changeDueCents: !isGroup && first.cashTenderCents != null ? first.cashTenderCents - first.totalCents : undefined,
    addressSnapshot: { id: '', userId: owner, zoneId: '', label: '', recipientName: destination?.recipientName || '',
      phone: destination?.phone || '', street: destination?.street || '', number: destination?.streetNumber || '', reference: destination?.reference || '', isDefault: false },
    merchantOrders: orders.map(order => {
      const detail = 'items' in order ? order : undefined;
      const status = customerOrderStatus[order.status];
      return { id: order.id, purchaseId: order.purchaseId, merchantId: order.storeId, merchantName: order.storeName,
        merchantAddress: '', merchantPhone: '', status, createdAt: order.createdAt, updatedAt: detail?.events.at(-1)?.occurredAt || order.createdAt,
        subtotalCents: order.subtotalCents, deliveryFeeCents: order.deliveryFeeCents, totalCents: order.totalCents,
        paymentStatus: paymentStatus([order.paymentStatus]),
        items: (detail?.items || []).map(line => ({ productId: '', productName: line.productName, productImage: '',
          variantName: line.variantName, quantity: line.quantity, unitPriceCents: line.unitPriceCents, subtotalCents: line.quantity * line.unitPriceCents, note: line.note })),
        rejectionReason: order.status === 'rejected' ? detail?.events.at(-1)?.reason : undefined,
        cancellationReason: order.status === 'cancelled' ? detail?.events.at(-1)?.reason : undefined,
        timeline: (detail?.events || []).map((event, index) => ({ id: `${order.id}:${index}`, timestamp: event.occurredAt,
          status: customerOrderStatus[event.status] || status, title: ORDER_STATUS_LABELS[customerOrderStatus[event.status]] || 'Actualización del pedido', description: event.reason, actor: '' })),
      };
    }),
  };
}

export function useCustomerPurchase(id: string, group = false) {
  const owner = useAuthStore(state => state.currentUser?.id || '');
  const resource = useRemote(`customer-purchase:${id}:${group}:${owner}`, async signal => {
    if (!owner) return null;
    const initial = group ? null : await orderingApi.detail(id, signal);
    const groupId = group ? id : initial?.checkoutGroupId;
    if (groupId) {
      const summary = await orderingApi.groupDetail(groupId, signal);
      const orders = await Promise.all(summary.orders.map(order => initial?.id === order.orderId ? initial : orderingApi.detail(order.orderId, signal)));
      return customerPurchase(orders, owner, summary);
    }
    return customerPurchase([initial!], owner);
  });
  useEffect(() => { if (!owner) return; const timer = setInterval(resource.reload, 15000); return () => clearInterval(timer); }, [owner, resource.reload]);
  return resource;
}

export function useCustomerOrders() {
  const owner = useAuthStore(state => state.currentUser?.id || '');
  return useRemote(`customer-purchases:${owner}`, async signal => {
    if (!owner) return [];
    const orders: OrderSummary[] = []; const cursors = new Set<string>(); let cursor: string | undefined;
    do {
      const page = await orderingApi.list('/me/orders', { cursor, limit: '50' }, signal);
      orders.push(...page.items); cursor = page.nextCursor || undefined;
      if (cursor && cursors.has(cursor)) throw new Error('No se pudieron cargar todos tus pedidos.');
      if (cursor) cursors.add(cursor);
    } while (cursor);
    const groups = new Map<string, OrderSummary[]>();
    orders.forEach(order => { const key = order.checkoutGroupId || order.id; groups.set(key, [...(groups.get(key) || []), order]); });
    return [...groups.values()].map(entries => customerPurchase(entries, owner)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}
