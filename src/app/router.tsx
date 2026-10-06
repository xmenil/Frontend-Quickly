import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { MerchantLayout } from '../layouts/MerchantLayout';
import { CourierLayout } from '../layouts/CourierLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Public & Catalog
import { HomePage } from '../features/catalog/HomePage';
import { MerchantsPage } from '../features/catalog/MerchantsPage';
import { MerchantDetailPage } from '../features/catalog/MerchantDetailPage';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';

// Auth
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterCustomerPage } from '../features/auth/RegisterCustomerPage';
import { RegisterMerchantPage } from '../features/auth/RegisterMerchantPage';
import { RegisterCourierPage } from '../features/auth/RegisterCourierPage';
import { RecoverPasswordPage, AccessDeniedPage, NotFoundPage } from '../features/auth/RecoverPasswordPage';

// Customer
import { CustomerOrdersPage } from '../features/orders/CustomerOrdersPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { TrackingPage } from '../features/orders/TrackingPage';
import { CustomerAddressesPage } from '../features/customer/CustomerAddressesPage';
import { CustomerFavoritesPage } from '../features/customer/CustomerFavoritesPage';
import { CustomerProfilePage } from '../features/customer/CustomerProfilePage';
import { CustomerNotificationsPage } from '../features/customer/CustomerNotificationsPage';
import { CustomerHelpPage } from '../features/customer/CustomerHelpPage';

// Merchant
import { MerchantDashboardPage } from '../features/merchant/MerchantDashboardPage';
import { MerchantStorePage } from '../features/merchant/MerchantStorePage';
import { MerchantProductsPage } from '../features/merchant/MerchantProductsPage';
import { MerchantOrdersPage } from '../features/merchant/MerchantOrdersPage';
import { MerchantReportsPage } from '../features/merchant/MerchantReportsPage';
import { MerchantSettingsPage } from '../features/merchant/MerchantSettingsPage';

// Courier
import { CourierRequestsPage } from '../features/courier/CourierRequestsPage';
import { CourierActiveDeliveryPage } from '../features/courier/CourierActiveDeliveryPage';
import { CourierHistoryPage } from '../features/courier/CourierHistoryPage';
import { CourierEarningsPage, CourierProfilePage } from '../features/courier/CourierEarningsPage';

// Admin
import { AdminOverviewPage } from '../features/admin/AdminOverviewPage';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { AdminMerchantsPage, AdminCouriersPage } from '../features/admin/AdminMerchantsPage';
import { AdminOrdersPage, AdminZonesPage } from '../features/admin/AdminOrdersPage';
import { AdminTicketsPage } from '../features/admin/AdminTicketsPage';
import { AdminReportsPage } from '../features/admin/AdminReportsPage';
import { AdminAuditPage } from '../features/admin/AdminAuditPage';

export const router = createBrowserRouter([
  // Public Routes (Shop, Cart, Catalog)
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'negocios', element: <MerchantsPage /> },
      { path: 'negocios/:id', element: <MerchantDetailPage /> },
      { path: 'carrito', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
    ],
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterCustomerPage /> },
      { path: 'registro/comercio', element: <RegisterMerchantPage /> },
      { path: 'registro/repartidor', element: <RegisterCourierPage /> },
      { path: 'recuperar-acceso', element: <RecoverPasswordPage /> },
    ],
  },

  // Customer Protected Routes
  {
    path: 'cliente',
    element: <CustomerLayout />,
    children: [
      { path: 'pedidos', element: <CustomerOrdersPage /> },
      { path: 'pedidos/:id', element: <OrderDetailPage /> },
      { path: 'seguimiento/:id', element: <TrackingPage /> },
      { path: 'direcciones', element: <CustomerAddressesPage /> },
      { path: 'favoritos', element: <CustomerFavoritesPage /> },
      { path: 'perfil', element: <CustomerProfilePage /> },
      { path: 'notificaciones', element: <CustomerNotificationsPage /> },
      { path: 'ayuda', element: <CustomerHelpPage /> },
    ],
  },

  // Merchant Routes
  {
    path: 'comercio',
    element: <MerchantLayout />,
    children: [
      { index: true, element: <Navigate to="/comercio/tienda" replace /> },
      { path: 'tienda', element: <MerchantDashboardPage /> },
      { path: 'perfil-tienda', element: <MerchantStorePage /> },
      { path: 'productos', element: <MerchantProductsPage /> },
      { path: 'pedidos', element: <MerchantOrdersPage /> },
      { path: 'reportes', element: <MerchantReportsPage /> },
      { path: 'configuracion', element: <MerchantSettingsPage /> },
    ],
  },

  // Courier Routes
  {
    path: 'repartidor',
    element: <CourierLayout />,
    children: [
      { index: true, element: <Navigate to="/repartidor/solicitudes" replace /> },
      { path: 'solicitudes', element: <CourierRequestsPage /> },
      { path: 'entrega-activa', element: <CourierActiveDeliveryPage /> },
      { path: 'historial', element: <CourierHistoryPage /> },
      { path: 'ingresos', element: <CourierEarningsPage /> },
      { path: 'perfil', element: <CourierProfilePage /> },
    ],
  },

  // Admin Routes
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/resumen" replace /> },
      { path: 'resumen', element: <AdminOverviewPage /> },
      { path: 'usuarios', element: <AdminUsersPage /> },
      { path: 'comercios', element: <AdminMerchantsPage /> },
      { path: 'repartidores', element: <AdminCouriersPage /> },
      { path: 'pedidos', element: <AdminOrdersPage /> },
      { path: 'zonas', element: <AdminZonesPage /> },
      { path: 'incidencias', element: <AdminTicketsPage /> },
      { path: 'reportes', element: <AdminReportsPage /> },
      { path: 'auditoria', element: <AdminAuditPage /> },
    ],
  },

  // Error Pages
  { path: 'acceso-denegado', element: <AccessDeniedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
