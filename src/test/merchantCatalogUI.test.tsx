import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MerchantStorePage } from '../features/merchant/MerchantStorePage';
import { MerchantProductsPage } from '../features/merchant/MerchantProductsPage';
import { MerchantSettingsPage } from '../features/merchant/MerchantSettingsPage';
import { operationsApi, Store, StoreMember } from '../services/api/operationsApi';
import { catalogApi, CatalogProduct, InventoryItem } from '../services/api/catalogApi';
import { mediaApi } from '../services/api/mediaApi';
import { useAuthStore } from '../store/authStore';

const mockStore: Store = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'La Selva Gourmet',
  categoryCode: 'restaurantes',
  zoneId: 'b0000000-0000-0000-0000-000000000001',
  zoneName: 'Tingo María Centro',
  description: 'Comida típica de la selva peruana en Leoncio Prado.',
  addressText: 'Av. Alameda Perú 450',
  phone: '+51962789101',
  legalBusinessName: 'La Selva Gourmet S.A.C.',
  taxId: '20601234567',
  status: 'active',
  statusReason: null,
  acceptingOrders: true,
  isOpen: true,
  minimumOrderCents: 1500,
  preparationMinutes: 25,
  createdAt: '2026-10-20T12:00:00.000Z',
  membershipRole: 'owner',
  openingIntervals: [
    { weekday: 1, opensAt: '11:00', closesAt: '22:00' },
    { weekday: 2, opensAt: '11:00', closesAt: '22:00' },
    { weekday: 3, opensAt: '11:00', closesAt: '22:00' },
    { weekday: 4, opensAt: '11:00', closesAt: '22:00' },
    { weekday: 5, opensAt: '11:00', closesAt: '23:00' },
    { weekday: 6, opensAt: '11:00', closesAt: '23:00' },
    { weekday: 7, opensAt: '11:00', closesAt: '22:00' },
  ],
};

const mockProduct: CatalogProduct = {
  id: 'c0000000-0000-0000-0000-000000000001',
  storeId: mockStore.id,
  storeName: mockStore.name,
  categoryId: 'd0000000-0000-0000-0000-000000000001',
  name: 'Tacacho con Cecina',
  description: 'Plato tradicional amazónico con plátano bellaco machacado y cecina ahumada.',
  brand: 'Especialidades',
  isActive: true,
  position: 0,
  skus: [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      skuCode: 'SKU-TACACHO-01',
      variantName: 'Porción Personal',
      priceCents: 2200,
      barcode: null,
      isActive: true,
      availableStock: 12,
    },
  ],
  images: [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      url: '/api/v1/merchant/products/c0000000-0000-0000-0000-000000000001/media/img1.png',
      altText: 'Tacacho con Cecina',
      position: 0,
    },
  ],
};

const mockInventory: InventoryItem[] = [
  {
    skuId: mockProduct.skus[0].id,
    productId: mockProduct.id,
    productName: mockProduct.name,
    skuCode: mockProduct.skus[0].skuCode,
    variantName: mockProduct.skus[0].variantName,
    onHand: 15,
    reserved: 3,
    available: 12,
    lowStockThreshold: 5,
    lowStock: false,
  },
];

const mockMember: StoreMember = {
  userId: 'u0000000-0000-0000-0000-000000000001',
  fullName: 'Juan Pérez Cocina',
  email: 'juan@selvagourmet.pe',
  membershipRole: 'operator',
  isActive: true,
};

const originalAuth = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState({
    ...originalAuth,
    currentUser: {
      id: 'user-merchant-1',
      name: 'Carlos Comercio',
      email: 'carlos@quickly.pe',
      phone: '+51962789100',
      role: 'comercio',
      status: 'activo',
      merchantId: mockStore.id,
      createdAt: '2026-10-20T12:00:00.000Z',
    },
    isAuthenticated: true,
    roles: ['comercio'],
    sessionStatus: 'ready',
  });

  vi.spyOn(operationsApi, 'ownStores').mockResolvedValue({
    items: [mockStore],
    nextCursor: null,
  });
  vi.spyOn(operationsApi, 'store').mockResolvedValue(mockStore);
  vi.spyOn(operationsApi, 'categories').mockResolvedValue([
    { code: 'restaurantes', label: 'Restaurantes' },
    { code: 'bodegas', label: 'Bodegas y Abarrotes' },
  ]);
  vi.spyOn(operationsApi, 'zones').mockResolvedValue([
    {
      id: mockStore.zoneId,
      code: 'TM-CENTRO',
      name: 'Tingo María Centro',
      description: 'Casco urbano',
      baseFeeCents: 350,
      estimatedMinutes: 25,
      isActive: true,
    },
  ]);
  vi.spyOn(operationsApi, 'members').mockResolvedValue([mockMember]);

  vi.spyOn(mediaApi, 'branding').mockResolvedValue({
    logoUrl: null,
    bannerUrl: null,
  });

  vi.spyOn(catalogApi, 'categories').mockResolvedValue([
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      code: 'platos-tipicos',
      name: 'Platos Típicos',
    },
  ]);
  vi.spyOn(catalogApi, 'products').mockResolvedValue({
    items: [mockProduct],
    nextCursor: null,
  });
  vi.spyOn(catalogApi, 'inventory').mockResolvedValue(mockInventory);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.setState(originalAuth);
});

