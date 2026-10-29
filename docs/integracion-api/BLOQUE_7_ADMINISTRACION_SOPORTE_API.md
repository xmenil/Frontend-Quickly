# Bloque 7: administración, soporte y auditoría sobre las vistas originales

Fecha: 2026-10-29.

## Alcance implementado

Se mantienen las nueve páginas originales de administración (resumen, usuarios, comercios, repartidores, pedidos, zonas, incidencias, reportes y auditoría) y OperationalHealthPage. Se conservan tablas adaptables, tarjetas, Tailwind, badges, iconos/avatares, buscadores, filtros, diálogos, menús y estados vacíos. No se cambian rutas ni se montan páginas Real*, Harness o interfaces alternativas.

adminModel concentra paginación completa, adaptadores de presentación y comprobaciones de mutaciones. Las nueve vistas originales dejan de consumir useDataStore. Los errores se muestran sin semillas; las operaciones quedan bloqueadas mientras se consulta, hay error de lectura o una mutación sigue en curso. Se consultan lecturas al recuperar conexión y periódicamente si la página está visible; no se repiten mutaciones automáticamente.

### Resumen y cuentas

- Resumen consulta /admin/overview y los listados completos de cuentas, comercios, repartidores, pedidos y tickets. Muestra pedidos activos, solicitudes de afiliación/cuentas, casos abiertos, apertura efectiva del comercio y conexión declarada por los repartidores. No interpreta conexión como capacidad libre de reparto.
- Las compras se distinguen de los pedidos mediante purchaseId: se cuentan compras únicas y se suman los totales de sus órdenes consultadas, incluidos estados cancelados. No se usa una suma parcial de una página.
- Usuarios carga todas las páginas y conserva búsqueda por nombre/correo, filtros y avatares de iniciales. Una cuenta puede tener varios roles: se muestran todos y el filtro comprueba pertenencia, sin elegir un rol por defecto para otorgar acceso.
- Cambiar estado usa PATCH /admin/users/{userId}/status con active/suspended y motivo obligatorio. Se verifica estado y último motivo con un listado GET completo antes de cerrar el diálogo. Activar una cuenta no aprueba afiliaciones ni concede roles localmente. El rechazo de solicitudes comerciales/de reparto se hace en sus secciones, porque el estado de una cuenta no tiene valor rejected.
- Las guardas del layout conservan restauración de sesión, cuenta activa y rol admin. Los badges de cuentas, comercios y repartidores usan el contador de su propia sección y se recargan tras las operaciones; el enlace de estado operativo queda accesible en la navegación existente.

### Comercios y repartidores

- Comercios consulta /admin/stores, branding autorizado y zonas para la tarifa base. Conserva tabla, logo o icono de ausencia, categoría, dirección, apertura y preparación. La aprobación y su motivo se presentan separados de la recepción y del horario efectivo.
- Aprobar/rechazar/suspender/reactivar usa las decisiones permitidas por el estado del backend, con un motivo de 3 a 500 caracteres. Se comprueba el estado y motivo con GET; un 409 o falta de confirmación conserva el diálogo y el motivo.
- El control comercial original modifica acceptingOrders mediante la API autorizada de tienda y comprueba GET. Activar recepción no promete abrir fuera de horario. El servidor conserva las restricciones de afiliación/actividad.
- Repartidores consulta perfiles administrativos reales: courierUserId, aprobación, motivo, vehículo, placa, zona y conexión. Las decisiones envían el userId del perfil; no una identidad inventada.
- No existe endpoint administrativo de disponibilidad personal del repartidor. Su botón original se conserva deshabilitado, con explicación; no se llama a un endpoint de otro usuario ni se simula el cambio.
- Las calificaciones no expuestas por estos DTO se indican como no disponibles; no se presentan estrellas ni promedios seed.

### Pedidos y asignaciones

