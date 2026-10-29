# Mapeo completo de API backend para el frontend

Fecha: 2026-10-28. Fuentes: backend/openapi.json, controladores/DTO/servicios locales de NestJS y Frontend-Quickly/src. **130 operaciones HTTP en 113 paths** del snapshot del backend. No se consultó la DB ni un backend desplegado; disponibilidad en producción y aplicación efectiva de migraciones quedan por verificar. Este documento no implementa la integración.

Complemento: [retirada estricta de mocks y matriz de las 39 rutas de negocio](MAPEO_DATOS_MOCK_FRONTEND.md).

## 1. Arquitectura y alcance de integración

Frontend → services/api → NestJS /api/v1 → DatabaseService (pg) → PostgreSQL/Supabase. No incorporar acceso directo a las tablas desde el navegador. La sesión es propia del backend, no un JWT de Supabase Auth.

La cobertura se distingue así:

- **Wrapper existente**: hay una función cliente que puede invocar la operación; no demuestra uso en una ruta activa.
- **Componente real disponible**: hay implementación React sobre API, pero puede no estar montada.
- **Pendiente**: falta wrapper, ruta, adaptación o contrato; se indica en el inventario.
- **Alternativa/legado**: endpoint conservado, pero otra operación ofrece la forma paginada/tipada usada por componentes nuevos. Integración completa significa cubrir las capacidades y decidir explícitamente qué aliases se mantienen; no llamar duplicadamente endpoints equivalentes.

El router activo sigue montando páginas antiguas en catálogo, checkout, pedidos, operación por rol y administración. HomePage es híbrida; CartPage es real; GroupCheckoutPage y /admin/operacion usan API. Navbar obtiene notificaciones reales. Revisar también layouts: los de comercio/repartidor/admin siguen leyendo dataStore.

## 2. Transporte, sesión y reglas comunes

| Tema | Contrato / acción |
|---|---|
| Base recomendada | VITE_API_BASE_URL debe incluir /api/v1. apiRequest añade sólo path relativo al recurso |
| Fallback de base actual | apiClient usa VITE_API_BASE_URL; en su ausencia deriva getBackendUrl() de override localStorage quickly_backend_url, VITE_API_URL o localhost:3000 |
| Segundo transporte | lib/api.ts apiFetch usa getBackendUrl() y exige path completo /api/v1/…; no atiende VITE_API_BASE_URL. Unificar para evitar dos backends distintos en una misma sesión |
| Cookie | quickly_session, HttpOnly, SameSite=Lax; credentials:include. Cross-site requiere validar cookies/proxy/topología; no basta con configurar URL |
| Bearer | Backend acepta token opaco de 64 caracteres hex devuelto por login/register/google; lib/api lo guarda en quickly_session_token |
| CSRF | Con autenticación por cookie, mutaciones requieren X-CSRF-Token obtenido de login/session. Con Bearer AuthGuard omite verificación CSRF; el control Origin sigue aplicando |
| Origen | configureHttp rechaza mutaciones cuyo Origin no está permitido. CORS permite credenciales, Authorization, X-CSRF-Token, Idempotency-Key y X-Request-Id |
| Validación | whitelist + forbidNonWhitelisted + transform: no enviar objetos de UI completos ni campos inventados |
| Paginación | Leer items y nextCursor donde exista; cambiar filtro reinicia cursor; cargar todas las páginas para totales globales o usar un agregado del servidor |
| Dinero | Enteros en céntimos de PEN; formatear al mostrar. Cotización/compra en servidor determina precios, tarifas y disponibilidad |
| Versiones | expectedVersion obligatorio en transiciones. Orden y assignment tienen versiones independientes; nunca usar 0 por defecto |
| Idempotencia | POST /purchases y /checkout/groups requieren Idempotency-Key. Conservar clave + payload de una intención; tras incertidumbre consultar intento y reintentar con misma clave |
| Respuestas 204 | Sin JSON; apiRequest ya las contempla |
| Binarios | Imágenes image/png no deben pasar por apiRequest JSON. Usar URL o fetch/blob según sesión y despliegue |
| Sesión obsoleta | apiRequest cancela pendientes y rechaza respuestas de una generación anterior; preservar este comportamiento al unificar |
| Errores | ApiError: status/code/message/requestId; 401 requiere restaurar/iniciar sesión, 403 muestra falta de acceso o CSRF/origen, 404 conserva identidad inexistente, 409 recarga estado y permite revisar acción |

