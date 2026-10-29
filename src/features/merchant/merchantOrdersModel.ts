import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { orderingApi, type Order } from '../../services/api/orderingApi';
import { operationsApi } from '../../services/api/operationsApi';
import { catalogApi } from '../../services/api/catalogApi';
import { mediaApi, mediaUrl } from '../../services/api/mediaApi';
import { engagementApi } from '../../services/api/engagementApi';
import { ApiError } from '../../services/api/apiClient';
import { allPages } from '../customer/customerAccountModel';
import { customerPurchase } from '../orders/customerOrderModel';
import { storefrontProduct } from '../catalog/storefrontModel';
import { useRemote } from '../operations/shared';
import { formatOpeningIntervals, canManageStore } from './merchantModel';
import type { OrderStatus, PaymentMethod } from '../../domain/types';

export function merchantOrder(order: Order) {
 const purchase = customerPurchase([order], '');
 return { ...purchase.merchantOrders[0], source: order, hasAssignment: !!order.assignment && order.assignment.status !== 'cancelled',
  acceptanceExpiresAt: order.acceptanceExpiresAt, purchaseId: order.purchaseId, purchaseCode: order.code,
  customerName: order.destination?.recipientName || 'Destinatario no informado', customerPhone: order.destination?.phone || '',
  addressSnapshot: purchase.addressSnapshot, paymentMethod: 'efectivo' as PaymentMethod, cashPaid: order.cashTenderCents ?? undefined,
  changeDue: order.cashTenderCents != null ? order.cashTenderCents - order.totalCents : undefined,
  purchaseCreatedAt: order.createdAt, courierName: undefined as string | undefined, courierPhone: undefined as string | undefined };
}
export type MerchantOrderView = ReturnType<typeof merchantOrder>;

