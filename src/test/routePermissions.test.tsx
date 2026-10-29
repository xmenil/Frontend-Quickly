import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
vi.mock('../config/appMode', () => ({ isDemoMode: false }));
import { RequireSession } from '../features/auth/SessionBoundary';
import { useAuthStore } from '../store/authStore';

afterEach(cleanup);
function renderRoute() {
  return render(<MemoryRouter initialEntries={['/admin']}><Routes>
    <Route path="/admin" element={<RequireSession role="admin"><p>Panel privado</p></RequireSession>} />
    <Route path="/login" element={<p>Login requerido</p>} />
    <Route path="/acceso-denegado" element={<p>Acceso denegado</p>} />
  </Routes></MemoryRouter>);
}
it('redirige al login antes de mostrar una ruta privada', () => {
  useAuthStore.setState({ isAuthenticated: false, roles: [] }); renderRoute();
  expect(screen.getByText('Login requerido')).toBeInTheDocument();
  expect(screen.queryByText('Panel privado')).not.toBeInTheDocument();
});
it('bloquea panel admin para sesión de cliente', () => {
  useAuthStore.setState({ isAuthenticated: true, roles: ['cliente'] }); renderRoute();
  expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
});
