# Bloque 5: pedidos y reportes del comercio sobre las vistas originales

Fecha: 2026-10-29. Continúa el bloque 4 terminado por el usuario.

## Implementación

Se conservan MerchantDashboardPage, MerchantOrdersPage y MerchantReportsPage, sus tarjetas, tablas, pestañas, buscadores, diálogos y estilos originales. No se cambian rutas ni se montan vistas Real*/Harness.

- merchantOrdersModel consulta la tienda seleccionada por sus identificadores autorizados. La bandeja carga todas las páginas de order-feed y sus detalles con concurrencia limitada; rechaza un detalle de otra tienda.
- Se consultan productos, destinatario, destino histórico, precios, pago, plazo de aceptación, asignación y eventos reales. Los datos personales del repartidor no expuestos por el detalle se muestran como no informados.
- Aceptar, iniciar preparación, marcar listo y rechazar envían expectedVersion. No se permite saltar estados ni registrar entrega/cobro desde el comercio.
- Las acciones bloquean doble envío. Tras el POST se consulta el detalle: solo se anuncia éxito si se verifica el cambio o la asignación persistida. Un error/409 conserva el motivo del diálogo y recarga el estado sin repetir automáticamente la mutación.
- El diálogo original de reparto permite consultar el detalle y el historial desde cualquier estado. Las incidencias disponibles se muestran desde el detalle de API.
- La asignación usa el endpoint comercial, courierUserId real y expectedVersion. Se cargan repartidores disponibles, contactos, vehículo, placa y zona devueltos por el servidor; no se elige un repartidor de ejemplo.
- El plazo se representa mediante acceptanceExpiresAt. El reloj no cambia estados, no reinicia el plazo y no decide el vencimiento.
- La recepción de pedidos modifica acceptingOrders. La pausa es manual hasta reactivación: el contrato no tiene reapertura programada. Las opciones temporizadas se mantienen deshabilitadas.
- Los accesos de productos del dashboard consultan el catálogo privado y actualizan isActive mediante API; no alteran stock local.
- Lecturas de órdenes y agregados se actualizan periódicamente mientras la página está visible, sin cancelar una carga que sigue en curso. Después de un error se dispone de reintento explícito. Las acciones actualizan también el contador del layout comercial.
- Reportes consulta agregados de la API con rangos de 7, 30 o 366 días. El último respeta el límite del backend y no representa histórico ilimitado.
- Ventas entregadas incluyen envío según la definición del backend; efectivo confirmado y tarifas de reparto se identifican por separado. El promedio se deriva de ventas entregadas y cantidad de entregas, no de semillas.
- Hora pico, serie semanal y ranking de productos no se inventan: conservan sus contenedores originales y muestran indisponibilidad. Las tarjetas digitales indican que esos pagos no están habilitados.
- El historial y CSV usan órdenes reales, período y búsqueda actual. La exportación escapa comillas y trata texto que podría interpretarse como fórmula.

## Endpoints

Todos bajo el prefijo/configuración común /api/v1:

| Uso | Endpoint |
|---|---|
| Tienda y recepción | GET/PATCH /merchant/stores/{id} |
| Imagen comercial | GET /merchant/stores/{id}/branding |
| Catálogo privado del dashboard | GET /merchant/stores/{id}/products |
| Publicación de producto | PATCH /merchant/products/{id} |
| Bandeja paginada | GET /merchant/stores/{id}/order-feed |
| Detalle e historial | GET /orders/{id} |
| Aceptar | POST /merchant/orders/{id}/accept |
| Preparar | POST /merchant/orders/{id}/start-preparation |
| Marcar listo | POST /merchant/orders/{id}/mark-ready |
| Rechazar | POST /merchant/orders/{id}/rejections |
| Repartidores disponibles | GET /merchant/available-couriers |
| Asignar | POST /merchant/orders/{id}/assign-courier |
| Reportes | GET /merchant/stores/{id}/reports?from=...&to=... |

## Corrección de backend

ReportService normaliza los agregados BIGINT de PostgreSQL a números seguros antes de serializar. Esto evita respuestas de importes como strings que el cliente tipado rechaza. Se rechazan importes negativos o fuera del rango entero seguro. No cambia el esquema, las fórmulas ni los registros de negocio.

## Verificación reducida

- Compilación frontend y backend.
- contracts:check: snapshot y tipos sincronizados.
- Ocho casos puntuales de paginación completa, aislamiento de tienda, versión, doble acción, conflicto 409, comprobación de persistencia, asignación con courierUserId y rango máximo.
- Revisión del diff: router y estilos globales sin modificaciones en este bloque.
- No se ejecutó la suite completa, un recorrido visual en navegador ni pruebas con dos operadores reales.
- No se ejecutaron migraciones, seeds ni escrituras en Supabase. El recorrido cliente → comercio → reparto y la persistencia SQL/HTTP quedan pendientes de verificación en una base de pruebas.

## Pendiente

Completar la verificación integral y visual. Continuar con el bloque 6 en las vistas originales del repartidor. El motor de pedidos, reportes y asignación sigue siendo el backend; no se incorporaron estados ni métricas mock como fallback.


## Actualización de verificación — bloque 8 (2026-10-29)

Los pendientes SQL/HTTP de esta entrega histórica se verificaron después en PostgreSQL 17 local aislado. El bloque 8 aporta suites con sesiones, permisos, concurrencia, persistencia, rollback y efectivo reales, y dos recorridos de las pantallas originales a 1366/390 px. No se consultó Supabase. Ver [resultados, evidencia y límites](BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md). Las pruebas interceptadas descritas arriba mantienen esa clasificación; no se reclasifican como evidencia de DB.
