import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CartPage } from '../features/cart/CartPage';
import { useRealCartStore, CartIntent } from '../store/realCartStore';
import { useAuthStore } from '../store/authStore';
import { catalogApi, CatalogProduct } from '../services/api/catalogApi';

const mockProduct1: CatalogProduct = {
  id: '20000000-0000-4000-8000-000000000001',
  storeId: '30000000-0000-4000-8000-000000000001',
  storeName: 'Restaurante & Pollería Rubén',
  categoryId: '40000000-0000-4000-8000-000000000001',
  name: 'Tacacho con Cecina y Chorizo Amazónico',
  description: 'Plato típico de la selva',
  brand: null,
  isActive: true,
  position: 1,
  skus: [
    {
      id: '10000000-0000-4000-8000-000000000001',
      skuCode: 'TAC-001',
      variantName: 'Personal',
      priceCents: 2500,
      barcode: null,
      isActive: true,
      availableStock: 10,
    },
  ],
  images: [],
};

const mockProduct2: CatalogProduct = {
  id: '20000000-0000-4000-8000-000000000002',
  storeId: '30000000-0000-4000-8000-000000000002',
  storeName: 'Café & Juguería Central',
  categoryId: '40000000-0000-4000-8000-000000000002',
  name: 'Segundo producto',
  description: 'Bebida',
  brand: null,
  isActive: true,
  position: 2,
  skus: [
    {
      id: '10000000-0000-4000-8000-000000000002',
      skuCode: 'BEB-001',
      variantName: 'Mediano',
      priceCents: 1500,
      barcode: null,
      isActive: true,
      availableStock: 10,
    },
  ],
  images: [],
};

const firstItem: CartIntent = {
  skuId: '10000000-0000-4000-8000-000000000001',
  productId: '20000000-0000-4000-8000-000000000001',
  storeId: '30000000-0000-4000-8000-000000000001',
  quantity: 1,
  note: '',
  selected: true,
  revision: '50000000-0000-4000-8000-000000000001',
};

const secondItem: CartIntent = {
  skuId: '10000000-0000-4000-8000-000000000002',
  productId: '20000000-0000-4000-8000-000000000002',
  storeId: '30000000-0000-4000-8000-000000000002',
  quantity: 1,
  note: '',
  selected: false,
  revision: '50000000-0000-4000-8000-000000000002',
};

beforeEach(() => {
  vi.spyOn(catalogApi, 'product').mockImplementation(async (id: string) => {
    if (id === mockProduct1.id) return mockProduct1;
    if (id === mockProduct2.id) return mockProduct2;
    throw new Error('Not found');
  });

  useRealCartStore.setState({ items: [firstItem, secondItem], notice: '' });
  useAuthStore.setState({
    isAuthenticated: true,
    currentUser: {
      id: 'user-1',
      email: 'cliente@quickly.pe',
      name: 'Cliente de Prueba',
      phone: '962123456',
      role: 'cliente',
      status: 'activo',
      createdAt: '2026-10-27T00:00:00Z',
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useRealCartStore.setState({ items: [], notice: '' });
  localStorage.clear();
});

const renderCart = async () => {
  const result = render(
    <MemoryRouter initialEntries={['/carrito']}>
      <Routes>
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/checkout" element={<h1>Elegir dirección</h1>} />
        <Route path="/login" element={<h1>Iniciar sesión</h1>} />
      </Routes>
    </MemoryRouter>
  );

  // Esperar a que se carguen los productos de la API
  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

describe('Cart selection and checkout flow', () => {
  it('switches the selected merchant without deleting products saved for later', async () => {
    await renderCart();

    const selectButtons = screen.getAllByRole('button', { name: 'Seleccionar tienda' });
    expect(selectButtons.length).toBeGreaterThan(0);

    fireEvent.click(selectButtons[0]);

    const items = useRealCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.skuId === secondItem.skuId)?.selected).toBe(true);
  });

  it('changes quantities without toggling product selection and prevents removing the last unit accidentally', async () => {
    await renderCart();

    const minusButton = screen.getByRole('button', {
      name: `Disminuir cantidad de ${mockProduct1.name}`,
    });
    expect(minusButton).toBeDisabled();

    const plusButton = screen.getByRole('button', {
      name: `Aumentar cantidad de ${mockProduct1.name}`,
    });
    fireEvent.click(plusButton);

    const items = useRealCartStore.getState().items;
    expect(items.find((i) => i.skuId === firstItem.skuId)?.quantity).toBe(2);
    expect(items.find((i) => i.skuId === firstItem.skuId)?.selected).toBe(true);
    expect(items.find((i) => i.skuId === secondItem.skuId)?.selected).toBe(false);
  });

  it('blocks continuation when selected stock is insufficient', async () => {
    vi.spyOn(catalogApi, 'product').mockImplementation(async (id: string) => {
      if (id === mockProduct1.id) {
        return {
          ...mockProduct1,
          skus: [{ ...mockProduct1.skus[0], availableStock: 0 }],
        };
      }
      return mockProduct2;
    });

    await renderCart();

    expect(screen.getByRole('button', { name: 'Continuar con la compra' })).toBeDisabled();
    expect(
      screen.getByText(/solo quedan 0 unidades disponibles en inventario/i)
    ).toBeInTheDocument();
  });

  it('labels the delivery estimate and proceeds only with the current selection', async () => {
    await renderCart();

    const summary = screen.getByRole('region', { name: 'Resumen del pedido' });
    expect(within(summary).getByText('Tarifa de envío')).toBeInTheDocument();
    expect(within(summary).getByText('Subtotal estimado')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar con la compra' }));
    expect(screen.getByRole('heading', { name: 'Elegir dirección' })).toBeInTheDocument();
    expect(useRealCartStore.getState().items).toHaveLength(2);
  });

  it('requires confirmation before clearing all products, including those saved for later', async () => {
    await renderCart();

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }));
    const dialog = screen.getByRole('dialog');
    expect(useRealCartStore.getState().items).toHaveLength(2);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(useRealCartStore.getState().items).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar carrito' }));
    const confirmButtons = screen.getAllByRole('button', { name: 'Vaciar carrito' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(useRealCartStore.getState().items).toHaveLength(0);
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });
});
