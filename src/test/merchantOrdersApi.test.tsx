import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { loadMerchantOrders, merchantOrder, reportRange, useMerchantActions } from '../features/merchant/merchantOrdersModel';
import { orderingApi } from '../services/api/orderingApi';
import { ApiError } from '../services/api/apiClient';
import { useAuthStore } from '../store/authStore';
import { customer, order, uid } from './checkoutFixtures';
const original = useAuthStore.getState();
beforeEach(() => { useAuthStore.setState({ currentUser: { ...customer, role: 'comercio', merchantId: order.storeId }, isAuthenticated: true, roles: ['comercio'], sessionStatus: 'ready' }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
const resource = () => ({ storeId: order.storeId, key: 'fixture', data: [merchantOrder(order)], loading: false, error: undefined, reload: vi.fn() });
it('carga todas las páginas y sus detalles sin mezclar tiendas', async () => {
 vi.spyOn(orderingApi, 'list').mockResolvedValueOnce({ items: [order], nextCursor: uid(80) }).mockResolvedValueOnce({ items: [{ ...order, id: uid(81) }], nextCursor: null });
 vi.spyOn(orderingApi, 'detail').mockResolvedValueOnce(order).mockResolvedValueOnce({ ...order, id: uid(81) });
 const rows = await loadMerchantOrders(order.storeId); expect(rows).toHaveLength(2); expect(orderingApi.list).toHaveBeenCalledTimes(2);
 expect(rows[0].customerName).toBe(order.destination!.recipientName); expect(rows[0].courierPhone).toBeUndefined();
});
it('rechaza un detalle de otra tienda', async () => {
 vi.spyOn(orderingApi, 'list').mockResolvedValue({ items: [order], nextCursor: null });
 vi.spyOn(orderingApi, 'detail').mockResolvedValue({ ...order, storeId: uid(82) });
 await expect(loadMerchantOrders(order.storeId)).rejects.toMatchObject({ code: 'STORE_MISMATCH' });
});
it('envía versión y bloquea dos acciones simultáneas', async () => {
 let done!: () => void; const action = vi.spyOn(orderingApi, 'action').mockImplementation(() => new Promise<void>(resolve => { done = resolve; }));
 vi.spyOn(orderingApi, 'detail').mockResolvedValue({ ...order, status: 'confirmed', version: 2 });
 const state = resource(); const { result } = renderHook(() => useMerchantActions(state));
 await act(async () => { const first = result.current.transition(order.id, 'confirmado'); await result.current.transition(order.id, 'confirmado'); done(); await first; });
 expect(action).toHaveBeenCalledTimes(1); expect(action).toHaveBeenCalledWith('/merchant/orders/' + order.id + '/accept', { expectedVersion: 1 });
 expect(result.current.notice).toContain('confirmada'); expect(state.reload).toHaveBeenCalled();
});
it('no anuncia éxito cuando el POST no se refleja en el detalle persistido', async () => {
 vi.spyOn(orderingApi, 'action').mockResolvedValue({}); vi.spyOn(orderingApi, 'detail').mockResolvedValue(order);
 const state = resource(); const { result } = renderHook(() => useMerchantActions(state));
 await act(async () => { expect(await result.current.transition(order.id, 'confirmado')).toBe(false); });
 expect(result.current.notice).toBe(''); expect(result.current.error).toContain('no confirmó');
});
it('un 409 no anuncia éxito y recarga sin repetir la mutación', async () => {
 const action = vi.spyOn(orderingApi, 'action').mockRejectedValue(new ApiError('Versión obsoleta', 409, 'VERSION_CONFLICT'));
 const state = resource(); const { result } = renderHook(() => useMerchantActions(state));
 await act(async () => { expect(await result.current.transition(order.id, 'confirmado')).toBe(false); });
 expect(result.current.error).toBe('Versión obsoleta'); expect(result.current.notice).toBe(''); expect(action).toHaveBeenCalledTimes(1); expect(state.reload).toHaveBeenCalled();
});
it('la asignación usa courierUserId real y la versión de la orden lista', async () => {
 const ready = { ...order, status: 'ready' as const, version: 3 };
 const state = { ...resource(), data: [merchantOrder(ready)] };
 const action = vi.spyOn(orderingApi, 'action').mockResolvedValue({}); vi.spyOn(orderingApi, 'detail').mockResolvedValue({ ...ready, assignment: { id: uid(85), courierUserId: uid(84), status: 'accepted', version: 1, agreedFeeCents: 280 } });
 const { result } = renderHook(() => useMerchantActions(state));
 await act(async () => { await result.current.assign(order.id, uid(84)); });
 expect(action).toHaveBeenCalledWith('/merchant/orders/' + order.id + '/assign-courier', expect.objectContaining({ expectedVersion: 3, courierUserId: uid(84) }));
});
it('el comercio no puede marcar entrega ni saltarse la preparación', async () => {
 const action = vi.spyOn(orderingApi, 'action'); const { result } = renderHook(() => useMerchantActions(resource()));
 await act(async () => { expect(await result.current.transition(order.id, 'entregado')).toBe(false); expect(await result.current.transition(order.id, 'listo_recoger')).toBe(false); });
 expect(action).not.toHaveBeenCalled();
});
it('el histórico respeta el máximo real de 366 días del reporte', () => {
 const range = reportRange('historico', new Date('2026-10-29T12:00:00Z'));
 expect(Date.parse(range.to) - Date.parse(range.from)).toBe(366 * 86400000);
});
