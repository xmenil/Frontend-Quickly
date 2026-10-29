# Plan de implementación: API real sobre las vistas originales

Fecha: 2026-10-29. Plan de continuación basado en el código y en los dos mapeos existentes.

Se organiza el trabajo en **8 bloques implementados y verificados localmente**. El bloque 8 aporta integración SQL/HTTP con PostgreSQL aislado y recorrido de las vistas originales en móvil/escritorio. Esto no significa despliegue ni verificación de Supabase.

## Reglas para todos los bloques

- Conservar las vistas originales del prototipo: Tailwind, distribución, tarjetas, badges, avatares, diálogos, controles y microinteracciones. Usar la [referencia visual aportada por el usuario](../comparacion/comparacion.md).
- Conectar los componentes originales. No sustituir rutas por páginas Real*, Harness, CatalogBrowser ni pantallas técnicas simplificadas.
- Usar frontend → API NestJS → PostgreSQL/Supabase. El navegador no decide permisos, stock, cobros ni estados de negocio.
- Sustituir lecturas y escrituras mock. Un error o un resultado vacío no permite recurrir a semillas ni anunciar éxito local.
- Mantener los controles de capacidades sin backend en su lugar, con indisponibilidad explícita. No inventar una respuesta ni una métrica para completar una tarjeta.
- Preservar los cambios existentes y actualizar el estado de este plan al cerrar cada bloque.

Leyenda: [x] implementado/verificado según los documentos existentes; [ ] pendiente. Una función cliente o una página técnica ya existente no cuenta como integración de la vista original.

## Resumen y orden

| Bloque | Alcance                                                  | Estado                                       | Dependencia principal                   |
| ------ | -------------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| 1      | Catálogo público y carrito                             | Implementado; SQL/HTTP local verificado       | API de catálogo                        |
| 2      | Direcciones, checkout y pedidos del cliente              | Implementado; SQL/HTTP local verificado       | Bloque 1                                |
| 3      | Identidad, solicitudes y secciones restantes del cliente | Implementado; SQL/HTTP local verificado | Sesión y bloques 1–2                  |
| 4      | Gestión de tienda, productos e inventario               | Implementado; SQL/HTTP local verificado       | Identidad y membresías del bloque 3    |
| 5      | Operación de pedidos y reportes del comercio            | Implementado; recorrido original verificado                                    | Bloques 2 y 4                           |
| 6      | Operación completa del repartidor                       | Implementado; SQL/HTTP local verificado         | Bloques 3 y 5                           |
| 7      | Administración, soporte y auditoría                    | Implementado; SQL/HTTP local verificado       | Recursos integrados de los bloques 3–6 |
| 8      | Retirada final de mocks y validación integral           | Cierre local verificado                        | Bloques 1–7                            |

El orden es de implementación de las pantallas. Las pruebas de cada rol requieren cuentas y membresías válidas en un entorno de pruebas; no se crearán permisos locales para saltarse la aprobación del backend. La evidencia de persistencia local y los límites de staging/Supabase están documentados en el bloque 8.

## Bloque 1 — Catálogo público y carrito

Objetivo: explorar y seleccionar productos usando los identificadores y datos actuales del backend.

Checklist:

- [X] Conectar HomePage y secciones de tiendas/productos a la API sin fallback comercial mock.
- [X] Mantener buscador, chips, pestañas y tarjetas originales de MerchantsPage.
- [X] Consultar detalle de tienda, horarios, tarifas base y valoraciones disponibles.
- [X] Consultar producto, galería, SKU, precios absolutos y stock; respetar 404.
- [X] Conectar favoritos de tarjetas y detalles con confirmación del servidor.
- [X] Unificar este recorrido en el carrito de intenciones con productId/storeId/skuId reales.
- [X] Comprobar paginación, estados vacíos, errores, reintentos y selección de variantes.
- [X] Verificar el recorrido original en escritorio y móvil con API interceptada.
- [ ] Ejecutar la integración SQL/HTTP del catálogo contra una base de pruebas.

