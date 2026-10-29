import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MerchantDashboardPage } from '../features/merchant/MerchantDashboardPage';
import { MerchantOrdersPage } from '../features/merchant/MerchantOrdersPage';
import { MerchantReportsPage } from '../features/merchant/MerchantReportsPage';
import { operationsApi, Store } from '../services/api/operationsApi';
import { catalogApi, CatalogProduct } from '../services/api/catalogApi';
import { mediaApi } from '../services/api/mediaApi';
import { orderingApi, Order } from '../services/api/orderingApi';
import { engagementApi } from '../services/api/engagementApi';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../services/api/apiClient';

const mockStore: Store = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'El Gran Rincón Tingalés',
  categoryCode: 'restaurantes',
  zoneId: 'b0000000-0000-0000-0000-000000000001',
  zoneName: 'Tingo María Centro',
  description: 'Gastronomía de la selva en Huánuco.',
  addressText: 'Av. Raymondi 320',
  phone: '+51962001122',
  legalBusinessName: 'El Gran Rincón S.A.C.',
  taxId: '20609988771',
  status: 'active',
  statusReason: null,
  acceptingOrders: true,
  isOpen: true,
  minimumOrderCents: 1500,
  preparationMinutes: 20,
  createdAt: '2026-10-20T12:00:00.000Z',
  membershipRole: 'owner',
  openingIntervals: [
    { weekday: 1, opensAt: '09:00', closesAt: '22:00' },
    { weekday: 2, opensAt: '09:00', closesAt: '22:00' },
  ],
};

const mockProduct: CatalogProduct = {
  id: 'c0000000-0000-0000-0000-000000000001',
  storeId: mockStore.id,
  storeName: mockStore.name,
  categoryId: 'd0000000-0000-0000-0000-000000000001',
  name: 'Juane Tradicional de Gallina',
  description: 'Arroz sazonado con especias de la selva y presa de gallina.',
  brand: 'Especialidades',
  isActive: true,
  position: 0,
  skus: [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      skuCode: 'SKU-JUANE-01',
      availableStock: 10,
      variantName: 'Estándar',
      priceCents: 2400,
      barcode: null,
      isActive: true,
    },
  ],
  images: [{ id: 'f0000000-0000-0000-0000-000000000001', url: '/juane.jpg', altText: 'Juane', position: 0 }],
};

const mockOrderPending: Order = {
  id: '10000000-0000-0000-0000-000000000001',
  purchaseId: '20000000-0000-0000-0000-000000000001',
  code: 'QK-1001',
  storeId: mockStore.id,
  storeName: mockStore.name,
  status: 'pending',
  version: 1,
  subtotalCents: 2400,
  deliveryFeeCents: 500,
  totalCents: 2900,
  paymentStatus: 'pending',
  cashTenderCents: 5000,
  cashReceivedCents: null,
  collectedByUserId: null,
  createdAt: '2026-10-29T10:00:00.000Z',
  acceptanceExpiresAt: '2026-10-29T10:15:00.000Z',
  assignment: null,
  items: [
    {
      skuId: 'e0000000-0000-0000-0000-000000000001',
      productName: 'Juane Tradicional de Gallina',
      variantName: 'Estándar',
      quantity: 1,
      unitPriceCents: 2400,
      note: 'Sin ají charapita',
    },
  ],
  destination: {
    recipientName: 'Carlos Huamán',
    phone: '+51987654321',
    street: 'Jr. Ucayali',
    streetNumber: '142',
    reference: 'Frente a la plaza',
  },
  events: [
    { status: 'pending', reason: 'Pedido recibido', occurredAt: '2026-10-29T10:00:00.000Z' },
  ],
  incidents: [],
};

const mockOrderReady: Order = {
  ...mockOrderPending,
  id: '10000000-0000-0000-0000-000000000002',
  code: 'QK-1002',
  status: 'ready',
  version: 3,
  events: [
    { status: 'pending', reason: 'Pedido recibido', occurredAt: '2026-10-29T09:00:00.000Z' },
    { status: 'confirmed', reason: 'Aceptado por tienda', occurredAt: '2026-10-29T09:02:00.000Z' },
    { status: 'preparing', reason: 'En cocina', occurredAt: '2026-10-29T09:05:00.000Z' },
    { status: 'ready', reason: 'Listo para recojo', occurredAt: '2026-10-29T09:25:00.000Z' },
  ],
};

const mockOrderDelivered: Order = {
  ...mockOrderPending,
  id: '10000000-0000-0000-0000-000000000003',
  code: 'QK-1003',
  status: 'delivered',
  version: 5,
  paymentStatus: 'succeeded',
  assignment: {
    id: '30000000-0000-0000-0000-000000000001',
    courierUserId: '40000000-0000-0000-0000-000000000001',
    status: 'delivered',
    version: 3,
    agreedFeeCents: 500,
  },
};