Fuentes: [src/services/api/apiClient.ts:3](../src/services/api/apiClient.ts#L3), [src/lib/api.ts:10](../src/lib/api.ts#L10), [backend/src/platform/guards/auth.guard.ts:36](../../backend/src/platform/guards/auth.guard.ts#L36), [backend/src/platform/configure-http.ts:27](../../backend/src/platform/configure-http.ts#L27), [backend/src/platform/security/web-session.ts:4](../../backend/src/platform/security/web-session.ts#L4).

### Inconsistencias confirmadas que deben resolverse primero

1. La copia OpenAPI del frontend no contiene los cuatro paths nuevos de verificación/Google/asignación por comercio (se listan abajo), ni SendVerificationCodeDto/GoogleAuthDto. RegisterDto y AuthResponseDto también difieren; POST register cambia su metadata.
2. identityApi.sessionSchema omite token. z.object elimina campos desconocidos: login/registro vía identityApi pierden el Bearer antes de acceptSession, aunque el backend lo devuelve. El flujo apiFetch de Google/registro sí conserva token. Unificar respuesta tipada y Zod, y definir estrategia de sesión consistente.
3. Hay dos CSRF: apiClient lo conserva en memoria; lib/api.ts lo busca en sessionStorage. acceptSession configura el primero. Las llamadas apiFetch autenticadas por cookie pueden no recibir ese CSRF. Compartir una fuente de sesión.
4. catalogApi.store/stores valida un schema público reducido y elimina address_text, phone, description, rating_average/rating_count, base_fee_cents y openingIntervals del detalle. Ampliar modelos y validación para usar datos existentes; no inventar estos campos en dataStore. base_fee_cents es tarifa de zona, no una cotización de checkout.
5. catalogApi no expone DELETE producto aunque el backend sí. Existe un helper antiguo en supabaseSync que oculta errores y muta localmente; sustituirlo por wrapper tipado.
6. RealOrderPages no implementa asignación por comercio, aunque la API ya existe. Incorporar listado de repartidores y acción con motivo/versión.
7. Las respuestas de varios controladores antiguos no tienen schema OpenAPI. La ausencia de schema no implica cuerpo vacío. Completar ApiOkResponse/ApiCreatedResponse según servicio antes de regenerar tipos.
8. verificationCode es opcional en RegisterDto y el servicio sólo valida si viene informado. Si la regla del producto exige verificar siempre el correo, debe cambiarse también el backend. sendVerificationCode puede devolver devCode fuera de producción; no simularlo en frontend.

Paths ausentes de la copia del frontend:

- /api/v1/auth/verification-code/send
- /api/v1/auth/google
- /api/v1/merchant/available-couriers
- /api/v1/merchant/orders/{id}/assign-courier

Sincronización propuesta, desde backend y Frontend-Quickly respectivamente (no ejecutada en esta auditoría): exportar OpenAPI con el script existente del backend; npm run contracts:sync; npm run contracts:check; npm run build. contracts:sync copia ../backend/openapi.json y regenera schema.d.ts; no editar tipos generados a mano.

## 3. Matriz de conexión de pantallas

La matriz detallada por ruta, archivo y reemplazo está en el documento de mocks. Los bloques reutilizables son:

| Dominio / rutas | Componente API existente | Estado / ajuste |
|---|---|---|
| /negocios, /negocios/:id, /producto/:id | RealMerchantsPage, CatalogBrowser, RealProductDetailPage | Reenlazar router; pasar params.id como storeId a CatalogBrowser en detalle de tienda |
| /checkout | RealCheckoutPage | Reenlazar; consume useRealCartStore y cotizaciones/compra simple o grupo |
| /cliente/pedidos y detalles | RealOrdersPage kind=customer, RealOrderDetailPage kind=customer | Montar; seguimiento usa eventos de API, sin GPS en vivo |
| /comercio/pedidos | RealOrdersPage kind=merchant y detalle kind=merchant | Añadir /comercio/pedidos/:id y asignación por comercio |
| /repartidor/{solicitudes,entrega-activa,historial} | RealOrdersPage kind=courier scope=available/active/history | Añadir /repartidor/pedidos/:id para enlaces de detalle; acciones usan assignment.id/version |
| /admin/pedidos | RealOrdersPage kind=admin y detalle kind=admin | Añadir /admin/pedidos/:id; asignación/intervención con motivo |
| /cliente/{direcciones,perfil} | RealAddressesPage, RealProfilePage, AvatarEditor | Montar y verificar permisos/sesión |
| /cliente/{favoritos,notificaciones,ayuda} | RealFavoritesPage, RealNotificationsPage, RealTicketsPage, RealTicketDetail | Añadir /cliente/ayuda/:id; usar estado/cursor del servidor |
| /comercio/{perfil-tienda,configuracion} | StoreManagementPage, StoreBrandingEditor | Montar, horarios y membresías; retirar updateMerchantProfile local |
| /comercio/productos | RealMerchantProductsPage | Montar y completar borrado por API |
| /repartidor/perfil | OperationalCourierPage | Montar; isOnline real |
| /admin/{resumen,usuarios,zonas} | RealAdminOverviewPage, RealAdminUsersPage, RealAdminZonesPage | Montar; contadores de backend |
| /admin/{comercios,repartidores} | AdminRequestsPage kind=stores/couriers | Montar; aprobar/rechazar/suspender vía decisions |
| /admin/incidencias | RealTicketsPage admin, RealTicketDetail admin | Añadir /admin/incidencias/:id |
| Reportes admin/comercio/repartidor | RealReportsPage kind=admin/merchant/courier | Montar; backend aporta agregados, no serie semanal/top de productos |
| /admin/auditoria | RealAuditPage | Montar y paginar |
| /registro/comercio, /registro/repartidor | StoreApplicationPage, CourierApplicationPage | API requiere sesión; redirigir primero a login/registro y volver a solicitud |
| Solicitudes del usuario | ApplicationsPage | Crear /cliente/solicitudes y rutas de edición que usan enlaces; no están en router actual |
| /admin/operacion | OperationalHealthPage | Ya está montado y llama /admin/operations |

No basta sustituir imports: los layouts deben obtener autorización desde SessionBoundary/profile.roles y datos desde APIs. Añadir rutas de detalle con guardas para el rol adecuado, actualizar enlaces y comprobar navegación directa/recarga.

## 4. Flujos y payloads obligatorios

### Autenticación y alta operativa

POST /auth/verification-code/send recibe {email}; el servidor genera/envía el código. POST /auth/register recibe fullName, email, phone E.164, password y verificationCode cuando corresponda. POST /auth/google recibe idToken de Google y phone opcional. La respuesta de sesión contiene user, csrfToken, expiresAt y token opcional. Restaurar desde GET /auth/session; salir con POST /auth/logout y limpiar sesión/cache privada.

No crear rol merchant/courier desde selector de UI. Una cuenta autenticada envía CreateStoreDto a POST /merchant/stores o ApplyCourierDto a PUT /courier/profile. Administración decide por API. Actualizar sesión para obtener roles/memberships concedidos.

### Catálogo, SKU e inventario

Producto y SKU tienen IDs distintos. PublishProductDto crea producto y SKU inicial y devuelve {productId,skuId}. UpdateProductDto cambia metadata/actividad del producto. CreateSkuDto/UpdateSkuDto controlan variante, precio y actividad; StockAdjustmentDto registra cantidad y motivo de ajuste. La reserva/venta no es un ajuste de inventario desde frontend.

El catálogo público devuelve skus[].availableStock. El panel privado devuelve onHand/reserved/available y movimientos. No usar el primer SKU inactivo o sin stock como fallback de compra. Si faltan categorías, imágenes o stock, mostrar estado correspondiente sin generar valores comerciales.

### Compra simple y multitienda

Enviar CreatePurchaseDto con addressId, paymentMethod:'cash', items:[{skuId,quantity,note?}], cashTenderCents opcional/null y expectedTotalCents cuando se confirma un total revisado. No enviar precios desde el carrito como fuente de verdad.

1. Resolver referencias y cantidades de carrito usando catálogo actual.
2. Una tienda: POST /checkout/quote. Varias: POST /checkout/groups/quote.
3. Mostrar totales y dinero previsto/cambio del servidor; el cliente acepta ese resultado.
4. Crear intención estable con UUID, payload y snapshot local. POST /purchases o /checkout/groups con Idempotency-Key.
5. Timeout no equivale a fallo de compra: consultar /me/checkout-attempts/{key} o /me/group-checkout-attempts/{key}; si corresponde, reintentar misma intención.
6. Consumir sólo líneas del snapshot confirmado; no borrar cambios de carrito posteriores. GroupCheckoutPage navega con group.id; detalle de orden con orderId.

CreatePurchaseDto valida 1–100 líneas, cantidad 1–10000 y nota hasta 500 caracteres. La agrupación soporta hasta 10 tiendas según GroupQuote/GroupCheckout y servicio. El backend es responsable de transacciones y reservas.

### Preparación, reparto y cobro

Orden: pending → confirmed → preparing → ready → in_transit → delivered. Rechazo/cancelación dependen de reglas de estado/propiedad del servidor. accept/start-preparation/mark-ready reciben {expectedVersion:order.version}; cancel/reject requieren también reason.

Claim y asignación usan ID/version de orden. Pickup/deliver/release/incidents usan ID/version de **assignment**. AssignCourierDto incluye courierUserId, expectedVersion y reason. DeliverCashDto incluye cashReceivedCents y expectedVersion. Confirmar cobro sólo tras respuesta; no convertir un botón local en entrega exitosa. Ante 409 recargar y pedir revisión de la acción.

### Soporte, valoraciones, reportes y pagos

Tickets usan estados open/in_review/resolved, prioridad low/normal/high y versión para decisión administrativa. Resolver ticket no ejecuta devolución ni entrega. Reseñas se envían con orderId y se agregan por tienda en /stores/{id}/reviews. Favoritos y notificaciones pertenecen al usuario autenticado.

Reportes usan from inclusivo y to exclusivo; preservar definición/currency de respuesta. No recrear ventas con fixtures. /payment-methods devuelve available/unavailableReason: la presencia de Yape/Plin en catálogo no implica proveedor integrado. El DTO de compra admite sólo cash. /me/purchases/{id}/payments permite leer intentos/reembolsos reales, no crearlos.

## 5. Inventario exhaustivo de operaciones

Convenciones: todas las rutas se muestran sin el prefijo común /api/v1. req significa obligatorio en OpenAPI. Los cuerpos nombrados remiten al diccionario de la sección 6. Sin schema significa contrato OpenAPI incompleto, no ausencia garantizada de datos. Acceso representa el alcance esperado; roles y propiedad también se validan dentro de servicios, no sólo en decoradores.

### HealthController

#### GET /health/live

| Aspecto | Mapeo |
|---|---|
| Operación | HealthController_live |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper; monitor de despliegue |
| Fuente | [backend/src/platform/controllers/health.controller.ts:11](../../backend/src/platform/controllers/health.controller.ts#L11) |

#### GET /health/ready

| Aspecto | Mapeo |
|---|---|
| Operación | HealthController_ready |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper; monitor de despliegue |
| Fuente | [backend/src/platform/controllers/health.controller.ts:14](../../backend/src/platform/controllers/health.controller.ts#L14) |

#### GET /health

| Aspecto | Mapeo |
|---|---|
| Operación | HealthController_getHealth — Verificar estado de salud del backend y base de datos |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | DemoSwitcher vía apiFetch |
| Fuente | [backend/src/platform/controllers/health.controller.ts:14](../../backend/src/platform/controllers/health.controller.ts#L14) |

### AuthController

#### POST /auth/verification-code/send

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_sendVerificationCode — Enviar código de verificación de 6 dígitos al correo |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | SendVerificationCodeDto |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | authStore.sendVerificationCode (apiFetch; quitar éxito simulado) |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:44](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L44) |

#### POST /auth/register

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_register — Registrar nueva cuenta de cliente con validación de código |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | RegisterDto |
| Respuesta documentada | 201: AuthResponseDto |
| Cliente / pendiente | identityApi.register / authStore.registerCustomerWithApi |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:51](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L51) |

#### POST /auth/google

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_google — Iniciar sesión o registrarse con Google |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | GoogleAuthDto |
| Respuesta documentada | 200: AuthResponseDto |
| Cliente / pendiente | authStore.loginGoogleWithToken (apiFetch) |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:61](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L61) |

#### POST /auth/login

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_login — Iniciar sesión con correo y contraseña |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | LoginDto |
| Respuesta documentada | 200: AuthResponseDto |
| Cliente / pendiente | identityApi.login |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:75](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L75) |

#### POST /auth/logout

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_logout — Cerrar y revocar sesión actual |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | identityApi.logout |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:86](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L86) |

#### GET /auth/session

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_session — Restaurar sesión web y protección CSRF |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AuthResponseDto |
| Cliente / pendiente | identityApi.session |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:96](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L96) |

#### GET /me

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_getProfile — Obtener perfil del usuario autenticado |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: UserProfileDto |
| Cliente / pendiente | Sin wrapper GET me; session aporta perfil |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:97](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L97) |

#### PATCH /me

| Aspecto | Mapeo |
|---|---|
| Operación | AuthController_updateProfile — Actualizar datos propios sin modificar roles, estado o membresías |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | UpdateProfileDto |
| Respuesta documentada | 200: UserProfileDto |
| Cliente / pendiente | identityApi.updateProfile |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/auth.controller.ts:115](../../backend/src/modules/identity/infrastructure/controllers/auth.controller.ts#L115) |

### AdminUsersController

#### GET /admin/overview

| Aspecto | Mapeo |
|---|---|
| Operación | AdminUsersController_overview |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AdminOverviewDto |
| Cliente / pendiente | operationsApi.overview |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/admin-users.controller.ts:12](../../backend/src/modules/identity/infrastructure/controllers/admin-users.controller.ts#L12) |

#### GET /admin/users

| Aspecto | Mapeo |
|---|---|
| Operación | AdminUsersController_list |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: status (opcional) "active" / "pending" / "suspended" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AdminUserListDto |
| Cliente / pendiente | operationsApi.adminUsers |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/admin-users.controller.ts:13](../../backend/src/modules/identity/infrastructure/controllers/admin-users.controller.ts#L13) |

#### PATCH /admin/users/{id}/status

| Aspecto | Mapeo |
|---|---|
| Operación | AdminUsersController_change |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | UserStatusDto |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | operationsApi.userStatus |
| Fuente | [backend/src/modules/identity/infrastructure/controllers/admin-users.controller.ts:15](../../backend/src/modules/identity/infrastructure/controllers/admin-users.controller.ts#L15) |

### GeographyController

#### GET /geography/zones

| Aspecto | Mapeo |
|---|---|
| Operación | GeographyController_zones |
| Acceso | Público |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: ZoneDto[] |
| Cliente / pendiente | operationsApi.zones |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:14](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L14) |

#### GET /me/addresses

| Aspecto | Mapeo |
|---|---|
| Operación | GeographyController_addresses |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AddressDto[] |
| Cliente / pendiente | operationsApi.addresses |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:16](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L16) |

#### POST /me/addresses

| Aspecto | Mapeo |
|---|---|
| Operación | GeographyController_create |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | CreateAddressDto |
| Respuesta documentada | 201: AddressDto |
| Cliente / pendiente | operationsApi.saveAddress sin id |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:18](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L18) |

#### PATCH /me/addresses/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | GeographyController_update |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | UpdateAddressDto |
| Respuesta documentada | 200: AddressDto |
| Cliente / pendiente | operationsApi.saveAddress con id |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:20](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L20) |

#### DELETE /me/addresses/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | GeographyController_remove |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | operationsApi.archiveAddress |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:24](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L24) |

#### PUT /me/addresses/{id}/default

