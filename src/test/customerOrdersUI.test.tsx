import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { CustomerOrdersPage } from '../features/orders/CustomerOrdersPage';
import { TrackingPage } from '../features/orders/TrackingPage';
import { orderingApi } from '../services/api/orderingApi';
import { engagementApi } from '../services/api/engagementApi';
import { setupCheckout, customer, order, uid } from './checkoutFixtures';
import { customerPurchase, purchaseStatus } from '../features/orders/customerOrderModel';
import { useAuthStore } from '../store/authStore';
import { useRealCartStore } from '../store/realCartStore';
const originalAuth = useAuthStore.getState(); const originalCart = useRealCartStore.getState();
beforeEach(() => { setupCheckout(); vi.spyOn(orderingApi, 'detail').mockResolvedValue(order); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(originalAuth); useRealCartStore.setState(originalCart); sessionStorage.clear(); localStorage.clear(); });
function detail() { return render(<MemoryRouter initialEntries={['/cliente/pedidos/' + order.id]}><Routes><Route path="/cliente/pedidos/:id" element={<OrderDetailPage />} /></Routes></MemoryRouter>); }
describe('Vistas originales de pedidos con API', () => {
 it('mapea estados y conserva destino y precios históricos sin inventar imágenes ni repartidor', () => {
  const view = customerPurchase([order], customer.id);
  expect(view.grandTotalCents).toBe(order.totalCents); expect(view.addressSnapshot.street).toBe(order.destination!.street);
  expect(view.merchantOrders[0].items[0].productImage).toBe(''); expect(view.merchantOrders[0].courierName).toBeUndefined();
  expect(purchaseStatus(['delivered', 'preparing'])).toBe('entrega_parcial');
  expect(purchaseStatus(['delivered', 'cancelled'])).toBe('finalizado_con_cancelaciones');
  expect(customerPurchase([{ ...order, paymentStatus: 'cancelled', status: 'cancelled' }], customer.id).paymentStatus).toBe('cancelado');
 });
 it('carga todas las páginas y agrupa las órdenes sin inventar cantidades de productos', async () => {
  vi.spyOn(orderingApi, 'list').mockResolvedValueOnce({ items: [{ ...order, checkoutGroupId: uid(60) }], nextCursor: uid(61) })
   .mockResolvedValueOnce({ items: [{ ...order, id: uid(62), checkoutGroupId: uid(60) }], nextCursor: null });
  render(<MemoryRouter><CustomerOrdersPage /></MemoryRouter>);
  await screen.findByRole('link', { name: 'Ver Detalle' });
  expect(orderingApi.list).toHaveBeenCalledTimes(2); expect(screen.getByRole('button', { name: 'Todos (1)' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver Detalle' })).toHaveAttribute('href', '/cliente/compras/' + uid(60));
  expect(screen.queryByText(/0 productos/)).not.toBeInTheDocument();
 });
 it('muestra un error de consulta sin pedidos de ejemplo', async () => {
  vi.mocked(orderingApi.detail).mockRejectedValue(new Error('Pedido no disponible'));
  detail(); await screen.findByRole('alert'); expect(screen.queryByText('PED-API')).not.toBeInTheDocument();
 });
 it('cancela usando la versión del servidor y refresca el detalle', async () => {
  const action = vi.spyOn(orderingApi, 'action').mockResolvedValue({});
  detail(); fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar pedido' }));
  await waitFor(() => expect(action).toHaveBeenCalledWith('/orders/' + order.id + '/cancellations', { expectedVersion: 1, reason: 'Cambié de opinión' }));
  await waitFor(() => expect(orderingApi.detail).toHaveBeenCalledTimes(2)); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 });
 it('conserva el motivo cuando el servidor rechaza la cancelación', async () => {
  vi.spyOn(orderingApi, 'action').mockRejectedValue(new Error('El pedido ya cambió de estado'));
  detail(); fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
  fireEvent.change(screen.getByLabelText('Motivo de la cancelación'), { target: { value: 'Dirección incorrecta' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar pedido' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('El pedido ya cambió de estado'));
  expect(screen.getByLabelText('Motivo de la cancelación')).toHaveValue('Dirección incorrecta');
 });
 it('solo agradece la valoración después de que el servidor la guarda', async () => {
  vi.mocked(orderingApi.detail).mockResolvedValue({ ...order, status: 'delivered' });
  const review = vi.spyOn(engagementApi, 'review').mockRejectedValueOnce(new Error('No se pudo publicar')).mockResolvedValue({});
  detail(); fireEvent.click(await screen.findByRole('button', { name: 'Valorar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Publicar Valoración' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('No se pudo publicar'));
  expect(screen.queryByText('¡Muchas gracias por tu valoración!')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Publicar Valoración' }));
  await screen.findByText('¡Muchas gracias por tu valoración!'); expect(review).toHaveBeenCalledWith(order.id, { rating: 5, comment: '' });
 });
 it('mantiene mapa y timeline, usando estados reales sin GPS ni ETA ficticios', async () => {
  vi.mocked(orderingApi.detail).mockResolvedValue({ ...order, status: 'in_transit', events: [{ status: 'in_transit', reason: 'Despacho confirmado', occurredAt: order.createdAt }] });
  render(<MemoryRouter initialEntries={['/cliente/seguimiento/' + order.id]}><Routes><Route path="/cliente/seguimiento/:id" element={<TrackingPage />} /></Routes></MemoryRouter>);
  await screen.findByRole('heading', { name: 'Seguimiento del Pedido' });
  expect(screen.getByText('Despacho confirmado')).toBeInTheDocument(); expect(screen.queryByText(/10-15 min/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver al detalle del pedido' })).toHaveAttribute('href', '/cliente/pedidos/' + order.id);
 });
});