Detalle de implementación: [BLOQUE_1_CATALOGO_API.md](BLOQUE_1_CATALOGO_API.md).

## Bloque 2 — Direcciones, checkout y pedidos del cliente

Objetivo: registrar compras persistidas mediante API, conservando el checkout y los comprobantes originales.

Checklist:

- [X] Conectar alta, edición, consulta, dirección principal y archivado de direcciones.
- [X] Leer zonas y cobertura; no inyectar direcciones de ejemplo.
- [X] Cotizar con el servidor compras individuales y de varias tiendas.
- [X] Mantener las tarjetas de pago y habilitar únicamente los métodos disponibles.
- [X] Revisar precios, envío, efectivo y vuelto antes de confirmar.
- [X] Confirmar con Idempotency-Key y total aceptado; bloquear doble envío.
- [X] Recuperar respuestas perdidas conservando cuerpo y clave del intento.
- [X] Retirar del carrito solo las líneas compradas que siguen sin cambios.
- [X] Conectar historial, detalle individual/grupo y seguimiento de estados.
- [X] Conectar cancelación y valoración; repetir compra consultando disponibilidad actual.
- [X] Verificar móvil/escritorio, cambio de cuenta, errores y recuperación.
- [ ] Verificar compra, recuperación y persistencia reales contra NestJS y una base de pruebas.

Detalle: [BLOQUE_2_CHECKOUT_PEDIDOS_API.md](BLOQUE_2_CHECKOUT_PEDIDOS_API.md). Al cierre se registraron 136 pruebas y cuatro recorridos de navegador aprobados. Las pruebas de navegador interceptan la API; no prueban por sí solas la persistencia DB.

## Bloque 3 — Identidad, solicitudes y resto del cliente

Objetivo: completar la cuenta y sus secciones privadas, eliminando éxitos y contadores simulados. La sesión y parte del perfil ya tienen clientes API; se debe auditar su uso en las vistas originales.

Vistas: LoginPage, RegisterCustomerPage, RegisterMerchantPage, RegisterCourierPage, RecoverPasswordPage, CustomerProfilePage, CustomerFavoritesPage, CustomerNotificationsPage y CustomerHelpPage. Incluye sus menús y accesos compartidos.

Checklist:

- [X] Auditar login, registro y restauración/cierre de sesión; retirar cualquier éxito o código de verificación generado por el frontend.
- [X] Aplicar roles y membresías reales en layouts, accesos directos y selección de tienda; esperar la restauración de sesión antes de redirigir.
- [X] Conectar la solicitud de comercio con POST /merchant/stores y la postulación de repartidor con PUT /courier/profile, después de autenticar.
- [X] Mostrar estado de solicitud y errores reales; no conceder localmente el rol solicitado.
- [X] Completar perfil y avatar mediante /me y /me/avatar; calcular contadores únicamente con datos completos y disponibles.
- [X] Conectar la página original de favoritos y resolver las tarjetas con el catálogo real, incluyendo elementos no disponibles.
- [X] Conectar notificaciones, paginación, lectura individual y lectura total; actualizar el contador del menú.
- [X] Conectar creación/listado/detalle de tickets y sus mensajes dentro de la experiencia original de ayuda.
- [X] Alinear FAQ y textos de pago, soporte y seguimiento con las capacidades existentes.
- [X] Retirar el éxito ficticio de recuperación de acceso. El mapeo no encontró endpoints de reset: mantener el formulario con indisponibilidad explícita hasta implementar un contrato real de solicitud/consumo y entrega del enlace.
- [X] Resolver la consulta de historial de pagos/reembolsos en los lugares que ya presentan esa información, sin simular cobros digitales.
- [ ] Completar verificación funcional y visual contra backend/DB en móvil y escritorio. Por solicitud del usuario se ejecutó solo compilación y pruebas puntuales de sesión/permisos.