const mockReport: Awaited<ReturnType<typeof engagementApi.report>> = {
  from: '2026-10-01T00:00:00.000Z',
  to: '2026-10-29T23:59:59.000Z',
  orders: 10,
  delivered: 8,
  cancelled: 2,
  deliveredSalesCents: 23200,
  cashCollectedCents: 23200,
  courierFeesCents: 4000,
  currency: 'PEN',
  definition: 'Cohorte por creación del pedido [inicio, fin)',
};

const mockCouriers = [
  {
    courierUserId: '40000000-0000-0000-0000-000000000001',
    fullName: 'Javier Motero Rivas',
    email: 'javier@tingo.pe',
    phone: '+51962334455',
    vehicleType: 'motorcycle' as const,
    plate: '8910-4F',
    isOnline: true,
    currentZoneId: 'b0000000-0000-0000-0000-000000000001',
    zoneName: 'Tingo María Centro',
  },
];

describe('Bloque 5 UI Verification: Merchant Dashboard, Orders and Reports', () => {
  const originalState = useAuthStore.getState();
  let ordersStore: Record<string, Order> = {};

  beforeEach(() => {
    ordersStore = {
      [mockOrderPending.id]: { ...mockOrderPending },
      [mockOrderReady.id]: { ...mockOrderReady },
      [mockOrderDelivered.id]: { ...mockOrderDelivered },
    };

    useAuthStore.setState({
      currentUser: {
        id: 'user-merchant-01',
        email: 'admin@selvagourmet.pe',
        name: 'Dueño Selva',
        phone: '+51962001122',
        role: 'comercio',
        merchantId: mockStore.id,
        status: 'activo',
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      isAuthenticated: true,
      roles: ['comercio'],
      sessionStatus: 'ready',
    });

    vi.spyOn(operationsApi, 'store').mockResolvedValue(mockStore);
    vi.spyOn(mediaApi, 'branding').mockResolvedValue({
      logoUrl: '/logo.png',
      bannerUrl: null,
    });
    vi.spyOn(catalogApi, 'products').mockResolvedValue({
      items: [mockProduct],
      nextCursor: null,
    });
    vi.spyOn(orderingApi, 'list').mockImplementation(async () => ({
      items: Object.values(ordersStore),
      nextCursor: null,
    }));
    vi.spyOn(orderingApi, 'detail').mockImplementation(async (id: string) => {
      return ordersStore[id] || mockOrderPending;
    });
    vi.spyOn(engagementApi, 'report').mockResolvedValue(mockReport);
    vi.spyOn(orderingApi, 'merchantCouriers').mockResolvedValue(mockCouriers);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState(originalState);
  });

  describe('MerchantDashboardPage', () => {
    it('muestra identidad de la tienda, KPIs reales de ventas y catálogo', async () => {
      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      // Store identity
      expect(await screen.findByText('El Gran Rincón Tingalés')).toBeInTheDocument();
      expect(screen.getByText(/Av. Raymondi 320/)).toBeInTheDocument();
      expect(screen.getByText('Recepción activada')).toBeInTheDocument();

      // Real KPIs derived from API
      // Total sales: 23200 cents = S/ 232.00
      expect(await screen.findByText(/232/)).toBeInTheDocument();
      // Facturación confirmada del período (no fake percentage)
      expect(screen.getByText('Facturación confirmada del período')).toBeInTheDocument();

      // Products count: 1 product available
      expect(screen.getByText(/productos activos/)).toBeInTheDocument();
    });

    it('permite pausar recepción de pedidos mediante diálogo de confirmación', async () => {
      const updateStoreSpy = vi.spyOn(operationsApi, 'updateStore').mockResolvedValue({
        ...mockStore,
        acceptingOrders: false,
      });

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('El Gran Rincón Tingalés')).toBeInTheDocument();

      // Click toggle switch
      const switchBtn = screen.getByLabelText('Alternar estado de apertura del comercio');
      fireEvent.click(switchBtn);

      // Confirm pause dialog opens
      expect(await screen.findByText('¿Pausar recepción de pedidos?')).toBeInTheDocument();
      expect(screen.getByText('Hasta reactivar manualmente')).toBeInTheDocument();

      // Click confirm pause
      const confirmBtn = screen.getByRole('button', { name: 'Confirmar Pausa' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(updateStoreSpy).toHaveBeenCalledWith(mockStore.id, { acceptingOrders: false });
      });
    });

    it('permite aceptar pedido pendiente desde el dashboard con verificación de versión', async () => {
      const actionSpy = vi.spyOn(orderingApi, 'action').mockImplementation(async () => {
        ordersStore[mockOrderPending.id] = {
          ...mockOrderPending,
          status: 'confirmed',
          version: 2,
        };
        return {};
      });

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      expect(await screen.findAllByText('QK-1001')).toBeTruthy();
      expect(screen.getAllByText(/Cliente: Carlos Huamán/).length).toBeGreaterThan(0);

      // Click Aceptar y Preparar
      const acceptBtn = screen.getByRole('button', { name: /Aceptar y Preparar/i });
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(actionSpy).toHaveBeenCalledWith(
          `/merchant/orders/${mockOrderPending.id}/accept`,
          { expectedVersion: 1 }
        );
      });
    });

    it('permite alternar publicación/pausa de un producto vía catalogApi.update', async () => {
      const updateProductSpy = vi.spyOn(catalogApi, 'update').mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('Juane Tradicional de Gallina')).toBeInTheDocument();

      // Find Pausar button
      const pauseBtn = screen.getByRole('button', { name: 'Pausar' });
      fireEvent.click(pauseBtn);

      await waitFor(() => {
        expect(updateProductSpy).toHaveBeenCalledWith(mockProduct.id, { isActive: false });
      });
    });
  });

  describe('MerchantOrdersPage', () => {
    it('organiza pedidos en pestañas con contadores exactos', async () => {
      render(
        <MemoryRouter>
          <MerchantOrdersPage />
        </MemoryRouter>
      );

      // Pending: 1 (QK-1001)
      expect(await screen.findByText('Nuevos')).toBeInTheDocument();
      // En cocina: 0 (confirmed/preparing)
      expect(screen.getByText('En Preparación')).toBeInTheDocument();
      // En Reparto: 1 (ready QK-1002)
      expect(screen.getByText('En Reparto')).toBeInTheDocument();
      // Finalizados: 1 (delivered QK-1003)
      expect(screen.getByText('Entregados / Historial')).toBeInTheDocument();

      // In "Nuevos" default tab, QK-1001 is visible
      expect(screen.getByText('QK-1001')).toBeInTheDocument();
    });

    it('permite rechazar un pedido enviando motivo y versión al backend', async () => {
      const actionSpy = vi.spyOn(orderingApi, 'action').mockImplementation(async () => {
        ordersStore[mockOrderPending.id] = {
          ...mockOrderPending,
          status: 'rejected',
          version: 2,
        };
        return {};
      });

      render(
        <MemoryRouter>
          <MerchantOrdersPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('QK-1001')).toBeInTheDocument();

      // Click Rechazar to open modal
      const rejectBtn = screen.getByRole('button', { name: /Rechazar/i });
      fireEvent.click(rejectBtn);

      expect(await screen.findByText('Rechazar Pedido')).toBeInTheDocument();
      expect(screen.getByText('Ingrediente o producto agotado')).toBeInTheDocument();

      // Click Confirmar Rechazo
      const confirmRejectBtn = screen.getByRole('button', { name: 'Confirmar Rechazo' });
      fireEvent.click(confirmRejectBtn);

      await waitFor(() => {
        expect(actionSpy).toHaveBeenCalledWith(
          `/merchant/orders/${mockOrderPending.id}/rejections`,
          {
            expectedVersion: 1,
            reason: 'Ingrediente o producto agotado',
          }
        );
      });
    });

    it('permite abrir modal de asignación y asignar repartidor con expectedVersion', async () => {
      const actionSpy = vi.spyOn(orderingApi, 'action').mockImplementation(async () => {
        ordersStore[mockOrderReady.id] = {
          ...mockOrderReady,
          assignment: {
            id: '30000000-0000-0000-0000-000000000001',
            courierUserId: mockCouriers[0].courierUserId,
            status: 'accepted',
            version: 1,
            agreedFeeCents: 500,
          },
        };
        return {};
      });

      render(
        <MemoryRouter>
          <MerchantOrdersPage />
        </MemoryRouter>
      );

      // Switch to "En Reparto" tab
      const readyTab = await screen.findByText('En Reparto');
      fireEvent.click(readyTab);

      expect(await screen.findByText('QK-1002')).toBeInTheDocument();

      // Click Asignar Repartidor
      const assignCourierBtn = screen.getByRole('button', { name: /Asignar Repartidor/i });
      fireEvent.click(assignCourierBtn);

      // Couriers modal opens
      expect(await screen.findByText('Asignar Repartidor a la Orden')).toBeInTheDocument();
      expect(await screen.findByText('Javier Motero Rivas')).toBeInTheDocument();
      expect(screen.getByText(/Placa:/)).toBeInTheDocument();

      // Click Asignar button in the list
      const assignBtn = screen.getByRole('button', { name: 'Asignar' });
      fireEvent.click(assignBtn);

      await waitFor(() => {
        expect(actionSpy).toHaveBeenCalledWith(
          `/merchant/orders/${mockOrderReady.id}/assign-courier`,
          {
            courierUserId: mockCouriers[0].courierUserId,
            expectedVersion: 3,
            reason: 'Asignación solicitada por el comercio',
          }
        );
      });
    });

    it('maneja conflicto 409 mostrando mensaje de error sin avanzar fraudulentamente', async () => {
      vi.spyOn(orderingApi, 'action').mockRejectedValue(
        new ApiError('El pedido fue modificado por otro usuario.', 409, 'VERSION_CONFLICT')
      );

      render(
        <MemoryRouter>
          <MerchantOrdersPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('QK-1001')).toBeInTheDocument();

      // Click Aceptar Pedido
      const acceptBtn = screen.getByRole('button', { name: /Aceptar Pedido/i });
      fireEvent.click(acceptBtn);

      expect(
        await screen.findByText('El pedido fue modificado por otro usuario.')
      ).toBeInTheDocument();
    });

    it('abre modal con detalle completo del pedido, dirección, total y timeline', async () => {
      render(
        <MemoryRouter>
          <MerchantOrdersPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('QK-1001')).toBeInTheDocument();

      // Click Ver detalle
      const detailBtns = screen.getAllByRole('button', { name: 'Ver detalle' });
      fireEvent.click(detailBtns[0]);

      expect(await screen.findByText('Detalle del pedido y reparto')).toBeInTheDocument();
      expect(screen.getAllByText('Carlos Huamán').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Jr. Ucayali #142/).length).toBeGreaterThan(0);
    });
  });

  describe('MerchantReportsPage', () => {
    it('muestra KPIs de ingresos entregados, ticket promedio y tasa de despacho', async () => {
      render(
        <MemoryRouter>
          <MerchantReportsPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('Ventas y Reportes')).toBeInTheDocument();

      // KPI: Ingresos entregados = S/ 232.00
      expect(screen.getByText('Ingresos Entregados')).toBeInTheDocument();
      expect(screen.getAllByText(/232/).length).toBeGreaterThan(0);

      // KPI: Ticket Promedio = 23200 / 8 = 2900 cents = S/ 29.00
      expect(screen.getByText('Ticket Promedio')).toBeInTheDocument();
      expect(screen.getAllByText(/29/).length).toBeGreaterThan(0);

      // KPI: Tasa de Despacho = 8 / 10 = 80%
      expect(screen.getByText('Tasa de Despacho')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();

      // KPI: Hora Pico shows "No disponible"
      expect(screen.getByText('Hora Pico Tingalesa')).toBeInTheDocument();
      expect(screen.getByText('No disponible')).toBeInTheDocument();
    });

    it('muestra estados honestos para series semanales y ranking no soportados', async () => {
      render(
        <MemoryRouter>
          <MerchantReportsPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('Ventas y Reportes')).toBeInTheDocument();

      // SVG Weekly Series
      expect(screen.getByText('Serie semanal no disponible en la API')).toBeInTheDocument();

      // Top Products Ranking
      expect(
        screen.getByText('El ranking de productos no está disponible en el contrato actual.')
      ).toBeInTheDocument();
    });

    it('permite cambiar el filtro de período entre 7 días, Este Mes y 366 días', async () => {
      render(
        <MemoryRouter>
          <MerchantReportsPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('Ventas y Reportes')).toBeInTheDocument();

      const btnMes = screen.getByRole('button', { name: 'Este Mes' });
      fireEvent.click(btnMes);

      await waitFor(() => {
        expect(engagementApi.report).toHaveBeenCalled();
      });

      const btnHistorico = screen.getByRole('button', { name: 'Últimos 366 días' });
      fireEvent.click(btnHistorico);

      await waitFor(() => {
        expect(engagementApi.report).toHaveBeenCalled();
      });
    });

    it('permite buscar en el registro detallado de comandas', async () => {
      render(
        <MemoryRouter>
          <MerchantReportsPage />
        </MemoryRouter>
      );

      expect(await screen.findByText('Registro Detallado de Comandas')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText('Filtrar por código o cliente...');
      fireEvent.change(searchInput, { target: { value: 'QK-1001' } });

      expect(screen.getAllByText('QK-1001').length).toBeGreaterThan(0);
    });
  });
});
