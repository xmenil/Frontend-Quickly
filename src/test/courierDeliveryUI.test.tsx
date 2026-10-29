import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourierActiveDeliveryPage } from '../features/courier/CourierActiveDeliveryPage';
import { CourierHistoryPage } from '../features/courier/CourierHistoryPage';
import { orderingApi } from '../services/api/orderingApi';
import { useAuthStore } from '../store/authStore';
import { setupCourier, accepted, picked, delivered, courier } from './courierApiFixtures';
const original = useAuthStore.getState();
let current = accepted;
beforeEach(() => { setupCourier(); current = accepted;
 vi.mocked(orderingApi.list).mockImplementation(async (_p, query) => ({ items: query?.scope === 'history' ? (current.assignment?.status === 'delivered' || current.assignment?.status === 'cancelled' ? [current] : []) : current.assignment?.status === 'accepted' || current.assignment?.status === 'picked_up' ? [current] : [], nextCursor: null }));
 vi.mocked(orderingApi.detail).mockImplementation(async () => current);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
function view(path = '/') { render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/" element={<CourierActiveDeliveryPage />} /><Route path="/repartidor/historial" element={<CourierHistoryPage />} /><Route path="/repartidor/solicitudes" element={<h1>Solicitudes</h1>} /></Routes></MemoryRouter>); }
it('recupera la asignación y envía assignmentId y su versión en recojo', async () => {
 vi.mocked(orderingApi.action).mockImplementation(async () => { current = picked; return {}; });
 view(); fireEvent.click(await screen.findByRole('button', { name: 'Confirmar recojo' }));
 expect(await screen.findByText('Recojo confirmado. Continúa con la entrega al cliente.')).toBeInTheDocument();
 expect(orderingApi.action).toHaveBeenCalledWith('/courier/assignments/' + accepted.assignment!.id + '/pickup', { expectedVersion: 4, cashReceivedCents: undefined });
 expect(await screen.findByRole('heading', { name: 'Entregar al cliente' })).toBeInTheDocument();
});
it('no entrega sin efectivo y conserva el diálogo si la respuesta es ambigua', async () => {
 current = picked; vi.mocked(orderingApi.action).mockRejectedValue(new Error('Conexión perdida'));
 view(); fireEvent.click(await screen.findByRole('button', { name: 'Confirmar entrega' }));
 const dialog = screen.getByRole('dialog'); const finish = within(dialog).getByRole('button', { name: 'Finalizar entrega' });
 expect(finish).toBeDisabled(); fireEvent.change(within(dialog).getByLabelText('Efectivo recibido (S/)'), { target: { value: '50.00' } });
 fireEvent.click(finish);
 expect(await within(dialog).findByRole('alert')).toHaveTextContent('Conexión perdida');
 expect(within(dialog).getByLabelText('Efectivo recibido (S/)')).toHaveValue('50.00');
 expect(orderingApi.action).toHaveBeenCalledTimes(1);
});
it('confirma cobro y entrega con GET antes de mostrar historial', async () => {
 current = picked; vi.mocked(orderingApi.action).mockImplementation(async () => { current = delivered; return {}; });
 view(); fireEvent.click(await screen.findByRole('button', { name: 'Confirmar entrega' }));
 fireEvent.change(screen.getByLabelText('Efectivo recibido (S/)'), { target: { value: '50' } });
 fireEvent.click(screen.getByRole('button', { name: 'Finalizar entrega' }));
 expect(await screen.findByRole('heading', { name: 'Historial de entregas' })).toBeInTheDocument();
 expect(await screen.findByText('Entrega ' + delivered.code + ' confirmada.')).toBeInTheDocument();
 expect(orderingApi.action).toHaveBeenCalledWith('/courier/assignments/' + picked.assignment!.id + '/deliver', { expectedVersion: 5, cashReceivedCents: 5000 });
});
it('conserva comentario de incidencia si GET no confirma el registro', async () => {
 view(); fireEvent.click(await screen.findByRole('button', { name: 'Reportar incidencia' }));
 const dialog = screen.getByRole('dialog'); fireEvent.change(within(dialog).getByLabelText('Comentario adicional (opcional)'), { target: { value: 'Necesito ayuda' } });
 fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar incidencia' }));
 await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('No se pudo verificar'));
 expect(within(dialog).getByLabelText('Comentario adicional (opcional)')).toHaveValue('Necesito ayuda');
 expect(screen.queryByText('Incidencia enviada a soporte.')).not.toBeInTheDocument();
});
it('libera antes de recojo y verifica la asignación cancelada en history', async () => {
 vi.mocked(orderingApi.action).mockImplementation(async () => { current = { ...accepted, assignment: { ...accepted.assignment!, status: 'cancelled', version: 5 } }; return {}; });
 view(); fireEvent.click(await screen.findByRole('button', { name: 'Liberar asignación' }));
 fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Avería' } });
 fireEvent.click(screen.getByRole('button', { name: 'Confirmar liberación' }));
 expect(await screen.findByRole('heading', { name: 'Solicitudes' })).toBeInTheDocument();
 expect(orderingApi.action).toHaveBeenCalledWith('/courier/assignments/' + accepted.assignment!.id + '/release', { expectedVersion: 4, reason: 'Avería' });
});
it('muestra historial entregado sin reconstruir datos personales ocultos', async () => {
 current = delivered; view('/repartidor/historial');
 const button = await screen.findByRole('button', { name: /Ver detalle de/ });
 fireEvent.click(button); expect(button).toHaveAttribute('aria-expanded', 'true');
 expect(screen.getByText('Destinatario no disponible')).toBeInTheDocument();
 expect(screen.queryByText(courier.phone)).not.toBeInTheDocument();
});
