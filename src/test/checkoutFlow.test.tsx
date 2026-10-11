import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { checkoutSnapshot, parseCashCents, validateCheckoutContext, CheckoutContext } from '../features/checkout/checkoutFlow';
import { CartItem } from '../domain/types';

const originalData = useDataStore.getState();
const originalAuth = useAuthStore.getState();
const originalCart = useCartStore.getState();
const customer = originalData.users.find((user) => user.role === 'cliente')!;
const merchant = { ...originalData.merchants[0], isOpen: true, status: 'activo' as const, minOrderCents: 0 };
const product = { ...originalData.products.find((item) => item.merchantId === merchant.id)!, isAvailable: true, stock: 20 };
const address = originalData.addresses.find((item) => item.userId === customer.id)!;
const zone = { ...originalData.zones.find((item) => item.id === address.zoneId)!, isAvailable: true };
const cartItem: CartItem = { id: 'checkout_item', productId: product.id, merchantId: merchant.id, quantity: 1, unitPriceCents: product.priceCents, selected: true };
const create = vi.fn();

const context = (): CheckoutContext => ({ userId: customer.id, addressId: address.id, items: [cartItem], addresses: [address], zones: [zone], merchants: [merchant], products: [product] });

beforeEach(() => {
  create.mockReset();
  create.mockReturnValue({ success: true });
  useDataStore.setState({ ...originalData, merchants: [merchant], products: [product], addresses: [address], zones: [zone], createPurchase: create });
  useAuthStore.setState({ currentUser: customer, isAuthenticated: true, activeRole: 'cliente' });
  useCartStore.setState({ items: [cartItem] });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalData);
  useAuthStore.setState(originalAuth);
  useCartStore.setState(originalCart);
  localStorage.clear();
});

const renderCheckout = () => render(
  <MemoryRouter initialEntries={['/checkout']}>
    <Routes>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/cliente/pedidos/:id" element={<h1>Pedido registrado</h1>} />
      <Route path="/carrito" element={<h1>Carrito</h1>} />
      <Route path="/login" element={<h1>Iniciar sesión</h1>} />
    </Routes>
  </MemoryRouter>
);

const chooseCash = () => {
  fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Efectivo contra entrega/ }));
  fireEvent.change(screen.getByLabelText('Monto con el que pagarás'), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
};

describe('Checkout validation', () => {
  it('accepts a valid context and rejects a foreign address or unavailable zone', () => {
    expect(validateCheckoutContext(context())).toBeNull();
    expect(validateCheckoutContext({ ...context(), addresses: [{ ...address, userId: 'other_user' }] })).toMatch(/tu cuenta/);
    expect(validateCheckoutContext({ ...context(), zones: [{ ...zone, isAvailable: false }] })).toMatch(/fuera de cobertura/);
  });

  it('rejects a closed store, insufficient aggregate stock and outdated prices', () => {
    expect(validateCheckoutContext({ ...context(), merchants: [{ ...merchant, isOpen: false }] })).toMatch(/comercio/);
    expect(validateCheckoutContext({ ...context(), products: [{ ...product, stock: 1 }], items: [cartItem, { ...cartItem, id: 'second_item' }] })).toMatch(/stock/);
    expect(validateCheckoutContext({ ...context(), products: [{ ...product, priceCents: product.priceCents + 100 }] })).toMatch(/precio/);
  });

  it('changes the review key when address, total or products change', () => {
    const initial = checkoutSnapshot(context()).key;
    expect(checkoutSnapshot({ ...context(), zones: [{ ...zone, baseFeeCents: zone.baseFeeCents + 100 }] }).key).not.toBe(initial);
    expect(checkoutSnapshot({ ...context(), addresses: [{ ...address, reference: 'Otra referencia' }] }).key).not.toBe(initial);
    expect(checkoutSnapshot({ ...context(), items: [{ ...cartItem, quantity: 2 }] }).key).not.toBe(initial);
  });

  it('parses cash amounts without accepting incomplete strings or invalid precision', () => {
    expect(parseCashCents('50,25')).toBe(5025);
    expect(parseCashCents(' 50.25 ')).toBe(5025);
    for (const value of ['', '50abc', '1e3', '-5', '0', '10.999']) expect(parseCashCents(value)).toBeNull();
  });
});

