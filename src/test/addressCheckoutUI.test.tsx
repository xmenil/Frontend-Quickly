import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AddressForm } from '../components/shared/AddressForm';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { useDataStore } from '../store/dataStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatCents } from '../lib/currency';
import { CartItem } from '../domain/types';

const originalData = useDataStore.getState();
const originalCart = useCartStore.getState();
const originalAuth = useAuthStore.getState();
const customer = originalData.users.find((user) => user.role === 'cliente')!;
const address = originalData.addresses.find((entry) => entry.userId === customer.id)!;
const zone = { ...originalData.zones.find((entry) => entry.id === address.zoneId)!, isAvailable: true };
const otherZone = { ...originalData.zones.find((entry) => entry.id !== address.zoneId)!, isAvailable: true };
const merchant = { ...originalData.merchants[0], status: 'activo' as const, isOpen: true, minOrderCents: 0 };
const product = { ...originalData.products.find((entry) => entry.merchantId === merchant.id)!, stock: 10, isAvailable: true };
const item: CartItem = { id: 'address_cart', productId: product.id, merchantId: merchant.id, quantity: 1, unitPriceCents: product.priceCents, selected: true };

beforeEach(() => {
  useDataStore.setState({ ...originalData, addresses: [address], zones: [zone, otherZone], merchants: [merchant], products: [product] });
  useAuthStore.setState({ currentUser: customer, isAuthenticated: true, activeRole: 'cliente' });
  useCartStore.setState({ items: [item] });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalData);
  useAuthStore.setState(originalAuth);
  useCartStore.setState(originalCart);
  localStorage.clear();
});

const fillAddress = (container?: HTMLElement) => {
  const query = container ? within(container) : screen;
  fireEvent.change(query.getByLabelText(/Nombre del destinatario/), { target: { value: ' Ana María ' } });
  fireEvent.change(query.getByLabelText(/Celular de contacto/), { target: { value: '962 123 456' } });
  fireEvent.change(query.getByRole('combobox', { name: /Zona de cobertura/ }), { target: { value: otherZone.id } });
  fireEvent.change(query.getByLabelText(/Calle, jirón o avenida/), { target: { value: ' Jr. Amazonas ' } });
  fireEvent.change(query.getByLabelText(/Número, manzana o lote/), { target: { value: ' 123 ' } });
  fireEvent.change(query.getByLabelText(/Referencia para el repartidor/), { target: { value: ' Frente al parque, portón verde ' } });
  fireEvent.change(query.getByLabelText(/Nombre de la dirección/), { target: { value: ' Trabajo ' } });
};

describe('Address form and checkout integration', () => {
  it('starts with an empty phone and explicit coverage selection, then focuses the first validation error', async () => {
    const success = vi.fn();
    render(<AddressForm userId={customer.id} onSuccess={success} onCancel={() => {}} />);
    expect(screen.getByLabelText(/Celular de contacto/)).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(screen.getByLabelText(/Nombre del destinatario/)).toHaveFocus());
    expect(success).not.toHaveBeenCalled();
    expect(useDataStore.getState().addresses).toHaveLength(1);
  });

  it('returns the saved address with trimmed fields and a normalized phone', async () => {
    const success = vi.fn();
    render(<AddressForm userId={customer.id} onSuccess={success} onCancel={() => {}} />);
    fillAddress();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(success).toHaveBeenCalledOnce());
    const saved = success.mock.calls[0][0];
    expect(saved).toMatchObject({ userId: customer.id, recipientName: 'Ana María', phone: '962123456', street: 'Jr. Amazonas', number: '123', label: 'Trabajo', zoneId: otherZone.id, isDefault: false });
    expect(useDataStore.getState().addresses.find((entry) => entry.id === address.id)?.isDefault).toBe(address.isDefault);
  });

  it('rejects saving an existing address whose coverage is no longer available', async () => {
    const update = vi.fn();
    useDataStore.setState({ zones: [{ ...zone, isAvailable: false }, otherZone], updateAddress: update });
    render(<AddressForm initialData={address} userId={customer.id} onSuccess={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar dirección' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Esta zona no tiene cobertura.'));
    expect(update).not.toHaveBeenCalled();
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById(select.getAttribute('aria-describedby')!)).toHaveTextContent('Esta zona no tiene cobertura.');
  });

  it('preserves entered data if saving fails', async () => {
    useDataStore.setState({ addAddress: () => { throw new Error('Storage unavailable'); } });
    const success = vi.fn();
    render(<AddressForm userId={customer.id} onSuccess={success} onCancel={() => {}} />);
    fillAddress();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar la dirección.'));
    expect(screen.getByLabelText(/Calle, jirón o avenida/)).toHaveValue(' Jr. Amazonas ');
    expect(screen.getByLabelText(/Celular de contacto/)).toHaveValue('962 123 456');
    expect(success).not.toHaveBeenCalled();
  });

  it('selects the new address and updates the checkout shipping total', async () => {
    render(<MemoryRouter initialEntries={['/checkout']}><CheckoutPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva dirección' }));
    const dialog = screen.getByRole('dialog');
    fillAddress(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar dirección' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('radio', { name: 'Entregar en Trabajo: Jr. Amazonas 123' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Dirección guardada y seleccionada.');
    const summary = screen.getByRole('region', { name: 'Resumen del pedido' });
    expect(within(summary).getByText(formatCents(otherZone.baseFeeCents).replace(/\s/g, ' '))).toBeInTheDocument();
    expect(within(summary).getByText(formatCents(product.priceCents + otherZone.baseFeeCents).replace(/\s/g, ' '))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Paso 3: Revisión' })).toBeDisabled();
  });
});