- Se cargan todas las páginas de /admin/orders y cada detalle con concurrencia limitada. Se rechaza un detalle cuyo orderId no coincide con el solicitado.
- Se mantienen búsqueda, tabla, badges y diálogo. Se muestran destinatario/destino, contacto, total, pago, productos, eventos e incidencias disponibles. Los nombres/contactos de repartidores se resuelven con los perfiles administrativos; si no se exponen, se conserva el identificador real, sin inventar datos.
- La asignación consulta /admin/courier-options por storeId, exige seleccionar un courierUserId elegible y un motivo, y envía expectedVersion de la orden. No se selecciona un repartidor por defecto.
- Liberar usa assignmentId y expectedVersion de la asignación, exige motivo y solo se ofrece antes de recojo. Se consulta el detalle y se comprueba la misma asignación cancelled.
- Administración no confirma recojo, entrega ni efectivo. Esas acciones siguen siendo del repartidor. Los conflictos y respuestas ambiguas recargan lecturas sin forzar estados ni anunciar éxitos locales.

### Zonas y soporte

- Zonas consulta todas las páginas privadas, incluidas zonas desactivadas. Se conservan tabla y badges; se añaden alta/edición en un Dialog con los controles existentes.
- Se validan código, nombre, tarifa en céntimos (incluido cero), tiempo de 1 a 1440 minutos y estado. Editar exige motivo y omite el código inmutable del PATCH. Se comprueban los campos guardados mediante GET antes del éxito. La desactivación y su efecto sobre repartidores quedan a cargo del backend.
- Soporte consulta listado y detalle administrativos con conversación real. El contrato no expone solicitante ni rol: se muestran como no informados y los mensajes identifican a su autor real; no se deduce una identidad a partir de una semilla.
- El diálogo permite responder, cambiar prioridad y pasar a abierto/en revisión/resuelto; un caso resuelto puede reabrirse mediante una nueva decisión. Se envían expectedVersion del ticket, estado, prioridad y mensaje.
- Solo se anuncia éxito después de GET con versión mayor, estado/prioridad esperados y un mensaje nuevo del administrador que coincide con la respuesta enviada. Errores/409 conservan el texto y permiten revisar el caso actualizado. Las incidencias de reparto se resuelven mediante la lógica transaccional del backend.

### Reportes, exportación y auditoría

- Reportes consulta /admin/reports con rangos de 7, 30 o 366 días. Ventas entregadas incluyen envío; efectivo es neto confirmado; tarifas corresponden a asignaciones entregadas y no representan saldo ni liquidación. Se conserva la normalización segura de BIGINT de ReportService.
- El CSV exporta pedidos reales consultados del mismo período de creación [from,to), con orderId y purchaseId separados. No promete exportar compras agrupadas ni métodos de pago que el resumen no expone. Escapa comillas/saltos de línea y neutraliza fórmulas; usa Blob y libera la URL temporal.
- Auditoría consulta todas las páginas con cursores BIGINT mantenidos como strings. Presenta acción, fecha, actorUserId, entidad y requestId reales. No genera entradas de auditoría desde el navegador.
- El contrato no expone rol histórico del actor ni detalles adicionales. Se conserva el filtro de rol deshabilitado con explicación y el badge de ausencia; no se infiere un rol histórico usando roles actuales.

### Salud

OperationalHealthPage conserva su panel y lectura de /admin/operations; agrega consultas validadas de liveness/readiness. Un resultado de salud incompleto o 503 no se convierte en conexión correcta. Readiness comprueba conectividad y no demuestra transacciones persistidas de pedidos/cobros.

Se añaden HealthLiveDto y HealthReadyDto a OpenAPI para /health/live, /health/ready y /health. No se cambia su comportamiento ni se realizan migraciones. Snapshot y tipos frontend se sincronizan. La corrección previa de reportes BIGINT permanece intacta.

## Endpoints utilizados

Todos bajo /api/v1 y con el transporte común.

| Uso | Endpoint |
| --- | --- |
| Resumen | GET /admin/overview |
| Cuentas | GET /admin/users; PATCH /admin/users/{userId}/status |
| Afiliaciones comerciales | GET /admin/stores; POST /admin/stores/{storeId}/decisions |
| Recepción/detalle comercial | GET/PATCH /merchant/stores/{storeId} |
| Branding autorizado | GET /merchant/stores/{storeId}/branding |
| Repartidores | GET /admin/couriers; POST /admin/couriers/{courierUserId}/decisions |
| Pedidos/detalles | GET /admin/orders; GET /orders/{orderId} |
| Repartidores elegibles | GET /admin/courier-options?storeId=... |
| Asignación | POST /admin/orders/{orderId}/assignment |
| Liberación | POST /admin/assignments/{assignmentId}/release |
| Cobertura | GET/POST /admin/zones; PATCH /admin/zones/{zoneId} |
| Soporte | GET /admin/tickets; GET /admin/tickets/{ticketId}; POST /admin/tickets/{ticketId}/decisions |
| Reportes | GET /admin/reports?from=...&to=... |
| Auditoría | GET /admin/audit?cursor=... |
| Operación y salud | GET /admin/operations; GET /health/live; GET /health/ready |

