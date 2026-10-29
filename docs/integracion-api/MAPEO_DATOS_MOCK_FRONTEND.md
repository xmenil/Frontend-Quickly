# Mapeo estricto de datos mock del frontend y retirada

> **Estado vigente — bloque 8, 2026-10-29:** dependencias mock retiradas del grafo de producción; sesión solo API, categorías reales y acciones sin backend explícitamente no disponibles. Se verificaron 97 pruebas SQL/HTTP en PostgreSQL local aislado y dos recorridos de las vistas originales con API/SQL reales. Supabase y staging no fueron ejecutados. [Implementación y evidencia](BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md) · [Inventario actualizado de las 130 operaciones](INVENTARIO_HTTP_BLOQUE_8.md).

> Las observaciones iniciales y los pendientes de los bloques anteriores que siguen en este archivo son históricos. El estado del bloque 8 y su inventario prevalecen sobre referencias a archivos retirados o pruebas DB antes pendientes.
> Bloque 7 implementado sobre las vistas originales de administración, soporte y auditoría: [detalle y verificación](BLOQUE_7_ADMINISTRACION_SOPORTE_API.md). Sin useDataStore en las nueve vistas administrativas; salud con schemas explícitos. Validación integral PostgreSQL/Supabase pendiente.
> Bloque 6 implementado sobre las cinco vistas originales, sin useDataStore ni actividad seed: [operación del repartidor](BLOQUE_6_OPERACION_REPARTIDOR_API.md). Perfil, scopes, asignaciones e ingresos usan NestJS; validación integral PostgreSQL/Supabase pendiente.
> Bloque 5 implementado sobre las vistas originales: [pedidos y reportes del comercio](BLOQUE_5_PEDIDOS_REPORTES_COMERCIO_API.md). Ver límites de validación en ese documento.
> Continuación: [plan de implementación en 8 bloques y sus checklist](PLAN_IMPLEMENTACION_POR_BLOQUES.md).

> Bloque 3 implementado con verificación reducida: [identidad y cuenta del cliente](BLOQUE_3_CUENTA_CLIENTE_API.md).

> Bloque 4 implementado: [tienda, productos e inventario](BLOQUE_4_TIENDA_CATALOGO_API.md).

> Avance de implementación: [Bloque 1: catálogo](BLOQUE_1_CATALOGO_API.md) y [Bloque 2: checkout y pedidos](BLOQUE_2_CHECKOUT_PEDIDOS_API.md), ambos sobre las vistas originales. El inventario que sigue describe la auditoría inicial; los documentos de bloque indican qué dependencias ya se reemplazaron y qué sigue pendiente.


> Restricción de interfaz confirmada por el usuario: conservar las pantallas originales, distribución, filtros, pestañas y tarjetas de las capturas de Vercel en [comparacion/comparacion.md](comparacion/comparacion.md). Las menciones a componentes Real* en este documento son referencias de lógica/API; no autorizan sustituir las vistas ni cambiar el router a esas interfaces. La integración debe hacerse dentro de los componentes originales.


Fecha de revisión: 2026-10-28. Alcance: código local de Frontend-Quickly/src, router activo, servicios NestJS, esquema y migraciones disponibles en backend. Documento de diagnóstico y ejecución futura; esta revisión no cambia la aplicación ni la base de datos.

## 1. Resultado y criterio de verdad

La conexión del backend a PostgreSQL/Supabase no elimina los mocks del frontend. El flujo objetivo es **frontend → API NestJS → PostgreSQL alojado en Supabase**. No se encontró cliente Supabase directo en src; lib/supabaseSync.ts llama al backend y no es una suscripción a Supabase. DatabaseService usa pg y configuración de conexión; no se verificó una conexión de producción ni se consultaron registros reales.

Un dato se considera real sólo si procede de una respuesta satisfactoria de la API y conserva sus identificadores. Un array vacío es un resultado válido. Un error de red debe mostrarse como error con reintento; nunca debe crear productos, pedidos, solicitudes o códigos de verificación de prueba.

Hallazgos de la auditoría inicial, resueltos progresivamente en bloques 1–8:

1. dataStore llama getInitialStoredData() sin condición de modo y carga INITIAL_* o datos persistidos. isDemoMode sólo protege algunas escrituras y acciones; desactivarlo no vacía los mocks.
2. syncFromBackend mezcla tiendas/productos reales con registros anteriores que no coinciden por ID. Los IDs m_* / p_* no coinciden con UUID y permanecen en el catálogo. Sólo obtiene hasta 50 productos, ignora nextCursor y oculta errores con catch.
3. HomePage, OfficialStoresSection y BigStoreProductsSection sustituyen errores **y respuestas vacías** por entidades mock sin condición de modo.
4. El router monta mayormente páginas antiguas con useDataStore. Tener un archivo Real*.tsx o un wrapper API no implica que la ruta lo use.
5. La sincronización parcial de productos modifica primero el estado local y puede mostrar éxito aunque falle la persistencia. El cambio de precio y stock requiere APIs de SKU/inventario, no sólo PATCH del producto.
6. Registro de comercio, postulación de repartidor y recuperación de acceso anuncian éxito mediante estado local sin persistir la operación.