describe('Checkout step protection', () => {
  it('locks future steps and requires explicit payment selection', () => {
    renderCheckout();
    expect(screen.getByRole('button', { name: 'Paso 2: Pago' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Paso 3: Revisión' }));
    expect(screen.queryByRole('button', { name: /Confirmar pedido/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
    expect(create).not.toHaveBeenCalled();
  });

  it('invalidates review when the selected products change', () => {
    renderCheckout();
    chooseCash();
    expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeEnabled();
    act(() => useCartStore.setState({ items: [{ ...cartItem, quantity: 2 }] }));
    expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Los datos del pedido cambiaron.');
    expect(create).not.toHaveBeenCalled();
  });

  it('requires another payment review after changing the method', () => {
    renderCheckout();
    chooseCash();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a pago' }));
    fireEvent.click(screen.getByRole('radio', { name: /Yape.*Plin/ }));
    expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Entiendo que el pago quedará pendiente/ }));
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeEnabled();
  });

  it('blocks duplicate confirmations and registers digital payments as pending', async () => {
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Yape.*Plin/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Entiendo que el pago quedará pendiente/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
    const confirm = screen.getByRole('button', { name: /Confirmar pedido/ });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    const purchase = create.mock.calls[0][0];
    expect(purchase.paymentStatus).toBe('pendiente');
    expect(purchase.merchantOrders[0].paymentStatus).toBe('pendiente');
    expect(purchase.cardLastFour).toBeUndefined();
    expect(screen.getByRole('heading', { name: 'Pedido registrado' })).toBeInTheDocument();
  });

  it('revalidates commerce availability before the delayed submission runs', async () => {
    renderCheckout();
    chooseCash();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));
    act(() => useDataStore.setState({ merchants: [{ ...merchant, isOpen: false }] }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/comercio|datos del pedido/));
    expect(create).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('accepts comma decimals but blocks insufficient or malformed cash amounts', () => {
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Efectivo contra entrega' }));
    const input = screen.getByLabelText('Monto con el que pagarás');
    fireEvent.change(input, { target: { value: '1,00' } });
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(input, { target: { value: '50abc' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa un monto válido en soles');
    fireEvent.change(input, { target: { value: '1000,25' } });
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeEnabled();
  });

  it('uses the exact cash amount and records no change due', () => {
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Efectivo contra entrega' }));
    fireEvent.click(screen.getByRole('button', { name: /^Monto exacto/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Pagarás el monto exacto, sin vuelto.');
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeEnabled();
  });

  it('does not offer preset bills below the order total', () => {
    useDataStore.setState({ products: [{ ...product, priceCents: 30000 }] });
    useCartStore.setState({ items: [{ ...cartItem, unitPriceCents: 30000 }] });
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Efectivo contra entrega' }));
    const group = screen.getByRole('group', { name: 'Montos rápidos de efectivo' });
    expect(group.querySelectorAll('button')).toHaveLength(1);
    expect(group).toHaveTextContent('Monto exacto');
  });

  it('does not collect card details or claim a charge when selecting a card', async () => {
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /Continuar al pago/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Tarjeta de débito o crédito' }));
    expect(screen.getByRole('button', { name: 'Revisar pedido' })).toBeDisabled();
    expect(screen.queryByText(/4242|Número oficial|Escanea QR/)).not.toBeInTheDocument();
    expect(screen.getByText(/No ingreses datos de tu tarjeta/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Entiendo que el pago quedará pendiente/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    expect(create.mock.calls[0][0]).toMatchObject({ paymentMethod: 'tarjeta', paymentStatus: 'pendiente' });
    expect(create.mock.calls[0][0].cardLastFour).toBeUndefined();
  });
  it('shows selected products and links to correct the address and payment in review', () => {
    useCartStore.setState({ items: [cartItem, { ...cartItem, id: 'saved_item', productId: 'saved_product', selected: false }] });
    renderCheckout();
    chooseCash();
    const productsRegion = screen.getByRole('region', { name: 'Productos seleccionados' });
    expect(within(productsRegion).getByText(product.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cambiar dirección' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cambiar pago' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Cambiar productos' })).toHaveAttribute('href', '/carrito');
    expect(screen.getByText(/Los productos que dejaste sin seleccionar seguirán/)).toBeInTheDocument();
  });

  it('keeps the cart and unlocks confirmation when registering the order fails', async () => {
    create.mockReturnValue({ success: false, message: 'No se puede registrar este pedido.' });
    renderCheckout();
    chooseCash();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se puede registrar este pedido.'));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Confirmar pedido/ })).toBeEnabled();
    expect(create).toHaveBeenCalledOnce();
  });

  it('offers recovery without another confirmation if the order is saved but cart cleanup fails', async () => {
    useDataStore.setState({ createPurchase: originalData.createPurchase });
    useCartStore.setState({ removeItems: () => { throw new Error('Storage unavailable'); } });
    renderCheckout();
    chooseCash();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Tu pedido ya está registrado'));
    expect(screen.getByRole('link', { name: 'Ver pedido registrado' })).toHaveAttribute('href', expect.stringMatching(/^\/cliente\/pedidos\/pur_/));
    expect(screen.getByRole('button', { name: /^Pedido registrado/ })).toBeDisabled();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('completes a real store purchase, keeps unselected items and displays the registration confirmation', async () => {
    useDataStore.setState({ createPurchase: originalData.createPurchase });
    useCartStore.setState({ items: [cartItem, { ...cartItem, id: 'saved_item', productId: 'saved_product', selected: false }] });
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cliente/pedidos/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    chooseCash();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar pedido/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pedido registrado' })).toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('El comercio revisará tu pedido.');
    expect(useCartStore.getState().items).toEqual([expect.objectContaining({ id: 'saved_item', selected: false })]);
    const purchase = useDataStore.getState().purchases[0];
    expect(purchase.customerId).toBe(customer.id);
    expect(purchase.merchantOrders[0].items[0].productId).toBe(product.id);
    expect(purchase.grandTotalCents).toBe(product.priceCents + zone.baseFeeCents);
  });

});
