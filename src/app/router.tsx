import { RealFavoritesPage, RealNotificationsPage, RealTicketsPage, RealTicketDetail, RealReportsPage, RealAuditPage } from '../features/engagement/RealEngagementPages';
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireSession } from '../features/auth/SessionBoundary';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterCustomerPage } from '../features/auth/RegisterCustomerPage';
import { RealProfilePage } from '../features/customer/RealProfilePage';
import { AccountLayout, PendingIntegrationPage } from '../layouts/AccountLayout';
import { ApplicationsPage, StoreApplicationPage, CourierApplicationPage } from '../features/operations/ApplicationPages';
import { StoreManagementPage } from '../features/operations/StoreManagementPage';
import { OperationalCourierPage } from '../features/operations/CourierProfilePage';
import { RealAddressesPage } from '../features/operations/AddressesPage';
import { AdminOperationsLayout, RealAdminOverviewPage, AdminRequestsPage, RealAdminUsersPage, RealAdminZonesPage } from '../features/operations/AdminPages';
import { RealCatalogPage, RealMerchantsPage, RealProductDetailPage } from '../features/catalog/RealCatalogPages';
import { RealMerchantProductsPage } from '../features/merchant/RealMerchantProductsPage';
import { RealCheckoutPage } from '../features/checkout/RealShoppingPages';
import { GroupCheckoutPage } from '../features/checkout/GroupCheckoutPage';
import { OperationalHealthPage } from '../features/operations/OperationalHealthPage';
import { RealOrdersPage, RealOrderDetailPage } from '../features/orders/RealOrderPages';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Public & Catalog
import { HomePage } from '../features/catalog/HomePage';
import { CartPage } from '../features/cart/CartPage';

// Errors
import { AccessDeniedPage, NotFoundPage } from '../features/auth/RecoverPasswordPage';

const pending = <PendingIntegrationPage />;

export const router = createBrowserRouter([
  // Public Routes (Shop, Cart, Catalog)
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'negocios', element: <RealMerchantsPage /> },
      { path: 'negocios/:id', element: <RealCatalogPage /> },
      { path: 'producto/:id', element: <RealProductDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'checkout', element: <RequireSession><RealCheckoutPage /></RequireSession> },
      { path: 'cliente/compras/:id', element: <RequireSession><GroupCheckoutPage /></RequireSession> },
    ],
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterCustomerPage /> },
      { path: 'registro/comercio', element: <RequireSession><StoreApplicationPage /></RequireSession> },
      { path: 'registro/repartidor', element: <RequireSession><CourierApplicationPage /></RequireSession> },
      { path: 'recuperar-acceso', element: pending },
    ],
  },

  // Customer Protected Routes
  {
    path: 'cliente',
    element: <RequireSession><AccountLayout /></RequireSession>,
    children: [
      { path: 'pedidos', element: <RealOrdersPage kind="customer" /> },
      { path: 'pedidos/:id', element: <RealOrderDetailPage kind="customer" /> },
      { path: 'seguimiento/:id', element: <RealOrderDetailPage kind="customer" /> },
      { path: 'direcciones', element: <RealAddressesPage /> },
      { path: 'solicitudes', element: <ApplicationsPage /> },
      { path: 'favoritos', element: <RealFavoritesPage /> },
      { path: 'perfil', element: <RealProfilePage /> },
      { path: 'notificaciones', element: <RealNotificationsPage /> },
      { path: 'ayuda/:id', element: <RealTicketDetail /> },
      { path: 'ayuda', element: <RealTicketsPage /> },
    ],
  },

  // Merchant Routes
  {
    path: 'comercio',
    element: <RequireSession role="comercio"><AccountLayout /></RequireSession>,
    children: [
      { index: true, element: <Navigate to="/comercio/tienda" replace /> },
      { path: 'tienda', element: <StoreManagementPage /> },
      { path: 'perfil-tienda', element: <Navigate to="/comercio/tienda" replace /> },
      { path: 'productos', element: <RealMerchantProductsPage /> },
      { path: 'pedidos', element: <RealOrdersPage kind="merchant" /> },
      { path: 'pedidos/:id', element: <RealOrderDetailPage kind="merchant" /> },
      { path: 'reportes', element: <RealReportsPage kind="merchant" /> },
      { path: 'resumen', element: <RealReportsPage kind="merchant" /> },
      { path: 'configuracion', element: <Navigate to="/comercio/tienda" replace /> },
    ],
  },

  // Courier Routes
  {
    path: 'repartidor',
    element: <RequireSession role="repartidor"><AccountLayout /></RequireSession>,
    children: [
      { index: true, element: <Navigate to="/repartidor/solicitudes" replace /> },
      { path: 'solicitudes', element: <RealOrdersPage kind="courier" scope="available" /> },
      { path: 'entrega-activa', element: <RealOrdersPage kind="courier" scope="active" /> },
      { path: 'historial', element: <RealOrdersPage kind="courier" scope="history" /> },
      { path: 'pedidos/:id', element: <RealOrderDetailPage kind="courier" /> },
      { path: 'ingresos', element: <RealReportsPage kind="courier" /> },
      { path: 'perfil', element: <OperationalCourierPage /> },
    ],
  },

  // Admin Routes
  {
    path: 'admin',
    element: <RequireSession role="admin"><AccountLayout /></RequireSession>,
    children: [{ element: <AdminOperationsLayout />, children: [
      { index: true, element: <Navigate to="/admin/resumen" replace /> },
      { path: 'resumen', element: <RealAdminOverviewPage /> },
      { path: 'operacion', element: <OperationalHealthPage /> },
      { path: 'usuarios', element: <RealAdminUsersPage /> },
      { path: 'comercios', element: <AdminRequestsPage key="stores" kind="stores" /> },
      { path: 'repartidores', element: <AdminRequestsPage key="couriers" kind="couriers" /> },
      { path: 'pedidos', element: <RealOrdersPage kind="admin" /> },
      { path: 'pedidos/:id', element: <RealOrderDetailPage kind="admin" /> },
      { path: 'zonas', element: <RealAdminZonesPage /> },
      { path: 'incidencias/:id', element: <RealTicketDetail admin /> },
      { path: 'incidencias', element: <RealTicketsPage admin /> },
      { path: 'reportes', element: <RealReportsPage kind="admin" /> },
      { path: 'auditoria', element: <RealAuditPage /> },
    ] }],
  },

  // Error Pages
  { path: 'acceso-denegado', element: <AccessDeniedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