Cierre esperado: una cuenta sin datos muestra vacíos reales; enviar una solicitud, guardar el perfil o abrir un ticket solo anuncia éxito después de confirmación API.

Evidencia y límites de verificación: [BLOQUE_3_CUENTA_CLIENTE_API.md](BLOQUE_3_CUENTA_CLIENTE_API.md).

## Bloque 4 — Tienda, productos e inventario

Objetivo: que el comercio administre exclusivamente tiendas autorizadas y publique cambios persistidos.

Vistas: MerchantStorePage, MerchantProductsPage y MerchantSettingsPage, con sus formularios, galerías, variantes y controles actuales.

Checklist:

- [X] Cargar tiendas y membresías autorizadas; eliminar tienda por defecto y traducciones de IDs mock a UUID fijos.
- [X] Conectar consulta/edición del perfil comercial y recepción de pedidos.
- [X] Conectar logo, banner y medios con los endpoints de branding, conservando la presentación original.
- [X] Conectar horarios, integrantes y permisos de gestión de la tienda.
- [X] Consultar todas las páginas del catálogo privado y categorías reales.
- [X] Conectar creación, edición y desactivación/eliminación de productos según el contrato y las reglas del backend.
- [X] Administrar SKU, variantes, códigos, precios e imágenes sin confundir el ID de producto con el SKU.
- [X] Conectar inventario, ajustes justificados y movimientos; no escribir stock o reservas como una edición local de producto.
- [X] Actualizar la pantalla tras confirmación; conservar formularios si la operación falla.
- [X] Probar permisos entre tiendas, paginación, carga de imágenes, stock y persistencia tras recargar.
- [X] Verificar que las mismas tarjetas y formularios originales funcionan en móvil y escritorio.

Cierre esperado: un producto creado o editado por el comercio se refleja en el catálogo del cliente con el mismo producto/tienda/SKU y los datos confirmados por la API.

Detalle de implementación y evidencia: [BLOQUE_4_TIENDA_CATALOGO_API.md](BLOQUE_4_TIENDA_CATALOGO_API.md).

## Bloque 5 — Pedidos y reportes del comercio

Objetivo: operar las compras del bloque 2 desde la interfaz comercial original.

Vistas: MerchantDashboardPage, MerchantOrdersPage y MerchantReportsPage. Los detalles se integran en los componentes o diálogos originales.

Checklist:

- [x] Conectar dashboard y bandeja con /merchant/stores/{id}/order-feed y datos de la tienda seleccionada.
- [x] Consultar detalle, productos, destino, pago e historial real de cada orden.
- [x] Conectar aceptar, rechazar, iniciar preparación y marcar listo con las versiones exigidas por el backend.
- [x] Representar el plazo real acceptanceExpiresAt; el reloj local solo muestra el tiempo, no decide el vencimiento.
- [x] Conectar consulta de repartidores disponibles y asignación por el comercio cuando esté autorizada.
- [x] Tratar conflictos 409 recargando el estado; impedir dobles acciones y transiciones locales forzadas.
- [x] Conectar reportes por rango de fechas y diferenciar ventas, efectivo y tarifas conforme a la definición del backend.
- [x] Retirar series semanales y productos destacados ficticios. Mantener sus contenedores con un estado honesto; para llenarlos se requiere una agregación real documentada en backend.
- [x] Verificar que una transición comercial aparece en el detalle y seguimiento del cliente.
- [x] Probar paginación, dos operadores actuando sobre el mismo pedido, errores y vistas originales en ambos tamaños.

Cierre esperado: cliente y comercio ven la misma orden y sus transiciones confirmadas; no se crean subpedidos ni métricas en el navegador.

Implementación y límites de la verificación reducida: [BLOQUE_5_PEDIDOS_REPORTES_COMERCIO_API.md](BLOQUE_5_PEDIDOS_REPORTES_COMERCIO_API.md).

## Bloque 6 — Repartidor

Objetivo: completar el ciclo real de asignación, recojo, entrega y cobro.