| Aspecto | Mapeo |
|---|---|
| Operación | GeographyController_default |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AddressDto |
| Cliente / pendiente | operationsApi.defaultAddress |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:22](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L22) |

### AdminZonesController

#### GET /admin/zones

| Aspecto | Mapeo |
|---|---|
| Operación | AdminZonesController_list |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: ZoneListDto |
| Cliente / pendiente | operationsApi.adminZones |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:31](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L31) |

#### POST /admin/zones

| Aspecto | Mapeo |
|---|---|
| Operación | AdminZonesController_create |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | — |
| Cuerpo JSON | CreateZoneDto |
| Respuesta documentada | 201: ZoneDto |
| Cliente / pendiente | operationsApi.saveZone sin id |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:33](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L33) |

#### PATCH /admin/zones/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | AdminZonesController_update |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | UpdateZoneDto |
| Respuesta documentada | 200: ZoneDto |
| Cliente / pendiente | operationsApi.saveZone con id |
| Fuente | [backend/src/modules/geography/infrastructure/controllers/geography.controller.ts:35](../../backend/src/modules/geography/infrastructure/controllers/geography.controller.ts#L35) |

### StoresController

#### GET /stores

| Aspecto | Mapeo |
|---|---|
| Operación | StoresController_listStores — Listar comercios activos |
| Acceso | Público |
| Parámetros | query: category (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | catalogApi.stores (añadir filtro category si se usa) |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/stores.controller.ts:9](../../backend/src/modules/merchant/infrastructure/controllers/stores.controller.ts#L9) |

#### GET /stores/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | StoresController_getStoreById — Detalle público de comercio |
| Acceso | Público |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | catalogApi.store (ampliar schema del detalle público) |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/stores.controller.ts:11](../../backend/src/modules/merchant/infrastructure/controllers/stores.controller.ts#L11) |

### StoreManagementController

#### GET /merchant/categories

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_categories |
| Acceso | Sesión; crear/consultar alcance propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreCategoryDto[] |
| Cliente / pendiente | operationsApi.categories |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:14](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L14) |

#### GET /merchant/stores

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_list |
| Acceso | Sesión; crear/consultar alcance propio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreListDto |
| Cliente / pendiente | operationsApi.ownStores |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:16](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L16) |

#### POST /merchant/stores

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_create |
| Acceso | Sesión; crear/consultar alcance propio |
| Parámetros | — |
| Cuerpo JSON | CreateStoreDto |
| Respuesta documentada | 201: StoreDetailDto |
| Cliente / pendiente | operationsApi.applyStore |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:18](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L18) |

#### GET /merchant/stores/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_detail |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreDetailDto |
| Cliente / pendiente | operationsApi.store |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:20](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L20) |

#### PATCH /merchant/stores/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_update |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | UpdateStoreDto |
| Respuesta documentada | 200: StoreDetailDto |
| Cliente / pendiente | operationsApi.updateStore |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:22](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L22) |

#### PUT /merchant/stores/{id}/hours

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_hours |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | ReplaceHoursDto |
| Respuesta documentada | 200: StoreDetailDto |
| Cliente / pendiente | operationsApi.hours |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:24](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L24) |

#### GET /merchant/stores/{id}/members

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_members |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreMemberDto[] |
| Cliente / pendiente | operationsApi.members |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:26](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L26) |

#### PUT /merchant/stores/{id}/members

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_setMember |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | SetStoreMemberDto |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | operationsApi.setMember |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:28](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L28) |

#### DELETE /merchant/stores/{id}/members/{userId}

| Aspecto | Mapeo |
|---|---|
| Operación | StoreManagementController_revoke |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; path: userId (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | operationsApi.revokeMember |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:30](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L30) |

### AdminStoresController

#### GET /admin/stores

| Aspecto | Mapeo |
|---|---|
| Operación | AdminStoresController_list |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: status (opcional) "pending" / "active" / "rejected" / "suspended" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreListDto |
| Cliente / pendiente | operationsApi.adminStores |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:37](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L37) |

#### GET /admin/stores/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | AdminStoresController_detail |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreDetailDto |
| Cliente / pendiente | Sin wrapper de detalle admin; añadir adminStore(id) |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:39](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L39) |

#### POST /admin/stores/{id}/decisions

| Aspecto | Mapeo |
|---|---|
| Operación | AdminStoresController_decide |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | OperationalDecisionDto |
| Respuesta documentada | 201: StoreDetailDto |
| Cliente / pendiente | operationsApi.decideStore |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:41](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L41) |

#### POST /admin/stores/{id}/approve

| Aspecto | Mapeo |
|---|---|
| Operación | AdminStoresController_approve |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 201: StoreDetailDto |
| Cliente / pendiente | Sin wrapper; preferir decisions con motivo explícito |
| Fuente | [backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts:43](../../backend/src/modules/merchant/infrastructure/controllers/store-management.controller.ts#L43) |

### CatalogManagementController

#### POST /merchant/products/{id}/images

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_image |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | ProductImageInputDto |
| Respuesta documentada | 201: CatalogProductDto |
| Cliente / pendiente | catalogApi.image |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:15](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L15) |

#### DELETE /merchant/products/{id}/images/{imageId}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_removeImage |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; path: imageId (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | catalogApi.removeImage |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:17](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L17) |

#### GET /media/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_imageFile |
| Acceso | Público |
| Parámetros | path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: string (binary) |
| Cliente / pendiente | URL de imagen; mediaUrl/imageUrl, no apiRequest JSON |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:19](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L19) |

#### GET /merchant/products/{id}/media/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_ownImageFile |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: string (binary) |
| Cliente / pendiente | URL de imagen autenticada; cookie o fetch binario |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:24](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L24) |

#### GET /catalog/categories

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_categories |
| Acceso | Público |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CategoryDto[] |
| Cliente / pendiente | catalogApi.categories |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:29](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L29) |

#### GET /catalog/search

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_search |
| Acceso | Público |
| Parámetros | query: q (opcional) string; query: category (opcional) string; query: storeId (opcional) string; query: zoneId (opcional) string; query: minPriceCents (opcional) number; query: maxPriceCents (opcional) number; query: available (opcional) "true" / "false"; query: limit (opcional) number; query: cursor (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CatalogPageDto |
| Cliente / pendiente | catalogApi.search |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:31](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L31) |

#### GET /stores/{id}/products

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_storeProducts |
| Acceso | Público |
| Parámetros | path: id (req) string; query: q (opcional) string; query: category (opcional) string; query: storeId (opcional) string; query: zoneId (opcional) string; query: minPriceCents (opcional) number; query: maxPriceCents (opcional) number; query: available (opcional) "true" / "false"; query: limit (opcional) number; query: cursor (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CatalogPageDto |
| Cliente / pendiente | Sin wrapper dedicado; search({storeId}) equivalente para listado |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:33](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L33) |

#### GET /products/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_detail |
| Acceso | Público |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CatalogProductDto |
| Cliente / pendiente | catalogApi.product |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:35](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L35) |

#### GET /merchant/stores/{id}/products

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_own |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; query: q (opcional) string; query: category (opcional) string; query: storeId (opcional) string; query: zoneId (opcional) string; query: minPriceCents (opcional) number; query: maxPriceCents (opcional) number; query: available (opcional) "true" / "false"; query: limit (opcional) number; query: cursor (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CatalogPageDto |
| Cliente / pendiente | catalogApi.products |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:37](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L37) |

#### POST /merchant/stores/{id}/products

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_create |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | PublishProductDto |
| Respuesta documentada | 201: CreatedProductDto |
| Cliente / pendiente | catalogApi.create |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:41](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L41) |

#### GET /merchant/products/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_ownDetail |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CatalogProductDto |
| Cliente / pendiente | catalogApi.ownProduct |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:39](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L39) |

#### PATCH /merchant/products/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_update |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | UpdateProductDto |
| Respuesta documentada | 200: CatalogProductDto |
| Cliente / pendiente | catalogApi.update |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:43](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L43) |

#### DELETE /merchant/products/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_deleteProduct |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | Sólo supabaseSync; añadir catalogApi.remove tipado |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:45](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L45) |

#### POST /merchant/products/{id}/skus

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_addSku |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | CreateSkuDto |
| Respuesta documentada | 201: CatalogProductDto |
| Cliente / pendiente | catalogApi.addSku |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:47](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L47) |

#### PATCH /merchant/skus/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_updateSku |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | UpdateSkuDto |
| Respuesta documentada | 200: CatalogProductDto |
| Cliente / pendiente | catalogApi.updateSku |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:49](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L49) |

#### GET /merchant/stores/{id}/inventory

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_inventory |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: InventoryItemDto[] |
| Cliente / pendiente | catalogApi.inventory |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:51](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L51) |

#### POST /merchant/skus/{id}/stock-adjustments

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_adjust |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | StockAdjustmentDto |
| Respuesta documentada | 201: InventoryMovementDto |
| Cliente / pendiente | catalogApi.adjust |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:53](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L53) |

#### GET /merchant/skus/{id}/movements

| Aspecto | Mapeo |
|---|---|
| Operación | CatalogManagementController_movements |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; query: q (opcional) string; query: category (opcional) string; query: storeId (opcional) string; query: zoneId (opcional) string; query: minPriceCents (opcional) number; query: maxPriceCents (opcional) number; query: available (opcional) "true" / "false"; query: limit (opcional) number; query: cursor (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: InventoryMovementDto[] |
| Cliente / pendiente | catalogApi.movements |
| Fuente | [backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts:55](../../backend/src/modules/catalog/infrastructure/controllers/catalog-management.controller.ts#L55) |

### ProfileMediaController

#### GET /me/avatar

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_avatar |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AvatarDto |
| Cliente / pendiente | mediaApi.avatar |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:14](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L14) |

#### PUT /me/avatar

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_setAvatar |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | ImageContentDto |
| Respuesta documentada | 200: AvatarDto |
| Cliente / pendiente | mediaApi.saveAvatar |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:16](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L16) |

#### DELETE /me/avatar

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_removeAvatar |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AvatarDto |
| Cliente / pendiente | mediaApi.removeAvatar |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:18](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L18) |