export async function loadMerchantOrders(storeId: string, signal?: AbortSignal) {
 const summaries = await allPages(cursor => orderingApi.list('/merchant/stores/' + storeId + '/order-feed', { cursor, limit: '50' }, signal));
 const details: Order[] = [];
 // Bounded concurrency while retaining every page required by the original counters/search.
 for (let index = 0; index < summaries.length; index += 6) {
  const batch = await Promise.all(summaries.slice(index, index + 6).map(order => orderingApi.detail(order.id, signal)));
  if (batch.some(order => order.storeId !== storeId)) throw new ApiError('El pedido no corresponde a esta tienda.', 403, 'STORE_MISMATCH');
  details.push(...batch);
 }
 return details.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(merchantOrder);
}
function useRefresh(reload: () => void, paused: boolean) {
 const pausedRef = useRef(paused); pausedRef.current = paused;
 useEffect(() => {
  const refresh = () => { if (!document.hidden && !pausedRef.current) reload(); };
  const timer = setInterval(refresh, 15000);
  window.addEventListener('quickly:merchant-orders-changed', refresh);
  return () => { clearInterval(timer); window.removeEventListener('quickly:merchant-orders-changed', refresh); };
 }, [reload]);
}
export function useMerchantOrders() {
 const storeId = useAuthStore(s => s.currentUser?.merchantId || '');
 const resource = useRemote('merchant-order-feed:' + storeId, signal => storeId ? loadMerchantOrders(storeId, signal) : Promise.resolve([]));
 useRefresh(resource.reload, resource.loading || !!resource.error);
 return { ...resource, storeId };
}
export function useMerchantWorkspace(products = false) {
 const storeId = useAuthStore(s => s.currentUser?.merchantId || '');
 const resource = useRemote('merchant-workspace:' + storeId + ':' + products, async signal => {
  if (!storeId) return null;
  const store = await operationsApi.store(storeId, signal);
  const [branding, catalog] = await Promise.all([mediaApi.branding(storeId, signal), products ? allPages(cursor => catalogApi.products(storeId, { cursor, limit: 50 }, signal)) : Promise.resolve([])]);
  return { store, products: catalog.map(product => storefrontProduct(product)), merchant: {
   id: store.id, name: store.name, address: store.addressText, phone: store.phone, schedule: formatOpeningIntervals(store.openingIntervals),
   isOpen: store.acceptingOrders, tradingNow: store.isOpen, logoUrl: branding.logoUrl ? mediaUrl(branding.logoUrl) : '', category: store.categoryCode,
  }, canManage: canManageStore(store.membershipRole) };
 });
 return { ...resource, storeId };
}
export function useMerchantActions(resource: ReturnType<typeof useMerchantOrders>) {
 const [busy, setBusy] = useState(false); const lock = useRef(false);
 const [error, setError] = useState(''); const [notice, setNotice] = useState('');
 const storeId = resource.storeId; const owner = useAuthStore(s => s.currentUser?.id);
 async function execute(work: () => Promise<unknown>, message: string) {
  if (lock.current || resource.loading || resource.error || !storeId) return false;
  lock.current = true; setBusy(true); setError(''); setNotice('');
  try { await work();
   if (useAuthStore.getState().currentUser?.id !== owner || useAuthStore.getState().currentUser?.merchantId !== storeId) return false;
   setNotice(message); return true;
  } catch (e) {
   if (useAuthStore.getState().currentUser?.id === owner && useAuthStore.getState().currentUser?.merchantId === storeId)
    setError(e instanceof Error ? e.message : 'No se pudo confirmar la operación.');
   return false;
  } finally { lock.current = false; setBusy(false); resource.reload(); window.dispatchEvent(new Event('quickly:merchant-orders-changed')); }
 }
 async function transition(id: string, next: OrderStatus, reason?: string) {
  const order = resource.data?.find(order => order.id === id);
  const operation = next === 'confirmado' ? ['pending','accept'] : next === 'en_preparacion' ? ['confirmed','start-preparation'] : next === 'listo_recoger' ? ['preparing','mark-ready'] : next === 'rechazado' ? ['pending,confirmed','rejections'] : null;
  if (!order || !operation || !operation[0].split(',').includes(order.source.status)) { setError('Esta transición no está disponible para el estado actual. Actualiza el pedido.'); return false; }
  return execute(async () => {
   await orderingApi.action('/merchant/orders/' + id + '/' + operation[1], { expectedVersion: order.source.version, ...(next === 'rechazado' ? { reason: reason?.trim() || 'Sin disponibilidad' } : {}) });
   const actual = await orderingApi.detail(id);
   if (actual.storeId !== storeId || actual.version <= order.source.version || actual.status === order.source.status) throw new Error('El servidor no confirmó el cambio de estado. Actualiza el pedido antes de reintentar.');
  }, 'Operación confirmada por el servidor. El pedido se ha actualizado.');
 }
 async function assign(id: string, courierUserId: string) {
  const order = resource.data?.find(order => order.id === id);
  if (!order || order.source.status !== 'ready' || order.hasAssignment) { setError('Actualiza el pedido antes de asignar reparto.'); return false; }
  return execute(async () => {
   await orderingApi.action('/merchant/orders/' + id + '/assign-courier', { courierUserId, expectedVersion: order.source.version, reason: 'Asignación solicitada por el comercio' });
   const actual = await orderingApi.detail(id);
   if (actual.storeId !== storeId || actual.assignment?.courierUserId !== courierUserId || actual.assignment.status === 'cancelled') throw new Error('No se pudo verificar la asignación. Actualiza el pedido antes de reintentar.');
  }, 'Asignación confirmada por el servidor.');
 }
 return { busy, error, notice, transition, assign, execute };
}
export function reportRange(period: 'semana' | 'mes' | 'historico', now = new Date()) {
 const end = now.toISOString();
 return { from: new Date(now.getTime() - (period === 'semana' ? 7 : period === 'mes' ? 30 : 366) * 86400000).toISOString(), to: end };
}
export function useMerchantReport(period: 'semana' | 'mes' | 'historico') {
 const storeId = useAuthStore(s => s.currentUser?.merchantId || '');
 const range = useMemo(() => reportRange(period), [period, storeId]);
 const resource = useRemote('merchant-report:' + storeId + ':' + JSON.stringify(range), signal => storeId ? engagementApi.report('/merchant/stores/' + storeId + '/reports', range, signal) : Promise.resolve(null));
 useRefresh(resource.reload, resource.loading || !!resource.error);
 return { ...resource, range };
}
export function AcceptanceDeadline({ expiresAt }: { expiresAt: string | null }) {
 const [now, setNow] = useState(Date.now());
 useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
 if (!expiresAt) return 'Plazo no informado';
 const seconds = Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
 return seconds === 0 ? 'Plazo alcanzado; el servidor valida el estado' : Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}