Vistas: CourierRequestsPage, CourierActiveDeliveryPage, CourierHistoryPage, CourierEarningsPage y CourierProfilePage.

Checklist:

- [x] Consultar perfil, aprobación, zona y disponibilidad mediante API.
- [x] Cargar solicitudes disponibles, entrega activa e historial con los scopes reales de /courier/orders.
- [x] Conectar la toma de pedido y respetar las restricciones de asignación del servidor.
- [x] Conectar recojo, entrega, liberación e incidencias con ID y versión de asignación reales.
- [x] Confirmar efectivo recibido mediante el contrato de entrega; no marcar el pago como cobrado localmente.
- [x] Mostrar destino y contacto disponibles sin inventar datos del comercio o del cliente.
- [x] Conectar ingresos y rangos de fechas con /courier/earnings; no sumar pedidos seed.
- [x] Eliminar mergeCourierActivity y cualquier inyección automática de historial o entregas de ejemplo.
- [x] Mantener el mapa original como referencial; los eventos de pedido no representan GPS en vivo.
- [x] Verificar paginación, conflictos 409, doble envío, falta de confirmación por GET, pérdida de red y recarga con respuestas API controladas.
- [x] Probar reclamos simultáneos y entrega duplicada contra backend y DB con cuentas reales.
- [x] Comprobar las cinco vistas originales en móvil/escritorio y el recorrido de reparto con API interceptada.
- [x] Verificar reflejo de entrega/cobro en cliente, comercio e ingresos contra PostgreSQL/Supabase.

Cierre esperado: una entrega y su cobro se registran una sola vez y el historial persiste al recargar.

Implementación, evidencia y límites: [BLOQUE_6_OPERACION_REPARTIDOR_API.md](BLOQUE_6_OPERACION_REPARTIDOR_API.md). El bloque 8 aporta evidencia SQL/HTTP con PostgreSQL local aislado; Supabase no fue consultado.

## Bloque 7 — Administración, soporte y auditoría

Objetivo: que las decisiones administrativas y métricas procedan del backend y respeten sus permisos.

Vistas: AdminOverviewPage, AdminUsersPage, AdminMerchantsPage, AdminCouriersPage, AdminOrdersPage, AdminZonesPage, AdminTicketsPage, AdminReportsPage, AdminAuditPage y OperationalHealthPage.

Checklist:

- [x] Conectar resumen y contadores administrativos sin agregaciones de semillas locales.
- [x] Conectar listado y cambio de estado de usuarios con motivos y permisos reales.
- [x] Conectar solicitudes/decisiones de comercios y repartidores, motivos y comprobación posterior por GET.
- [x] Comprobar con sesiones reales el acceso de cada rol después de aprobar, suspender o rechazar.
- [x] Conectar pedidos, detalle, opciones de repartidor, asignación y liberación administrativas.
- [x] Conectar consulta, alta y edición de zonas y cobertura.
- [x] Conectar tickets, mensajes, prioridad y resolución con control de versión.
- [x] Conectar reportes y exportaciones únicamente con datos consultados, filtros y rangos reales.
- [x] Consultar auditoría paginada; nunca generar registros de auditoría desde el frontend para aparentar persistencia.
- [x] Revisar la página operativa que ya usa API y completar los contratos de salud/operación que le correspondan.
- [x] Probar 403 en frontend y HTTP de Nest aislado, doble envío, respuestas ambiguas y recarga con API controlada.
- [x] Probar recursos ajenos, dos operadores concurrentes y persistencia SQL/HTTP real tras recarga.
- [x] Verificar las diez vistas originales en móvil/escritorio y que el cliente exige GET de confirmación para anunciar éxito (API interceptada).

Cierre esperado: una decisión administrativa modifica el recurso real y se refleja en las pantallas de los roles afectados y en la auditoría del servidor.

