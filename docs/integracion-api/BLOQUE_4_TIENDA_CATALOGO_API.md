# Bloque 4: gestión de tienda, productos e inventario

Fecha: 2026-10-29. Implementación dentro de las vistas originales de comercio. Se mantienen el router, layout, Tailwind, tarjetas, badges, formularios, microinteracciones y diálogos.

## Implementado

- **Gestión y autorización de tiendas (`MerchantStorePage`)**:
  - Consulta de tiendas autorizadas (`operationsApi.ownStores`) y detalle (`operationsApi.store`).
  - Eliminada la tienda por defecto mock (`merchants[0]`) y el uso de `useDataStore`.
  - Respeto de roles y membresías reales (`owner`, `manager`, `operator`). Los operadores tienen vista de solo lectura y nota explicativa; solo encargados y propietarios pueden editar el perfil comercial.
  - Edición del perfil comercial: nombre, categoría oficial, descripción, dirección física, teléfono E.164, tiempo de preparación y pedido mínimo con persistencia en `PATCH /merchant/stores/{id}`.
  - Control de recepción de pedidos activa/pausada con llamada directa a `operationsApi.updateStore({ acceptingOrders })`.
  - Foto de portada y logo: menús contextuales de 3 puntos (⋮) para visor ampliado (Lightbox), subida directa desde dispositivo mediante `prepareImage` y `PUT /merchant/stores/{id}/branding/{kind}`, presets/URL externos y restablecimiento/eliminación mediante `DELETE /merchant/stores/{id}/branding/{kind}`.
  - Formulario protegido: en caso de error de red o validación del servidor, los datos ingresados no se pierden y se despliega la alerta de error.

- **Catálogo, SKU e inventario (`MerchantProductsPage`)**:
  - Consulta de catálogo privado (`GET /merchant/stores/{id}/products`) e inventario real (`GET /merchant/stores/{id}/inventory`).
  - Clasificación de pestañas (Todos, Disponibles, Desactivados, Sin Stock, Poco Stock) basada en el estado `isActive` y el stock real consolidado de inventario.
  - Filtro por categorías reales cargadas desde `GET /catalog/categories`.
  - Conmutador simétrico de disponibilidad (Activo / Pausado) conectado a `PATCH /merchant/products/{id}` con `{ isActive }`.
  - Creación de producto con SKU y existencia inicial mediante `POST /merchant/stores/{id}/products` (`PublishProductDto`).
  - Edición completa de producto, metadatos, categoría y precio de SKU mediante `PATCH /merchant/products/{id}` y `PATCH /merchant/skus/{id}`.
  - Despublicación / eliminación mediante `DELETE /merchant/products/{id}` (`catalogApi.deleteProduct`), conservando inmutabilidad histórica.
  - Ajustes justificados de inventario físico mediante `POST /merchant/skus/{id}/stock-adjustments` con motivo registrado.
  - Consulta del historial de movimientos (Kardex) por SKU mediante `GET /merchant/skus/{id}/movements`.
  - Soporte de variantes y presentaciones múltiples (`POST /merchant/products/{id}/skus`).
  - Subida de hasta 4 fotos y perfiles de producto mediante `POST /merchant/products/{id}/images` y eliminación con `DELETE /merchant/products/{id}/images/{imageId}`.

- **Configuración del local, horarios y miembros (`MerchantSettingsPage`)**:
  - Horario semanal de atención: configuración completa de turnos diarios (Lunes a Domingo) con horas de apertura y cierre persistidas en el backend mediante `PUT /merchant/stores/{id}/hours`.
  - Equipo e integrantes de la tienda: consulta de miembros (`GET /merchant/stores/{id}/members`), asignación de roles de operador o encargado (`PUT /merchant/stores/{id}/members`) y revocación de acceso (`DELETE /merchant/stores/{id}/members/{userId}`).
  - Tiempos de preparación de cocina y teléfono comercial sincronizados con `PATCH /merchant/stores/{id}`.
  - Canales de cobro honestos: efectivo contra entrega como medio activo de la plataforma; Yape/Plin y tarjeta con indicación explícita sobre coordinación directa en entrega y dependencias de integración digital.
  - Preferencias operativas locales (timbre de campana, tolerancia por lluvias tropicales) persistidas en el navegador sin simular contratos inexistentes.

## Fuentes API

- Tiendas y equipo: `/merchant/stores`, `/merchant/stores/{id}`, `/merchant/stores/{id}/hours`, `/merchant/stores/{id}/members`, `/merchant/categories` y `/geography/zones`.
- Branding de tienda: `/merchant/stores/{id}/branding` y `/merchant/stores/{id}/branding/{kind}` (`GET`, `PUT`, `DELETE`).
- Catálogo y productos: `/merchant/stores/{id}/products`, `/merchant/products/{id}`, `/products/{id}` y `/catalog/categories`.
- SKU e inventario: `/merchant/products/{id}/skus`, `/merchant/skus/{id}`, `/merchant/stores/{id}/inventory`, `/merchant/skus/{id}/stock-adjustments` y `/merchant/skus/{id}/movements`.
- Medios e imágenes de productos: `/merchant/products/{id}/images` y `/merchant/products/{id}/images/{imageId}`.

## Verificación realizada

- **Compilación completa**:
  - `Frontend-Quickly`: `tsc -b` y `vite build` completados con éxito (código de salida 0).
  - `backend`: `nest build` completado con éxito (código de salida 0).
- **Pruebas automáticas**:
  - Creada suite `src/test/merchantCatalogUI.test.tsx` con 11 pruebas integrales cubriendo:
    1. Carga de tiendas autorizadas, perfil comercial y horarios reales.
    2. Guardado comercial en servidor y confirmación mediante alerta.
    3. Retención de formulario y despliegue de error ante fallos de API.
    4. Conmutación de recepción de pedidos activa/pausada.
    5. Carga de catálogo privado y existencias reales de inventario.
    6. Pausa y activación de productos con confirmación de API.
    7. Ajustes justificados de inventario físico con motivo.
    8. Creación de nuevos productos con SKU y stock inicial.
    9. Eliminación de productos mediante DELETE confirmada en servidor.
    10. Conexión y guardado de horarios semanales de atención.
    11. Asignación y administración de integrantes de la tienda.
  - 11 de 11 pruebas aprobadas.
- **Auditoría de dependencias mock**:
  - `MerchantStorePage.tsx`, `MerchantProductsPage.tsx` y `MerchantSettingsPage.tsx` ya no importan `useDataStore`.
  - Sin uso de identificadores mock `m_*` o `p_*`.

## Siguiente bloque

Continuar con el **Bloque 5: pedidos y reportes del comercio**, abarcando:
- `MerchantDashboardPage`
- `MerchantOrdersPage`
- `MerchantReportsPage`
Conectando el order-feed (`/merchant/stores/{id}/order-feed`), transiciones de comanda (aceptar, preparar, marcar listo, rechazar con motivo), asignación de repartidores y reportes por rango de fechas sin series ficticias.