## Verificación y límites

- Build frontend y backend satisfactorios; contracts:check sincronizado.
- 37 pruebas puntuales frontend: 13 de modelo/acciones, 4 de usuarios, 3 de soporte, 9 de vistas administrativas/layout, 4 del cliente operativo y 4 de salud. Cubren paginación/cursor circular, aislamiento de IDs, motivos, múltiples roles, versiones de orden/asignación/ticket, doble envío, conflictos, desconexión, GET sin confirmación, cambio de sesión, lectura 403, ausencia de datos y exportación segura.
- Ocho comprobaciones HTTP de Nest: RolesGuard rechaza customer/merchant/courier en cuentas/zonas, y los servicios rechazan acceso administrativo a pedidos/reportes/auditoría/tickets. Se usan una sesión controlada y un proveedor SQL simulado: son pruebas aisladas, no autenticación ni persistencia contra PostgreSQL/Supabase.
- Tres recorridos Playwright: diez pantallas originales y operaciones a 1366 y 390 px, más 403 sin registros de ejemplo. Incluyen suspensión y recarga de cuenta, aprobación comercial/de reparto, asignación/liberación con versiones, edición/alta de zona, resolución y consulta de ticket tras recarga, exportación, badges por sección y menú móvil.
- Treinta capturas regenerables en test-results/admin/: diez pantallas y cinco diálogos por tamaño. Se revisan composición, contenido, controles y ausencia de desbordamiento horizontal.
- Las pruebas de frontend y navegador interceptan la API. Sus GET posteriores verifican el comportamiento de confirmación del cliente con respuestas controladas; **no prueban persistencia SQL/HTTP real**.

Comandos reproducibles:

~~~sh
# Frontend-Quickly
npm run build
npm run contracts:check
npm test -- src/test/adminApi.test.tsx src/test/adminUsersUI.test.tsx src/test/adminTicketsUI.test.tsx src/test/adminOperationsUI.test.tsx src/test/operationsApi.test.ts src/test/healthApi.test.ts
npx playwright test --config playwright.admin.config.ts
# backend
npm run build
npm test -- --runInBand admin-routes.spec.ts
npm run contracts:export
~~~

## Pendiente integral

No se ejecutaron migraciones, seeds ni escrituras en Supabase. Falta verificar decisiones y permisos con cuentas/sesiones reales, revocación de sesiones y roles tras aprobar/suspender/rechazar, protección del último administrador y de pedidos/entregas activos, recursos ajenos, dos operadores concurrentes y recarga de datos persistidos/auditoría.

Pedidos/asignaciones/tickets usan las versiones disponibles. Cuentas, afiliaciones y zonas no exponen expectedVersion: el cliente respeta sus contratos y verifica el estado posterior, sin prometer una exclusión optimista que el backend no ofrece. Los listados, agregados y exportaciones son lecturas independientes, no una instantánea transaccional única.

La siguiente implementación es el bloque 8: reauditoría y retirada final de dependencias mock, seguida del circuito integral con base de pruebas. Siguen visibles las verificaciones DB pendientes de los bloques anteriores.


## Actualización de verificación — bloque 8 (2026-10-29)

Los pendientes SQL/HTTP de esta entrega histórica se verificaron después en PostgreSQL 17 local aislado. El bloque 8 aporta suites con sesiones, permisos, concurrencia, persistencia, rollback y efectivo reales, y dos recorridos de las pantallas originales a 1366/390 px. No se consultó Supabase. Ver [resultados, evidencia y límites](BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md). Las pruebas interceptadas descritas arriba mantienen esa clasificación; no se reclasifican como evidencia de DB.
