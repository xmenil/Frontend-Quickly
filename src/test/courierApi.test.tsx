import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { claimCourierOrder, courierAssignmentAction, loadCourierOrders, useCourierAction } from '../features/courier/courierModel';
import { orderingApi } from '../services/api/orderingApi';
import { useAuthStore } from '../store/authStore';
import { setupCourier, ready, accepted, picked, delivered, courier } from './courierApiFixtures';
import { uid } from './checkoutFixtures';
const original = useAuthStore.getState();
beforeEach(setupCourier);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
it('pagina solicitudes completas sin pedir detalle privado antes de claim', async () => {
 vi.mocked(orderingApi.list).mockResolvedValueOnce({ items: [ready], nextCursor: uid(90) }).mockResolvedValueOnce({ items: [{ ...ready, id: uid(91) }], nextCursor: null });
 expect(await loadCourierOrders('available')).toHaveLength(2);
 expect(orderingApi.detail).not.toHaveBeenCalled();
 expect(orderingApi.list).toHaveBeenNthCalledWith(2, '/courier/orders', { scope: 'available', cursor: uid(90), limit: '50' }, undefined);
});
it('detecta cursor circular en vez de completar un listado parcial', async () => {
 vi.mocked(orderingApi.list).mockResolvedValue({ items: [ready], nextCursor: uid(90) });
 await expect(loadCourierOrders('available')).rejects.toThrow('paginación');
});
it('historial liberado no pide detalle sin acceso', async () => {
 vi.mocked(orderingApi.list).mockResolvedValue({ items: [{ ...accepted, assignment: { ...accepted.assignment!, status: 'cancelled' } }], nextCursor: null });
 const rows = await loadCourierOrders('history'); expect(rows).toHaveLength(1); expect(orderingApi.detail).not.toHaveBeenCalled(); expect(rows[0].customerPhone).toBe('');
});
it('rechaza una asignación cambiada entre bandeja y detalle', async () => {
 vi.mocked(orderingApi.list).mockResolvedValue({ items: [accepted], nextCursor: null });
 vi.mocked(orderingApi.detail).mockResolvedValue({ ...accepted, assignment: { ...accepted.assignment!, id: uid(92) } });
 await expect(loadCourierOrders('active')).rejects.toThrow('asignación cambió');
});
it('bloquea doble envío mientras una mutación está pendiente', async () => {
 let resolve!: () => void;
 const work = vi.fn(() => new Promise<void>(done => { resolve = done; })); const reload = vi.fn();
 const { result } = renderHook(() => useCourierAction(reload));
 await act(async () => { const first = result.current.execute(work); expect(await result.current.execute(work)).toBe(false); resolve(); expect(await first).toBe(true); });
 expect(work).toHaveBeenCalledTimes(1); expect(reload).toHaveBeenCalledTimes(1);
});
it('no vuelve a mutar tras respuesta perdida y pide recarga', async () => {
 vi.mocked(orderingApi.action).mockRejectedValue(new Error('Sin conexión'));
 const reload = vi.fn(); const { result } = renderHook(() => useCourierAction(reload));
 await act(async () => { expect(await result.current.execute(() => claimCourierOrder(ready, courier.userId))).toBe(false); });
 expect(orderingApi.action).toHaveBeenCalledTimes(1); expect(reload).toHaveBeenCalled(); expect(result.current.error).toContain('estado actualizado');
});
it('no confirma entrega si el GET no verifica efectivo y cobrador', async () => {
 vi.mocked(orderingApi.detail).mockResolvedValue({ ...delivered, collectedByUserId: uid(92) });
 await expect(courierAssignmentAction(picked, courier.userId, 'deliver', { cashReceivedCents: 5000 })).rejects.toThrow('No se pudo verificar');
});
it('no confirma el recojo si GET falla después del POST', async () => {
 vi.mocked(orderingApi.detail).mockRejectedValue(new Error('GET no disponible'));
 await expect(courierAssignmentAction(accepted, courier.userId, 'pickup')).rejects.toThrow('GET no disponible');
 expect(orderingApi.action).toHaveBeenCalledTimes(1);
});
it('no ejecuta asignaciones ajenas', async () => {
 await expect(courierAssignmentAction(picked, uid(92), 'pickup')).rejects.toThrow('Actualiza');
 expect(orderingApi.action).not.toHaveBeenCalled();
});
