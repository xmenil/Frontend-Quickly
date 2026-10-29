import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourierRequestsPage } from '../features/courier/CourierRequestsPage';
import { orderingApi } from '../services/api/orderingApi';
import { operationsApi } from '../services/api/operationsApi';
import { ApiError } from '../services/api/apiClient';
import { useAuthStore } from '../store/authStore';
import { setupCourier, ready, courier } from './courierApiFixtures';
const original = useAuthStore.getState();
beforeEach(() => { setupCourier(); vi.mocked(orderingApi.list).mockImplementation(async (_path, query) => ({ items: query?.scope === 'available' ? [ready] : [], nextCursor: null })); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
function view() { render(<MemoryRouter><Routes><Route path="/" element={<CourierRequestsPage />} /><Route path="/repartidor/entrega-activa" element={<h1>Entrega activa verificada</h1>} /></Routes></MemoryRouter>); }
it('conserva tarjetas y toma el orderId real con versión; navega tras GET', async () => {
 view(); const button = await screen.findByRole('button', { name: /Aceptar entrega/ });
 expect(screen.getByText('Dirección API del comercio')).toBeInTheDocument();
 expect(screen.getByText(/Destino no disponible/)).toBeInTheDocument();
 fireEvent.click(button);
 expect(await screen.findByText('Entrega activa verificada')).toBeInTheDocument();
 expect(orderingApi.action).toHaveBeenCalledWith('/courier/orders/' + ready.id + '/claim', { expectedVersion: 8 });
 expect(orderingApi.detail).toHaveBeenCalledWith(ready.id);
});
it('409 recarga sin reenviar ni anunciar éxito', async () => {
 vi.mocked(orderingApi.action).mockRejectedValue(new ApiError('Pedido tomado', 409, 'CONFLICT'));
 view(); fireEvent.click(await screen.findByRole('button', { name: /Aceptar entrega/ }));
 expect(await screen.findByRole('alert')).toHaveTextContent('Pedido tomado');
 expect(orderingApi.action).toHaveBeenCalledTimes(1); expect(screen.queryByText('Entrega activa verificada')).not.toBeInTheDocument();
});
it('no acepta en pausa ni con asignación activa', async () => {
 vi.mocked(operationsApi.courier).mockResolvedValue({ ...courier, isOnline: false });
 view(); expect(await screen.findByRole('button', { name: /Aceptar entrega/ })).toBeDisabled();
 expect(screen.getByText(/Activa tu disponibilidad/)).toBeInTheDocument();
});
it('rechaza éxito HTTP sin asignación confirmada', async () => {
 vi.mocked(orderingApi.detail).mockResolvedValue(ready);
 view(); fireEvent.click(await screen.findByRole('button', { name: /Aceptar entrega/ }));
 expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo verificar la asignación');
});
it('distingue API vacía y caída sin insertar solicitudes', async () => {
 vi.mocked(orderingApi.list).mockResolvedValue({ items: [], nextCursor: null }); view();
 expect(await screen.findByText('No hay entregas disponibles por ahora')).toBeInTheDocument();
 vi.mocked(orderingApi.list).mockRejectedValue(new Error('Sin conexión'));
 fireEvent(window, new Event('online'));
 await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión'));
 expect(orderingApi.action).not.toHaveBeenCalled();
});
