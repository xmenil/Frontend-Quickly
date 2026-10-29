import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminMerchantsPage } from '../features/admin/AdminMerchantsPage';
import { AdminCouriersPage } from '../features/admin/AdminCouriersPage';
import { AdminOrdersPage } from '../features/admin/AdminOrdersPage';
import { AdminZonesPage } from '../features/admin/AdminZonesPage';
import { AdminReportsPage } from '../features/admin/AdminReportsPage';
import { AdminOverviewPage } from '../features/admin/AdminOverviewPage';
import { AdminAuditPage } from '../features/admin/AdminAuditPage';
import { AdminLayout } from '../layouts/AdminLayout';
import { OperationalHealthPage } from '../features/operations/OperationalHealthPage';
import { operationsApi } from '../services/api/operationsApi';
import { orderingApi } from '../services/api/orderingApi';
import { engagementApi } from '../services/api/engagementApi';
import { healthApi } from '../services/api/healthApi';
import * as transport from '../services/api/apiClient';
import { useAuthStore } from '../store/authStore';
import { setupAdmin, store, courier, ready, uid, audit, zone } from './adminApiFixtures';
const original = useAuthStore.getState(); beforeEach(setupAdmin);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
it('conserva tabla comercial y verifica aprobación con motivo', async () => {
 vi.mocked(operationsApi.decideStore).mockImplementation(async (_id, body) => { vi.mocked(operationsApi.store).mockResolvedValue({ ...store, status: 'active', statusReason: body.reason }); return store; });
 render(<AdminMerchantsPage />); fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }));
 fireEvent.change(screen.getByLabelText(/Motivo de la decisión/), { target: { value: 'Documentación revisada' } }); fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisión' }));
 await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 expect(operationsApi.decideStore).toHaveBeenCalledWith(store.id, { decision: 'approve', reason: 'Documentación revisada' });
});
it('repartidor conserva disponibilidad de solo lectura y usa userId al suspender', async () => {
 render(<AdminCouriersPage />); expect(await screen.findByRole('button', { name: /Pausar disponibilidad/ })).toBeDisabled();
 fireEvent.click(screen.getByRole('button', { name: 'Suspender' })); fireEvent.change(screen.getByLabelText(/Motivo de la decisión/), { target: { value: 'Revisión' } }); fireEvent.click(screen.getByRole('button', { name: 'Confirmar decisión' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo verificar'); expect(operationsApi.decideCourier).toHaveBeenCalledWith(courier.userId, { decision: 'suspend', reason: 'Revisión' });
});
it('pedido muestra detalle y asigna únicamente un courierUserId elegible', async () => {
 vi.mocked(orderingApi.action).mockImplementation(async () => { vi.mocked(orderingApi.detail).mockResolvedValue({ ...ready, assignment: { id: uid(170), courierUserId: courier.userId, status: 'accepted', version: 1, agreedFeeCents: 350 } }); return {}; });
 render(<AdminOrdersPage />); fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' })); expect(screen.getByRole('dialog')).toHaveTextContent('Producto API');
 fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar modal' }));
 fireEvent.click(screen.getByRole('button', { name: 'Asignar repartidor' }));
 await waitFor(() => expect(orderingApi.couriers).toHaveBeenCalledWith(ready.storeId, expect.any(AbortSignal)));
 fireEvent.change(screen.getByLabelText('Repartidor'), { target: { value: courier.userId } }); fireEvent.change(screen.getByLabelText(/Motivo de la asignación/), { target: { value: 'Apoyo operativo' } }); fireEvent.click(screen.getByRole('button', { name: 'Confirmar asignación' }));
 expect(await screen.findByText('Asignación confirmada.')).toBeInTheDocument(); expect(orderingApi.action).toHaveBeenCalledWith('/admin/orders/' + ready.id + '/assignment', { expectedVersion: 8, courierUserId: courier.userId, reason: 'Apoyo operativo' });
});
it('formulario de cobertura conserva datos si guardar falla', async () => {
 vi.mocked(operationsApi.saveZone).mockRejectedValue(new Error('Sin conexión'));
 render(<AdminZonesPage />); fireEvent.click(await screen.findByRole('button', { name: 'Editar zona: ' + zone.name }));
 fireEvent.change(screen.getByLabelText(/Motivo del cambio/), { target: { value: 'Revisión de tarifa' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar zona' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión'); expect(screen.getByLabelText(/Nombre de zona/)).toHaveValue(zone.name); expect(screen.getByLabelText(/Motivo del cambio/)).toHaveValue('Revisión de tarifa');
});
it('reporte muestra agregado del servidor y cambia rangos reales', async () => {
 render(<AdminReportsPage />); expect(await screen.findByText('Ventas entregadas')).toBeInTheDocument(); expect(screen.getByText('Ventas entregadas').closest('tr')).toHaveTextContent('23.50');
 fireEvent.change(screen.getByLabelText('Período'), { target: { value: 'historico' } });
 await waitFor(() => { const call = vi.mocked(engagementApi.report).mock.calls.at(-1)!; expect(call[0]).toBe('/admin/reports'); expect(Date.parse(call[1].to!) - Date.parse(call[1].from!)).toBe(366 * 86400000); });
});
it('auditoría conserva bigint como string y no inventa roles históricos', async () => {
 vi.mocked(engagementApi.audit).mockResolvedValueOnce({ items: [audit], nextCursor: '9007199254740994' }).mockResolvedValueOnce({ items: [{ ...audit, id: '9007199254740995', action: 'delivery.courier_suspend' }], nextCursor: null });
 render(<AdminAuditPage />); expect(await screen.findByText(audit.action)).toBeInTheDocument(); expect(screen.getByText('delivery.courier_suspend')).toBeInTheDocument();
 expect(engagementApi.audit).toHaveBeenCalledWith('9007199254740994', undefined, expect.any(AbortSignal)); expect(screen.getByLabelText('Tipo de responsable')).toBeDisabled(); expect(screen.getAllByText('Rol no informado')).toHaveLength(2);
});
it('resumen consulta conjuntos completos y diferencia pedidos de compras', async () => {
 vi.mocked(orderingApi.list).mockResolvedValue({ items: [ready, { ...ready, id: uid(180) }], nextCursor: null });
 render(<MemoryRouter><AdminOverviewPage /></MemoryRouter>); await screen.findByRole('heading', { name: 'Resumen de la operación' });
 expect(screen.getByText('Compras registradas').closest('tr')).toHaveTextContent('1'); expect(screen.getByText('Monto total registrado').closest('tr')).toHaveTextContent('47.00');
});
it('estado operativo comprueba salud sin convertirlo en persistencia transaccional', async () => {
 vi.spyOn(transport, 'apiRequest').mockResolvedValue({ checkedAt: zone.id ? '2026-10-29T12:00:00Z' : '', pendingEvents: 0, retryingEvents: 0, oldestPendingEventSeconds: null, expiredPendingOrders: 0, activeAssignments: 1, openTickets: 1, poolTotal: 2, poolIdle: 1, poolWaiting: 0, alerts: [] });
 render(<OperationalHealthPage />); expect(await screen.findByText('Servicio disponible · Base de datos conectada')).toBeInTheDocument(); expect(await screen.findByText('Sin avisos en esta consulta.')).toBeInTheDocument(); expect(healthApi.ready).toHaveBeenCalled();
});
it('layout impide acceso a otro rol antes de consultar datos administrativos', async () => {
 useAuthStore.setState({ roles: ['cliente'] });
 render(<MemoryRouter><Routes><Route path="/" element={<AdminLayout />} /><Route path="/acceso-denegado" element={<h1>Acceso denegado</h1>} /></Routes></MemoryRouter>);
 expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument(); expect(operationsApi.overview).not.toHaveBeenCalled();
});
