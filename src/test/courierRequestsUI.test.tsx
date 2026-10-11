import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourierRequestsPage } from '../features/courier/CourierRequestsPage';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { Purchase } from '../domain/types';

const originalData = useDataStore.getState();
const originalAuth = useAuthStore.getState();
const courier = { ...originalData.couriers[0], isAvailable: true };
const purchase: Purchase = {
  ...originalData.purchases[0],
  merchantOrders: [{
    ...originalData.purchases[0].merchantOrders[0],
    id: 'ui_request', status: 'listo_recoger', courierId: undefined,
    merchantAddress: 'Jr. Amazonas 123, frente a la Plaza de Armas de Tingo María',
  }],
};
const accept = vi.fn();

beforeEach(() => {
  accept.mockReset();
  accept.mockReturnValue({ success: false, message: 'Este pedido ya fue tomado por otro repartidor.' });
  useDataStore.setState({ purchases: [purchase], couriers: [courier], courierAcceptOrder: accept });
  useAuthStore.setState({ currentUser: null });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalData);
  useAuthStore.setState(originalAuth);
});

const renderRequests = () => render(
  <MemoryRouter initialEntries={['/repartidor/solicitudes']}>
    <Routes>
      <Route path="/repartidor/solicitudes" element={<CourierRequestsPage />} />
      <Route path="/repartidor/entrega-activa" element={<h1>Entrega activa</h1>} />
    </Routes>
  </MemoryRouter>
);

describe('Courier requests interface', () => {
  it('shows the operation error and keeps the request visible', () => {
    renderRequests();
    expect(screen.getByText(purchase.merchantOrders[0].merchantAddress)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Aceptar entrega/ }));
    expect(accept).toHaveBeenCalledWith('ui_request', courier.id);
    expect(screen.getByRole('alert')).toHaveTextContent('Este pedido ya fue tomado por otro repartidor.');
    expect(screen.getByRole('heading', { name: 'Solicitudes de entrega' })).toBeInTheDocument();
  });

  it('explains why acceptance is disabled while paused', () => {
    useDataStore.setState({ couriers: [{ ...courier, isAvailable: false }] });
    renderRequests();
    expect(screen.getByRole('button', { name: /Aceptar entrega/ })).toBeDisabled();
    expect(screen.getByText(/Activa tu disponibilidad desde la cabecera/)).toBeInTheDocument();
    expect(accept).not.toHaveBeenCalled();
  });

  it('navigates to the active delivery after successful acceptance', () => {
    accept.mockReturnValue({ success: true });
    renderRequests();
    fireEvent.click(screen.getByRole('button', { name: /Aceptar entrega/ }));
    expect(screen.getByRole('heading', { name: 'Entrega activa' })).toBeInTheDocument();
  });

  it('shows a profile empty state when no courier exists', () => {
    useDataStore.setState({ couriers: [] });
    renderRequests();
    expect(screen.getByText('No hay un perfil de repartidor disponible')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aceptar entrega/ })).not.toBeInTheDocument();
  });
});
