import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { useDataStore } from '../store/dataStore';
import { User } from '../domain/types';

const originalState = useDataStore.getState();
const pendingUser: User = {
  id: 'ui_pending', name: 'Ana María', email: 'ana@example.test', phone: '962123456',
  role: 'comercio', status: 'pendiente_aprobacion', createdAt: '2026-10-01T12:00:00Z',
};
const rejectUser = vi.fn();

beforeEach(() => {
  rejectUser.mockReset();
  useDataStore.setState({
    users: [pendingUser],
    adminRejectUser: rejectUser,
  });
});

afterEach(() => {
  cleanup();
  useDataStore.setState(originalState);
});

describe('Admin users interface', () => {
  it('keeps the dialog open and blocks a whitespace-only reason', () => {
    render(<AdminUsersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Motivo de la decisión/), { target: { value: '   ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar rechazo' }));
    expect(rejectUser).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Escribe el motivo antes de continuar.');
    expect(within(dialog).getByLabelText(/Motivo de la decisión/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps the reason if the existing action does not update the account', () => {
    render(<AdminUsersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Motivo de la decisión/), { target: { value: 'Falta documentación.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar rechazo' }));
    expect(rejectUser).toHaveBeenCalledWith(pendingUser.id, 'Falta documentación.');
    expect(within(dialog).getByLabelText(/Motivo de la decisión/)).toHaveValue('Falta documentación.');
    expect(within(dialog).getByRole('alert')).toHaveTextContent('No se pudo completar la acción.');
  });

  it('recovers from an empty search by clearing the filters', () => {
    render(<AdminUsersPage />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), { target: { value: 'sin coincidencias' } });
    expect(screen.getByText('No encontramos usuarios con estos filtros')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);
    expect(screen.getByRole('heading', { name: 'Ana María' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});