describe('Bloque 4: Gestión de Tienda (MerchantStorePage)', () => {
  it('consulta tiendas autorizadas y muestra perfil comercial real', async () => {
    render(
      <MemoryRouter>
        <MerchantStorePage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Mi Tienda' });
    expect(operationsApi.ownStores).toHaveBeenCalled();
    expect(operationsApi.store).toHaveBeenCalledWith(mockStore.id);
    expect(screen.getAllByText('La Selva Gourmet').length).toBeGreaterThan(0);
    expect(screen.getByText('Av. Alameda Perú 450')).toBeInTheDocument();
    expect(screen.getByText('25 minutos')).toBeInTheDocument();
    expect(screen.getByText('Recepción Activa')).toBeInTheDocument();
  });

  it('guarda cambios comerciales en el servidor y muestra confirmación', async () => {
    const updateSpy = vi.spyOn(operationsApi, 'updateStore').mockResolvedValue({
      ...mockStore,
      name: 'La Selva Gourmet Actualizada',
    });

    render(
      <MemoryRouter>
        <MerchantStorePage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Información' }));

    const nameInput = screen.getByLabelText(/Nombre Comercial/i);
    fireEvent.change(nameInput, { target: { value: 'La Selva Gourmet Actualizada' } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar Cambios' })[0]);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        mockStore.id,
        expect.objectContaining({
          name: 'La Selva Gourmet Actualizada',
        })
      );
    });

    await screen.findByText('Perfil comercial actualizado y guardado correctamente en el servidor.');
  });

  it('conserva el formulario y muestra error cuando la API falla', async () => {
    vi.spyOn(operationsApi, 'updateStore').mockRejectedValueOnce(
      new Error('El nombre ya está registrado por otro comercio')
    );

    render(
      <MemoryRouter>
        <MerchantStorePage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Información' }));

    const nameInput = screen.getByLabelText(/Nombre Comercial/i);
    fireEvent.change(nameInput, { target: { value: 'Nombre En Conflicto' } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar Cambios' })[0]);

    await screen.findByText('El nombre ya está registrado por otro comercio');
    expect(screen.getByLabelText(/Nombre Comercial/i)).toHaveValue('Nombre En Conflicto');
  });

  it('permite pausar y reactivar la recepción de pedidos', async () => {
    const toggleSpy = vi.spyOn(operationsApi, 'updateStore').mockResolvedValue({
      ...mockStore,
      acceptingOrders: false,
    });

    render(
      <MemoryRouter>
        <MerchantStorePage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Pausar' }));

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(mockStore.id, {
        acceptingOrders: false,
      });
    });

    await screen.findByText('Recepción de pedidos pausada con éxito.');
  });
});

describe('Bloque 4: Productos e Inventario (MerchantProductsPage)', () => {
  it('consulta catálogo privado e inventario real y muestra existencias', async () => {
    render(
      <MemoryRouter>
        <MerchantProductsPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Productos' });
    expect(catalogApi.products).toHaveBeenCalledWith(mockStore.id);
    expect(catalogApi.inventory).toHaveBeenCalledWith(mockStore.id);

    expect(screen.getByText('Tacacho con Cecina')).toBeInTheDocument();
    expect(screen.getByText('S/ 22.00')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('permite pausar y activar un producto con confirmación del servidor', async () => {
    const updateSpy = vi.spyOn(catalogApi, 'update').mockResolvedValue({
      ...mockProduct,
      isActive: false,
    });

    render(
      <MemoryRouter>
        <MerchantProductsPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Activo' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(mockProduct.id, {
        isActive: false,
      });
    });

    await screen.findByText('"Tacacho con Cecina" fue pausado temporalmente.');
  });

  it('registra un ajuste justificado de inventario físico', async () => {
    const adjustSpy = vi.spyOn(catalogApi, 'adjust').mockResolvedValue({
      id: 'mov-1',
      kind: 'manual_adjustment',
      quantity: 5,
      onHandAfter: 20,
      reason: 'Ingreso de cecina fresca del día',
      actorUserId: 'user-merchant-1',
      createdAt: '2026-10-29T10:00:00.000Z',
    });

    render(
      <MemoryRouter>
        <MerchantProductsPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Stock' }));

    const qtyInput = screen.getByLabelText(/Cantidad de ajuste/i);
    fireEvent.change(qtyInput, { target: { value: '5' } });

    const reasonInput = screen.getByLabelText(/Motivo o Justificación/i);
    fireEvent.change(reasonInput, { target: { value: 'Ingreso de cecina fresca del día' } });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar Ajuste' }));

    await waitFor(() => {
      expect(adjustSpy).toHaveBeenCalledWith(mockProduct.skus[0].id, {
        quantity: 5,
        reason: 'Ingreso de cecina fresca del día',
      });
    });

    await screen.findByText(/Ajuste de inventario \(\+5\) registrado/);
  });

  it('crea un nuevo producto con SKU e inventario inicial tras confirmación', async () => {
    const createSpy = vi.spyOn(catalogApi, 'create').mockResolvedValue({
      productId: 'c0000000-0000-0000-0000-000000000002',
      skuId: 'e0000000-0000-0000-0000-000000000002',
    });

    render(
      <MemoryRouter>
        <MerchantProductsPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo Producto' }));

    const nameInput = screen.getByLabelText(/Nombre del Producto/i);
    fireEvent.change(nameInput, { target: { value: 'Juane Especial' } });

    const priceInput = screen.getByLabelText(/Precio en Soles/i);
    fireEvent.change(priceInput, { target: { value: '25.00' } });

    const stockInput = screen.getByLabelText(/Cantidad \/ Stock/i);
    fireEvent.change(stockInput, { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: 'Crear Producto' }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        mockStore.id,
        expect.objectContaining({
          name: 'Juane Especial',
          priceCents: 2500,
          initialStock: 20,
        })
      );
    });

    await screen.findByText('Producto "Juane Especial" publicado exitosamente en tu catálogo.');
  });

  it('elimina un producto del catálogo tras confirmación', async () => {
    const deleteSpy = vi.spyOn(catalogApi, 'deleteProduct').mockResolvedValue();

    render(
      <MemoryRouter>
        <MerchantProductsPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByTitle('Eliminar producto del catálogo'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Definitivamente' }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(mockProduct.id);
    });

    await screen.findByText('Producto "Tacacho con Cecina" eliminado del catálogo.');
  });
});

describe('Bloque 4: Configuración, Horarios e Integrantes (MerchantSettingsPage)', () => {
  it('conecta horarios semanales y guarda turnos mediante la API', async () => {
    const hoursSpy = vi.spyOn(operationsApi, 'hours').mockResolvedValue(mockStore);
    vi.spyOn(operationsApi, 'updateStore').mockResolvedValue(mockStore);

    render(
      <MemoryRouter>
        <MerchantSettingsPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Configuración del Local' });
    expect(screen.getByText('Horario Semanal de Atención')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Configuración' }));

    await waitFor(() => {
      expect(hoursSpy).toHaveBeenCalledWith(mockStore.id, expect.any(Array));
    });

    await screen.findByText(/Configuración de cocina, horarios y cobros sincronizada y guardada con éxito/);
  });

  it('conecta integrantes de la tienda y permite asignar un nuevo operador', async () => {
    const memberSpy = vi.spyOn(operationsApi, 'setMember').mockResolvedValue();

    render(
      <MemoryRouter>
        <MerchantSettingsPage />
      </MemoryRouter>
    );

    await screen.findByText('Juan Pérez Cocina');
    expect(screen.getByText('juan@selvagourmet.pe')).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Correo electrónico');
    fireEvent.change(emailInput, { target: { value: 'nuevo.operador@selva.pe' } });

    fireEvent.click(screen.getByRole('button', { name: 'Asignar' }));

    await waitFor(() => {
      expect(memberSpy).toHaveBeenCalledWith(mockStore.id, {
        email: 'nuevo.operador@selva.pe',
        membershipRole: 'operator',
      });
    });

    await screen.findByText('Membresía asignada correctamente a nuevo.operador@selva.pe.');
  });
});
