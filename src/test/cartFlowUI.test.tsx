import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CartPage } from '../features/cart/CartPage';
import { useDataStore } from '../store/dataStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { CartItem } from '../domain/types';

const originalData = useDataStore.getState();
const originalCart = useCartStore.getState();
const originalAuth = useAuthStore.getState();
const merchant = { ...originalData.merchants[0], isOpen: true, status: 'activo' as const, minOrderCents: 0 };
const secondMerchant = { ...originalData.merchants[1], isOpen: true, status: 'activo' as const, minOrderCents: 0 };
const product = { ...originalData.products.find((item) => item.merchantId === merchant.id)!, stock: 10, isAvailable: true };
const secondProduct = { ...product, id: 'second_cart_product', name: 'Segundo producto', merchantId: secondMerchant.id };
const firstItem: CartItem = { id: 'cart_first', productId: product.id, merchantId: merchant.id, quantity: 1, unitPriceCents: product.priceCents, selected: true };
const secondItem: CartItem = { id: 'cart_second', productId: secondProduct.id, merchantId: secondMerchant.id, quantity: 1, unitPriceCents: secondProduct.priceCents, selected: false };

beforeEach(() => {
  useDataStore.setState({ ...originalData, merchants: [merchant, secondMerchant], products: [product, secondProduct] });
  useCartStore.setState({ items: [firstItem, secondItem] });
  useAuthStore.setState({ isAuthenticated: true, currentUser: originalData.users.find((user) => user.role === 'cliente')! });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalData);
  useCartStore.setState(originalCart);
  useAuthStore.setState(originalAuth);
  localStorage.clear();
});

const renderCart = () => render(
  <MemoryRouter initialEntries={['/carrito']}>
    <Routes>
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/checkout" element={<h1>Elegir dirección</h1>} />
      <Route path="/login" element={<h1>Iniciar sesión</h1>} />
    </Routes>
  </MemoryRouter>
);

describe('Cart selection and checkout flow', () => {
  it('switches the selected merchant without deleting products saved for later', () => {
    renderCart();
    fireEvent.click(screen.getByRole('button', { name: `Comprar de ${secondMerchant.name}` }));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.id === firstItem.id)?.selected).toBe(false);
    expect(items.find((item) => item.id === secondItem.id)?.selected).toBe(true);
    expect(screen.getByRole('checkbox', { name: `Seleccionar ${secondProduct.name}` })).toBeChecked();
  });

  it('changes quantities without toggling product selection and prevents removing the last unit accidentally', () => {
    renderCart();
    expect(screen.getByRole('button', { name: `Disminuir cantidad de ${product.name}` })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: `Aumentar cantidad de ${product.name}` }));
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().items[0].selected).toBe(true);
    expect(useCartStore.getState().items[1].selected).toBe(false);
  });

  it('blocks continuation when selected stock or store availability changes', () => {
    renderCart();
    act(() => useDataStore.setState({ products: [{ ...product, stock: 0 }, secondProduct] }));
    expect(screen.getByRole('button', { name: 'Continuar con la dirección' })).toBeDisabled();
    act(() => useDataStore.setState({ products: [product, secondProduct], merchants: [{ ...merchant, isOpen: false }, secondMerchant] }));
    expect(screen.getByRole('button', { name: 'Continuar con la dirección' })).toBeDisabled();
    expect(screen.getByText('Este comercio no está atendiendo. Puedes conservar sus productos para después.')).toBeInTheDocument();
  });

  it('labels the delivery estimate and proceeds only with the current selection', () => {
    renderCart();
    const summary = screen.getByRole('region', { name: 'Resumen del pedido' });
    expect(within(summary).getByText('Envío estimado')).toBeInTheDocument();
    expect(within(summary).getByText('Total estimado')).toBeInTheDocument();
    expect(within(summary).getByText('El envío y el total se actualizarán al elegir tu dirección de entrega.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con la dirección' }));
    expect(screen.getByRole('heading', { name: 'Elegir dirección' })).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('requires confirmation before clearing all products, including those saved for later', () => {
    renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }));
    const dialog = screen.getByRole('dialog');
    expect(useCartStore.getState().items).toHaveLength(2);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(useCartStore.getState().items).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Vaciar carrito' }));
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });
});