Evidencia principal: [src/store/dataStore.ts:138](../src/store/dataStore.ts#L138), [src/store/dataStore.ts:199](../src/store/dataStore.ts#L199), [src/store/dataStore.ts:995](../src/store/dataStore.ts#L995), [src/app/router.tsx:65](../src/app/router.tsx#L65), [backend/src/platform/database/database.service.ts:25](../../backend/src/platform/database/database.service.ts#L25).

## 2. Fuentes mock y reemplazo obligatorio

| Fuente / símbolo | Contenido y alcance | Fuente real / acción |
|---|---|---|
| mocks/initialData.ts — INITIAL_MERCHANTS | Tiendas, propietarios, horarios, tarifas, valoraciones e imágenes de ejemplo | /stores y /stores/{id}; gestión privada /merchant/stores. No conservar IDs m_* |
| INITIAL_PRODUCTS | Productos, precios, stock, variantes, imágenes, marcas | /catalog/search y /products/{id}; skus[].id para comprar; inventario privado para administrar |
| INITIAL_USERS | Cuentas/roles/estados ficticios | /auth/session, /me y /admin/users. Roles autorizados por backend |
| INITIAL_COURIERS | Repartidores y disponibilidad ficticios | /courier/profile, /admin/couriers y APIs de reparto |
| INITIAL_ZONES | Coberturas y tarifas | /geography/zones; /admin/zones para administración |
| INITIAL_ADDRESSES | Direcciones preexistentes | /me/addresses; no crear direcciones de muestra para una cuenta real |
| INITIAL_PURCHASES | Compras/subpedidos/totales/seguimiento | /me/orders, /orders/{id}, order-feed, /courier/orders, /admin/orders y /me/checkout-groups/{id} |
| INITIAL_TICKETS | Tickets de soporte | /me/tickets y /admin/tickets; mensajes y decisiones persistidos |
| INITIAL_AUDIT_LOGS | Auditoría ficticia | /admin/audit; nunca fabricar la auditoría en el navegador |
| INITIAL_NOTIFICATIONS | Avisos ficticios | /me/notifications; read/read-all |
| mocks/courierActivityData.ts — eliminado en bloque 6 | Inyección y versión de seed retiradas; tests sustituidos por fixtures API | /courier/orders con scopes; detalle autorizado y asignación real |
| mocks/exampleAddresses.ts — addExampleAddresses | Direcciones de ejemplo por usuario | Retirar de producción; cuenta sin direcciones muestra estado vacío |
| demoAuthStore.ts | Login por identidad de prueba y perfiles generados | authStore + identityApi y sesión backend; aislar del bundle de producción si se conserva demo |

Todos los endpoints anteriores llevan /api/v1. Para payloads, permisos y cobertura completa consultar [MAPEO_API_BACKEND_FRONTEND.md](MAPEO_API_BACKEND_FRONTEND.md).

## 3. Fallbacks, simulaciones y valores inventados fuera de mocks/

| Archivo / punto | Problema observado | Sustitución estricta |
|---|---|---|
| [src/features/catalog/HomePage.tsx:36](../src/features/catalog/HomePage.tsx#L36) | Convierte INITIAL_PRODUCTS en CatalogProduct; SKU e imagen heredan p.id ficticio. Se usa en vacío/error | Eliminar fallback de entidades; error y vacío separados; bloquear compra sin SKU real y disponible |
| [src/components/shared/OfficialStoresSection.tsx:24](../src/components/shared/OfficialStoresSection.tsx#L24) | Crea tiendas desde INITIAL_MERCHANTS y zona UUID fija | Usar exclusivamente /stores; imágenes genéricas pueden ser presentación, pero no identidad de tiendas |
| [src/components/shared/BigStoreProductsSection.tsx:18](../src/components/shared/BigStoreProductsSection.tsx#L18) | Tiendas/productos ficticios añadibles al carrito real | Eliminar ambos FALLBACK_CATALOG_*; conservar sólo datos devueltos por API |
| [src/store/dataStore.ts:1003](../src/store/dataStore.ts#L1003) | Al sincronizar inventa teléfono, rating 4.8, 18 reseñas, preparación 25, envío 400, mínimo 1000 y horario fijo | Leer campos reales del detalle, zonas y reseñas; ampliar contrato cuando falten; ocultar campo desconocido |
| [src/store/dataStore.ts:1033](../src/store/dataStore.ts#L1033) | Si no hay SKU inventa precio 1000 y stock 10; disponibilidad puede quedar verdadera | Producto sin SKU comprable no se vende; precio/stock desconocidos no tienen default comercial |
| [src/lib/supabaseSync.ts:53](../src/lib/supabaseSync.ts#L53) | Traduce IDs mock mediante UUID fijos y tienda por defecto si no existe ID | Eliminar tablas de traducción; seleccionar tienda autorizada de memberships/ownStores; error ante ID desconocido |
| [src/lib/supabaseSync.ts:58](../src/lib/supabaseSync.ts#L58) | Categoría desconocida acaba en categoría fija | Usar ID de /catalog/categories; diferenciar merchant.categories de catalog.categories |
| [src/store/cartStore.ts:49](../src/store/cartStore.ts#L49) | Usa productId como skuId si falta variante, hace puente parcial a otro carrito y silencia errores | Un carrito de intenciones con SKU real validado. No inferir SKU a partir del ID de producto |
| [src/features/catalog/ProductDetailPage.tsx:475](../src/features/catalog/ProductDetailPage.tsx#L475) | Una URL de producto inexistente termina mostrando tacacho o el primer producto y otra tienda | Respetar 404; ninguna sustitución de identidad |
| [src/store/authStore.ts:163](../src/store/authStore.ts#L163) | Fallo de red al enviar verificación devuelve success:true y código aleatorio | Devolver error real; el código sólo puede generarlo/validarlo el backend |
| [src/features/auth/RegisterMerchantPage.tsx:24](../src/features/auth/RegisterMerchantPage.tsx#L24) y [src/features/auth/RegisterCourierPage.tsx:19](../src/features/auth/RegisterCourierPage.tsx#L19) | Formularios anuncian solicitud enviada sin HTTP ni persistencia | Esperar POST /merchant/stores o PUT /courier/profile tras iniciar sesión; éxito sólo con respuesta válida |
| [src/features/auth/RecoverPasswordPage.tsx:13](../src/features/auth/RecoverPasswordPage.tsx#L13) | Recuperación ficticia y contraseña temporal publicada en interfaz | Backend pendiente: solicitud y consumo de restablecimiento. Retirar confirmación simulada |
| [src/features/merchant/MerchantReportsPage.tsx:192](../src/features/merchant/MerchantReportsPage.tsx#L192) | Serie semanal fija y productos demo cuando faltan ventas | /reports aporta agregados, no serie/top. Quitar gráficos ficticios o ampliar backend con agregación verificable |
| [src/features/merchant/MerchantDashboardPage.tsx:123](../src/features/merchant/MerchantDashboardPage.tsx#L123) | Plazo de aceptación simulado | acceptanceExpiresAt del pedido y reloj sólo para representación; servidor decide vencimiento |
| [src/features/orders/OrderDetailPage.tsx:369](../src/features/orders/OrderDetailPage.tsx#L369) | Reembolso y seguimiento derivados de mutaciones locales | Cancelación vía API; mostrar estado de pago real. No afirmar reembolso digital sin implementación |
| [src/features/customer/CustomerHelpPage.tsx:31](../src/features/customer/CustomerHelpPage.tsx#L31) | FAQ promete Yape/Plin/reembolso inmediato de simulación | Alinear texto con pago cash actual y soporte real |
| [src/components/shared/CouponsModal.tsx:22](../src/components/shared/CouponsModal.tsx#L22) | TINGO20, ENVIOSELVA, CACAO10 prometen descuentos sin contrato | Ocultar hasta contar con API y cálculo de descuentos en servidor; no descontar localmente |
| [src/components/shared/PlayModal.tsx:67](../src/components/shared/PlayModal.tsx#L67) | Contenido ilustrativo; acción cierra modal | Retirar llamada funcional o implementar servicio de contenido; no existe API en este backend |
| [src/components/shared/SearchBar.tsx:14](../src/components/shared/SearchBar.tsx#L14) | Historial predeterminado prellenado | Iniciar vacío; persistir únicamente búsquedas del usuario si se desea |
| CategoriesDropdown.tsx, CategoryGridSection.tsx, QuickCategoryStrip.tsx | Taxonomía/promociones estáticas pueden enlazar códigos no soportados | Consultar categorías reales; iconos/etiquetas pueden seguir locales si la clave viene del catálogo |
| HomePage.tsx, HomeHero.tsx, OfficialStoresSection.tsx | Claims de entregas en 20–35 min, repartidores activos y verificación visual | No son mediciones. Usar estimatedMinutes/isOpen reales donde proceda; no afirmar GPS/disponibilidad/verificación no suministrados |

Un timeout de UI, un icono, un menú de navegación, etiquetas de estados, textos editoriales o un placeholder gráfico no son por sí solos datos mock de negocio. Se conservan si no simulan una operación o una métrica real.

## 4. Matriz completa por ruta activa

Las sustituciones son propuestas, no cambios ya aplicados. Conservar el diseño actual es posible moviendo su fuente de datos a los servicios indicados; los componentes Real* son una base reutilizable, no garantía de compatibilidad inmediata.

| Ruta | Archivo actual | Origen actual | Sustitución / trabajo requerido | API real (prefijo /api/v1) |
|---|---|---|---|---|
| / | [src/features/catalog/HomePage.tsx:1](../src/features/catalog/HomePage.tsx#L1) | Mixto: API + fallback mock | HomePage; eliminar FALLBACK_FEATURED_PRODUCTS y fallbacks de sus secciones | catalogApi.search/stores; operationsApi.zones |
| /negocios | [src/features/catalog/MerchantsPage.tsx:1](../src/features/catalog/MerchantsPage.tsx#L1) | merchants/products de useDataStore | RealMerchantsPage o CatalogBrowser según listado deseado | GET /stores; GET /catalog/search |
| /negocios/:id | [src/features/catalog/MerchantDetailPage.tsx:1](../src/features/catalog/MerchantDetailPage.tsx#L1) | merchants/products/favoritos locales | CatalogBrowser con storeId obtenido de params | GET /stores/{id}; GET /catalog/search?storeId={id}; favoritos API |
| /producto/:id | [src/features/catalog/ProductDetailPage.tsx:1](../src/features/catalog/ProductDetailPage.tsx#L1) | products/merchants/favoritos; fallback a otro producto | RealProductDetailPage | GET /products/{id}; favoritos API |
| /carrito | [src/features/cart/CartPage.tsx:1](../src/features/cart/CartPage.tsx#L1) | Real: useRealCartStore + recarga de producto | Conservar; eliminar puente cartStore y validar SKU | GET /products/{id} |
| /checkout | [src/features/checkout/CheckoutPage.tsx:1](../src/features/checkout/CheckoutPage.tsx#L1) | direcciones/zonas/precios/creación de compra locales | RealCheckoutPage | POST /checkout/quote; POST /purchases; POST /checkout/groups/quote; POST /checkout/groups |
| /cliente/compras/:id | [src/features/checkout/GroupCheckoutPage.tsx:1](../src/features/checkout/GroupCheckoutPage.tsx#L1) | Real: detalle multitienda | Conservar; proteger acceso con sesión | GET /me/checkout-groups/{id} |
| /cliente/pedidos | [src/features/orders/CustomerOrdersPage.tsx:1](../src/features/orders/CustomerOrdersPage.tsx#L1) | purchases locales | RealOrdersPage kind=customer | GET /me/orders |
| /cliente/pedidos/:id | [src/features/orders/OrderDetailPage.tsx:1](../src/features/orders/OrderDetailPage.tsx#L1) | compra/timeline/reembolsos/reseñas locales | RealOrderDetailPage kind=customer | GET /orders/{id}; POST /orders/{id}/cancellations; POST /orders/{id}/reviews |
| /cliente/seguimiento/:id | [src/features/orders/TrackingPage.tsx:1](../src/features/orders/TrackingPage.tsx#L1) | purchases/zones y mapa esquemático | Detalle real con eventos; mapa sólo si hay coordenadas reales | GET /orders/{id}; sin API de GPS en vivo |
| /cliente/direcciones | [src/features/customer/CustomerAddressesPage.tsx:1](../src/features/customer/CustomerAddressesPage.tsx#L1) | addresses/zones y ejemplos locales | RealAddressesPage | GET/POST /me/addresses; PATCH/DELETE /me/addresses/{id}; PUT /me/addresses/{id}/default |
| /cliente/favoritos | [src/features/customer/CustomerFavoritesPage.tsx:1](../src/features/customer/CustomerFavoritesPage.tsx#L1) | IDs favoritos/products/merchants locales | RealFavoritesPage | GET /me/favorites; PUT/DELETE /me/favorites/{products|stores}/{id} |
| /cliente/perfil | [src/features/customer/CustomerProfilePage.tsx:1](../src/features/customer/CustomerProfilePage.tsx#L1) | Identidad real + contadores de useDataStore | RealProfilePage; contadores desde APIs completas | GET/PATCH /me; GET/PUT/DELETE /me/avatar |
| /cliente/notificaciones | [src/features/customer/CustomerNotificationsPage.tsx:1](../src/features/customer/CustomerNotificationsPage.tsx#L1) | notifications locales | RealNotificationsPage | GET /me/notifications; PATCH /me/notifications/{id}/read; PATCH /me/notifications/read-all |
| /cliente/ayuda | [src/features/customer/CustomerHelpPage.tsx:1](../src/features/customer/CustomerHelpPage.tsx#L1) | tickets/purchases locales + FAQ de simulación | RealTicketsPage y ruta nueva /cliente/ayuda/:id | GET/POST /me/tickets; GET /me/tickets/{id}; POST /tickets/{id}/messages |
| /comercio/tienda | [src/features/merchant/MerchantDashboardPage.tsx:1](../src/features/merchant/MerchantDashboardPage.tsx#L1) | merchants/purchases y temporizador simulado | Componer dashboard desde tienda, order-feed y reports | GET /merchant/stores; GET /merchant/stores/{id}; GET /merchant/stores/{id}/order-feed; GET /merchant/stores/{id}/reports |
| /comercio/perfil-tienda | [src/features/merchant/MerchantStorePage.tsx:1](../src/features/merchant/MerchantStorePage.tsx#L1) | perfil/imágenes de tienda locales | StoreManagementPage y StoreBrandingEditor | GET/PATCH /merchant/stores/{id}; GET/PUT/DELETE branding |
| /comercio/productos | [src/features/merchant/MerchantProductsPage.tsx:1](../src/features/merchant/MerchantProductsPage.tsx#L1) | CRUD local con sincronización parcial | RealMerchantProductsPage; añadir borrado tipado | catalogApi: productos, SKU, inventario, movimientos e imágenes |
| /comercio/pedidos | [src/features/merchant/MerchantOrdersPage.tsx:1](../src/features/merchant/MerchantOrdersPage.tsx#L1) | purchases/couriers y transiciones locales | RealOrdersPage kind=merchant + nueva /comercio/pedidos/:id | GET /merchant/stores/{id}/order-feed; acciones accept/start-preparation/mark-ready/rejections; asignación por comercio |
| /comercio/reportes | [src/features/merchant/MerchantReportsPage.tsx:1](../src/features/merchant/MerchantReportsPage.tsx#L1) | compras locales, top demo y weeklyData fijo | RealReportsPage kind=merchant; extender backend si se conserva serie semanal/top | GET /merchant/stores/{id}/reports |
| /comercio/configuracion | [src/features/merchant/MerchantSettingsPage.tsx:1](../src/features/merchant/MerchantSettingsPage.tsx#L1) | updateMerchantProfile local | StoreManagementPage: horarios, miembros, recepción | PATCH /merchant/stores/{id}; PUT hours; GET/PUT/DELETE members |
| /repartidor/solicitudes | [src/features/courier/CourierRequestsPage.tsx:1](../src/features/courier/CourierRequestsPage.tsx#L1) | purchases/couriers locales | CourierRequestsPage original integrada (bloque 6) | GET /courier/orders?scope=available; POST /courier/orders/{id}/claim |
| /repartidor/entrega-activa | [src/features/courier/CourierActiveDeliveryPage.tsx:1](../src/features/courier/CourierActiveDeliveryPage.tsx#L1) | asignación/transiciones/incidencias locales | CourierActiveDeliveryPage original integrada (bloque 6) | GET /courier/orders?scope=active; POST /courier/assignments/{id}/{pickup|deliver|release|incidents} |
| /repartidor/historial | [src/features/courier/CourierHistoryPage.tsx:1](../src/features/courier/CourierHistoryPage.tsx#L1) | purchases/couriers locales | CourierHistoryPage original integrada (bloque 6) | GET /courier/orders?scope=history |
| /repartidor/ingresos | [src/features/courier/CourierEarningsPage.tsx:1](../src/features/courier/CourierEarningsPage.tsx#L1) | ingresos calculados con purchases locales | CourierEarningsPage original integrada (bloque 6) | GET /courier/earnings |
| /repartidor/perfil | [src/features/courier/CourierProfilePage.tsx:1](../src/features/courier/CourierProfilePage.tsx#L1) | couriers locales | CourierProfilePage original integrada (bloque 6) | GET/PUT /courier/profile; PATCH /courier/profile/availability |
| /admin/resumen | [src/features/admin/AdminOverviewPage.tsx:1](../src/features/admin/AdminOverviewPage.tsx#L1) | contadores locales | AdminOverviewPage original integrada (bloque 7) | GET /admin/overview |
| /admin/operacion | [src/features/operations/OperationalHealthPage.tsx:1](../src/features/operations/OperationalHealthPage.tsx#L1) | Real: API operativa | Conservar | GET /admin/operations |
| /admin/usuarios | [src/features/admin/AdminUsersPage.tsx:1](../src/features/admin/AdminUsersPage.tsx#L1) | users y acciones locales | AdminUsersPage original integrada (bloque 7) | GET /admin/users; PATCH /admin/users/{id}/status |
| /admin/comercios | [src/features/admin/AdminMerchantsPage.tsx:1](../src/features/admin/AdminMerchantsPage.tsx#L1) | merchants locales | AdminMerchantsPage original integrada (bloque 7) | GET /admin/stores; POST /admin/stores/{id}/decisions |
| /admin/repartidores | [src/features/admin/AdminCouriersPage.tsx:1](../src/features/admin/AdminCouriersPage.tsx#L1) | couriers locales | AdminCouriersPage original integrada (bloque 7) | GET /admin/couriers; POST /admin/couriers/{id}/decisions |
| /admin/pedidos | [src/features/admin/AdminOrdersPage.tsx:1](../src/features/admin/AdminOrdersPage.tsx#L1) | purchases/couriers locales | AdminOrdersPage original con diálogo de detalle (bloque 7) | GET /admin/orders; GET /admin/courier-options; POST /admin/orders/{id}/assignment |
| /admin/zonas | [src/features/admin/AdminZonesPage.tsx:1](../src/features/admin/AdminZonesPage.tsx#L1) | zones locales | RealAdminZonesPage | GET/POST /admin/zones; PATCH /admin/zones/{id} |
| /admin/incidencias | [src/features/admin/AdminTicketsPage.tsx:1](../src/features/admin/AdminTicketsPage.tsx#L1) | tickets/resolución local | RealTicketsPage admin + nueva /admin/incidencias/:id | GET /admin/tickets; GET /admin/tickets/{id}; POST /admin/tickets/{id}/decisions |
| /admin/reportes | [src/features/admin/AdminReportsPage.tsx:1](../src/features/admin/AdminReportsPage.tsx#L1) | purchases/indicadores/exportación local | AdminReportsPage original integrada (bloque 7) | GET /admin/reports |
| /admin/auditoria | [src/features/admin/AdminAuditPage.tsx:1](../src/features/admin/AdminAuditPage.tsx#L1) | auditLogs locales | AdminAuditPage original integrada (bloque 7) | GET /admin/audit |
| /registro/comercio | [src/features/auth/RegisterMerchantPage.tsx:1](../src/features/auth/RegisterMerchantPage.tsx#L1) | Sólo setIsSubmitted(true); no crea solicitud | StoreApplicationPage después de autenticar | POST /merchant/stores |
| /registro/repartidor | [src/features/auth/RegisterCourierPage.tsx:1](../src/features/auth/RegisterCourierPage.tsx#L1) | Sólo setIsSubmitted(true); no crea solicitud | CourierApplicationPage después de autenticar | PUT /courier/profile |
| /recuperar-acceso | [src/features/auth/RecoverPasswordPage.tsx:1](../src/features/auth/RecoverPasswordPage.tsx#L1) | Sólo setSent(true), clave temporal de demostración | Retirar confirmación ficticia; implementar contrato backend | No existe endpoint de recuperación/restablecimiento |

/login y /registro ya invocan autenticación HTTP mediante authStore; revisar los caminos apiFetch, los defaults de contraseña y la generación de códigos indicada arriba. Las rutas índice /comercio, /repartidor y /admin sólo redirigen a su primera pantalla. Las páginas de acceso denegado/404 son presentación y no requieren datos mock.

## 5. Componentes compartidos y dependencias indirectas

- AddressForm depende de addresses/zones y mutaciones locales; reutilizar formulario real de AddressesPage y operationsApi.
- MerchantCard y ProductCard guardan favoritos en dataStore; usar FavoriteButton/engagementApi. ProductCard y detalle antiguo usan cartStore: retirar puente entre carritos.
- MerchantLayout obtiene tienda y contadores de pedidos de dataStore; usar perfil/memberships, ownStores y order-feed. Un conteo de una sola página no representa el total global.
- CourierLayout obtiene perfil y cambia disponibilidad localmente; usar operationsApi.courier/availability y esperar respuesta.
- AdminLayout cuenta usuarios pendientes/tickets desde dataStore; usar overview y API de soporte. openTickets existe en /admin/operations, no debe inferirse del primer lote de tickets.
- Navbar ya obtiene notificaciones por API y cuenta useRealCartStore; sus destinos de catálogo deben terminar en páginas reales.
- SchematicMap representa geometría ilustrativa; TrackingPage no tiene una fuente GPS en vivo en la API actual.
- DemoSwitcher mantiene conexión/configuración y acciones demo: separar la configuración útil de la simulación. El selector de roles sólo debe permitir roles presentes en la sesión.

## 6. Modelo de datos que no se debe confundir

| Dato antiguo | Dato real | Regla |
|---|---|---|
| merchantId m_* | storeId UUID de merchant.stores | Sin tablas de equivalencias ni tienda predeterminada |
| productId p_* | CatalogProduct.id UUID | No usarlo como SKU |
| selectedVariantId | CatalogSku.id UUID | Seleccionar skus activos con availableStock > 0 |
| Product.stock | availableStock público; onHand/reserved/available privado | Servidor valida y reserva stock al comprar |
| Product.priceCents + diferencia de variante | sku.priceCents | Precio absoluto por SKU; cotización backend es autoridad |
| Merchant.category | category_code/categoryCode de merchant.categories | No convertir por cast a categorías de productos |
| Product.category | categoryId UUID de catalog.categories | Cargar taxonomía de producto por API |
| Purchase.id / MerchantOrder.id | checkoutGroupId / purchaseId / order.id | Navegación y acciones usan el ID específico de cada recurso |
| Courier.id | courierProfile.id frente a courierUserId | Asignar mediante courierUserId; validar respuesta del endpoint |
| Order.version | order.version y assignment.version independientes | Orden: version de orden. Pickup/deliver/release/incidents: version de assignment |
| status en español | pending/confirmed/preparing/ready/in_transit/delivered/cancelled/rejected | Traducir sólo al mostrar; enviar código del backend |
| favorito booleano global | favorito por usuario autenticado | Limpiar cache al cambiar sesión |
| tracking local | events[].status/reason/occurredAt | No fabricar eventos; refrescar API |

Persistencia real observada en SQL de servicios: merchant.stores/memberships/opening_intervals/ratings; catalog.products/skus/product_images/favorites/product_favorites/categories; inventory.stock/reservations/movements; identity.users/user_roles/sessions; geography.addresses/coverage_zones; ordering.purchases/merchant_orders/order_items/order_events/checkout_groups; delivery.courier_profiles/assignments/incidents; platform.notifications/audit_entries; support.tickets/ticket_messages; billing.payment_attempts/refunds/payment_methods. Son referencias de backend, no tablas que el frontend deba consultar directamente.

## 7. Retirada de persistencia y secuencia de ejecución

1. Sincronizar contratos y resolver diferencias del documento API. Unificar transporte y sesión antes de mover pantallas.
2. Quitar fallbacks de entidades en portada y no mezclar INITIAL_* con API. Resolver 404 y productos sin SKU sin cambiar identidad.
3. Conectar rutas y layouts al catálogo/direcciones/favoritos/perfil reales. Eliminar entrada de IDs mock en carrito.
4. Migrar checkout a cotización y compra backend con Idempotency-Key estable por intento; expectedTotalCents desde cotización; no confirmar por temporizador local.
5. Migrar pedidos por rol, versiones, vencimiento, cobro y asignaciones. Añadir rutas de detalle que usan los enlaces RealOrderPages.
6. Migrar gestión de tienda, catálogo, inventario, administración, soporte y reportes. Reutilizar Real* con ajustes, actualizar enlaces y permisos.
7. Retirar importaciones de mocks y useDataStore de pantallas/servicios de producción; demo puede vivir en entrada separada si se desea conservarlo.
8. Retirar lectura/migración de quickly_datastore_v2, quickly_datastore_v3 y quickly_datastore_v4. Eliminar sólo estas claves obsoletas y quickly_auth_v1/quickly_cart_v1 según migración; no llamar localStorage.clear(). No subir contenido de estos almacenes automáticamente a la DB.
9. Conservar quickly_cart_real_v2 como intención local sin precios/stock autoritativos, revalidando referencias contra API. Revisar datos por sesión e intentos pendientes de checkout; no borrar una intención cuya compra necesita recuperarse.
10. Retirar supabaseSync y cartStore después de eliminar todos sus consumidores. No ejecutar seed-initial ni extract-initial-data para sustituir datos reales.

## 8. Criterios de aceptación verificables

- [ ] Con VITE_APP_MODE distinto de demo y almacenamiento nuevo, cada ruta de la matriz muestra sólo registros de API, vacío o error.
- [ ] Al desconectar backend no aparecen tiendas/productos/solicitudes/códigos de prueba ni confirmaciones de compra.
- [ ] Una DB sin catálogo muestra vacío. Un UUID inexistente devuelve 404 visible sin mostrar otro producto.
- [ ] Ninguna operación anuncia éxito antes de recibir y validar respuesta; errores de escritura no dejan éxito local persistente.
- [ ] No hay IDs m_*, p_*, z_* ni productId usado como skuId en solicitudes reales.
- [ ] Se recarga la página y otra sesión ve los cambios autorizados persistidos; favoritos/direcciones no se comparten entre usuarios.
- [ ] Compra simple y multitienda conservan idempotencia tras timeout y actualización; no duplican pedidos.
- [ ] Conflictos de stock/precio/versiones se muestran y recargan sin sobreescribir el servidor.
- [ ] Los importadores de mocks y mutaciones de dataStore sólo existen en demo/pruebas aisladas.
- [ ] Los reportes sin operaciones muestran cero/vacío real, nunca ventas de muestra.
- [ ] Build, comprobación de contratos y pruebas de flujos reales pasan después de implementar la migración.

## 9. Inventario reproducible de consumidores locales

Listado derivado de imports/usos presentes en src, excluye tests y contratos generados. La referencia de import no significa que el archivo sea una ruta activa; comprobar sección 4.

| Archivo | Evidencia | Alcance |
|---|---|---|
| [src/components/shared/AddressForm.tsx:6](../src/components/shared/AddressForm.tsx#L6) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/components/shared/BigStoreProductsSection.tsx:5](../src/components/shared/BigStoreProductsSection.tsx#L5) | import { INITIAL_MERCHANTS, INITIAL_PRODUCTS } from '../../mocks/initialData'; | Alcanzable desde main.tsx por imports estáticos |
| [src/components/shared/DemoSwitcher.tsx:4](../src/components/shared/DemoSwitcher.tsx#L4) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/components/shared/MerchantCard.tsx:7](../src/components/shared/MerchantCard.tsx#L7) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/components/shared/OfficialStoresSection.tsx:4](../src/components/shared/OfficialStoresSection.tsx#L4) | import { INITIAL_MERCHANTS } from '../../mocks/initialData'; | Alcanzable desde main.tsx por imports estáticos |
| [src/components/shared/ProductCard.tsx:8](../src/components/shared/ProductCard.tsx#L8) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminAuditPage.tsx:2](../src/features/admin/AdminAuditPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminCouriersPage.tsx:2](../src/features/admin/AdminCouriersPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminMerchantsPage.tsx:2](../src/features/admin/AdminMerchantsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminOrdersPage.tsx:2](../src/features/admin/AdminOrdersPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminOverviewPage.tsx:3](../src/features/admin/AdminOverviewPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminReportsPage.tsx:2](../src/features/admin/AdminReportsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminTicketsPage.tsx:2](../src/features/admin/AdminTicketsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminUsersPage.tsx:2](../src/features/admin/AdminUsersPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/admin/AdminZonesPage.tsx:2](../src/features/admin/AdminZonesPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/auth/RegisterMerchantPage.tsx:3](../src/features/auth/RegisterMerchantPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/catalog/DemoHomePage.tsx:3](../src/features/catalog/DemoHomePage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Sin camino estático desde main.tsx detectado |
| [src/features/catalog/HomePage.tsx:6](../src/features/catalog/HomePage.tsx#L6) | import { INITIAL_PRODUCTS, INITIAL_MERCHANTS } from '../../mocks/initialData'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/catalog/MerchantDetailPage.tsx:3](../src/features/catalog/MerchantDetailPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/catalog/MerchantsPage.tsx:3](../src/features/catalog/MerchantsPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/catalog/ProductDetailPage.tsx:3](../src/features/catalog/ProductDetailPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/checkout/CheckoutPage.tsx:4](../src/features/checkout/CheckoutPage.tsx#L4) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/courier/CourierActiveDeliveryPage.tsx:3](../src/features/courier/CourierActiveDeliveryPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/courier/CourierEarningsPage.tsx:2](../src/features/courier/CourierEarningsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/courier/CourierHistoryPage.tsx:3](../src/features/courier/CourierHistoryPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/courier/CourierProfilePage.tsx:2](../src/features/courier/CourierProfilePage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/courier/CourierRequestsPage.tsx:3](../src/features/courier/CourierRequestsPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/customer/CustomerAddressesPage.tsx:2](../src/features/customer/CustomerAddressesPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/customer/CustomerFavoritesPage.tsx:3](../src/features/customer/CustomerFavoritesPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/customer/CustomerHelpPage.tsx:2](../src/features/customer/CustomerHelpPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/customer/CustomerNotificationsPage.tsx:3](../src/features/customer/CustomerNotificationsPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/customer/CustomerProfilePage.tsx:4](../src/features/customer/CustomerProfilePage.tsx#L4) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/merchant/MerchantDashboardPage.tsx:3](../src/features/merchant/MerchantDashboardPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/merchant/MerchantOrdersPage.tsx:2](../src/features/merchant/MerchantOrdersPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/merchant/MerchantProductsPage.tsx:2](../src/features/merchant/MerchantProductsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/merchant/MerchantReportsPage.tsx:2](../src/features/merchant/MerchantReportsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/merchant/MerchantSettingsPage.tsx:2](../src/features/merchant/MerchantSettingsPage.tsx#L2) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/merchant/MerchantStorePage.tsx:3](../src/features/merchant/MerchantStorePage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/orders/CustomerOrdersPage.tsx:3](../src/features/orders/CustomerOrdersPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/orders/OrderDetailPage.tsx:3](../src/features/orders/OrderDetailPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/features/orders/TrackingPage.tsx:3](../src/features/orders/TrackingPage.tsx#L3) | import { useDataStore } from '../../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/layouts/AdminLayout.tsx:7](../src/layouts/AdminLayout.tsx#L7) | import { useDataStore } from '../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/layouts/CourierLayout.tsx:8](../src/layouts/CourierLayout.tsx#L8) | import { useDataStore } from '../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/layouts/MerchantLayout.tsx:6](../src/layouts/MerchantLayout.tsx#L6) | import { useDataStore } from '../store/dataStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/store/authStore.ts:5](../src/store/authStore.ts#L5) | import { useAuthStore as demo } from './demoAuthStore'; | Alcanzable desde main.tsx por imports estáticos |
| [src/store/dataStore.ts:223](../src/store/dataStore.ts#L223) | } from '../mocks/initialData';<br>import { mergeCourierActivity } from '../mocks/courierActivityData';<br>import { addExampleAddresses } from '../mocks/exampleAddresses'; | Alcanzable desde main.tsx por imports estáticos |
| [src/store/demoAuthStore.ts:3](../src/store/demoAuthStore.ts#L3) | import { INITIAL_USERS } from '../mocks/initialData'; | Alcanzable desde main.tsx por imports estáticos |

Método: inspección estática de fuentes y grafo de imports relativos desde main.tsx. No se ejecutaron pruebas de aplicación ni consultas a Supabase. Los criterios son para validar la implementación posterior.
