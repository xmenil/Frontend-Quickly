import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(await fs.readFile(path.join(root, 'src/services/api/contracts/openapi.json'), 'utf8'));
// Consumer families are explicit; unknown controllers fail rather than disappearing from the audit.
const families = {
 HealthController: ['healthApi', 'OperationalHealthPage', 'healthApi.test.ts; backend f8 (no ejecutada en este entorno)'],
 AuthController: ['identityApi / authStore', 'LoginPage, RegisterCustomerPage, SessionBoundary, CustomerProfilePage', 'authSession.test.ts; backend f0/f6'],
 AdminUsersController: ['operationsApi / adminModel', 'AdminOverviewPage, AdminUsersPage', 'adminUsersUI.test.tsx, adminApi.test.tsx; backend f2/f6'],
 GeographyController: ['operationsApi / customerAddressModel', 'CustomerAddressesPage, AddressForm, CheckoutPage', 'addressCheckoutUI.test.tsx; backend f2/f4'],
 AdminZonesController: ['operationsApi / adminModel', 'AdminZonesPage', 'adminOperationsUI.test.tsx; backend f2'],
 StoresController: ['catalogApi', 'HomePage, MerchantsPage, MerchantDetailPage, courierModel', 'storefrontUI.test.tsx; backend f2/f3'],
 StoreManagementController: ['operationsApi / merchantModel', 'RegisterMerchantPage, MerchantStorePage, MerchantSettingsPage', 'merchantCatalogUI.test.tsx; backend f2/f3'],
 AdminStoresController: ['operationsApi / adminModel', 'AdminMerchantsPage', 'adminOperationsUI.test.tsx; backend f2/f6'],
 CatalogManagementController: ['catalogApi / mediaApi', 'MerchantProductsPage, catálogo y carrito originales', 'catalogApi.test.ts, mediaApi.test.ts, merchantCatalogUI.test.tsx; backend f3'],
 ProfileMediaController: ['mediaApi', 'CustomerProfilePage, MerchantStorePage y avatares/logos originales', 'mediaApi.test.ts, merchantCatalogUI.test.tsx; backend f3'],
 OrderingController: ['orderingApi / useCheckout / merchantOrdersModel', 'CheckoutPage, OrderDetailPage, MerchantOrdersPage', 'checkoutFlow.test.tsx, merchantOrdersApi.test.tsx; backend f4/f7'],
 OrderFlowController: ['orderingApi / modelos de pedidos', 'CustomerOrdersPage, OrderDetailPage, MerchantOrdersPage, CourierRequestsPage, AdminOrdersPage', 'customerOrdersUI.test.tsx, courierApi.test.tsx, adminApi.test.tsx; backend f4'],
 GroupCheckoutController: ['orderingApi / useCheckout', 'CheckoutPage, GroupCheckoutPage, OrderDetailPage', 'checkoutFlow.test.tsx; backend f7'],
 DeliveryController: ['orderingApi / courierModel', 'CourierRequestsPage, CourierActiveDeliveryPage', 'courierApi.test.tsx, courierDeliveryUI.test.tsx; backend f4/f5'],
 AdminDeliveryController: ['orderingApi / adminModel', 'AdminOrdersPage', 'adminOperationsUI.test.tsx; backend f4'],
 MerchantDeliveryController: ['orderingApi / merchantOrdersModel', 'MerchantOrdersPage', 'merchantOrdersUI.test.tsx; backend f4'],
 CourierProfileController: ['operationsApi / courierModel', 'RegisterCourierPage, CourierLayout, CourierProfilePage', 'courierEarningsProfileUI.test.tsx; backend f2/f6'],
 AdminCouriersController: ['operationsApi / adminModel', 'AdminCouriersPage', 'adminOperationsUI.test.tsx; backend f2/f6'],
 PlatformController: ['engagementApi', 'CustomerNotificationsPage, Navbar', 'engagementApi.test.ts; backend f5'],
 ReportController: ['engagementApi', 'MerchantReportsPage, CourierEarningsPage, AdminReportsPage, AdminAuditPage', 'merchantOrdersUI.test.tsx, courierEarningsProfileUI.test.tsx, adminOperationsUI.test.tsx; backend f5'],
 OperationsController: ['healthApi', 'OperationalHealthPage', 'healthApi.test.ts; backend f8 (no ejecutada en este entorno)'],
 EngagementController: ['engagementApi / useCatalogFavorite', 'CustomerFavoritesPage, MerchantCard, ProductDetailPage, OrderDetailPage', 'storefrontUI.test.tsx, engagementApi.test.ts; backend f5'],
 SupportController: ['engagementApi / customerAccountModel / adminModel', 'CustomerHelpPage, TicketConversation, AdminTicketsPage', 'adminTicketsUI.test.tsx, engagementApi.test.ts; backend f5'],
 BillingQueryController: ['billingApi', 'CheckoutPage, PaymentHistory', 'checkoutFlow.test.tsx; backend f4/f7'],
};
const alternatives = {
 AuthController_getProfile: 'Sin llamada independiente: /auth/session devuelve el mismo perfil con CSRF y caducidad; no duplicar restauración.',
 AdminStoresController_detail: 'Sin pantalla adicional: el listado administrativo ya entrega la ficha utilizada por el diálogo.',
 AdminStoresController_approve: 'Compatibilidad de aprobación simple; la vista usa /decisions con motivo y verificación GET.',
 CatalogManagementController_storeProducts: 'Alternativa de catálogo por tienda; la vista usa /catalog/search?storeId con paginación completa.',
 ProfileMediaController_publicBranding: 'Metadatos alternativos: /stores y /stores/{id} ya entregan logoUrl y bannerUrl para las tarjetas.',
 OrderingController_getUserPurchases: 'Historial heredado sin paginación; la vista usa /me/orders, detalle de orden y /me/purchases/{id}.',
 OrderingController_getStoreOrders: 'Listado heredado; la bandeja original usa /order-feed paginado y /orders/{id}.',
 DeliveryController_listAvailableOrders: 'Listado heredado; solicitudes usa /courier/orders?scope=available.',
 DeliveryController_getActiveAssignment: 'Detalle heredado; entrega activa usa /courier/orders?scope=active y /orders/{id}.',
 AdminCouriersController_detail: 'Sin pantalla adicional: la ficha administrativa procede del listado autorizado.',
 PlatformController_getNotifications: 'Compatibilidad sin paginación; la vista usa /me/notifications.',
 PlatformController_markAsRead: 'Compatibilidad; la vista usa /me/notifications/{id}/read con comprobación por GET.',
};
function schemaName(schema) {
 if (!schema) return '—';
 if (schema.$ref) return schema.$ref.split('/').at(-1);
 if (schema.type === 'array') return schemaName(schema.items) + '[]';
 if (schema.type === 'object') return '{' + Object.keys(schema.properties || {}).join(', ') + '}';
 return schema.type || (schema.oneOf ? schema.oneOf.map(schemaName).join(' / ') : 'schema');
}
const rows = [];
for (const [url, methods] of Object.entries(spec.paths)) for (const [method, op] of Object.entries(methods)) {
 if (!op.operationId) continue;
 const family = families[op.operationId.split('_')[0]];
 if (!family) throw new Error('Clasificar consumidor: ' + op.operationId);
 const success = Object.entries(op.responses || {}).filter(([code]) => /^2/.test(code));
 for (const [code, response] of success) if (code !== '204' && !response.content) throw new Error('Respuesta sin contrato: ' + op.operationId);
 const payload = schemaName(op.requestBody?.content?.['application/json']?.schema || op.requestBody?.content?.['multipart/form-data']?.schema);
 const parameters = (op.parameters || []).map(p => p.in + ':' + p.name).join(', ');
 const responses = success.map(([code, res]) => code + ' ' + schemaName(Object.values(res.content || {})[0]?.schema)).join('; ');
 const controller = op.operationId.split('_')[0];
 const privateOperation = op.security?.some(entry => Object.hasOwn(entry, 'cookie'));
 const role = !privateOperation ? 'público; disponibilidad del recurso según Nest' :
   controller === 'StoreManagementController' ? 'sesión; alta propia o membresía/gestión de tienda según acción' :
   controller === 'CourierProfileController' ? 'sesión propia; online exige aprobación y zona activa' :
   controller === 'CatalogManagementController' || controller === 'ProfileMediaController' ? 'sesión; propietario del perfil o permisos sobre la tienda/producto' :
   /\/admin\//.test(url) ? 'admin' : /\/merchant\//.test(url) ? 'merchant/admin + permisos de tienda' :
   /\/courier\//.test(url) ? 'courier/admin + perfil/asignación propia' : 'sesión + propiedad/alcance del recurso';
 rows.push('| `' + op.operationId + '`<br>' + method.toUpperCase() + ' `' + url + '` | ' + role + ' | ' + payload + (parameters ? '<br>' + parameters : '') + ' | ' + responses + ' | ' + (alternatives[op.operationId] || family[0] + ' → ' + family[1]) + ' | ' + family[2] + ' |');
}
const output = '# Inventario HTTP — bloque 8\n\nGenerado del snapshot OpenAPI vigente con `npm run integration:inventory`. ' + rows.length + ' operaciones. Cada fila identifica el consumidor o el motivo de no exposición. Los parámetros, DTO y campos de respuesta provienen del contrato; permisos adicionales los impone Nest. Los nombres de suites son referencias de cobertura por familia, no una afirmación de que cada endpoint alternativo tenga una prueba de navegador.\n\nLas pruebas `src/test` usan respuestas controladas. Las suites backend f0/f2–f7 usan HTTP y PostgreSQL aislado; `original-integral.spec.ts` enlaza los roles mediante las vistas originales y API real. OAuth Google/SMTP, staging y respaldo Docker no quedan verificados por estas suites locales.\n\n| Operación | Rol / alcance | Payload y parámetros | Respuesta 2xx | Consumidor o motivo explícito | Pruebas de referencia |\n|---|---|---|---|---|---|\n' + rows.join('\n') + '\n';
const target = path.join(root, 'docs/integracion-api/INVENTARIO_HTTP_BLOQUE_8.md');
if (process.argv.includes('--check')) {
 if (await fs.readFile(target, 'utf8') !== output) throw new Error('Inventario desactualizado. Ejecute npm run integration:inventory.');
} else await fs.writeFile(target, output);
console.log(rows.length + ' operaciones inventariadas; respuestas 2xx documentadas.');
