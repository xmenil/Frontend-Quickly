# Bloque 6: operación del repartidor sobre las vistas originales

Fecha: 2026-10-29.

## Implementación

Se mantienen CourierRequestsPage, CourierActiveDeliveryPage, CourierHistoryPage, CourierEarningsPage y CourierProfilePage, sus tarjetas, tablas adaptables, badges, avatar de iniciales, formulario de incidencia, diálogos y recorrido referencial. No se cambian rutas ni se incorporan páginas Real*, Harness o interfaces técnicas. Se añade la liberación antes de recojo y el campo de efectivo en los diálogos con los componentes y estilos existentes.

- courierModel consulta todas las páginas de /courier/orders con scopes available, active e history. Detecta cursores repetidos y no presenta un listado parcial como completo. Consulta detalles autorizados; comprueba que la asignación no cambió entre listado y detalle.
- Perfil, aprobación, motivo, vehículo, zona y disponibilidad proceden de /courier/profile. No hay selección del primer repartidor ni fallback de cuenta. El layout conserva sus guardas y consulta existente; el cambio de disponibilidad se verifica con GET antes del mensaje de éxito y actualiza las páginas.
- La toma usa orderId y expectedVersion de la orden. Solo navega a entrega activa tras consultar una asignación accepted cuyo courierUserId coincide con la sesión.
- Recojo, entrega, liberación e incidencia usan assignmentId y expectedVersion de la asignación, nunca purchaseId ni el ID del perfil. La entrega verifica estado delivered de orden/asignación, avance de versión, paymentStatus succeeded, cashReceivedCents y collectedByUserId.
- El diálogo conserva el efectivo ingresado si falla. Se valida el importe en céntimos y se envía cashReceivedCents al endpoint deliver. El backend confirma entrega y cobro en su transacción; no se marca pago localmente.
- La liberación se ofrece solo antes de recojo y exige motivo. Se verifica la asignación cancelled mediante history porque el detalle privado deja de ser accesible después de liberar. El historial distingue entregas completadas y asignaciones liberadas.
- La incidencia usa el contrato de reparto, que crea el ticket en backend. Se consulta el detalle y se busca su descripción persistida antes de anunciar envío; se conserva comentario ante error. Las incidencias ya consultadas siguen visibles después de recargar.
- Dirección y teléfono actuales del comercio se consultan con /stores/{storeId}; un 404 se presenta como datos no disponibles. Otros errores se muestran y permiten reintento. Los contactos del destinatario proceden exclusivamente del destino autorizado del pedido.
- Las solicitudes disponibles no conceden acceso al detalle privado: destino, destinatario y contenido se identifican como no disponibles hasta asignación. No se intenta ese GET sin permiso. Tras entrega el backend oculta el destino: historial e ingresos respetan ese límite y no reconstruyen contactos desde almacenamiento local.
- Ingresos consulta /courier/earnings por 7, 30 o 366 días. Los totales proceden del reporte, no de la suma del historial. El desglose filtra por creación del pedido en [from,to), igual que el backend. Las tarifas no representan liquidación ni saldo; efectivo confirmado se muestra por separado.
- Se eliminan mocks/courierActivityData.ts, mergeCourierActivity, su versión de seed y todas sus llamadas de inicialización/restauración/reset. El almacén heredado ya no inyecta compras ni repartidores iniciales. Las cinco vistas no leen useDataStore ni almacenamiento de negocio local. Los datos heredados de otras vistas y la retirada final del almacén corresponden al bloque 8; no se borra indiscriminadamente almacenamiento del usuario.
- Un candado bloquea dobles envíos. 409, pérdida de conexión y GET de comprobación fallido recargan lecturas sin repetir mutaciones, sin anunciar éxito y sin forzar estado local. La asignación se recupera con GET al recargar. También se refresca al recuperar conexión y periódicamente mientras la página está visible; un error exige reintento explícito.
- Se conserva el recorrido original como referencia, sin GPS en vivo. Calificaciones no expuestas por el perfil se muestran como no disponibles.

