import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AdminTicketsPage } from '../features/admin/AdminTicketsPage';
import { useDataStore } from '../store/dataStore';
import { SupportTicket } from '../domain/types';

const originalState = useDataStore.getState();
const ticket: SupportTicket = {
  id: 'ui_case', userId: 'ui_customer', userName: 'Ana María', userRole: 'cliente',
  subject: 'Entrega incompleta', description: 'Faltó un producto en el pedido.',
  status: 'abierto', priority: 'alta', createdAt: '2026-10-01T12:00:00Z',
};
const resolve = vi.fn();

beforeEach(() => {
  resolve.mockReset();
  useDataStore.setState({ tickets: [ticket], resolveSupportTicket: resolve });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalState);
});

describe('Admin tickets interface', () => {
  it('blocks a whitespace-only response and retains the dialog', () => {
    render(<AdminTicketsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Resolver incidencia: Entrega incompleta' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Respuesta de resolución/), { target: { value: '   ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resolver incidencia' }));
    expect(resolve).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Escribe cómo se resolvió la incidencia');
  });

  it('retains the response when the action does not save a resolution', () => {
    render(<AdminTicketsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Resolver incidencia: Entrega incompleta' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Respuesta de resolución/), { target: { value: 'Se entregó el producto faltante.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resolver incidencia' }));
    expect(resolve).toHaveBeenCalledWith(ticket.id, 'Se entregó el producto faltante.');
    expect(within(dialog).getByRole('alert')).toHaveTextContent('No se pudo guardar la resolución.');
    expect(within(dialog).getByLabelText(/Respuesta de resolución/)).toHaveValue('Se entregó el producto faltante.');
  });

  it('allows reading a resolved case without submitting another resolution', () => {
    useDataStore.setState({ tickets: [{ ...ticket, status: 'resuelto', response: 'Se entregó el producto faltante.' }] });
    render(<AdminTicketsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver caso: Entrega incompleta' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Se entregó el producto faltante.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Resolver incidencia' })).not.toBeInTheDocument();
    expect(resolve).not.toHaveBeenCalled();
  });
});
