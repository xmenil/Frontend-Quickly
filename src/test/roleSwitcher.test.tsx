import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoleSwitcher } from '../components/shared/RoleSwitcher';
import { useAuthStore } from '../store/authStore';
afterEach(cleanup);
it('solo ofrece paneles concedidos a la cuenta actual, sin cuentas de demostración', () => {
  const switchRole = vi.fn();
  useAuthStore.setState({ isAuthenticated: true, roles: ['cliente'], activeRole: 'cliente', switchRole,
    currentUser: { id: '50000000-0000-4000-8000-000000000001', name: 'Cuenta de prueba', email: 'test@example.test', phone: '+51912345678', role: 'cliente', status: 'activo', createdAt: new Date().toISOString() } });
  render(<MemoryRouter><RoleSwitcher /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Panel:/ }));
  expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Comercio' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cliente' }));
  expect(switchRole).toHaveBeenCalledWith('cliente');
});
it('no permite elegir identidades cuando no existe una sesión', () => {
  useAuthStore.setState({ currentUser: null, isAuthenticated: false, roles: [] });
  const { container } = render(<MemoryRouter><RoleSwitcher /></MemoryRouter>);
  expect(container).toBeEmptyDOMElement();
});