## Endpoints

Todos usan el transporte común de NestJS bajo /api/v1.

| Uso | Endpoint |
| --- | --- |
| Perfil y aprobación | GET /courier/profile |
| Disponibilidad | PATCH /courier/profile/availability + GET /courier/profile |
| Bandejas completas | GET /courier/orders?scope=available, active o history |
| Detalle autorizado, eventos e incidencias | GET /orders/{orderId} |
| Datos públicos actuales del comercio | GET /stores/{storeId} |
| Tomar pedido | POST /courier/orders/{orderId}/claim |
| Recojo | POST /courier/assignments/{assignmentId}/pickup |
| Entrega y efectivo | POST /courier/assignments/{assignmentId}/deliver |
| Liberación | POST /courier/assignments/{assignmentId}/release |
| Incidencia | POST /courier/assignments/{assignmentId}/incidents |
| Agregados por período | GET /courier/earnings?from=...&to=... |

## Verificación

- Build frontend y backend satisfactorios. Se conserva la corrección de normalización BIGINT de ReportService; este bloque no modifica backend ni contratos.
- contracts:check satisfactorio, snapshot y tipos sincronizados.
- 31 pruebas puntuales aprobadas: 23 de repartidor y 8 regresiones del modelo comercial. Cubren vistas originales, paginación completa/circular, detalle inaccesible, cambio de asignación, IDs/versiones, doble envío, 409, conexión perdida, GET sin confirmación, cobro/cobrador, liberación, incidencia, perfil, vacíos y rango máximo.
- Se sustituyen las pruebas que exigían el seed automático del repartidor por fixtures aislados de respuestas API. Se corrigen cuatro desajustes de tipos en fixtures comerciales preexistentes para permitir compilar; no se cambia su comportamiento de producción.
- Dos recorridos Playwright aprobados a 1366 y 390 px: solicitudes → claim → recarga de asignación → recojo → incidencia → entrega con efectivo → historial y recarga → ingresos y rango → perfil y pausa. Se comprueban payloads y ausencia de desbordamiento horizontal.
- Capturas en test-results/courier-{solicitudes,recojo,entrega,confirmacion,historial,ingresos,perfil}-{1366,390}.png, revisadas en escritorio y móvil. Conservan la composición original, estilos y controles adaptables; test-results es evidencia local regenerable.
- Los tests de interfaz y navegador interceptan la API. Su GET de comprobación usa respuestas controladas: demuestra el comportamiento del cliente, **no persistencia PostgreSQL/Supabase**.

Comandos reproducibles:

~~~sh
npm run build
npm run contracts:check
npm test -- src/test/courierApi.test.tsx src/test/courierRequestsUI.test.tsx src/test/courierDeliveryUI.test.tsx src/test/courierEarningsProfileUI.test.tsx src/test/merchantOrdersApi.test.tsx
npx playwright test --config playwright.courier.config.ts
# En backend:
npm run build
~~~

## Pendiente de validación integral

No se ejecutaron migraciones, seeds ni escrituras en Supabase. Falta ejecutar dos repartidores reales reclamando la misma orden, versiones obsoletas y entrega duplicada sobre SQL/HTTP, y el circuito cliente → comercio → reparto → cobro → ingresos/auditoría con recarga persistida. Se mantienen pendientes las verificaciones integrales de los bloques anteriores. No se afirma liquidación, pago digital ni seguimiento GPS.


## Actualización de verificación — bloque 8 (2026-10-29)

Los pendientes SQL/HTTP de esta entrega histórica se verificaron después en PostgreSQL 17 local aislado. El bloque 8 aporta suites con sesiones, permisos, concurrencia, persistencia, rollback y efectivo reales, y dos recorridos de las pantallas originales a 1366/390 px. No se consultó Supabase. Ver [resultados, evidencia y límites](BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md). Las pruebas interceptadas descritas arriba mantienen esa clasificación; no se reclasifican como evidencia de DB.
