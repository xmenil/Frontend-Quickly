import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourierActiveDeliveryPage } from '../features/courier/CourierActiveDeliveryPage';
import { CourierHistoryPage } from '../features/courier/CourierHistoryPage';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { Purchase } from '../domain/types';

const originalData = useDataStore.getState();
const originalAuth = useAuthStore.getState();
const courier = originalData.couriers[0];
const purchase: Purchase = {
  ...originalData.purchases[0],
  merchantOrders: [{
    ...originalData.purchases[0].merchantOrders[0],
    id: 'ui_active', courierId: courier.id, status: 'en_camino',
  }],
};
const advance = vi.fn();
const report = vi.fn();

beforeEach(() => {
  advance.mockReset();
  report.mockReset();
  advance.mockReturnValue({ success: false, message: 'No se puede avanzar este pedido.' });
  useDataStore.setState({ purchases: [purchase], couriers: [courier], tickets: [], courierAdvanceDelivery: advance, courierReportIncident: report });
  useAuthStore.setState({ currentUser: null });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalData);
  useAuthStore.setState(originalAuth);
});

const renderDelivery = (path = '/repartidor/entrega-activa') => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/repartidor/entrega-activa" element={<CourierActiveDeliveryPage />} />
      <Route path="/repartidor/historial" element={<CourierHistoryPage />} />
    </Routes>
  </MemoryRouter>
);

describe('Courier delivery and history interface', () => {
  it('shows a pickup error without leaving the active delivery', () => {
    useDataStore.setState({ purchases: [{ ...purchase, merchantOrders: [{ ...purchase.merchantOrders[0], status: 'listo_recoger' }] }] });
    renderDelivery();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar recojo' }));
    expect(advance).toHaveBeenCalledWith('ui_active', courier.id, 'pickup', 'Pedido retirado de la tienda');
    expect(screen.getByRole('alert')).toHaveTextContent('No se puede avanzar este pedido.');
    expect(screen.getByRole('heading', { name: 'Recoger en el comercio' })).toBeInTheDocument();
  });

  it('requires confirmation and retains the dialog if completing delivery fails', () => {
    renderDelivery();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    expect(advance).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finalizar entrega' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('No se puede avanzar este pedido.');
    expect(screen.queryByRole('heading', { name: 'Historial de entregas' })).not.toBeInTheDocument();
  });

  it('shows the delivery confirmation in history after success', () => {
    advance.mockImplementation(() => {
      useDataStore.setState({ purchases: [{ ...purchase, merchantOrders: [{ ...purchase.merchantOrders[0], status: 'entregado' }] }] });
      return { success: true };
    });
    renderDelivery();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Finalizar entrega' }));
    expect(screen.getByRole('heading', { name: 'Historial de entregas' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`Entrega ${purchase.code} confirmada.`);
  });

  it('retains the comment and shows an error if the incident was not saved', () => {
    renderDelivery();
    fireEvent.click(screen.getByRole('button', { name: 'Reportar incidencia' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Comentario adicional (opcional)'), { target: { value: 'Necesito ayuda para ubicar la dirección.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar incidencia' }));
    expect(report).toHaveBeenCalledWith('ui_active', courier.id, 'Lluvia intensa en Tingo María', 'Necesito ayuda para ubicar la dirección.');
    expect(within(dialog).getByRole('alert')).toHaveTextContent('No se pudo enviar la incidencia.');
    expect(within(dialog).getByLabelText('Comentario adicional (opcional)')).toHaveValue('Necesito ayuda para ubicar la dirección.');
  });

  it('expands and collapses the complete history details', () => {
    useDataStore.setState({ purchases: [{ ...purchase, merchantOrders: [{ ...purchase.merchantOrders[0], status: 'entregado' }] }] });
    renderDelivery('/repartidor/historial');
    const button = screen.getByRole('button', { name: /Ver detalle de/ });
    const detail = document.getElementById(button.getAttribute('aria-controls')!);
    expect(detail).not.toBeVisible();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(detail).toBeVisible();
    expect(within(detail!).getByText(purchase.merchantOrders[0].merchantAddress)).toBeInTheDocument();
    fireEvent.click(button);
    expect(detail).not.toBeVisible();
  });
});