#### GET /me/avatar/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_avatarImage |
| Acceso | Sesión; recurso propio |
| Parámetros | path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: string (binary) |
| Cliente / pendiente | URL autenticada de avatar; mediaUrl |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:20](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L20) |

#### GET /merchant/stores/{id}/branding

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_branding |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreBrandingDto |
| Cliente / pendiente | mediaApi.branding |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:22](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L22) |

#### PUT /merchant/stores/{id}/branding/{kind}

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_setBranding |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; path: kind (req) "logo" / "banner" |
| Cuerpo JSON | ImageContentDto |
| Respuesta documentada | 200: StoreBrandingDto |
| Cliente / pendiente | mediaApi.saveBranding |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:24](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L24) |

#### DELETE /merchant/stores/{id}/branding/{kind}

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_removeBranding |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; path: kind (req) "logo" / "banner" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreBrandingDto |
| Cliente / pendiente | mediaApi.removeBranding |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:26](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L26) |

#### GET /merchant/stores/{id}/branding/{kind}/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_ownBrandImage |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; path: kind (req) "logo" / "banner"; path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: string (binary) |
| Cliente / pendiente | URL autenticada de branding; mediaUrl |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:28](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L28) |

#### GET /stores/{id}/branding

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_publicBranding |
| Acceso | Público |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: StoreBrandingDto |
| Cliente / pendiente | Sin wrapper dedicado; stores incluye URLs |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:30](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L30) |

#### GET /stores/{id}/branding/{kind}/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | ProfileMediaController_brandImage |
| Acceso | Público |
| Parámetros | path: id (req) string; path: kind (req) "logo" / "banner"; path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: string (binary) |
| Cliente / pendiente | URL pública de branding; mediaUrl |
| Fuente | [backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts:32](../../backend/src/modules/media/infrastructure/controllers/profile-media.controller.ts#L32) |

### OrderingController

#### POST /purchases

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_createPurchase — Crear compra e iniciar reserva de inventario (Idempotente) |
| Acceso | Sesión; alcance validado en servicio |
| Parámetros | header: Idempotency-Key (req) string |
| Cuerpo JSON | CreatePurchaseDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.create |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:30](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L30) |

#### GET /me/purchases

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_getUserPurchases — Consultar historial de compras del cliente |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper; legado, usar me/orders para pantalla nueva |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:42](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L42) |

#### POST /orders/{id}/cancellations

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_cancelOrder — Cancelar un pedido antes de su preparación (libera reservas de stock) |
| Acceso | Sesión; propiedad o alcance de orden |
| Parámetros | path: id (req) string |
| Cuerpo JSON | CancelOrderDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action(path,{expectedVersion,reason}) |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:50](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L50) |

#### GET /merchant/stores/{storeId}/orders

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_getStoreOrders — Listar comandas de una tienda (Panel de Comercio) |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: storeId (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper; legado, usar order-feed |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:63](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L63) |

#### POST /merchant/orders/{id}/accept

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_acceptOrder — Comercio acepta pedido (pending -> confirmed) |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | VersionDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action(path,{expectedVersion}) |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:72](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L72) |

#### POST /merchant/orders/{id}/start-preparation

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_startPreparation — Comercio inicia preparación en cocina (confirmed -> preparing) |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | VersionDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action(path,{expectedVersion}) |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:85](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L85) |

#### POST /merchant/orders/{id}/mark-ready

| Aspecto | Mapeo |
|---|---|
| Operación | OrderingController_markReady — Comercio marca pedido listo para recojo (preparing -> ready) |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | VersionDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action(path,{expectedVersion}) |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts:98](../../backend/src/modules/ordering/infrastructure/controllers/ordering.controller.ts#L98) |

### OrderFlowController

#### POST /checkout/quote

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_quote |
| Acceso | Sesión; alcance validado en servicio |
| Parámetros | — |
| Cuerpo JSON | CreatePurchaseDto |
| Respuesta documentada | 200: QuoteDto |
| Cliente / pendiente | orderingApi.quote |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:13](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L13) |

#### GET /me/orders

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_own |
| Acceso | Sesión; recurso propio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: storeId (opcional) string; query: status (opcional) "pending" / "confirmed" / "preparing" / "ready" / "in_transit" / "delivered" / "cancelled" / "rejected"; query: scope (opcional) "available" / "active" / "history" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderPageDto |
| Cliente / pendiente | orderingApi.list("/me/orders") |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:15](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L15) |

#### GET /merchant/stores/{id}/order-feed

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_merchant |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; query: limit (opcional) number; query: cursor (opcional) string (uuid); query: storeId (opcional) string; query: status (opcional) "pending" / "confirmed" / "preparing" / "ready" / "in_transit" / "delivered" / "cancelled" / "rejected"; query: scope (opcional) "available" / "active" / "history" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderPageDto |
| Cliente / pendiente | orderingApi.list("/merchant/stores/{id}/order-feed") |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:17](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L17) |

#### GET /admin/orders

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_admin |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: storeId (opcional) string; query: status (opcional) "pending" / "confirmed" / "preparing" / "ready" / "in_transit" / "delivered" / "cancelled" / "rejected"; query: scope (opcional) "available" / "active" / "history" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderPageDto |
| Cliente / pendiente | orderingApi.list("/admin/orders") |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:19](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L19) |

#### GET /courier/orders

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_courier |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: storeId (opcional) string; query: status (opcional) "pending" / "confirmed" / "preparing" / "ready" / "in_transit" / "delivered" / "cancelled" / "rejected"; query: scope (opcional) "available" / "active" / "history" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderPageDto |
| Cliente / pendiente | orderingApi.list("/courier/orders",{scope}) |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:21](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L21) |

#### GET /orders/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_detail |
| Acceso | Sesión; propiedad o alcance de orden |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderDetailDto |
| Cliente / pendiente | orderingApi.detail |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:23](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L23) |

#### GET /me/purchases/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_purchase |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderDetailDto |
| Cliente / pendiente | Sin wrapper por purchaseId; añadir si se conserva esta navegación |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:25](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L25) |

#### GET /me/checkout-attempts/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_attempt |
| Acceso | Sesión; recurso propio |
| Parámetros | path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OrderDetailDto |
| Cliente / pendiente | orderingApi.attempt |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:27](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L27) |

#### POST /merchant/orders/{id}/rejections

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_reject |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | CancelOrderDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action(path,{expectedVersion,reason}) |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:29](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L29) |

#### GET /admin/courier-options

| Aspecto | Mapeo |
|---|---|
| Operación | OrderFlowController_couriers |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: storeId (opcional) string; query: status (opcional) "pending" / "confirmed" / "preparing" / "ready" / "in_transit" / "delivered" / "cancelled" / "rejected"; query: scope (opcional) "available" / "active" / "history" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CourierChoiceDto[] |
| Cliente / pendiente | orderingApi.couriers |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts:31](../../backend/src/modules/ordering/infrastructure/controllers/order-flow.controller.ts#L31) |

### GroupCheckoutController

#### POST /checkout/groups/quote

| Aspecto | Mapeo |
|---|---|
| Operación | GroupCheckoutController_quote |
| Acceso | Sesión; alcance validado en servicio |
| Parámetros | — |
| Cuerpo JSON | CreatePurchaseDto |
| Respuesta documentada | 200: GroupQuoteDto |
| Cliente / pendiente | orderingApi.groupQuote |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts:16](../../backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts#L16) |

#### POST /checkout/groups

| Aspecto | Mapeo |
|---|---|
| Operación | GroupCheckoutController_create |
| Acceso | Sesión; alcance validado en servicio |
| Parámetros | header: Idempotency-Key (req) string |
| Cuerpo JSON | CreatePurchaseDto |
| Respuesta documentada | 201: GroupCheckoutDto |
| Cliente / pendiente | orderingApi.groupCreate |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts:19](../../backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts#L19) |

#### GET /me/checkout-groups/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | GroupCheckoutController_detail |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: GroupCheckoutDto |
| Cliente / pendiente | orderingApi.groupDetail |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts:23](../../backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts#L23) |

#### GET /me/group-checkout-attempts/{key}

| Aspecto | Mapeo |
|---|---|
| Operación | GroupCheckoutController_attempt |
| Acceso | Sesión; recurso propio |
| Parámetros | path: key (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: GroupCheckoutDto |
| Cliente / pendiente | orderingApi.groupAttempt |
| Fuente | [backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts:25](../../backend/src/modules/ordering/infrastructure/controllers/group-checkout.controller.ts#L25) |

### DeliveryController

#### GET /courier/available-orders

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_listAvailableOrders — Listar pedidos listos para recojo en espera de repartidor |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper dedicado; alternativa courier/orders?scope=available |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:27](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L27) |

#### GET /courier/active-assignment

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_getActiveAssignment — Obtener la entrega actualmente activa del repartidor |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper dedicado; añadir entrega activa tipada si se usa |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:33](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L33) |

#### POST /courier/orders/{id}/claim

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_claimOrder — Repartidor toma un pedido listo para entrega (claim) |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | path: id (req) string |
| Cuerpo JSON | VersionDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action; RealOrderPages ClaimButton |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:39](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L39) |

#### POST /courier/assignments/{id}/pickup

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_pickupDelivery — Repartidor retira pedido del comercio (descuenta stock físico on_hand) |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | path: id (req) string |
| Cuerpo JSON | VersionDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action; RealOrderPages |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:49](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L49) |

#### POST /courier/assignments/{id}/deliver

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_completeDelivery — Repartidor entrega pedido al cliente (confirma cobro de efectivo) |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | path: id (req) string |
| Cuerpo JSON | DeliverCashDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action con DeliverCashDto |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:59](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L59) |

#### POST /courier/assignments/{id}/release

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_release |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | path: id (req) string |
| Cuerpo JSON | CancelOrderDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action con CancelOrderDto |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:67](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L67) |

#### POST /courier/assignments/{id}/incidents

| Aspecto | Mapeo |
|---|---|
| Operación | DeliveryController_incident |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | path: id (req) string |
| Cuerpo JSON | CancelOrderDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action con CancelOrderDto |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:69](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L69) |

### AdminDeliveryController

#### POST /admin/orders/{id}/assignment

