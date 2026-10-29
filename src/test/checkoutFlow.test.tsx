import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { parseCashCents } from '../features/checkout/checkoutFlow';
import { checkoutJournalKey, pendingFor, saveCheckoutIntent } from '../features/checkout/checkoutIntent';
import { orderingApi } from '../services/api/orderingApi';
import { billingApi } from '../services/api/billingApi';
import { ApiError } from '../services/api/apiClient';
import { useRealCartStore } from '../store/realCartStore';
import { useAuthStore } from '../store/authStore';
import { customer, item, order, quote, uid, setupCheckout } from './checkoutFixtures';
const originalAuth = useAuthStore.getState(); const originalCart = useRealCartStore.getState();
beforeEach(setupCheckout);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(originalAuth); useRealCartStore.setState(originalCart); sessionStorage.clear(); localStorage.clear(); });
function renderCheckout() { return render(<MemoryRouter initialEntries={['/checkout']}><Routes>
 <Route path="/checkout" element={<CheckoutPage />} /><Route path="/cliente/pedidos/:id" element={<h1>Pedido registrado</h1>} />
 <Route path="/cliente/compras/:id" element={<h1>Compra registrada</h1>} /><Route path="/carrito" element={<h1>Carrito</h1>} /><Route path="/login" element={<h1>Iniciar sesión</h1>} />
</Routes></MemoryRouter>); }
async function payment() {
 await waitFor(() => expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeEnabled());
 fireEvent.click(screen.getByRole('button', { name: 'Continuar al pago' }));
 await waitFor(() => expect(screen.getByRole('radio', { name: 'Efectivo contra entrega' })).toBeEnabled());
 fireEvent.click(screen.getByRole('radio', { name: 'Efectivo contra entrega' }));
 if (!screen.getByLabelText('Monto con el que pagarás').hasAttribute('disabled')) fireEvent.change(screen.getByLabelText('Monto con el que pagarás'), { target: { value: '50' } });
}
async function review() { await payment(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); await screen.findByRole('button', { name: /Confirmar pedido/ }); }
const confirm = () => fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));
describe('Checkout original con API', () => {
 it('rechaza una cotización con productos o sumas inconsistentes', async () => {
  vi.mocked(orderingApi.quote).mockResolvedValue({ ...quote, totalCents: 1 });
  renderCheckout(); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La cotización no coincide'));
  expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeDisabled(); expect(orderingApi.create).not.toHaveBeenCalled();
 });
 it('respeta la indisponibilidad de efectivo informada por la API', async () => {
  vi.mocked(billingApi.methods).mockResolvedValue([{ code: 'cash', label: 'Efectivo', available: false, unavailableReason: 'No disponible' }]);
  renderCheckout(); await waitFor(() => expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Continuar al pago' }));
  expect(screen.getByRole('radio', { name: 'Efectivo contra entrega' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();
 });
 it('un rechazo comercial libera el intento y obliga a una nueva revisión', async () => {
  vi.mocked(orderingApi.create).mockRejectedValue(new ApiError('El precio cambió', 409, 'PRICE_CHANGED'));
  renderCheckout(); await review(); confirm();
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('El precio cambió'));
  expect(pendingFor(customer.id)).toBeNull(); expect(useRealCartStore.getState().items).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
 });
 it('recupera una confirmación de grupo conservando el tipo de intento', async () => {
  saveCheckoutIntent(customer.id, { key: uid(65), group: true, body: { addressId: uid(2), paymentMethod: 'cash', items: [{ skuId: item.skuId, quantity: 2, note: item.note }], cashTenderCents: null, expectedTotalCents: 2350 }, snapshot: [item] });
  const attempt = vi.spyOn(orderingApi, 'groupAttempt').mockResolvedValue({ id: uid(66), createdAt: customer.createdAt, subtotalCents: 2000, deliveryFeeCents: 350, totalCents: 2350, orders: [] });
  const create = vi.spyOn(orderingApi, 'groupCreate'); renderCheckout();
  fireEvent.click(await screen.findByRole('button', { name: 'Recuperar o reintentar confirmación' })); await screen.findByRole('heading', { name: 'Compra registrada' });
  expect(attempt).toHaveBeenCalledWith(uid(65)); expect(create).not.toHaveBeenCalled(); expect(orderingApi.attempt).not.toHaveBeenCalled();
 });
 it('valida el efectivo sin aceptar precisión inválida', () => {
  expect(parseCashCents('50,25')).toBe(5025);
  for (const value of ['', '50abc', '1e3', '-5', '0', '10.999']) expect(parseCashCents(value)).toBeNull();
 });
 it('bloquea pasos futuros y conserva tarjetas digitales deshabilitadas', async () => {
  renderCheckout(); expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
  await payment(); expect(screen.getByRole('radio', { name: 'Yape / Plin' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Tarjeta de débito o crédito' })).toBeDisabled(); expect(orderingApi.create).not.toHaveBeenCalled();
 });
 it('envía intención y total del servidor, sin precios locales', async () => {
  renderCheckout(); await review(); confirm(); await screen.findByRole('heading', { name: 'Pedido registrado' });
  expect(orderingApi.create).toHaveBeenCalledTimes(1);
  const [body, key] = vi.mocked(orderingApi.create).mock.calls[0];
  expect(body).toEqual({ addressId: uid(2), paymentMethod: 'cash', cashTenderCents: 5000, expectedTotalCents: 2350, items: [{ skuId: item.skuId, quantity: 2, note: item.note }] });
  expect(key).toMatch(/^[a-f0-9-]{36}$/); expect(useRealCartStore.getState().items).toEqual([]); expect(pendingFor(customer.id)).toBeNull();
 });
 it('exige revisar otra vez si el servidor cambia precios', async () => {
  renderCheckout(); await payment();
  vi.mocked(orderingApi.quote).mockResolvedValue({ ...quote, items: [{ ...quote.items[0], unitPriceCents: 1100 }], subtotalCents: 2200, totalCents: 2550 });
  fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Los importes cambiaron'));
  expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled(); expect(orderingApi.create).not.toHaveBeenCalled();
 });
 it('invalida revisión al cambiar el carrito', async () => {
  renderCheckout(); await review(); act(() => useRealCartStore.getState().update(item.skuId, { quantity: 1 }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled()); expect(orderingApi.create).not.toHaveBeenCalled();
 });
 it('bloquea doble confirmación y conserva líneas nuevas y no seleccionadas', async () => {
  let resolve!: (value: { orderId: string; purchaseId: string }) => void;
  vi.mocked(orderingApi.create).mockImplementation(() => new Promise(done => { resolve = done; }));
  renderCheckout(); await review(); const button = screen.getByRole('button', { name: /Confirmar pedido/ }); fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(orderingApi.create).toHaveBeenCalledTimes(1));
  act(() => useRealCartStore.setState({ items: [{ ...item, revision: uid(20), quantity: 3 }, { ...item, skuId: uid(21), selected: false }] }));
  await act(async () => resolve({ orderId: order.id, purchaseId: order.purchaseId }));
  await screen.findByRole('heading', { name: 'Pedido registrado' }); expect(useRealCartStore.getState().items).toHaveLength(2);
 });
 it('recupera respuesta perdida tras recargar sin otra creación', async () => {
  vi.mocked(orderingApi.create).mockRejectedValue(new ApiError('Conexión interrumpida', 0, 'NETWORK_ERROR'));
  const view = renderCheckout(); await review(); confirm(); await screen.findByRole('button', { name: 'Recuperar o reintentar confirmación' });
  const pending = pendingFor(customer.id); expect(pending).not.toBeNull(); expect(useRealCartStore.getState().items).toHaveLength(1);
  view.unmount(); renderCheckout(); fireEvent.click(await screen.findByRole('button', { name: 'Recuperar o reintentar confirmación' }));
  await screen.findByRole('heading', { name: 'Pedido registrado' });
  expect(orderingApi.attempt).toHaveBeenCalledWith((pending as { key: string }).key); expect(orderingApi.create).toHaveBeenCalledTimes(1);
 });
 it('reenvía cuerpo y clave idénticos si el intento aún no existe', async () => {
  const pending = saveCheckoutIntent(customer.id, { key: uid(30), group: false, body: { addressId: uid(2), paymentMethod: 'cash', cashTenderCents: 5000, expectedTotalCents: 2350, items: [{ skuId: item.skuId, quantity: 2, note: item.note }] }, snapshot: [item] });
  vi.mocked(orderingApi.attempt).mockRejectedValue(new ApiError('Sin intento', 404, 'NOT_FOUND'));
  renderCheckout(); fireEvent.click(await screen.findByRole('button', { name: 'Recuperar o reintentar confirmación' }));
  await screen.findByRole('heading', { name: 'Pedido registrado' }); expect(orderingApi.create).toHaveBeenCalledWith(pending.body, pending.key);
 });
 it('conserva intento ante conflicto de idempotencia', async () => {
  vi.mocked(orderingApi.create).mockRejectedValue(new ApiError('Clave en conflicto', 409, 'IDEMPOTENCY_CONFLICT'));
  renderCheckout(); await review(); confirm(); await screen.findByRole('button', { name: 'Recuperar o reintentar confirmación' });
  expect(pendingFor(customer.id)).not.toBeNull(); expect(screen.getByRole('link', { name: 'Consultar mis pedidos' })).toBeInTheDocument();
 });
 it('no compra si no puede guardar antes el intento', async () => {
  renderCheckout(); await review(); vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Almacenamiento bloqueado'); });
  confirm(); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Almacenamiento bloqueado')); expect(orderingApi.create).not.toHaveBeenCalled();
 });
 it('no consume carrito si cambia la cuenta durante confirmación', async () => {
  let resolve!: (value: { orderId: string; purchaseId: string }) => void;
  vi.mocked(orderingApi.create).mockImplementation(() => new Promise(done => { resolve = done; }));
  renderCheckout(); await review(); confirm(); act(() => useAuthStore.setState({ currentUser: { ...customer, id: uid(40) } }));
  await act(async () => resolve({ orderId: order.id, purchaseId: order.purchaseId }));
  expect(useRealCartStore.getState().items).toHaveLength(1); expect(sessionStorage.getItem(checkoutJournalKey(customer.id))).not.toBeNull();
  expect(screen.queryByRole('heading', { name: 'Pedido registrado' })).not.toBeInTheDocument();
 });
 it('usa grupo con efectivo exacto por entrega para dos tiendas', async () => {
  const second = { ...quote, storeId: uid(50), storeName: 'Segunda tienda', items: [{ ...quote.items[0], skuId: uid(51) }] };
  useRealCartStore.setState({ items: [item, { ...item, storeId: second.storeId, skuId: uid(51), productId: uid(52) }] });
  vi.spyOn(orderingApi, 'groupQuote').mockResolvedValue({ stores: [quote, second], subtotalCents: 4000, deliveryFeeCents: 700, totalCents: 4700 });
  vi.spyOn(orderingApi, 'groupCreate').mockResolvedValue({ id: uid(53), createdAt: customer.createdAt, subtotalCents: 4000, deliveryFeeCents: 700, totalCents: 4700, orders: [] });
  renderCheckout(); await review(); confirm(); await screen.findByRole('heading', { name: 'Compra registrada' });
  expect(orderingApi.groupCreate).toHaveBeenCalledWith(expect.objectContaining({ cashTenderCents: null, expectedTotalCents: 4700 }), expect.any(String)); expect(orderingApi.create).not.toHaveBeenCalled();
 });
});
