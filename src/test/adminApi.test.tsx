import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { assignAdminOrder, changeAdminUser, csvCell, decideAffiliation, decideAdminTicket, loadAdminOrders, loadAdminUsers, releaseAdminAssignment, saveAdminZone, useAdminAction } from '../features/admin/adminModel';
import { operationsApi } from '../services/api/operationsApi';
import { orderingApi } from '../services/api/orderingApi';
import { engagementApi } from '../services/api/engagementApi';
import { useAuthStore } from '../store/authStore';
import { setupAdmin, targetUser, courier, store, ready, zone, ticket, admin, uid } from './adminApiFixtures';
const original = useAuthStore.getState(); beforeEach(setupAdmin);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
it('pagina usuarios completos y detecta ciclos de cursor', async () => {
 vi.mocked(operationsApi.adminUsers).mockResolvedValueOnce({ items: [targetUser], nextCursor: uid(150) }).mockResolvedValueOnce({ items: [{ ...targetUser, id: uid(151) }], nextCursor: null });
 expect(await loadAdminUsers()).toHaveLength(2); expect(operationsApi.adminUsers).toHaveBeenNthCalledWith(2, { cursor: uid(150) }, undefined);
 vi.mocked(operationsApi.adminUsers).mockResolvedValue({ items: [], nextCursor: uid(150) }); await expect(loadAdminUsers()).rejects.toThrow('paginación');
});
it('bandeja administrativa carga todas las páginas y detalles por orderId', async () => {
 vi.mocked(orderingApi.list).mockResolvedValueOnce({ items: [ready], nextCursor: uid(152) }).mockResolvedValueOnce({ items: [{ ...ready, id: uid(153) }], nextCursor: null });
 vi.mocked(orderingApi.detail).mockResolvedValueOnce(ready).mockResolvedValueOnce({ ...ready, id: uid(153) });
 expect(await loadAdminOrders()).toHaveLength(2); expect(orderingApi.detail).toHaveBeenCalledWith(uid(153), undefined);
});
it('rechaza detalle de un pedido diferente', async () => {
 vi.mocked(orderingApi.detail).mockResolvedValue({ ...ready, id: uid(154) }); await expect(loadAdminOrders()).rejects.toThrow('no corresponde');
});
it('cuenta sin estado y motivo confirmados no produce éxito', async () => {
 await expect(changeAdminUser(targetUser.id, 'suspended', 'Revisión')).rejects.toThrow('No se pudo verificar');
 expect(operationsApi.userStatus).toHaveBeenCalledTimes(1);
});
it('aprobación comercial comprueba estado y motivo usando GET', async () => {
 vi.mocked(operationsApi.store).mockResolvedValue({ ...store, status: 'active', statusReason: 'Aprobación documentada' });
 await decideAffiliation('stores', store.id, { decision: 'approve', reason: 'Aprobación documentada' });
 expect(operationsApi.decideStore).toHaveBeenCalledWith(store.id, { decision: 'approve', reason: 'Aprobación documentada' }); expect(operationsApi.store).toHaveBeenCalledWith(store.id);
});
it('la decisión del repartidor verifica courierUserId, sin conceder roles locales', async () => {
 vi.mocked(operationsApi.adminCouriers).mockResolvedValue({ items: [{ ...courier, status: 'suspended', statusReason: 'Revisión' }], nextCursor: null });
 await decideAffiliation('couriers', courier.userId, { decision: 'suspend', reason: 'Revisión' });
 expect(operationsApi.decideCourier).toHaveBeenCalledWith(courier.userId, { decision: 'suspend', reason: 'Revisión' }); expect(useAuthStore.getState().roles).toEqual(['admin']);
});
it('asigna con versión de orden y libera con versión de asignación', async () => {
 const assigned = { ...ready, assignment: { id: uid(160), courierUserId: courier.userId, status: 'accepted', version: 4, agreedFeeCents: 350 } };
 vi.mocked(orderingApi.detail).mockResolvedValue(assigned);
 await assignAdminOrder(ready, courier.userId, 'Apoyo operativo');
 expect(orderingApi.action).toHaveBeenCalledWith('/admin/orders/' + ready.id + '/assignment', { expectedVersion: 8, courierUserId: courier.userId, reason: 'Apoyo operativo' });
 vi.mocked(orderingApi.detail).mockResolvedValue({ ...assigned, assignment: { ...assigned.assignment, status: 'cancelled', version: 5 } });
 await releaseAdminAssignment(assigned, 'Avería');
 expect(orderingApi.action).toHaveBeenLastCalledWith('/admin/assignments/' + assigned.assignment.id + '/release', { expectedVersion: 4, reason: 'Avería' });
});
it('respuesta a ticket requiere un mensaje nuevo del administrador y versión mayor', async () => {
 vi.mocked(engagementApi.ticket).mockResolvedValue({ ...ticket, status: 'resolved', version: 8 });
 await expect(decideAdminTicket(ticket, { status: 'resolved', priority: 'high', body: 'Resuelto' }, admin.id)).rejects.toThrow('No se pudo verificar');
});
it('edición de zona omite el código inmutable y comprueba importes contra GET', async () => {
 await saveAdminZone({ ...zone, reason: 'Actualización' }, zone.id);
 const body = vi.mocked(operationsApi.saveZone).mock.calls[0][0]; expect(body).not.toHaveProperty('code'); expect(body).toMatchObject({ baseFeeCents: 350, reason: 'Actualización' });
});
it('bloquea el doble envío y no repite mutaciones ambiguas', async () => {
 let finish!: () => void; const work = vi.fn(() => new Promise<void>(resolve => { finish = resolve; })); const reload = vi.fn(); const { result } = renderHook(() => useAdminAction(reload));
 await act(async () => { const first = result.current.execute(work, 'Guardado'); expect(await result.current.execute(work, 'Guardado')).toBe(false); finish(); await first; }); expect(work).toHaveBeenCalledTimes(1);
 await act(async () => { expect(await result.current.execute(async () => { throw new Error('Conexión perdida'); }, 'Guardado')).toBe(false); });
 expect(result.current.notice).toBe(''); expect(result.current.error).toContain('estado actualizado'); expect(reload).toHaveBeenCalledTimes(2);
});
it('otro rol no ejecuta una mutación administrativa', async () => {
 useAuthStore.setState({ roles: ['cliente'] }); const work = vi.fn(); const { result } = renderHook(() => useAdminAction(vi.fn()));
 await act(async () => { expect(await result.current.execute(work, 'Guardado')).toBe(false); }); expect(work).not.toHaveBeenCalled();
});
it('no anuncia éxito si cambia la sesión mientras espera la operación', async () => {
 let finish!: () => void; const { result } = renderHook(() => useAdminAction(vi.fn()));
 await act(async () => { const pending = result.current.execute(() => new Promise<void>(resolve => { finish = resolve; }), 'Guardado'); useAuthStore.setState({ currentUser: { ...admin, id: uid(161) } }); finish(); expect(await pending).toBe(false); }); expect(result.current.notice).toBe('');
});
it('CSV escapa comillas, saltos de línea y fórmulas', () => {
 expect(csvCell('=SUM(A1)')).toBe("\"'=SUM(A1)\""); expect(csvCell('a,"b"\nc')).toBe("\"a,\"\"b\"\"\nc\""); expect(csvCell(' +2')).toBe("\"' +2\"");
});
