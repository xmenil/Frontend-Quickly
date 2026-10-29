import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { useAuthStore } from '../store/authStore';
import { operationsApi } from '../services/api/operationsApi';
import { ApiError } from '../services/api/apiClient';
import { setupAdmin, targetUser } from './adminApiFixtures';
const original = useAuthStore.getState(); beforeEach(setupAdmin);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
it('filtra por cualquier rol real de una cuenta sin conceder roles', async () => {
 render(<AdminUsersPage />); await screen.findByText(targetUser.fullName);
 fireEvent.change(screen.getByLabelText('Tipo de cuenta'), { target: { value: 'comercio' } });
 expect(screen.getByText(targetUser.fullName)).toBeInTheDocument(); expect(operationsApi.userStatus).not.toHaveBeenCalled();
});
it('valida motivo y conserva el diálogo ante conflicto 409', async () => {
 vi.mocked(operationsApi.userStatus).mockRejectedValue(new ApiError('Cuenta con entregas activas', 409, 'CONFLICT'));
 render(<AdminUsersPage />); fireEvent.click(await screen.findByRole('button', { name: 'Suspender' })); const dialog = screen.getByRole('dialog');
 fireEvent.change(within(dialog).getByLabelText(/Motivo de la decisión/), { target: { value: '  ' } });
 fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar cambio' }));
 expect(within(dialog).getByRole('alert')).toHaveTextContent('al menos 3'); expect(operationsApi.userStatus).not.toHaveBeenCalled();
 fireEvent.change(within(dialog).getByLabelText(/Motivo de la decisión/), { target: { value: 'Revisión de acceso' } });
 fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar cambio' }));
 expect(await within(dialog).findByRole('alert')).toHaveTextContent('entregas activas');
 expect(within(dialog).getByLabelText(/Motivo de la decisión/)).toHaveValue('Revisión de acceso'); expect(operationsApi.userStatus).toHaveBeenCalledTimes(1);
});
it('comprueba con GET el estado y motivo antes de cerrar', async () => {
 vi.mocked(operationsApi.userStatus).mockImplementation(async (_id, body) => { vi.mocked(operationsApi.adminUsers).mockResolvedValue({ items: [{ ...targetUser, status: body.status, statusReason: body.reason }], nextCursor: null }); });
 render(<AdminUsersPage />); fireEvent.click(await screen.findByRole('button', { name: 'Suspender' }));
 fireEvent.change(screen.getByLabelText(/Motivo de la decisión/), { target: { value: 'Revisión de acceso' } }); fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
 expect(await screen.findByText('Estado de cuenta confirmado.')).toBeInTheDocument(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(operationsApi.userStatus).toHaveBeenCalledWith(targetUser.id, { status: 'suspended', reason: 'Revisión de acceso' });
});
it('un 403 se muestra sin cuentas mock', async () => {
 vi.mocked(operationsApi.adminUsers).mockRejectedValue(new ApiError('Solo administración', 403, 'FORBIDDEN'));
 render(<AdminUsersPage />); expect(await screen.findByRole('alert')).toHaveTextContent('Solo administración'); expect(screen.queryByText(targetUser.fullName)).not.toBeInTheDocument();
});
