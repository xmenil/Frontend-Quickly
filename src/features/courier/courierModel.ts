import { useEffect, useRef, useState } from 'react';
import { orderingApi, type Order, type OrderSummary } from '../../services/api/orderingApi';
import { catalogApi } from '../../services/api/catalogApi';
import { ApiError } from '../../services/api/apiClient';
import { operationsApi } from '../../services/api/operationsApi';
import { useAuthStore } from '../../store/authStore';
import { allPages } from '../customer/customerAccountModel';
import { useRemote } from '../operations/shared';

export type Scope = 'available' | 'active' | 'history';
export function courierOrder(source: OrderSummary, detail?: Order) {
 const destination = detail?.destination;
 return { source, id: source.id, purchaseCode: source.code, merchantName: source.storeName,
  merchantAddress: 'Dirección del comercio no disponible en esta consulta', merchantPhone: '',
  customerName: destination?.recipientName || 'Destinatario no disponible', customerPhone: destination?.phone || '',
  addressSnapshot: { street: destination?.street || 'Destino no disponible en esta consulta', number: destination?.streetNumber || '', reference: destination ? destination.reference : 'No disponible en esta consulta' },
  customerAddress: { street: destination?.street || 'Destino no disponible en esta consulta', number: destination?.streetNumber || '', reference: destination ? destination.reference : 'No disponible en esta consulta' },
  incidents: detail?.incidents || [], items: detail?.items || [], deliveryFeeCents: source.assignment && source.assignment.status !== 'cancelled' ? source.assignment.agreedFeeCents : source.deliveryFeeCents,
  totalCents: source.totalCents, paymentMethod: source.cashTenderCents !== null ? 'efectivo' : 'No informado', paymentStatus: source.paymentStatus,
  changeDue: source.cashTenderCents === null ? null : Math.max(0, source.cashTenderCents - source.totalCents),
  status: source.status, updatedAt: detail?.events[detail.events.length - 1]?.occurredAt || source.createdAt,
 };
}
export async function loadCourierOrders(scope: Scope, signal?: AbortSignal) {
 const rows = await allPages(cursor => orderingApi.list('/courier/orders', { scope, cursor, limit: '50' }, signal));
 // Available orders and released assignments do not grant access to private detail.
 const output: ReturnType<typeof courierOrder>[] = [];
 const stores = new Map<string, { address_text?: string; phone?: string }>();
 for (const row of rows) {
  const accessible = scope !== 'available' && row.assignment && ['accepted', 'picked_up', 'delivered'].includes(row.assignment.status);
  const detail = accessible ? await orderingApi.detail(row.id, signal) : undefined;
  if (detail && (detail.id !== row.id || detail.assignment?.id !== row.assignment?.id)) throw new Error('La asignación cambió durante la consulta. Actualiza la sección.');
  const view = courierOrder(detail || row, detail);
  if (scope !== 'history') {
   if (!stores.has(row.storeId)) {
    try { stores.set(row.storeId, await catalogApi.store(row.storeId, signal)); }
    catch (error) { if (error instanceof ApiError && error.status === 404) stores.set(row.storeId, {}); else throw error; }
   }
   const store = stores.get(row.storeId)!;
   view.merchantAddress = store.address_text || 'Dirección del comercio no disponible en esta consulta';
   view.merchantPhone = store.phone || '';
  }
  output.push(view);
 }
 return output.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export const courierChanged = () => window.dispatchEvent(new Event('quickly:courier-changed'));
export function useCourierOrders(scope: Scope) {
 const resource = useRemote('courier-orders:' + scope, signal => loadCourierOrders(scope, signal));
 useEffect(() => {
  const refresh = () => { if (!resource.loading && !document.hidden) resource.reload(); };
  const timer = setInterval(() => { if (!resource.error) refresh(); }, 20000);
  window.addEventListener('quickly:courier-changed', refresh);
  window.addEventListener('online', refresh);
  return () => { clearInterval(timer); window.removeEventListener('quickly:courier-changed', refresh); window.removeEventListener('online', refresh); };
 }, [resource.loading, resource.error, resource.reload]);
 return resource;
}
export function useCourierProfile() {
 const resource = useRemote('courier-profile', signal => operationsApi.courier(signal));
 useEffect(() => { window.addEventListener('quickly:courier-changed', resource.reload); return () => window.removeEventListener('quickly:courier-changed', resource.reload); }, [resource.reload]);
 return resource;
}
export async function claimCourierOrder(order: OrderSummary, userId: string) {
 await orderingApi.action(`/courier/orders/${order.id}/claim`, { expectedVersion: order.version });
 const saved = await orderingApi.detail(order.id);
 if (saved.assignment?.courierUserId !== userId || saved.assignment.status !== 'accepted') throw new Error('No se pudo verificar la asignación. Consulta la entrega activa antes de reintentar.');
}
export async function courierAssignmentAction(order: OrderSummary, userId: string, action: 'pickup' | 'deliver' | 'release' | 'incidents', extra: { reason?: string; cashReceivedCents?: number } = {}) {
 const assignment = order.assignment;
 if (!assignment || assignment.courierUserId !== userId) throw new Error('Actualiza la asignación antes de continuar.');
 await orderingApi.action(`/courier/assignments/${assignment.id}/${action}`, { expectedVersion: assignment.version, ...extra });
 if (action === 'release') {
  const rows = await allPages(cursor => orderingApi.list('/courier/orders', { scope: 'history', cursor, limit: '50' }));
  if (!rows.some(row => row.id === order.id && row.assignment?.id === assignment.id && row.assignment.status === 'cancelled')) throw new Error('No se pudo verificar la liberación. Actualiza antes de reintentar.');
  return;
 }
 const actual = await orderingApi.detail(order.id);
 if (actual.assignment?.id !== assignment.id || actual.assignment.courierUserId !== userId) throw new Error('La asignación cambió. Actualiza la entrega.');
 const valid = action === 'incidents' ? actual.incidents?.some(i => i.description === extra.reason)
  : actual.assignment.version > assignment.version && (action === 'pickup'
   ? actual.assignment.status === 'picked_up' && actual.status === 'in_transit'
   : actual.assignment.status === 'delivered' && actual.status === 'delivered' && actual.cashReceivedCents === extra.cashReceivedCents && actual.collectedByUserId === userId && actual.paymentStatus === 'succeeded');
 if (!valid) throw new Error('No se pudo verificar la operación. Actualiza antes de reintentar.');
}
export function useCourierAction(reload: () => void, blocked = false) {
 const lock = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const owner = useAuthStore(s => s.currentUser?.id);
 async function execute(work: () => Promise<unknown>) {
  if (lock.current || blocked || !owner) return false;
  lock.current = true; setBusy(true); setError('');
  try { await work(); return useAuthStore.getState().currentUser?.id === owner; }
  catch (e) { if (useAuthStore.getState().currentUser?.id === owner) setError((e instanceof Error ? e.message : 'No se pudo confirmar la operación.') + ' Consulta el estado actualizado antes de volver a enviar.'); return false; }
  finally { lock.current = false; setBusy(false); reload(); courierChanged(); }
 }
 return { execute, busy, error };
}
