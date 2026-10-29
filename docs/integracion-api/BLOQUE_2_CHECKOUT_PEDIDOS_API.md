# Bloque 2: checkout y pedidos sobre las vistas originales

Fecha: 2026-10-29. Continúa [el bloque 1](BLOQUE_1_CATALOGO_API.md) y respeta la [referencia visual del usuario](comparacion/comparacion.md).

## Alcance implementado

Se conserva el router y se adapta la lógica de los componentes originales. No se montan RealCheckoutPage, RealCartPage ni RealOrdersPage. No hay cambios al CSS global, la distribución de las pantallas ni los layouts de catálogo. CustomerLayout espera la restauración de sesión antes de redirigir, conservando su estructura original.

| Vista original | Integración y comportamiento |
|---|---|
| CustomerAddressesPage / AddressForm | Consulta, alta, edición, principal y archivado de direcciones del usuario autenticado. Conserva tarjetas, badges y formularios. Zonas y cobertura desde API. Teléfono normalizado a +51. Un error conserva el formulario o diálogo; no crea una dirección local |
| CheckoutPage: Dirección | Selecciona direcciones reales con zona activa. Cotiza los SKU, cantidades y notas seleccionados; no calcula el importe final con tarifas mock |
| CheckoutPage: Pago | Conserva las tarjetas de efectivo, Yape/Plin y tarjeta. Solo efectivo puede habilitarse cuando la API lo permite. Valida monto y vuelto. En varias tiendas se prepara efectivo exacto por entrega |
| CheckoutPage: Revisión | Precios, nombres, variantes, envío y total de la cotización del backend. Una segunda cotización verifica cambios antes de habilitar confirmación. Si cambian carrito, dirección o importes, exige revisar nuevamente |
| Confirmación y recuperación | Crea pedido individual o grupo con Idempotency-Key y expectedTotalCents. Guarda el intento antes de enviar. Ante respuesta perdida conserva cuerpo, clave y snapshot, consulta el intento y solo lo reenvía con la misma clave si aún no existe |
| CustomerOrdersPage | Historial paginado completo, filtros y tarjetas originales. Agrupa pedidos por checkoutGroupId. No muestra cantidades de productos que el resumen de API no contiene |
| OrderDetailPage / GroupCheckoutPage | Pedido o grupo persistido en el mismo detalle rico original: destino histórico, precios, subpedidos, badges y timeline. Cancelación con expectedVersion; valoración guardada mediante API. Volver a pedir consulta SKU y disponibilidad actuales |
| TrackingPage / OrderTimeline | Conserva mapa esquemático, selector de tienda y progreso. Consulta estados e historial del backend cada 15 segundos. El mapa es referencial; no afirma GPS, posición real ni inventa un tiempo de llegada |

## Mapeo de endpoints activos

Todos se resuelven mediante services/api y la configuración actual de VITE_API_BASE_URL. La identidad de escritura procede de la sesión del backend, nunca de un customerId enviado por el navegador.

| Operación | Endpoint |
|---|---|
| Zonas y cobertura | GET /geography/zones |
| Direcciones | GET y POST /me/addresses; PATCH y DELETE /me/addresses/{id}; PUT /me/addresses/{id}/default |
| Disponibilidad de pago | GET /payment-methods |
| Cotización individual | POST /checkout/quote |
| Cotización de varias tiendas | POST /checkout/groups/quote |
| Compra individual | POST /purchases, con Idempotency-Key |
| Compra multitienda | POST /checkout/groups, con Idempotency-Key |
| Recuperación individual | GET /me/checkout-attempts/{key} |
| Recuperación multitienda | GET /me/group-checkout-attempts/{key} |
| Comprobante de grupo | GET /me/checkout-groups/{id}, más detalle de cada orden |
| Historial y detalle | GET /me/orders; GET /orders/{id} |
| Cancelación | POST /orders/{id}/cancellations |
| Valoración de entrega | POST /orders/{id}/reviews |
| Repetir compra | GET /catalog/search?storeId=..., paginado, para resolver los SKU actuales |

## Reglas de consistencia

- El carrito persiste intención: producto, tienda, SKU, cantidad, nota, selección y revisión. No persiste precios como autoridad.
- La cotización se valida contra las líneas solicitadas y sus sumas. Las decisiones finales de stock, cobertura, mínimos, precio y permisos pertenecen al backend.
- Confirmar envía dirección, cash, SKU/cantidad/nota, efectivo y total aceptado; no un objeto Purchase local ni nombres, precios o estados inventados.
- Se bloquea el doble envío con una referencia síncrona. Un error de conexión, respuesta inválida o conflicto de idempotencia conserva el intento. Un rechazo comercial explícito exige cotizar y revisar otra vez.
- No se envía ninguna compra si no puede guardarse antes su intento en sessionStorage. Un intento dañado impide crear uno nuevo y ofrece consultar pedidos.
- Solo después de recibir una orden o grupo válido se consumen las líneas del snapshot que siguen sin cambios. Productos nuevos, modificados o no seleccionados permanecen en el carrito.
- Una respuesta perteneciente a una cuenta anterior no consume el carrito ni navega al comprobante de otra cuenta.
- No se fabrican imágenes históricas, contacto de repartidor, dirección comercial, reembolsos ni eventos. Los campos no expuestos por el contrato no se suplen con semillas.
- No se usa useDataStore, useCartStore ni setTimeout para registrar compras, direcciones, cancelaciones o valoraciones en este recorrido.

## Verificación reproducible

- npm test: 25 archivos y 136 pruebas aprobadas, incluidos checkout original, direcciones y pedidos.
- npm run build: TypeScript y producción Vite aprobados. Vite mantiene el aviso de tamaño del bundle; no bloquea la compilación.
- npm run contracts:check: aprobado; contrato y tipos sincronizados con el backend local.
- npm run test:checkout: cuatro recorridos de navegador con API interceptada: escritorio 1366 px, móvil 390 px, respuesta perdida tras recarga y confirmación multitienda.
- Las pruebas usan fixtures solo bajo src/test y e2e. No son un fallback del código de producción ni escriben en Supabase.
- Capturas reproducibles bajo test-results: checkout-direccion-*, checkout-pago-*, checkout-revision-*, checkout-pedido-* y checkout-seguimiento-*. Se inspeccionaron visualmente el detalle móvil y la revisión de escritorio.
- Se verificó ausencia de desbordamiento horizontal del checkout y del detalle en los anchos probados.

## Límites y trabajo posterior

La integración frontend del bloque 2 está implementada sobre los endpoints existentes; no requiere migraciones ni cambios a la base de datos en esta entrega.

No se ejecutó el recorrido SQL/HTTP contra la DB: Docker Desktop no tiene disponible el motor local (dockerDesktopLinuxEngine). No se utilizó la base operativa como alternativa. La compra completa contra NestJS y una base de pruebas, incluida su persistencia efectiva, queda pendiente de esa verificación.

Los pagos digitales continúan deshabilitados según el backend actual. La ubicación GPS y los datos personales del repartidor no están en el contrato consumido. Los paneles heredados de comercio, repartidor, administración y otras secciones de cliente conservan sus pendientes del mapeo; este bloque no declara eliminados todos los mocks de la aplicación.
