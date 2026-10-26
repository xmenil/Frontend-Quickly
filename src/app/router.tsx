import {RealFavoritesPage,RealNotificationsPage,RealTicketsPage,RealTicketDetail,RealReportsPage,RealAuditPage} from '../features/engagement/RealEngagementPages';
import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { isDemoMode } from '../config/appMode';
import { RequireSession } from '../features/auth/SessionBoundary';
import { RealLoginPage, RealRegisterPage } from '../features/auth/AccountForms';
import { RealProfilePage } from '../features/customer/RealProfilePage';
import { AccountLayout, PendingIntegrationPage } from '../layouts/AccountLayout';
import { ApplicationsPage, StoreApplicationPage, CourierApplicationPage } from '../features/operations/ApplicationPages';
import { StoreManagementPage } from '../features/operations/StoreManagementPage';
import { OperationalCourierPage } from '../features/operations/CourierProfilePage';
import { RealAddressesPage } from '../features/operations/AddressesPage';
import { AdminOperationsLayout, RealAdminOverviewPage, AdminRequestsPage, RealAdminUsersPage, RealAdminZonesPage } from '../features/operations/AdminPages';
import { RealCatalogPage, RealMerchantsPage, RealProductDetailPage } from '../features/catalog/RealCatalogPages';
import { RealMerchantProductsPage } from '../features/merchant/RealMerchantProductsPage';
import {RealCartPage,RealCheckoutPage} from '../features/checkout/RealShoppingPages';
import {RealOrdersPage,RealOrderDetailPage} from '../features/orders/RealOrderPages';

const pending = <PendingIntegrationPage />;

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
import { ProductDetailPage } from '../features/catalog/ProductDetailPage';
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
import { CourierEarningsPage } from '../features/courier/CourierEarningsPage';
import { CourierProfilePage } from '../features/courier/CourierProfilePage';

// Admin
import { AdminOverviewPage } from '../features/admin/AdminOverviewPage';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { AdminMerchantsPage } from '../features/admin/AdminMerchantsPage';
import { AdminCouriersPage } from '../features/admin/AdminCouriersPage';
import { AdminOrdersPage } from '../features/admin/AdminOrdersPage';
import { AdminZonesPage } from '../features/admin/AdminZonesPage';
import { AdminTicketsPage } from '../features/admin/AdminTicketsPage';
import { AdminReportsPage } from '../features/admin/AdminReportsPage';
import { AdminAuditPage } from '../features/admin/AdminAuditPage';