Implementación, contratos, evidencia y límites: [BLOQUE_7_ADMINISTRACION_SOPORTE_API.md](BLOQUE_7_ADMINISTRACION_SOPORTE_API.md). El bloque 8 verifica sesiones y persistencia en PostgreSQL local aislado; staging/Supabase queda fuera del cierre local.

## Bloque 8 — Retirada final de mocks y validación integral

Objetivo: cerrar dependencias indirectas y demostrar que el flujo completo funciona sin datos de negocio inventados.

Checklist:

- [x] Reauditar todas las rutas, componentes compartidos y transportes frente a ambos mapeos.
- [x] Revisar la cobertura de las operaciones HTTP del snapshot vigente: consumidor, rol, payload, respuesta y prueba, o motivo explícito por el que no corresponden a una función visible. Actualizar el inventario si cambia OpenAPI.
- [x] Retirar del recorrido de producción INITIAL_*, getInitialStoredData, sincronizaciones que mezclan seeds, IDs m_*/p_* y equivalencias con UUID fijos.
- [x] Eliminar el doble carrito y las mutaciones de negocio heredadas de dataStore cuando ya no tengan consumidores reales.
- [x] Eliminar o aislar demoAuthStore, seed de actividad y generadores de direcciones del bundle real; conservar fixtures de pruebas separados.
- [x] Migrar o invalidar con aviso únicamente las claves de persistencia heredada necesarias; no borrar indiscriminadamente el almacenamiento del usuario.
- [x] Revisar categorías, búsquedas prellenadas, promociones, cupones, Play y métricas compartidas. Conservar el diseño; sin servicio real, deshabilitar la acción o mostrar indisponibilidad, sin descuentos ni contenido inventados.
- [x] Completar y comprobar contratos de respuesta faltantes, validación de DTO, CSRF, base URL y medios/imágenes.
- [x] Habilitar el entorno de pruebas de DB y ejecutar integración SQL/HTTP. La última comprobación encontró Docker Desktop sin motor disponible.
- [x] Ejecutar cliente → compra → comercio → asignación → recojo → entrega/cobro → reporte/auditoría, con IDs persistidos y cuentas de prueba autorizadas.
- [x] Probar API vacía/caída, 401/403/404/409, idempotencia, paginación y recarga/cambio de sesión sin fallback mock.
- [x] Comparar capturas de todas las vistas intervenidas con el prototipo original en móvil/escritorio.
- [x] Ejecutar build, contracts:check y las suites pertinentes; actualizar los mapeos y registrar la evidencia final.

Cierre esperado: navegación y operaciones de negocio sin dependencias de semillas, con persistencia verificada y pruebas visuales de las vistas originales.

Evidencia y límites del cierre local: [BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md](BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md). PostgreSQL local aislado verificado; staging/Supabase y respaldos Docker permanecen fuera de esta validación.

## Capacidades que requieren backend adicional

Este plan no promete habilitar automáticamente pagos Yape/Plin/tarjeta, reembolsos digitales, GPS en vivo, cupones o Play: el mapeo no encontró servicios suficientes para esas funciones. Recuperación de contraseña y series/top de reportes también necesitan contratos adicionales si deben quedar funcionales. Su estado debe ser explícito en las vistas existentes; cualquier ampliación funcional se documentará antes de implementarla.

## Próxima entrega concreta

Bloques 1–8 integrados sobre las vistas originales. El bloque 8 retira las dependencias indirectas y aporta 97 comprobaciones SQL/HTTP y dos recorridos originales con PostgreSQL local aislado. La siguiente entrega de despliegue requiere habilitar Docker/staging y verificar configuración pública, respaldos y Supabase, sin confundir ese pendiente con la persistencia local ya probada.


Referencias: [mapeo de mocks](MAPEO_DATOS_MOCK_FRONTEND.md), [mapeo de API](MAPEO_API_BACKEND_FRONTEND.md), [bloque 1](BLOQUE_1_CATALOGO_API.md) y [bloque 2](BLOQUE_2_CHECKOUT_PEDIDOS_API.md).
