import { useEffect, useRef, useState } from 'react';
import { operationsApi, type AdminUser, type CourierProfile, type StoreSummary, type Decision, type ZoneInput } from '../../services/api/operationsApi';
import { mediaApi, mediaUrl } from '../../services/api/mediaApi';
import { engagementApi } from '../../services/api/engagementApi';
import { orderingApi, type Order } from '../../services/api/orderingApi';
import { useAuthStore } from '../../store/authStore';
import { allPages } from '../customer/customerAccountModel';
import { merchantOrder } from '../merchant/merchantOrdersModel';
import { useRemote, vehicleLabels } from '../operations/shared';
import type { UserRole, UserStatus } from '../../domain/types';

export const adminChanged = () => window.dispatchEvent(new Event('quickly:admin-changed'));
export const accountRoles: Record<string, UserRole> = { customer: 'cliente', merchant: 'comercio', courier: 'repartidor', admin: 'admin' };
export const decisionLabels: Record<Decision['decision'], string> = { approve: 'Aprobar', reject: 'Rechazar', suspend: 'Suspender', reactivate: 'Reactivar' };
export const decisionTarget: Record<Decision['decision'], string> = { approve: 'active', reject: 'rejected', suspend: 'suspended', reactivate: 'active' };
export const decisionsFor = (status: string): Decision['decision'][] => status === 'pending' ? ['approve', 'reject'] : status === 'active' ? ['suspend'] : status === 'suspended' ? ['reactivate'] : [];
export const loadAdminUsers = (signal?: AbortSignal) => allPages(cursor => operationsApi.adminUsers({ cursor }, signal));
export const loadAdminStores = (signal?: AbortSignal) => allPages(cursor => operationsApi.adminStores({ cursor }, signal));
export const loadAdminCouriers = (signal?: AbortSignal) => allPages(cursor => operationsApi.adminCouriers({ cursor }, signal));
export const loadAdminZones = (signal?: AbortSignal) => allPages(cursor => operationsApi.adminZones({ cursor }, signal));
export const loadAdminTickets = (signal?: AbortSignal) => allPages(cursor => engagementApi.tickets(true, cursor, signal));
export function adminUser(source: AdminUser) {
 const roles = source.roles.map(role => accountRoles[role]).filter((role): role is UserRole => !!role);
 return { source, ...source, name: source.fullName, role: roles[0], roles, status: (source.status === 'active' ? 'activo' : source.status === 'pending' ? 'pendiente_aprobacion' : 'suspendido') as UserStatus };
}
export function adminStore(source: StoreSummary) { return { source, ...source, address: source.addressText, category: source.categoryCode, prepTimeMinutes: source.preparationMinutes, logoUrl: '', deliveryFeeCents: null as number | null }; }
export function adminCourier(source: CourierProfile) { return { source, ...source, name: source.fullName, currentZone: source.zoneName || '', isAvailable: source.isOnline, vehicleType: vehicleLabels[source.vehicleType] }; }
export async function loadAdminStoreViews(signal?: AbortSignal) {
 const [stores, zones] = await Promise.all([loadAdminStores(signal), loadAdminZones(signal)]);
 const output: ReturnType<typeof adminStore>[] = [];
 for (let start = 0; start < stores.length; start += 6) {
  output.push(...await Promise.all(stores.slice(start, start + 6).map(async store => {
   const branding = await mediaApi.branding(store.id, signal);
   return { ...adminStore(store), logoUrl: branding.logoUrl ? mediaUrl(branding.logoUrl) : '', deliveryFeeCents: zones.find(zone => zone.id === store.zoneId)?.baseFeeCents ?? null };
  })));
 }
 return output;
}
export function useAdminResource<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
 const resource = useRemote('admin:' + key, load);
 const paused = useRef(false); paused.current = resource.loading || !!resource.error;
 useEffect(() => {
  const refresh = () => { if (!document.hidden && !paused.current) resource.reload(); };
  const online = () => { if (!resource.loading) resource.reload(); };
  const timer = setInterval(refresh, 30000);
  window.addEventListener('quickly:admin-changed', refresh); window.addEventListener('online', online);
  return () => { clearInterval(timer); window.removeEventListener('quickly:admin-changed', refresh); window.removeEventListener('online', online); };
 }, [resource.reload, resource.loading]);
 return resource;
}
export function useAdminAction(reload: () => void, blocked = false) {
 const lock = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
 const owner = useAuthStore(s => s.currentUser?.id);
 async function execute(work: () => Promise<unknown>, message: string) {
  if (lock.current || blocked || !owner || !useAuthStore.getState().roles.includes('admin')) return false;
  lock.current = true; setBusy(true); setError(''); setNotice('');
  try { await work(); if (useAuthStore.getState().currentUser?.id !== owner || !useAuthStore.getState().roles.includes('admin')) return false; setNotice(message); return true; }
  catch (e) { if (useAuthStore.getState().currentUser?.id === owner) setError((e instanceof Error ? e.message : 'No se pudo confirmar la operación.') + ' Revisa el estado actualizado antes de volver a enviar.'); return false; }
  finally { lock.current = false; setBusy(false); reload(); adminChanged(); }
 }
 return { execute, busy, error, notice, clear: () => { setError(''); setNotice(''); } };
}
export async function changeAdminUser(id: string, status: 'active' | 'suspended', reason: string) {
 await operationsApi.userStatus(id, { status, reason: reason.trim() });
 const saved = (await loadAdminUsers()).find(user => user.id === id);
 if (!saved || saved.status !== status || saved.statusReason !== reason.trim()) throw new Error('No se pudo verificar el estado de la cuenta.');
}
export async function decideAffiliation(kind: 'stores' | 'couriers', id: string, body: Decision) {
 if (kind === 'stores') {
  await operationsApi.decideStore(id, body); const saved = await operationsApi.store(id);
  if (saved.id !== id || saved.status !== decisionTarget[body.decision] || saved.statusReason !== body.reason) throw new Error('No se pudo verificar la decisión del comercio.');
 } else {
  await operationsApi.decideCourier(id, body); const saved = (await loadAdminCouriers()).find(courier => courier.userId === id);
  if (!saved || saved.status !== decisionTarget[body.decision] || saved.statusReason !== body.reason) throw new Error('No se pudo verificar la decisión del repartidor.');
 }
}
export async function setStoreReception(id: string, acceptingOrders: boolean) {
 await operationsApi.updateStore(id, { acceptingOrders }); const saved = await operationsApi.store(id);
 if (saved.id !== id || saved.acceptingOrders !== acceptingOrders) throw new Error('No se pudo verificar la recepción del comercio.');
}
export async function loadAdminOrders(signal?: AbortSignal) {
 const [summaries, couriers] = await Promise.all([allPages(cursor => orderingApi.list('/admin/orders', { cursor, limit: '50' }, signal)), loadAdminCouriers(signal)]);
 const details: Order[] = [];
 for (let start = 0; start < summaries.length; start += 6) {
  const batch = summaries.slice(start, start + 6);
  const values = await Promise.all(batch.map(row => orderingApi.detail(row.id, signal)));
  if (values.some((row, i) => row.id !== batch[i].id)) throw new Error('La respuesta no corresponde al pedido solicitado.');
  details.push(...values);
 }
 return details.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(source => {
  const view = merchantOrder(source); const courier = couriers.find(courier => courier.userId === source.assignment?.courierUserId);
  return { ...view, parentCode: source.code, courierName: view.hasAssignment ? courier?.fullName || source.assignment?.courierUserId : undefined, courierPhone: view.hasAssignment ? courier?.phone : undefined };
 });
}
export async function assignAdminOrder(order: Order, courierUserId: string, reason: string) {
 await orderingApi.action('/admin/orders/' + order.id + '/assignment', { courierUserId, expectedVersion: order.version, reason });
 const saved = await orderingApi.detail(order.id);
 if (saved.id !== order.id || saved.assignment?.courierUserId !== courierUserId || saved.assignment.status !== 'accepted') throw new Error('No se pudo verificar la asignación.');
}
export async function releaseAdminAssignment(order: Order, reason: string) {
 if (!order.assignment) throw new Error('Asignación no disponible.');
 await orderingApi.action('/admin/assignments/' + order.assignment.id + '/release', { expectedVersion: order.assignment.version, reason });
 const saved = await orderingApi.detail(order.id);
 if (saved.id !== order.id || saved.assignment?.id !== order.assignment.id || saved.assignment.status !== 'cancelled') throw new Error('No se pudo verificar la liberación.');
}
export async function saveAdminZone(body: ZoneInput & { reason?: string }, id?: string) {
 const { code, ...patch } = body;
 const saved = await operationsApi.saveZone(id ? patch as Parameters<typeof operationsApi.saveZone>[0] : body, id);
 const actual = (await loadAdminZones()).find(zone => zone.id === saved.id);
 if (!actual || (id && actual.id !== id) || actual.code !== code || actual.name !== body.name || actual.description !== (body.description || '') || actual.baseFeeCents !== body.baseFeeCents || actual.estimatedMinutes !== body.estimatedMinutes || actual.isActive !== body.isActive) throw new Error('No se pudo verificar la zona guardada.');
}
export async function decideAdminTicket(ticket: Awaited<ReturnType<typeof engagementApi.ticket>>, body: { status: 'open' | 'in_review' | 'resolved'; priority: 'low' | 'normal' | 'high'; body: string }, owner: string) {
 const previous = new Set(ticket.messages.map(message => message.id));
 await engagementApi.decide(ticket.id, { ...body, expectedVersion: ticket.version });
 const saved = await engagementApi.ticket(true, ticket.id);
 if (saved.id !== ticket.id || saved.version <= ticket.version || saved.status !== body.status || saved.priority !== body.priority || !saved.messages.some(message => !previous.has(message.id) && message.authorUserId === owner && message.body === body.body)) throw new Error('No se pudo verificar la respuesta del caso.');
}
export const csvCell = (value: unknown) => { let text = String(value ?? ''); if (/^[\s]*[=+@-]/.test(text)) text = "'" + text; return '"' + text.split('"').join('""') + '"'; };
export function downloadCsv(name: string, rows: unknown[][]) {
 const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
 const link = document.createElement('a'); link.href = url; link.download = name; document.body.appendChild(link);
 try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export function adminTicket(source: Awaited<ReturnType<typeof engagementApi.tickets>>['items'][number] & { messages?: Awaited<ReturnType<typeof engagementApi.ticket>>['messages'] }) {
 return { ...source, source, status: ({ open: 'abierto', in_review: 'en_revision', resolved: 'resuelto' } as Record<string,string>)[source.status] || source.status,
  priority: ({ low: 'baja', normal: 'media', high: 'alta' } as Record<string,string>)[source.priority] || source.priority,
  userName: 'Solicitante no informado', userRole: '', description: source.messages?.[0]?.body || 'Abre el caso para ver la conversación.', response: source.messages?.[source.messages.length - 1]?.body || '',
 };
}