| Aspecto | Mapeo |
|---|---|
| Operación | AdminDeliveryController_assign |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | AssignCourierDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action con AssignCourierDto |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:76](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L76) |

#### POST /admin/assignments/{id}/release

| Aspecto | Mapeo |
|---|---|
| Operación | AdminDeliveryController_release |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | CancelOrderDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | orderingApi.action con CancelOrderDto |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:78](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L78) |

### MerchantDeliveryController

#### GET /merchant/available-couriers

| Aspecto | Mapeo |
|---|---|
| Operación | MerchantDeliveryController_listAvailableCouriers — Listar repartidores disponibles para asignar pedido |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper; añadir deliveryApi.availableCouriers |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:91](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L91) |

#### POST /merchant/orders/{id}/assign-courier

| Aspecto | Mapeo |
|---|---|
| Operación | MerchantDeliveryController_assignCourier — Comercio asigna un repartidor a su orden |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | AssignCourierDto |
| Respuesta documentada | 201: sin schema declarado |
| Cliente / pendiente | Sólo supabaseSync helper; falta UI real y wrapper tipado |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts:97](../../backend/src/modules/delivery/infrastructure/controllers/delivery.controller.ts#L97) |

### CourierProfileController

#### GET /courier/profile

| Aspecto | Mapeo |
|---|---|
| Operación | CourierProfileController_own |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CourierProfileDto |
| Cliente / pendiente | operationsApi.courier |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts:14](../../backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts#L14) |

#### PUT /courier/profile

| Aspecto | Mapeo |
|---|---|
| Operación | CourierProfileController_apply |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | — |
| Cuerpo JSON | ApplyCourierDto |
| Respuesta documentada | 200: CourierProfileDto |
| Cliente / pendiente | operationsApi.applyCourier |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts:16](../../backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts#L16) |

#### PATCH /courier/profile/availability

| Aspecto | Mapeo |
|---|---|
| Operación | CourierProfileController_availability |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | — |
| Cuerpo JSON | CourierAvailabilityDto |
| Respuesta documentada | 200: CourierProfileDto |
| Cliente / pendiente | operationsApi.availability |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts:18](../../backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts#L18) |

### AdminCouriersController

#### GET /admin/couriers

| Aspecto | Mapeo |
|---|---|
| Operación | AdminCouriersController_list |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid); query: status (opcional) "pending" / "active" / "rejected" / "suspended" |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CourierListDto |
| Cliente / pendiente | operationsApi.adminCouriers |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts:25](../../backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts#L25) |

#### GET /admin/couriers/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | AdminCouriersController_detail |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: CourierProfileDto |
| Cliente / pendiente | Sin wrapper de detalle admin; añadir adminCourier(id) |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts:27](../../backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts#L27) |

#### POST /admin/couriers/{id}/decisions

| Aspecto | Mapeo |
|---|---|
| Operación | AdminCouriersController_decide |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | OperationalDecisionDto |
| Respuesta documentada | 201: CourierProfileDto |
| Cliente / pendiente | operationsApi.decideCourier |
| Fuente | [backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts:29](../../backend/src/modules/delivery/infrastructure/controllers/courier-profile.controller.ts#L29) |

### PlatformController

#### GET /me/notifications

| Aspecto | Mapeo |
|---|---|
| Operación | PlatformController_page |
| Acceso | Sesión; recurso propio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: NotificationPage |
| Cliente / pendiente | engagementApi.notifications |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/platform.controller.ts:26](../../backend/src/modules/platform/infrastructure/controllers/platform.controller.ts#L26) |

#### PATCH /me/notifications/read-all

| Aspecto | Mapeo |
|---|---|
| Operación | PlatformController_readAll |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.read() |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/platform.controller.ts:28](../../backend/src/modules/platform/infrastructure/controllers/platform.controller.ts#L28) |

#### PATCH /me/notifications/{id}/read

| Aspecto | Mapeo |
|---|---|
| Operación | PlatformController_read |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.read(id) |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/platform.controller.ts:30](../../backend/src/modules/platform/infrastructure/controllers/platform.controller.ts#L30) |

#### GET /notifications

| Aspecto | Mapeo |
|---|---|
| Operación | PlatformController_getNotifications — Obtener notificaciones del usuario autenticado |
| Acceso | Sesión; alcance validado en servicio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: sin schema declarado |
| Cliente / pendiente | Sin wrapper; legado, preferir me/notifications |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/platform.controller.ts:34](../../backend/src/modules/platform/infrastructure/controllers/platform.controller.ts#L34) |

#### PATCH /notifications/{id}/read

| Aspecto | Mapeo |
|---|---|
| Operación | PlatformController_markAsRead — Marcar notificación como leída |
| Acceso | Sesión; alcance validado en servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | Sin wrapper; legado, preferir me/notifications/{id}/read |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/platform.controller.ts:41](../../backend/src/modules/platform/infrastructure/controllers/platform.controller.ts#L41) |

### ReportController

#### GET /admin/reports

| Aspecto | Mapeo |
|---|---|
| Operación | ReportController_admin |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: from (opcional) string; query: to (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: ReportResult |
| Cliente / pendiente | engagementApi.report("/admin/reports",range) |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/report.controller.ts:10](../../backend/src/modules/platform/infrastructure/controllers/report.controller.ts#L10) |

#### GET /merchant/stores/{id}/reports

| Aspecto | Mapeo |
|---|---|
| Operación | ReportController_merchant |
| Acceso | Sesión; membresía/permiso de tienda o admin |
| Parámetros | path: id (req) string; query: from (opcional) string; query: to (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: ReportResult |
| Cliente / pendiente | engagementApi.report("/merchant/stores/{id}/reports",range) |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/report.controller.ts:11](../../backend/src/modules/platform/infrastructure/controllers/report.controller.ts#L11) |

#### GET /courier/earnings

| Aspecto | Mapeo |
|---|---|
| Operación | ReportController_courier |
| Acceso | Sesión; perfil/rol/propiedad de reparto según operación |
| Parámetros | query: from (opcional) string; query: to (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: ReportResult |
| Cliente / pendiente | engagementApi.report("/courier/earnings",range) |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/report.controller.ts:12](../../backend/src/modules/platform/infrastructure/controllers/report.controller.ts#L12) |

#### GET /admin/audit

| Aspecto | Mapeo |
|---|---|
| Operación | ReportController_audit |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: cursor (opcional) string; query: action (opcional) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: AuditPage |
| Cliente / pendiente | engagementApi.audit |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/report.controller.ts:13](../../backend/src/modules/platform/infrastructure/controllers/report.controller.ts#L13) |

### OperationsController

#### GET /admin/operations

| Aspecto | Mapeo |
|---|---|
| Operación | OperationsController_status |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: OperationsDto |
| Cliente / pendiente | OperationalHealthPage vía apiRequest |
| Fuente | [backend/src/modules/platform/infrastructure/controllers/operations.controller.ts:13](../../backend/src/modules/platform/infrastructure/controllers/operations.controller.ts#L13) |

### EngagementController

#### GET /me/favorites

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_favorites |
| Acceso | Sesión; recurso propio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: FavoritePage |
| Cliente / pendiente | engagementApi.favorites |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:12](../../backend/src/modules/engagement/engagement.controller.ts#L12) |

#### PUT /me/favorites/products/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_addProduct |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.favorite("product",id,true) |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:14](../../backend/src/modules/engagement/engagement.controller.ts#L14) |

#### DELETE /me/favorites/products/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_removeProduct |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.favorite("product",id,false) |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:16](../../backend/src/modules/engagement/engagement.controller.ts#L16) |

#### PUT /me/favorites/stores/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_addStore |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.favorite("store",id,true) |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:18](../../backend/src/modules/engagement/engagement.controller.ts#L18) |

#### DELETE /me/favorites/stores/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_removeStore |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.favorite("store",id,false) |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:20](../../backend/src/modules/engagement/engagement.controller.ts#L20) |

#### POST /orders/{id}/reviews

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_review |
| Acceso | Sesión; propiedad o alcance de orden |
| Parámetros | path: id (req) string |
| Cuerpo JSON | ReviewInput |
| Respuesta documentada | 201: ReviewItem |
| Cliente / pendiente | engagementApi.review |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:22](../../backend/src/modules/engagement/engagement.controller.ts#L22) |

#### GET /stores/{id}/reviews

| Aspecto | Mapeo |
|---|---|
| Operación | EngagementController_reviews |
| Acceso | Público |
| Parámetros | path: id (req) string; query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: ReviewPage |
| Cliente / pendiente | engagementApi.reviews |
| Fuente | [backend/src/modules/engagement/engagement.controller.ts:24](../../backend/src/modules/engagement/engagement.controller.ts#L24) |

### SupportController

#### GET /me/tickets

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_list |
| Acceso | Sesión; recurso propio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: TicketPage |
| Cliente / pendiente | engagementApi.tickets(false) |
| Fuente | [backend/src/modules/support/support.controller.ts:11](../../backend/src/modules/support/support.controller.ts#L11) |

#### POST /me/tickets

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_create |
| Acceso | Sesión; recurso propio |
| Parámetros | — |
| Cuerpo JSON | TicketInput |
| Respuesta documentada | 201: TicketItem |
| Cliente / pendiente | engagementApi.createTicket |
| Fuente | [backend/src/modules/support/support.controller.ts:15](../../backend/src/modules/support/support.controller.ts#L15) |

#### GET /admin/tickets

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_adminList |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: TicketPage |
| Cliente / pendiente | engagementApi.tickets(true) |
| Fuente | [backend/src/modules/support/support.controller.ts:12](../../backend/src/modules/support/support.controller.ts#L12) |

#### GET /me/tickets/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_detail |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: TicketDetail |
| Cliente / pendiente | engagementApi.ticket(false,id) |
| Fuente | [backend/src/modules/support/support.controller.ts:13](../../backend/src/modules/support/support.controller.ts#L13) |

#### GET /admin/tickets/{id}

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_adminDetail |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | — |
| Respuesta documentada | 200: TicketDetail |
| Cliente / pendiente | engagementApi.ticket(true,id) |
| Fuente | [backend/src/modules/support/support.controller.ts:14](../../backend/src/modules/support/support.controller.ts#L14) |

#### POST /tickets/{id}/messages

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_message |
| Acceso | Sesión; autor o admin |
| Parámetros | path: id (req) string |
| Cuerpo JSON | MessageInput |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.message |
| Fuente | [backend/src/modules/support/support.controller.ts:16](../../backend/src/modules/support/support.controller.ts#L16) |

#### POST /admin/tickets/{id}/decisions

| Aspecto | Mapeo |
|---|---|
| Operación | SupportController_decide |
| Acceso | Sesión admin; validación en guard/servicio |
| Parámetros | path: id (req) string |
| Cuerpo JSON | TicketDecision |
| Respuesta documentada | 204: sin cuerpo |
| Cliente / pendiente | engagementApi.decide |
| Fuente | [backend/src/modules/support/support.controller.ts:17](../../backend/src/modules/support/support.controller.ts#L17) |

### BillingQueryController

#### GET /payment-methods

| Aspecto | Mapeo |
|---|---|
| Operación | BillingQueryController_methods |
| Acceso | Público (Origin en mutaciones) |
| Parámetros | — |
| Cuerpo JSON | — |
| Respuesta documentada | 200: PaymentMethodDto[] |
| Cliente / pendiente | Sin wrapper; añadir billingApi.methods |
| Fuente | [backend/src/modules/billing/infrastructure/billing.controller.ts:16](../../backend/src/modules/billing/infrastructure/billing.controller.ts#L16) |

#### GET /me/purchases/{id}/payments

| Aspecto | Mapeo |
|---|---|
| Operación | BillingQueryController_own |
| Acceso | Sesión; recurso propio |
| Parámetros | path: id (req) string; query: limit (opcional) number; query: cursor (opcional) string (uuid) |
| Cuerpo JSON | — |
| Respuesta documentada | 200: PaymentHistoryDto |
| Cliente / pendiente | Sin wrapper; añadir billingApi.payments(purchaseId,cursor) |
| Fuente | [backend/src/modules/billing/infrastructure/billing.controller.ts:22](../../backend/src/modules/billing/infrastructure/billing.controller.ts#L22) |

## 6. Diccionario completo de esquemas OpenAPI

Transcripción estructurada de los 93 schemas del backend. Obligatorio y nullable son conceptos distintos. Las restricciones ausentes en Swagger pueden existir en class-validator o servicios: los DTO fuente son autoridad para validación. No usar ejemplos Swagger como valores por defecto.

### ErrorResponseDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| statusCode | number | Sí | — |
| error | string | Sí | — |
| code | string | Sí | — |
| message | string / string[] | Sí | — |
| requestId | string (uuid) | Sí | — |
| timestamp | string (date-time) | Sí | — |
| path | string | Sí | — |

### SendVerificationCodeDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| email | string | Sí | — |

### RegisterDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| fullName | string | Sí | — |
| email | string | Sí | — |
| phone | string | Sí | description: Número en formato E.164 (+51...) |
| password | string | Sí | minLength: 6 |
| verificationCode | string | No | description: Código de verificación de 6 dígitos enviado al correo |

### MembershipDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| storeId | string (uuid) | Sí | — |
| storeName | string | Sí | — |
| storeStatus | "pending" / "active" / "rejected" / "suspended" | Sí | — |
| membershipRole | "owner" / "manager" / "operator" | Sí | — |

### UserProfileDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| fullName | string | Sí | — |
| email | string | Sí | — |
| phone | string | Sí | — |
| roles | "customer" / "merchant" / "courier" / "admin"[] | Sí | — |
| status | "active" / "pending" / "suspended" | Sí | — |
| createdAt | string (date-time) | Sí | — |
| memberships | MembershipDto[] | Sí | — |
| courierId | string (uuid) / null | Sí | — |

### AuthResponseDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| user | UserProfileDto | Sí | — |
| csrfToken | string | Sí | description: Protección CSRF; conservar solo en memoria |
| token | string | No | description: Token de sesión Bearer para clientes móviles y cross-origin |
| expiresAt | string (date-time) | Sí | — |

### GoogleAuthDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| idToken | string | Sí | description: Google ID Token (credential JWT) |
| phone | string | No | description: Teléfono opcional si el usuario es nuevo |

### LoginDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| email | string | Sí | — |
| password | string | Sí | — |

### UpdateProfileDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| fullName | string | No | — |
| email | string | No | — |
| phone | string | No | — |

### AdminOverviewDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| pendingStores | number | Sí | — |
| pendingCouriers | number | Sí | — |
| activeStores | number | Sí | — |
| activeCouriers | number | Sí | — |
| activeUsers | number | Sí | — |
| suspendedUsers | number | Sí | — |

### AdminUserDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| fullName | string | Sí | — |
| email | string | Sí | — |
| phone | string | Sí | — |
| status | "active" / "pending" / "suspended" | Sí | — |
| roles | string[] | Sí | — |
| createdAt | string (date-time) | Sí | — |
| statusReason | string / null | Sí | — |

### AdminUserListDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | AdminUserDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

### UserStatusDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| status | "active" / "suspended" | Sí | — |
| reason | string | Sí | — |

### ZoneDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| code | string | Sí | — |
| name | string | Sí | — |
| description | string | Sí | — |
| baseFeeCents | number | Sí | — |
| estimatedMinutes | number | Sí | — |
| isActive | boolean | Sí | — |

### AddressDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| zoneId | string (uuid) | Sí | — |
| zoneName | string | Sí | — |
| zoneActive | boolean | Sí | — |
| label | string | Sí | — |
| recipientName | string | Sí | — |
| phone | string | Sí | — |
| street | string | Sí | — |
| streetNumber | string | Sí | — |
| reference | string | Sí | — |
| isDefault | boolean | Sí | — |
| latitude | number / null | Sí | — |
| longitude | number / null | Sí | — |

### CreateAddressDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| zoneId | string (uuid) | Sí | — |
| label | string | Sí | — |
| recipientName | string | Sí | — |
| phone | string | Sí | — |
| street | string | Sí | — |
| streetNumber | string | Sí | — |
| reference | string | No | — |
| latitude | number / null | No | — |
| longitude | number / null | No | — |
| isDefault | boolean | No | — |

### UpdateAddressDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| zoneId | string (uuid) | No | — |
| label | string | No | — |
| recipientName | string | No | — |
| phone | string | No | — |
| street | string | No | — |
| streetNumber | string | No | — |
| reference | string | No | — |
| latitude | number / null | No | — |
| longitude | number / null | No | — |
| isDefault | boolean | No | — |

### ZoneListDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | ZoneDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

### CreateZoneDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| code | string | Sí | — |
| name | string | Sí | — |
| description | string | No | — |
| baseFeeCents | number | Sí | minimum: 0; maximum: 100000000 |
| estimatedMinutes | number | Sí | minimum: 1; maximum: 1440 |
| isActive | boolean | No | — |

### UpdateZoneDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| code | string | No | — |
| name | string | No | — |
| description | string | No | — |
| baseFeeCents | number | No | minimum: 0; maximum: 100000000 |
| estimatedMinutes | number | No | minimum: 1; maximum: 1440 |
| isActive | boolean | No | — |
| reason | string | Sí | — |

### StoreCategoryDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| code | string | Sí | — |
| label | string | Sí | — |

### StoreDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| name | string | Sí | — |
| categoryCode | string | Sí | — |
| zoneId | string (uuid) | Sí | — |
| zoneName | string | Sí | — |
| description | string | Sí | — |
| addressText | string | Sí | — |
| phone | string | Sí | — |
| legalBusinessName | string / null | Sí | — |
| taxId | string / null | Sí | — |
| status | "pending" / "active" / "rejected" / "suspended" | Sí | — |
| statusReason | string / null | Sí | — |
| acceptingOrders | boolean | Sí | — |
| isOpen | boolean | Sí | — |
| minimumOrderCents | number | Sí | — |
| preparationMinutes | number | Sí | — |
| createdAt | string (date-time) | Sí | — |
| membershipRole | "owner" / "manager" / "operator" / "admin" | Sí | — |

### StoreListDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | StoreDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

### CreateStoreDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| categoryCode | string | Sí | — |
| zoneId | string (uuid) | Sí | — |
| name | string | Sí | — |
| addressText | string | Sí | — |
| phone | string | Sí | — |
| description | string | No | — |
| legalBusinessName | string / null | No | — |
| taxId | string / null | No | — |
| minimumOrderCents | number | No | minimum: 0; maximum: 100000000 |
| preparationMinutes | number | No | minimum: 1; maximum: 1440 |

### OpeningIntervalDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| weekday | number | Sí | minimum: 1; maximum: 7 |
| opensAt | string | Sí | — |
| closesAt | string | Sí | — |

### StoreDetailDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| name | string | Sí | — |
| categoryCode | string | Sí | — |
| zoneId | string (uuid) | Sí | — |
| zoneName | string | Sí | — |
| description | string | Sí | — |
| addressText | string | Sí | — |
| phone | string | Sí | — |
| legalBusinessName | string / null | Sí | — |
| taxId | string / null | Sí | — |
| status | "pending" / "active" / "rejected" / "suspended" | Sí | — |
| statusReason | string / null | Sí | — |
| acceptingOrders | boolean | Sí | — |
| isOpen | boolean | Sí | — |
| minimumOrderCents | number | Sí | — |
| preparationMinutes | number | Sí | — |
| createdAt | string (date-time) | Sí | — |
| membershipRole | "owner" / "manager" / "operator" / "admin" | Sí | — |
| openingIntervals | OpeningIntervalDto[] | Sí | — |

### UpdateStoreDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| categoryCode | string | No | — |
| zoneId | string (uuid) | No | — |
| name | string | No | — |
| addressText | string | No | — |
| phone | string | No | — |
| description | string | No | — |
| legalBusinessName | string / null | No | — |
| taxId | string / null | No | — |
| minimumOrderCents | number | No | minimum: 0; maximum: 100000000 |
| preparationMinutes | number | No | minimum: 1; maximum: 1440 |
| acceptingOrders | boolean | No | — |

### ReplaceHoursDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| intervals | OpeningIntervalDto[] | Sí | — |

### StoreMemberDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| userId | string (uuid) | Sí | — |
| fullName | string | Sí | — |
| email | string | Sí | — |
| membershipRole | "owner" / "manager" / "operator" | Sí | — |
| isActive | boolean | Sí | — |

### SetStoreMemberDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| email | string | Sí | — |
| membershipRole | "manager" / "operator" | Sí | — |

### OperationalDecisionDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| decision | "approve" / "reject" / "suspend" / "reactivate" | Sí | — |
| reason | string | Sí | — |

### ProductImageInputDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| content | string | Sí | description: PNG RGB/RGBA base64 sin prefijo data URL. Validado y saneado en servidor. |
| altText | string | Sí | — |
| position | number | Sí | — |

### CatalogSkuDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| skuCode | string | Sí | — |
| variantName | string | Sí | — |
| priceCents | number | Sí | — |
| barcode | string / null | Sí | — |
| isActive | boolean | Sí | — |
| availableStock | number | Sí | — |

### CatalogImageDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| url | string | Sí | — |
| altText | string | Sí | — |
| position | number | Sí | — |

### CatalogProductDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| storeId | string | Sí | — |
| storeName | string | Sí | — |
| categoryId | string | Sí | — |
| name | string | Sí | — |
| description | string | Sí | — |
| brand | string / null | Sí | — |
| isActive | boolean | Sí | — |
| position | number | Sí | — |
| skus | CatalogSkuDto[] | Sí | — |
| images | CatalogImageDto[] | Sí | — |

### CategoryDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| code | string | Sí | — |
| name | string | Sí | — |

### CatalogPageDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | CatalogProductDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

### PublishProductDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| skuCode | string | Sí | — |
| variantName | string | Sí | — |
| priceCents | number | Sí | description: Precio absoluto en céntimos PEN |
| barcode | string | No | — |
| initialStock | number | Sí | — |
| lowStockThreshold | number | No | — |
| categoryId | string | Sí | — |
| name | string | Sí | — |
| description | string | No | — |
| brand | string | No | — |

### CreatedProductDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| productId | string | Sí | — |
| productName | string | Sí | — |
| skuId | string | Sí | — |
| skuCode | string | Sí | — |
| priceCents | number | Sí | — |
| initialStock | number | Sí | — |

### UpdateProductDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| categoryId | string | No | — |
| name | string | No | — |
| description | string | No | — |
| brand | string | No | — |
| position | number | No | — |
| isActive | boolean | No | — |

### CreateSkuDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| skuCode | string | Sí | — |
| variantName | string | Sí | — |
| priceCents | number | Sí | description: Precio absoluto en céntimos PEN |
| barcode | string | No | — |
| initialStock | number | Sí | — |
| lowStockThreshold | number | No | — |

### UpdateSkuDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| skuCode | string | No | — |
| variantName | string | No | — |
| priceCents | number | No | — |
| barcode | string | No | — |
| isActive | boolean | No | — |
| lowStockThreshold | number | No | — |

### InventoryItemDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| skuId | string | Sí | — |
| productId | string | Sí | — |
| productName | string | Sí | — |
| skuCode | string | Sí | — |
| variantName | string | Sí | — |
| onHand | number | Sí | — |
| reserved | number | Sí | — |
| available | number | Sí | — |
| lowStockThreshold | number | Sí | — |
| lowStock | boolean | Sí | — |

### StockAdjustmentDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| quantity | number | Sí | description: Variación física; nunca reemplaza el stock ni las reservas |
| reason | string | Sí | — |

### InventoryMovementDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| kind | string | Sí | — |
| quantity | number | Sí | — |
| onHandAfter | number | Sí | — |
| reason | string | Sí | — |
| actorUserId | string / null | Sí | — |
| createdAt | string | Sí | — |

### AvatarDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| url | string / null | Sí | — |

### ImageContentDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| content | string | Sí | description: PNG RGB/RGBA base64 sin prefijo data URL; hasta 2 MB y 1600 × 1600. |

### StoreBrandingDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| logoUrl | string / null | Sí | — |
| bannerUrl | string / null | Sí | — |

### PurchaseItemDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| skuId | string | Sí | description: ID del SKU a comprar |
| quantity | number | Sí | description: Cantidad deseada |
| note | string | No | — |

### CreatePurchaseDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| expectedTotalCents | number | No | description: Total revisado por el cliente; se compara con el cálculo vigente del servidor |
| cashTenderCents | number / null | No | description: Importe previsto en céntimos; omitir/null significa importe exacto calculado por servidor |
| addressId | string | Sí | description: ID de la dirección de entrega del usuario |
| paymentMethod | "cash" | Sí | description: Efectivo; digital se habilitará en F6 |
| items | PurchaseItemDto[] | Sí | — |

### CancelOrderDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| expectedVersion | number | Sí | — |
| reason | string | Sí | — |

### VersionDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| expectedVersion | number | Sí | — |

### OrderLineDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| skuId | string | Sí | — |
| productName | string | Sí | — |
| variantName | string | Sí | — |
| quantity | number | Sí | — |
| unitPriceCents | number | Sí | — |
| note | string | Sí | — |

### QuoteDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| storeId | string | Sí | — |
| storeName | string | Sí | — |
| subtotalCents | number | Sí | — |
| deliveryFeeCents | number | Sí | — |
| totalCents | number | Sí | — |
| cashTenderCents | number | Sí | — |
| cashChangeCents | number | Sí | — |
| items | OrderLineDto[] | Sí | — |
| paymentMethods | string[] | Sí | — |

### AssignmentSummaryDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| courierUserId | string | Sí | — |
| status | string | Sí | — |
| version | number | Sí | — |
| agreedFeeCents | number | Sí | — |

### OrderSummaryDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| checkoutGroupId | string / null | No | — |
| id | string | Sí | — |
| purchaseId | string | Sí | — |
| code | string | Sí | — |
| storeId | string | Sí | — |
| storeName | string | Sí | — |
| status | string | Sí | — |
| version | number | Sí | — |
| subtotalCents | number | Sí | — |
| deliveryFeeCents | number | Sí | — |
| totalCents | number | Sí | — |
| paymentStatus | string | Sí | — |
| cashTenderCents | number / null | Sí | — |
| cashReceivedCents | number / null | Sí | — |
| collectedByUserId | string / null | Sí | — |
| createdAt | string | Sí | — |
| acceptanceExpiresAt | string / null | Sí | — |
| assignment | AssignmentSummaryDto | Sí | — |

### OrderPageDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | OrderSummaryDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

### IncidentDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| description | string | Sí | — |
| createdAt | string | Sí | — |

### DestinationDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| recipientName | string | Sí | — |
| phone | string | Sí | — |
| street | string | Sí | — |
| streetNumber | string | Sí | — |
| reference | string | Sí | — |

### TimelineEventDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| status | string | Sí | — |
| reason | string | Sí | — |
| occurredAt | string | Sí | — |

### OrderDetailDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| checkoutGroupId | string / null | No | — |
| id | string | Sí | — |
| purchaseId | string | Sí | — |
| code | string | Sí | — |
| storeId | string | Sí | — |
| storeName | string | Sí | — |
| status | string | Sí | — |
| version | number | Sí | — |
| subtotalCents | number | Sí | — |
| deliveryFeeCents | number | Sí | — |
| totalCents | number | Sí | — |
| paymentStatus | string | Sí | — |
| cashTenderCents | number / null | Sí | — |
| cashReceivedCents | number / null | Sí | — |
| collectedByUserId | string / null | Sí | — |
| createdAt | string | Sí | — |
| acceptanceExpiresAt | string / null | Sí | — |
| assignment | AssignmentSummaryDto | Sí | — |
| incidents | IncidentDto[] | No | — |
| items | OrderLineDto[] | Sí | — |
| destination | DestinationDto | Sí | — |
| events | TimelineEventDto[] | Sí | — |

### CourierChoiceDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| userId | string | Sí | — |
| fullName | string | Sí | — |

### GroupQuoteDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| stores | QuoteDto[] | Sí | — |
| subtotalCents | number | Sí | — |
| deliveryFeeCents | number | Sí | — |
| totalCents | number | Sí | — |

### GroupOrderDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| orderId | string | Sí | — |
| purchaseId | string | Sí | — |
| storeId | string | Sí | — |
| storeName | string | Sí | — |
| code | string | Sí | — |
| status | string | Sí | — |
| paymentStatus | string | Sí | — |
| totalCents | number | Sí | — |
| subtotalCents | number | Sí | — |
| deliveryFeeCents | number | Sí | — |

### GroupCheckoutDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| createdAt | string | Sí | — |
| totalCents | number | Sí | — |
| deliveryFeeCents | number | Sí | — |
| subtotalCents | number | Sí | — |
| orders | GroupOrderDto[] | Sí | — |

### DeliverCashDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| expectedVersion | number | Sí | — |
| cashReceivedCents | number | Sí | description: Efectivo recibido y confirmado por el repartidor, en céntimos |

### AssignCourierDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| expectedVersion | number | Sí | — |
| reason | string | Sí | — |
| courierUserId | string | Sí | — |

### CourierProfileDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string (uuid) | Sí | — |
| userId | string (uuid) | Sí | — |
| fullName | string | Sí | — |
| email | string | Sí | — |
| phone | string | Sí | — |
| vehicleType | "motorcycle" / "bicycle" / "mototaxi" | Sí | — |
| plate | string / null | Sí | — |
| zoneId | string (uuid) / null | Sí | — |
| zoneName | string / null | Sí | — |
| status | "pending" / "active" / "rejected" / "suspended" | Sí | — |
| statusReason | string / null | Sí | — |
| isOnline | boolean | Sí | — |
| createdAt | string (date-time) | Sí | — |

### ApplyCourierDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| vehicleType | "motorcycle" / "bicycle" / "mototaxi" | Sí | — |
| plate | string / null | No | — |
| zoneId | string (uuid) | Sí | — |

### CourierAvailabilityDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| isOnline | boolean | Sí | — |

### CourierListDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | CourierProfileDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

### NotificationItem

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| title | string | Sí | — |
| message | string | Sí | — |
| kind | string | Sí | — |
| relativeUrl | string / null | Sí | — |
| readAt | string / null | Sí | — |
| createdAt | string | Sí | — |

### NotificationPage

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | NotificationItem[] | Sí | — |
| nextCursor | string / null | Sí | — |
| unreadCount | number | Sí | — |

### ReportResult

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| from | string | Sí | — |
| to | string | Sí | — |
| currency | string | Sí | — |
| definition | string | Sí | — |
| orders | number | Sí | — |
| delivered | number | Sí | — |
| cancelled | number | Sí | — |
| deliveredSalesCents | number | Sí | — |
| cashCollectedCents | number | Sí | — |
| courierFeesCents | number | Sí | — |

### AuditItem

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| actorUserId | string / null | Sí | — |
| action | string | Sí | — |
| entityType | string | Sí | — |
| entityId | string | Sí | — |
| requestId | string | Sí | — |
| occurredAt | string | Sí | — |

### AuditPage

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | AuditItem[] | Sí | — |
| nextCursor | string / null | Sí | — |

### OperationsDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| checkedAt | string | Sí | — |
| pendingEvents | number | Sí | — |
| retryingEvents | number | Sí | — |
| oldestPendingEventSeconds | number / null | Sí | — |
| expiredPendingOrders | number | Sí | — |
| activeAssignments | number | Sí | — |
| openTickets | number | Sí | — |
| poolTotal | number | Sí | — |
| poolIdle | number | Sí | — |
| poolWaiting | number | Sí | — |
| alerts | string[] | Sí | — |

### FavoriteItem

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| kind | "product" / "store" | Sí | — |
| name | string | Sí | — |
| available | boolean | Sí | — |

### FavoritePage

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | FavoriteItem[] | Sí | — |
| nextCursor | string / null | Sí | — |

### ReviewInput

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| rating | number | Sí | minimum: 1; maximum: 5 |
| comment | string | No | maxLength: 1000 |

### ReviewItem

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| rating | number | Sí | — |
| comment | string / null | Sí | — |
| createdAt | string | Sí | — |

### ReviewPage

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | ReviewItem[] | Sí | — |
| nextCursor | string / null | Sí | — |
| count | number | Sí | — |
| average | number / null | Sí | — |

### TicketItem

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| subject | string | Sí | — |
| status | string | Sí | — |
| priority | string | Sí | — |
| version | number | Sí | — |
| createdAt | string | Sí | — |
| resolvedAt | string / null | Sí | — |
| orderId | string / null | Sí | — |

### TicketPage

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | TicketItem[] | Sí | — |
| nextCursor | string / null | Sí | — |

### TicketMessage

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| authorUserId | string | Sí | — |
| body | string | Sí | — |
| createdAt | string | Sí | — |

### TicketDetail

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| subject | string | Sí | — |
| status | string | Sí | — |
| priority | string | Sí | — |
| version | number | Sí | — |
| createdAt | string | Sí | — |
| resolvedAt | string / null | Sí | — |
| orderId | string / null | Sí | — |
| messages | TicketMessage[] | Sí | — |

### TicketInput

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| body | string | Sí | maxLength: 3000 |
| subject | string | Sí | maxLength: 150 |
| orderId | string (uuid) | No | — |

### MessageInput

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| body | string | Sí | maxLength: 3000 |

### TicketDecision

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| body | string | Sí | maxLength: 3000 |
| expectedVersion | number | Sí | — |
| status | "open" / "in_review" / "resolved" | Sí | — |
| priority | "low" / "normal" / "high" | Sí | — |

### PaymentMethodDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| code | string | Sí | — |
| label | string | Sí | — |
| available | boolean | Sí | — |
| unavailableReason | string / null | Sí | — |

### RefundSummaryDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| orderId | string | Sí | — |
| amountCents | number | Sí | — |
| status | "pending" / "processing" / "succeeded" / "failed" | Sí | — |
| createdAt | string | Sí | — |
| succeededAt | string / null | Sí | — |

### PaymentAttemptDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| id | string | Sí | — |
| methodCode | string | Sí | — |
| status | "pending" / "processing" / "succeeded" / "failed" / "cancelled" | Sí | — |
| amountCents | number | Sí | — |
| createdAt | string | Sí | — |
| succeededAt | string / null | Sí | — |
| refunds | RefundSummaryDto[] | Sí | — |

### PaymentHistoryDto

| Campo | Tipo | Obligatorio | Restricciones / descripción declaradas |
|---|---|---|---|
| items | PaymentAttemptDto[] | Sí | — |
| nextCursor | string / null | Sí | — |

## 7. Capacidades sin contrato suficiente o sin backend

| Capacidad visible | Estado y trabajo |
|---|---|
| Recuperación/cambio de contraseña | No existen endpoints de solicitud/consumo de reset en controladores revisados; retirar confirmación ficticia y diseñar contrato backend |
| Cupones/descuentos/promociones | Sin API ni campos de cupón en CreatePurchaseDto; ocultar hasta implementación y cálculo del servidor |
| GPS de repartidor en vivo | Sin endpoint de ubicación/stream; eventos de orden no equivalen a GPS |
| Serie semanal/top productos de reportes | ReportResult aporta agregados, no estas series; ampliar backend o quitar visualizaciones ficticias |
| Reembolsos digitales | Se pueden consultar registros de pago/reembolso; no hay integración pública de cobro/reembolso digital en estos controladores |
| Tiendas “verificadas” como atributo dedicado | El listado público filtra activas, pero no expone bandera separada de verificación; evitar inferir una certificación adicional |
| Contenido Play | Sin API de contenido/reproducción |

### Respuestas de éxito sin schema JSON completo

Las siguientes operaciones retornan éxito diferente de 204 sin un schema de respuesta declarado en el snapshot. Completar contratos desde los servicios y sus pruebas existentes; no inferir que la respuesta es void:

- GET /api/v1/health/live — HealthController_live
- GET /api/v1/health/ready — HealthController_ready
- GET /api/v1/health — HealthController_getHealth
- POST /api/v1/auth/verification-code/send — AuthController_sendVerificationCode
- GET /api/v1/stores — StoresController_listStores
- GET /api/v1/stores/{id} — StoresController_getStoreById
- POST /api/v1/purchases — OrderingController_createPurchase
- GET /api/v1/me/purchases — OrderingController_getUserPurchases
- POST /api/v1/orders/{id}/cancellations — OrderingController_cancelOrder
- GET /api/v1/merchant/stores/{storeId}/orders — OrderingController_getStoreOrders
- POST /api/v1/merchant/orders/{id}/accept — OrderingController_acceptOrder
- POST /api/v1/merchant/orders/{id}/start-preparation — OrderingController_startPreparation
- POST /api/v1/merchant/orders/{id}/mark-ready — OrderingController_markReady
- POST /api/v1/merchant/orders/{id}/rejections — OrderFlowController_reject
- GET /api/v1/courier/available-orders — DeliveryController_listAvailableOrders
- GET /api/v1/courier/active-assignment — DeliveryController_getActiveAssignment
- POST /api/v1/courier/orders/{id}/claim — DeliveryController_claimOrder
- POST /api/v1/courier/assignments/{id}/pickup — DeliveryController_pickupDelivery
- POST /api/v1/courier/assignments/{id}/deliver — DeliveryController_completeDelivery
- POST /api/v1/courier/assignments/{id}/release — DeliveryController_release
- POST /api/v1/courier/assignments/{id}/incidents — DeliveryController_incident
- POST /api/v1/admin/orders/{id}/assignment — AdminDeliveryController_assign
- POST /api/v1/admin/assignments/{id}/release — AdminDeliveryController_release
- GET /api/v1/merchant/available-couriers — MerchantDeliveryController_listAvailableCouriers
- POST /api/v1/merchant/orders/{id}/assign-courier — MerchantDeliveryController_assignCourier
- GET /api/v1/notifications — PlatformController_getNotifications

Para /stores el servicio devuelve array de tiendas públicas. /stores/{id} añade description, base_fee_cents y openingIntervals, entre otros campos SQL. POST /purchases se valida actualmente en orderingApi como {orderId,purchaseId}. Las transiciones genéricas action() aún usan unknown: añadir contratos explícitos después de documentar respuestas reales. GET /courier/active-assignment no debe asumirse con la forma OrderDetailDto sin adapter/verificación.

## 8. Orden de implementación y validación

1. Actualizar snapshot y tipos; completar schemas públicos y respuestas antiguas. Alinear token/CSRF y base URL entre transportes.
2. Quitar fallbacks y conectar catálogo/carrito; conservar SKU, tienda y producto como identificadores separados.
3. Conectar sesión, solicitudes, direcciones, perfil, imágenes y guardas; retirar éxitos locales sin HTTP.
4. Conectar checkout simple/grupo con cotización, recuperación de intento e idempotencia.
5. Conectar pedidos por rol y detalles nuevos; agregar asignación por comercio, control de versión y cobro de efectivo.
6. Conectar administración, inventario, reportes, auditoría, soporte/favoritos/notificaciones; crear billingApi para catálogo de pagos/historial si se presentan esas capacidades.
7. Retirar almacén de negocio mock, adapters con UUID fijos y doble carrito; seguir criterios del documento complementario.

Validación posterior a implementación:

- contracts:check sin diferencias y build satisfactorio.
- Validar navegación directa de todas las rutas y detalles nuevos; sesión propia, roles y membresías reales.
- API caída/vacía/404 sin fixtures; errores 401/403/409 con tratamiento explícito.
- Flujo cliente → comercio → reparto → entrega/cobro → reporte con IDs reales, usando entorno de pruebas autorizado.
- Compra repetida con misma clave produce misma operación; conflicto de stock/precio/versiones no duplica ni fuerza estado.
- Verificar paginación, permisos sobre recursos ajenos y persistencia tras recarga/cambio de sesión.
- Verificar imágenes binarias y URLs con la misma topología que la API; Bearer no se envía automáticamente desde una etiqueta img.

La auditoría sólo creó documentación. No se ejecutaron migraciones, seeds ni escrituras de negocio. La ejecución de shell falló al iniciar el proceso por acceso denegado; los inventarios y comparaciones se realizaron leyendo archivos con Node. No se afirma que tests/build o conectividad de Supabase hayan sido validados.
