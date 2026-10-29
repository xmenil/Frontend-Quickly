import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AdminTicketsPage } from '../features/admin/AdminTicketsPage';
import { useAuthStore } from '../store/authStore';
import { engagementApi } from '../services/api/engagementApi';
import { setupAdmin, ticket, admin, uid } from './adminApiFixtures';
const original = useAuthStore.getState(); beforeEach(setupAdmin);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
async function open() { render(<AdminTicketsPage />); fireEvent.click(await screen.findByRole('button', { name: 'Resolver incidencia: ' + ticket.subject })); await screen.findByLabelText(/Respuesta del caso/); return screen.getByRole('dialog'); }
it('consulta conversación autorizada sin inventar solicitante ni rol', async () => {
 const dialog = await open(); expect(within(dialog).getAllByText('Faltó un producto').length).toBeGreaterThan(0);
 expect(within(dialog).getByText(/Solicitante no informado/)).toBeInTheDocument(); expect(within(dialog).getByRole('button', { name: 'Guardar respuesta y estado' })).toBeDisabled();
 expect(engagementApi.ticket).toHaveBeenCalledWith(true, ticket.id, expect.any(AbortSignal));
});
it('conserva respuesta si POST no se refleja en GET', async () => {
 const dialog = await open(); fireEvent.change(within(dialog).getByLabelText(/Respuesta del caso/), { target: { value: 'Revisión del caso' } }); fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar respuesta y estado' }));
 expect(await within(dialog).findByRole('alert')).toHaveTextContent('No se pudo verificar'); expect(within(dialog).getByLabelText(/Respuesta del caso/)).toHaveValue('Revisión del caso');
 expect(engagementApi.decide).toHaveBeenCalledWith(ticket.id, { expectedVersion: 7, status: 'resolved', priority: 'high', body: 'Revisión del caso' });
});
it('guarda mensaje, prioridad y estado con versión y verificación', async () => {
 vi.mocked(engagementApi.decide).mockImplementation(async (_id, body) => { vi.mocked(engagementApi.ticket).mockResolvedValue({ ...ticket, status: body.status as 'resolved', priority: body.priority as 'normal', version: 8, messages: [...ticket.messages, { id: uid(130), authorUserId: admin.id, body: body.body, createdAt: ticket.createdAt }] }); });
 const dialog = await open(); fireEvent.change(within(dialog).getByLabelText('Nuevo estado'), { target: { value: 'in_review' } }); fireEvent.change(within(dialog).getByLabelText('Prioridad del caso'), { target: { value: 'normal' } });
 fireEvent.change(within(dialog).getByLabelText(/Respuesta del caso/), { target: { value: 'Revisión del caso' } }); fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar respuesta y estado' }));
 expect(await screen.findByText('Respuesta y estado del caso confirmados.')).toBeInTheDocument(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(engagementApi.decide).toHaveBeenCalledWith(ticket.id, { expectedVersion: 7, status: 'in_review', priority: 'normal', body: 'Revisión del caso' });
});
