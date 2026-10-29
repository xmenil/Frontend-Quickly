import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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
  useAuthStore.setState({ sessionStatus: 'ready', isAuthenticated: false, roles: [] }); renderRoute();
  expect(screen.getByText('Login requerido')).toBeInTheDocument();
  expect(screen.queryByText('Panel privado')).not.toBeInTheDocument();
});
it('bloquea panel admin para sesión de cliente', () => {
  useAuthStore.setState({ sessionStatus: 'ready', isAuthenticated: true, roles: ['cliente'], currentUser: { id: '50000000-0000-4000-8000-000000000001', name: 'Cliente', email: 'test@example.test', phone: '+51912345678', role: 'cliente', status: 'activo', createdAt: new Date().toISOString() } }); renderRoute();
  expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
});
