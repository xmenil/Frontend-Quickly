# Bloque 8 — Retirada de mocks y validación integral

Fecha: 2026-10-29. Se conservan el router y las vistas originales. El recorrido de producción usa React → NestJS → PostgreSQL; no se montan páginas Real*, Harness ni navegadores técnicos de catálogo.

## Resultado de la retirada

- Eliminados dataStore, cartStore, demoAuthStore, initialData, exampleAddresses, supabaseSync, DemoHomePage, DemoSwitcher y appMode. También se retiraron QuickCategoryStrip y generadores locales de IDs/códigos sin consumidores. Ya no existen merges, equivalencias de UUID ni almacenes locales de pedidos, stock, usuarios o asignaciones.
- authStore restaura identidad con cookies de sesión y CSRF en memoria. No importa autenticación demo, no guarda Bearer y no acepta la selección de una cuenta de ejemplo. RoleSwitcher conserva el control flotante y solo ofrece roles concedidos por Nest.
- Un solo transporte resuelve JSON y medios mediante VITE_API_BASE_URL (incluye /api/v1), o VITE_API_URL + /api/v1; el valor predeterminado es /api/v1 con proxy del mismo origen. Se retiraron apiFetch y el override de backend en localStorage.
- Migración idempotente y acotada: quickly_auth_v1, quickly_session_token, quickly_datastore_v2/v3/v4, quickly_cart_v1, quickly_backend_url y quickly_search_history; también quickly_csrf en sessionStorage. Se avisa al usuario. Se conservan quickly_cart_real_v2, quickly_checkout_intent_v1:<usuario>, búsquedas actuales y preferencias ajenas. No se llama localStorage.clear en producción.
- Categorías y enlaces usan IDs de /catalog/categories. No se inventan subcategorías; se conserva el menú y su panel lateral con un estado explícito. El catálogo filtra categoriaProducto por el ID real, mantiene pestañas/chips/tarjetas y no interpreta búsquedas como descuentos inexistentes.
- Búsqueda sin historial precargado, con cancelación de consultas obsoletas, error y reintento explícito. Seleccionar una tienda en productos destacados consulta esa tienda en el servidor.
- Cupones y Play mantienen sus modales, tarjetas, badges y controles, con indisponibilidad y acciones deshabilitadas. Las ofertas tampoco prometen un descuento. Se retiraron afirmaciones de envío inmediato y badges técnicos del producto.
- Favoritos consulta nuevamente el servidor antes de reflejar el cambio confirmado; un error de lectura no se sustituye por un favorito local.

El plugin quickly-production-boundary de Vite inspecciona los módulos del bundle y falla si entra src/test, src/mocks, los almacenes retirados, DemoSwitcher, DemoHomePage o pantallas operations/Real*. Los fixtures permanecen en src/test y e2e, fuera del grafo de producción.

## Contrato completo e inventario

[INVENTARIO_HTTP_BLOQUE_8.md](INVENTARIO_HTTP_BLOQUE_8.md) contiene las 130 operaciones del snapshot: consumidor o motivo de no exposición, alcance de rol, DTO/parámetros, respuesta y suites de referencia. Se genera con npm run integration:inventory y se comprueba con npm run integration:check. Un controlador desconocido o una respuesta JSON 2xx sin esquema hacen fallar la comprobación.

Se documentaron las 21 respuestas JSON antes incompletas: verificación de correo, compras, cancelaciones/transiciones, consultas heredadas, asignación, recojo, entrega, liberación, incidencias, repartidores disponibles y notificaciones heredadas. Se respeta el formato existente, incluidos los agregados int8 que llegan como cadenas en rutas antiguas. No se altera la normalización numérica segura de ReportService.

La suite HTTP f4 valida respuestas contra OpenAPI mediante test/assert-openapi.cjs, además de verificar permisos, versiones, idempotencia y resultados SQL. Los endpoints alternativos sin UI no se llaman artificialmente para aumentar una cifra de cobertura. Los nombres de suites en el inventario indican cobertura de la familia, no certificación individual de cada alias.

## Persistencia verificada localmente

Docker Desktop no tenía motor disponible. Se usó PostgreSQL 17 instalado y el script existente backend/scripts/test-postgres.ps1: cluster propio en .tmp/pg-f0, escucha exclusiva en 127.0.0.1:15432. No se utilizó una base de desarrollo ni Supabase.

Cada suite crea quickly_test_<hex> con nombre aleatorio, aplica esquema/verificación y migraciones dos veces, y elimina únicamente esa base y su directorio temporal de medios al finalizar, incluso si falla. Las cuentas, tiendas y productos sintéticos solo existen en esas bases.

La primera ejecución real detectó que DatabaseService podía elegir SSL a partir de DATABASE_HOST aunque DATABASE_URL apuntase a loopback. Ahora deriva el host de la URL seleccionada y respeta DATABASE_SSL=false; el runner fija explícitamente host local y SSL desactivado. Cuatro pruebas unitarias comprueban esa precedencia.

