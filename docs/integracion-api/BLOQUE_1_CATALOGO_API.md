# Bloque 1: catálogo conectado sobre las vistas originales

Fecha: 2026-10-28. Referencia visual: [comparación aportada por el usuario](comparacion/comparacion.md).

## Alcance implementado

Se conservan el router, layouts, CSS general y los componentes originales. No se montan RealCatalogPages, CatalogBrowser ni otras vistas alternativas.

| Pantalla/componente original | Fuente y comportamiento actual |
|---|---|
| HomePage, OfficialStoresSection, BigStoreProductsSection | API de catálogo/tiendas/zonas. Sin fallback a INITIAL_*. Vacío, error y reintento independientes de la identidad local |
| MerchantsPage | API pública, todas sus páginas para conservar contadores/filtros/ordenación de las pestañas originales. Mantiene buscador, chips horizontales, Productos/Comercios y tarjetas |
| MerchantDetailPage | Tienda, horarios, dirección, preparación, mínimo y tarifa base devueltos por backend. Catálogo por storeId y categorías reales |
| ProductDetailPage | GET producto y tienda por sus IDs. Galería original; selección de SKU actualiza precio absoluto y stock. No sustituye un 404 por otro producto |
| ProductCard / MerchantCard | Mismos controles y tarjetas. Favoritos por API; éxito sólo tras confirmación; error no cambia el corazón. Cache privada invalidada al cambiar usuario |
| ProductDetailModal | Recarga el detalle real antes de comprar; SKU y stock válidos; notas conservadas |
| CartPage / realCartStore | Un único carrito de intenciones para este recorrido. Rechaza IDs inválidos, SKU ausente/inactivo, tienda incorrecta y cantidades superiores al stock; errores de red bloquean continuación y permiten reintentar |

La relación productId/storeId/skuId se conserva sin UUID fijos ni equivalencias con m_* o p_*. El carrito no persiste precios ni stock como autoridad. Comprar ahora agrega la presentación seleccionada y lleva al carrito para revisión.

## Datos que ya no se inventan

- No se generan ventas, descuentos, precio anterior, cuotas, cupón de primera compra ni promesas de envío gratis.
- La ordenación por ventas/calificación de producto no está soportada por el contrato actual: el selector mantiene su lugar y ofrece el orden del catálogo y precios reales. Los promedios comerciales sí se leen del servidor.
- Las opiniones disponibles en backend pertenecen al comercio: se identifican así y se consultan por API. Distribución y resumen se derivan de esos registros; no hay reseñas/fotos/contadores generados ni se afirma usar IA.
- Los medios de pago se alinean con el contrato de compra actual: efectivo. La pasarela digital sigue fuera de este bloque.
- Sin imagen se muestra un placeholder neutral, nunca una fotografía ajena.
- La sincronización automática de dataStore que mezclaba respuestas reales con semillas se retiró. Otros módulos heredados siguen pendientes según el mapeo; esto no declara libre de mocks toda la aplicación.

## Conexión y backend

JSON, llamadas de compatibilidad e imágenes usan la misma resolución de VITE_API_BASE_URL / URL de backend. CSRF comparte memoria y la validación de sesión conserva el Bearer opcional del contrato. Las lecturas públicas del catálogo sobreviven a restauración/cierre de sesión; las solicitudes privadas siguen descartando respuestas de sesiones anteriores.

GET /stores y GET /stores/{id} ahora documentan y devuelven descripción, preparación, mínimo, tarifa base y valoraciones persistidas. La tarifa base es orientativa; el importe final depende del destino y la cotización. Se agregaron DTO públicos y normalización numérica; no hay migraciones ni cambios al esquema o a registros de Supabase.

## Verificación

- Build y contracts:check del frontend; build y contratos exportados del backend.
- Pruebas de componentes: filtros/pestañas originales, catálogo con varias páginas, vacío/error/reintento, 404, variantes/precios/stock, favoritos y carrito.
- Regresión del ciclo de sesión: restaurar identidad no cancela la consulta pública del catálogo.
- Pruebas de navegador sin DB: npm run test:storefront. Interceptan todas las solicitudes API con fixtures exclusivamente de prueba. Recorren listado → detalle → SKU → carrito, error/vacío/404 y ancho móvil/escritorio.
- Capturas reproducibles: test-results/storefront-list-1366.png, storefront-list-390.png, storefront-product-1366.png y storefront-cart-390.png.
- Prueba de integración SQL/HTTP preparada en backend/test/f3.e2e.cjs. Su ejecución quedó pendiente porque Docker Desktop no estaba activo; no se usó la base operativa como alternativa. Comando: node scripts/harness-docker.cjs --suite=f3 con configuración de pruebas locales.

## Límite y siguiente bloque

Este bloque termina en el carrito. CheckoutPage, direcciones de cliente, pedidos y paneles de operación heredados siguen en su fase de migración: deben conectarse dentro de sus vistas originales. No se ha validado aún una compra completa ni el recorrido entre roles sobre la DB operativa. La siguiente entrega debe adaptar el checkout original a cotizaciones, direcciones reales, idempotencia y confirmación backend, sin sustituir su interfaz.

Actualización 2026-10-29: la adaptación del checkout, direcciones y pedidos continúa en [Bloque 2](BLOQUE_2_CHECKOUT_PEDIDOS_API.md). Los límites anteriores describen el cierre del bloque 1.