export const router = createBrowserRouter([
  // Public Routes (Shop, Cart, Catalog)
  {
    path: '/',
    element: isDemoMode ? <PublicLayout /> : <AccountLayout />,
    children: [
      { index: true, element: isDemoMode ? <HomePage /> : <RealCatalogPage /> },
      { path: 'negocios', element: isDemoMode ? <MerchantsPage /> : <RealMerchantsPage /> },
      { path: 'negocios/:id', element: isDemoMode ? <MerchantDetailPage /> : <RealCatalogPage /> },
      { path: 'producto/:id', element: isDemoMode ? <ProductDetailPage /> : <RealProductDetailPage /> },
      { path: 'carrito', element: isDemoMode ? <CartPage /> : <RealCartPage /> },
      { path: 'checkout', element: isDemoMode ? <CheckoutPage /> : <RequireSession><RealCheckoutPage/></RequireSession> },
    ],
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: isDemoMode ? <LoginPage /> : <RealLoginPage /> },
      { path: 'registro', element: isDemoMode ? <RegisterCustomerPage /> : <RealRegisterPage /> },
      { path: 'registro/comercio', element: isDemoMode ? <RegisterMerchantPage /> : <RequireSession><StoreApplicationPage /></RequireSession> },
      { path: 'registro/repartidor', element: isDemoMode ? <RegisterCourierPage /> : <RequireSession><CourierApplicationPage /></RequireSession> },
      { path: 'recuperar-acceso', element: isDemoMode ? <RecoverPasswordPage /> : pending },
    ],
  },

  // Customer Protected Routes
  {
    path: 'cliente',
    element: isDemoMode ? <CustomerLayout /> : <RequireSession><AccountLayout /></RequireSession>,
    children: [
      { path: 'pedidos', element: isDemoMode ? <CustomerOrdersPage /> : <RealOrdersPage kind="customer"/> },
      { path: 'pedidos/:id', element: isDemoMode ? <OrderDetailPage /> : <RealOrderDetailPage kind="customer"/> },
      { path: 'seguimiento/:id', element: isDemoMode ? <TrackingPage /> : <RealOrderDetailPage kind="customer"/> },
      { path: 'direcciones', element: isDemoMode ? <CustomerAddressesPage /> : <RealAddressesPage /> },
      { path: 'solicitudes', element: isDemoMode ? pending : <ApplicationsPage /> },
      { path: 'favoritos', element: isDemoMode ? <CustomerFavoritesPage /> : <RealFavoritesPage/> },
      { path: 'perfil', element: isDemoMode ? <CustomerProfilePage /> : <RealProfilePage /> },
      { path: 'notificaciones', element: isDemoMode ? <CustomerNotificationsPage /> : <RealNotificationsPage/> },
      { path: 'ayuda/:id', element: <RealTicketDetail/> },
      { path: 'ayuda', element: isDemoMode ? <CustomerHelpPage /> : <RealTicketsPage/> },
    ],
  },

  // Merchant Routes
  {
    path: 'comercio',
    element: isDemoMode ? <MerchantLayout /> : <RequireSession role="comercio"><AccountLayout /></RequireSession>,
    children: [
      { index: true, element: <Navigate to="/comercio/tienda" replace /> },
      { path: 'tienda', element: isDemoMode ? <MerchantDashboardPage /> : <StoreManagementPage /> },
      { path: 'perfil-tienda', element: isDemoMode ? <MerchantStorePage /> : <Navigate to="/comercio/tienda" replace /> },
      { path: 'productos', element: isDemoMode ? <MerchantProductsPage /> : <RealMerchantProductsPage /> },
      { path: 'pedidos', element: isDemoMode ? <MerchantOrdersPage /> : <RealOrdersPage kind="merchant"/> },
      { path: 'pedidos/:id', element:<RealOrderDetailPage kind="merchant"/> },
      { path: 'reportes', element: isDemoMode ? <MerchantReportsPage /> : <RealReportsPage kind="merchant"/> },
      { path: 'resumen', element: <RealReportsPage kind="merchant"/> },
      { path: 'configuracion', element: isDemoMode ? <MerchantSettingsPage /> : <Navigate to="/comercio/tienda" replace /> },
    ],
  },

  // Courier Routes
  {
    path: 'repartidor',
    element: isDemoMode ? <CourierLayout /> : <RequireSession role="repartidor"><AccountLayout /></RequireSession>,
    children: [
      { index: true, element: <Navigate to={isDemoMode ? '/repartidor/solicitudes' : '/repartidor/perfil'} replace /> },
      { path: 'solicitudes', element: isDemoMode ? <CourierRequestsPage /> : <RealOrdersPage kind="courier" scope="available"/> },
      { path: 'entrega-activa', element: isDemoMode ? <CourierActiveDeliveryPage /> : <RealOrdersPage kind="courier" scope="active"/> },
      { path: 'historial', element: isDemoMode ? <CourierHistoryPage /> : <RealOrdersPage kind="courier" scope="history"/> },
      { path: 'pedidos/:id', element:<RealOrderDetailPage kind="courier"/> },
      { path: 'ingresos', element: isDemoMode ? <CourierEarningsPage /> : <RealReportsPage kind="courier"/> },
      { path: 'perfil', element: isDemoMode ? <CourierProfilePage /> : <OperationalCourierPage /> },
    ],
  },

  // Admin Routes
  {
    path: 'admin',
    element: isDemoMode ? <AdminLayout /> : <RequireSession role="admin"><AccountLayout /></RequireSession>,
    children: [{ element: isDemoMode ? <Outlet /> : <AdminOperationsLayout />, children: [
      { index: true, element: <Navigate to="/admin/resumen" replace /> },
      { path: 'resumen', element: isDemoMode ? <AdminOverviewPage /> : <RealAdminOverviewPage /> },
      { path: 'usuarios', element: isDemoMode ? <AdminUsersPage /> : <RealAdminUsersPage /> },
      { path: 'comercios', element: isDemoMode ? <AdminMerchantsPage /> : <AdminRequestsPage key="stores" kind="stores" /> },
      { path: 'repartidores', element: isDemoMode ? <AdminCouriersPage /> : <AdminRequestsPage key="couriers" kind="couriers" /> },
      { path: 'pedidos', element: isDemoMode ? <AdminOrdersPage /> : <RealOrdersPage kind="admin"/> },
      { path: 'pedidos/:id', element:<RealOrderDetailPage kind="admin"/> },
      { path: 'zonas', element: isDemoMode ? <AdminZonesPage /> : <RealAdminZonesPage /> },
      { path: 'incidencias/:id', element: <RealTicketDetail admin/> },
      { path: 'incidencias', element: isDemoMode ? <AdminTicketsPage /> : <RealTicketsPage admin/> },
      { path: 'reportes', element: isDemoMode ? <AdminReportsPage /> : <RealReportsPage kind="admin"/> },
      { path: 'auditoria', element: isDemoMode ? <AdminAuditPage /> : <RealAuditPage/> },
    ] }],
  },

  // Error Pages
  { path: 'acceso-denegado', element: <AccessDeniedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