Otra aserción antigua agrupaba como duplicados los avisos sin source_event_id. Se acotó a eventos identificados, igual que el índice único real. Se conservan las comprobaciones de reintento, concurrencia, lectura propia y rollback del outbox.

## Evidencia de verificación

| Verificación | Resultado |
|---|---|
| Frontend TypeScript/Vite | Compilación satisfactoria; guardia de módulos activa |
| Frontend Vitest | 200 pruebas; transporte, sesión, roles, migración, búsqueda y vistas API |
| Backend Nest/Jest | Compilación satisfactoria; 28 pruebas en 8 suites |
| SQL/HTTP f0 | 23 pruebas aprobadas |
| SQL/HTTP f2 | 12 pruebas aprobadas |
| SQL/HTTP f3 | 30 pruebas aprobadas |
| SQL/HTTP f4 | 11 pruebas, incluido contrato y dos operadores concurrentes |
| SQL/HTTP f5 | 7 pruebas aprobadas |
| SQL/HTTP f6 | 5 pruebas aprobadas |
| SQL/HTTP f7 | 9 pruebas aprobadas |
| Contratos e inventario | Snapshot, tipos y 130 operaciones sincronizados |
| Navegador con API/SQL reales | Dos recorridos, 1366 y 390 px, sin respuestas mock |

Las pruebas unitarias de UI usan respuestas controladas y no acreditan persistencia. Las 97 comprobaciones SQL/HTTP y el recorrido de navegador sí usan Nest y PostgreSQL reales. [Log SQL/HTTP](../../../.tmp/block8/sql-http.log), [log de navegador](../../../.tmp/block8/browser-real.log), [reporte Vitest](../../../.tmp/block8/frontend-tests.json) y capturas son evidencia local regenerable, fuera de los repositorios.

[original-integral.spec.ts](../../e2e/original-integral.spec.ts) prepara cuentas de prueba mediante HTTP real y ejecuta en las interfaces originales: login, catálogo, carrito, dirección/pago/revisión, creación de compra, preparación comercial, asignación/liberación administrativa, toma del repartidor, recarga, recojo, incidencia, entrega y efectivo, historial, ingresos, reportes/exportación y auditoría. Verifica mediante GET estado delivered, pago succeeded, importe recibido, courierUserId y tarifa acordada. El destino no se expone en solicitudes previas a la asignación.

En móvil route.fetch realiza la creación real y después aborta su respuesta para simular pérdida de conexión. Tras recargar se recupera la misma orden por clave, con un único POST de creación. No se sustituye la API por una respuesta prefabricada.

Las capturas a ambos tamaños comprueban composición y ausencia de desbordamiento horizontal. Se revisaron contra la referencia de [comparación](../comparacion/comparacion.md), que contrapone la pantalla técnica local con la vista original. Se mantienen la cabecera, buscador, chips, pestañas, tarjetas, formularios, badges y diálogos; las imágenes ausentes muestran el placeholder existente. Las capturas no son una comparación automática píxel a píxel.

Los specs antiguos auth/operations/catalog/purchase/engagement/multistore/home usaban selectores anteriores a la recuperación de las vistas originales. Se conservan como referencia histórica, pero el comando integral vigente selecciona original-integral.spec.ts; el runner rechaza esos nombres antiguos. Las suites storefront/checkout/courier/admin de API interceptada conservan sus configuraciones independientes y no se mezclan con las pruebas SQL.

Los tests retirados de autenticación demo, direcciones generadas y stock local ya no comprobaban el comportamiento del producto. Sus reemplazos son authSession/routePermissions/roleSwitcher, addressCheckoutUI/legacyStorage, realShopping/checkoutFlow y las suites SQL f0/f2/f3/f4/f7.

## Reproducción

Desde backend, con PostgreSQL 17 instalado y ambos repositorios con dependencias:

~~~powershell
./scripts/test-postgres.ps1
$env:TEST_DATABASE_URL = 'postgresql://quickly_test@127.0.0.1:15432/postgres'
npm run build
npm test
npm run contracts:export
npm run test:integration:local
npm run test:original:local
./scripts/test-postgres.ps1 -Stop
~~~

Desde Frontend-Quickly:

~~~powershell
npm run contracts:sync
npm run build
npm test
npm run contracts:check
npm run integration:inventory
npm run integration:check
~~~

## Límites de esta entrega

No se ejecutó staging público ni se consultó o modificó Supabase. La suite backend f8 de respaldo/restauración y el ensayo de despliegue necesitan Docker y quedan fuera de esta evidencia local. Google OAuth, envío SMTP real, pagos digitales, GPS, reembolsos, cupones y contenido de Play no quedan certificados. Ninguna de esas capacidades se simula como completada en el producto.

El build mantiene una advertencia de tamaño del chunk principal (~1,12 MB antes de gzip). No impide la compilación, pero sigue siendo una oportunidad de optimización. Los reportes entre roles son lecturas independientes; no se presentan como una instantánea transaccional única.
