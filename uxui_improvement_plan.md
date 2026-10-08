# Plan de Mejoras UI/UX — Quickly Delivery
### Plataforma de delivery centralizada · Tingo María, Leoncio Prado, Perú

> Este plan está organizado por bloques funcionales y priorizado por impacto en la experiencia del usuario. Cada bloque incluye hallazgos actuales, mejoras propuestas y criterios de éxito.

---

## Índice de Bloques

| # | Bloque | Páginas / Archivos involucrados | Prioridad |
|---|--------|-------------------------------|-----------|
| A | Autenticación & Onboarding | `LoginPage.tsx`, `AuthLayout.tsx` | 🔴 Alta |
| B | Catálogo & Descubrimiento | `HomePage.tsx`, `MerchantsPage.tsx`, `MerchantDetailPage.tsx`, `ProductDetailPage.tsx`, `ProductDetailModal.tsx` | 🔴 Alta |
| C | Carrito & Checkout | `CartPage.tsx`, `CheckoutPage.tsx` | 🔴 Alta |
| D | Pedidos & Seguimiento | `CustomerOrdersPage.tsx`, `OrderDetailPage.tsx`, `TrackingPage.tsx` | 🟠 Media |
| E | Portal del Cliente | `CustomerProfilePage.tsx`, `CustomerAddressesPage.tsx`, `CustomerFavoritesPage.tsx`, `CustomerNotificationsPage.tsx`, `CustomerHelpPage.tsx` | ✅ Completado |
| F | Portal del Comercio | `MerchantDashboardPage.tsx`, `MerchantOrdersPage.tsx`, `MerchantProductsPage.tsx`, `MerchantReportsPage.tsx`, `MerchantSettingsPage.tsx`, `MerchantStorePage.tsx` | ✅ Completado |
| G | Portal del Repartidor | `CourierRequestsPage.tsx`, `CourierActiveDeliveryPage.tsx`, `CourierHistoryPage.tsx`, `CourierEarningsPage.tsx` | ✅ Completado |
| H | Panel Admin | `AdminOverviewPage.tsx`, `AdminMerchantsPage.tsx`, `AdminUsersPage.tsx`, `AdminOrdersPage.tsx`, `AdminTicketsPage.tsx`, `AdminReportsPage.tsx`, `AdminAuditPage.tsx` | 🟠 Media |
| I | Componentes Compartidos | `Navbar.tsx`, `MobileNav.tsx`, `ProductCard.tsx`, `MerchantCard.tsx`, `OrderTimeline.tsx`, `PriceSummary.tsx` | 🔴 Alta |

---

## BLOQUE A — Autenticación & Onboarding
**Archivos:** [`LoginPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/auth/LoginPage.tsx) · [`AuthLayout.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/layouts/AuthLayout.tsx)

### Estado actual
- El login ya fue rediseñado con grilla 2×2 de roles y UI amigable. ✅
- Faltan: pantalla de recuperación de contraseña, estado de cuenta suspendida con mensaje contextual, y una pantalla de bienvenida post-registro.

### Mejoras propuestas

#### A-1 · Pantalla de contraseña olvidada
- Flujo de 2 pasos: ingreso de email → confirmación enviada (solo visual, no real en prototipo).
- Botón de retorno al login con `ChevronLeft` y animación de slide.
- Estimación de tiempo: "Recibirás el enlace en menos de 2 minutos".

#### A-2 · Estado de cuenta suspendida o pendiente de aprobación
- En vez de un mensaje genérico de error, mostrar un modal diferenciado con:
  - **Pendiente de aprobación:** Icono `Clock` en ámbar, "Tu cuenta está en revisión. Te notificaremos por WhatsApp a tu número registrado."
  - **Suspendida:** Icono `ShieldX` en rojo, "Tu cuenta ha sido suspendida. Contacta a soporte: 062-XXX-XXX".
- Ambos estados con botón de contacto directo.

#### A-3 · Pantalla de bienvenida post-primer login
- Solo para rol `cliente` en primer acceso.
- Pantalla de 3 slides rápidos (skip disponible): "Pide comida amazónica → Llega en 20-35 min → Paga con Yape, Plin o efectivo".
- Guardado del flag en `localStorage` para no repetirlo.

#### A-4 · Feedback visual en el selector de rol
- Al hacer hover/focus en la tarjeta de rol, mostrar qué datos de acceso se usan (email de demo en texto gris).
- Agregar transición de escala `scale-[1.02]` suave al seleccionar rol.

---

## BLOQUE B — Catálogo & Descubrimiento
**Archivos:** [`HomePage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/catalog/HomePage.tsx) · [`MerchantsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/catalog/MerchantsPage.tsx) · [`MerchantDetailPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/catalog/MerchantDetailPage.tsx) · [`ProductDetailPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/catalog/ProductDetailPage.tsx)

### Estado actual
- HomePage tiene tarjetas destacadas con productos fuera de contexto (zapatillas Vans) — **violación directa** de la regla #1 de la skill `quickly-ui`.
- ProductDetailPage es muy larga (802 líneas), mezcla demasiada lógica de presentación.
- No hay skeleton loaders ni estados vacíos visualizados.
- El selector de zona no es prominente en la pantalla de inicio.

### Mejoras propuestas

#### B-1 · Hero del home orientado a Tingo María 🔴
- Reemplazar tarjetas de zapatillas por: platos típicos (tacacho con cecina, juanes, inchicapí) y productos locales (cacao, café de Leoncio Prado).
- Banner hero con imagen de fondo de la selva alta y texto: "Delivery en Tingo María • Llega en 20-35 min".
- Indicador de zona activa (ej. "Entregando en: Centro") clickeable para cambiar zona → bottom sheet.

#### B-2 · Barra de búsqueda prominente
- Mover el buscador al top del home, con placeholder contextual que rote: "Busca tacacho con cecina...", "Busca medicamentos...", "Busca productos del mercado...".
- Resultados con categoría visual (icono de tienda o producto).

#### B-3 · Skeleton loaders en tarjetas de comercios y productos
- `MerchantCard` y `ProductCard` deben mostrar un estado shimmer mientras cargan (fondo gris animado).
- Usar `animate-pulse` de Tailwind, con la misma estructura de la tarjeta.

#### B-4 · Indicador de estado de comercio más visible en `MerchantCard`
- El badge "Cerrado en este momento" debe ser más claro: overlay con 50% de opacidad + horario de reapertura si está disponible ("Abre a las 7:00 am").
- Badge "Abierto ahora" en verde esmeralda (`bg-emerald-500`) flotante en la esquina superior izquierda de la portada.

#### B-5 · Página de detalle de producto más eficiente (`ProductDetailPage`)
- Dividir en secciones colapsables: Descripción, Ingredientes / Información nutricional, Reseñas.
- Sticky bar inferior con botón de agregar al carrito siempre visible al hacer scroll (similar a apps de e-commerce modernas).
- Galería de imágenes con swipe nativo en móvil (touch events).

#### B-6 · Filtros rápidos en página de comercios
- Chips horizontales con scroll: "Todos", "Abiertos ahora", "Más rápidos", "Mejor valorados", "Más cercanos".
- Filtro de categoría con botón de reset visible.

#### B-7 · Modo "sin zona seleccionada"
- Si el usuario no ha seleccionado zona, mostrar un bottom sheet obligatorio (no bloqueante): "¿En qué parte de Tingo María estás?" con las 5 zonas disponibles.
- Guardar en `localStorage`.

---

## BLOQUE C — Carrito & Checkout
**Archivos:** [`CartPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/cart/CartPage.tsx) · [`CheckoutPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/checkout/CheckoutPage.tsx)

### Estado actual
- El carrito muestra items pero no diferencia visualmente entre comercios del mismo pedido.
- El checkout de 3 pasos no tiene barra de progreso visual clara.
- El resumen de precios no destaca el ahorro si hay descuentos.
- El método de pago "Yape/Plin" no tiene un QR de ejemplo ni instrucción visual.

### Mejoras propuestas

#### C-1 · Agrupación visual por comercio en el carrito
- Separar los items del carrito con un encabezado de comercio (`Store` icon + nombre + tiempo estimado de preparación).
- Mostrar subtotal por comercio y el costo de envío correspondiente a esa sección.

#### C-2 · Barra de progreso del checkout
- En el tope del `CheckoutPage`, mostrar un stepper visual de 3 pasos: `Dirección → Pago → Revisión`.
- El paso activo con círculo relleno `primary`; los completados con check verde; los pendientes en gris.
- Animar la transición entre pasos con `transition-all duration-300`.

#### C-3 · Resumen de precio mejorado en el carrito
- Si hay descuentos aplicados, mostrar una línea en verde: "Ahorras S/ X.XX" con ícono `Tag`.
- Si el costo de envío es gratis por superar un umbral, destacarlo: "¡Envío gratis!" en emerald.

#### C-4 · Instrucciones visuales para pago Yape/Plin
- Al seleccionar "Yape / Plin", mostrar un QR de demo con número de celular del comercio (placeholder).
- Instrucción en 2 pasos: "1. Abre tu app → 2. Escanea o ingresa el número 962 XXX XXX".
- Botón de "Ya pagué" que avanza al siguiente paso.

#### C-5 · Estado del carrito "vacío" más atractivo
- Ilustración SVG simple de un carrito con una hoja de selva (on-brand con Tingo María).
- CTA claro: "Explorar comercios locales →".

#### C-6 · Validación de dirección en tiempo real
- En el paso 1 del checkout, si no hay direcciones guardadas, abrir directamente el formulario de nueva dirección (no un selector vacío con botón adicional).
- Confirmar zona de entrega automáticamente: "Entregaremos en Centro de Tingo María • S/ 4.00 • ~20 min".

---

## BLOQUE D — Pedidos & Seguimiento
**Archivos:** [`CustomerOrdersPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/orders/CustomerOrdersPage.tsx) · [`OrderDetailPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/orders/OrderDetailPage.tsx) · [`TrackingPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/orders/TrackingPage.tsx)

### Estado actual
- `OrderTimeline` existe pero no muestra tiempo estimado de llegada de forma prominente.
- La lista de pedidos no tiene filtros ni paginación visible.
- No hay acción de "repetir pedido" visible de forma directa.

### Mejoras propuestas

#### D-1 · ETA prominente en el seguimiento
- En la parte superior de `OrderDetailPage` y `TrackingPage`, mostrar un contador con tiempo estimado de llegada: "Llega en aprox. **18 min**" con ícono `Clock` en ámbar y fondo cálido.
- Actualización visual cada 30s (simulado en prototipo).

#### D-2 · Mapa esquemático mejorado (`SchematicMap`)
- Añadir leyenda visual: punto "Comercio" (ícono `Store` en ámbar) y punto "Tu dirección" (ícono `Home` en primary).
- Línea de ruta animada con `stroke-dashoffset` CSS entre los dos puntos.

#### D-3 · Acción "Repetir pedido" en historial
- En la lista de pedidos entregados, botón secundario "Volver a pedir" que pre-carga los mismos items al carrito.
- Confirmación con toast: "3 productos añadidos al carrito de La Selva Gourmet".

#### D-4 · Filtros en historial de pedidos
- Chips de filtro: "Todos", "En curso", "Entregados", "Cancelados".
- Ordenamiento: "Más recientes primero" (default) / "Más antiguos".

#### D-5 · Sistema de reseñas mejorado
- Al finalizar un pedido, mostrar un prompt no intrusivo: "¿Cómo estuvo tu pedido de [Comercio]?" con estrellas rápidas.
- Captura de reseña en modal con campo de texto opcional y 3 emojis rápidos (sin emojis como iconos de UI — esto es feedback de reseña).

---

## BLOQUE E — Portal del Cliente
**Archivos:** [`CustomerProfilePage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/customer/CustomerProfilePage.tsx) · [`CustomerAddressesPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/customer/CustomerAddressesPage.tsx) · [`CustomerFavoritesPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/customer/CustomerFavoritesPage.tsx) · [`CustomerNotificationsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/customer/CustomerNotificationsPage.tsx) · [`CustomerHelpPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/customer/CustomerHelpPage.tsx)

### Estado: ✅ Completado

- **E-1 · Pantalla de perfil enriquecida:** Avatar circular con iniciales degradadas y fallback de iniciales, tira de métricas en tiempo real (pedidos completados, total en soles con `formatCents`, comercios tingaleses probados y zona activa), accesos rápidos hacia Pedidos, Direcciones, Favoritos, Notificaciones y Ayuda, y formulario de datos personales con zona habitual.
- **E-2 · Favoritos con acción directa:** Cada plato/producto cuenta con botón directo "+ Agregar al pedido" con feedback de 1.5s ("¡Agregado!"), pestañas divididas entre "Platos y Productos" y "Comercios", buscador integrado dentro de favoritos y estados vacíos cálidos ambientados en la gastronomía de Tingo María.
- **E-3 · Notificaciones con estados visuales claros:** Notificaciones no leídas con fondo `primary-50` y punto pulsante `primary` a la izquierda, badges por tipo (`Package` para pedidos, `Bike` para entregas, `Tag` para promociones, `ShieldCheck` para sistema), filtros por todas/no leídas y acción de "Marcar todas como leídas".
- **E-4 · Centro de ayuda mejorado:** Banner de tiempo de respuesta &lt; 2h en horario de 8:00 AM a 10:00 PM, botón directo a WhatsApp y central telefónica de Tingo María, preguntas frecuentes con buscador y acordeón interactivo, formulario de ticket de soporte con selección de pedido reciente e historial de tickets previos con respuestas de administración.
- **E-5 · Gestión de direcciones intuitiva:** Dirección predeterminada destacada con badge esmeralda "Principal", botón directo de un solo tap "Usar como principal", modal de confirmación con nombre de la dirección al eliminar y tarifas/tiempos estimados por cada zona de Tingo María.

---

## BLOQUE F — Portal del Comercio
**Archivos:** [`MerchantDashboardPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/merchant/MerchantDashboardPage.tsx) · [`MerchantOrdersPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/merchant/MerchantOrdersPage.tsx) · [`MerchantProductsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/merchant/MerchantProductsPage.tsx) · [`MerchantReportsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/merchant/MerchantReportsPage.tsx) · [`MerchantSettingsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/merchant/MerchantSettingsPage.tsx)

### Estado: ✅ Completado

- **F-1 · Toggle "Abierto / Cerrado" en cabecera:** Switch prominente con badge en vivo ("Abierto ahora" / "Pausado / Cerrado"), horario de atención del día y modal interactivo para pausar recepción (30 min por cocina llena, 1 hora o hasta mañana).
- **F-2 · Pedidos entrantes en tiempo real:** Eliminación de datos simulados fijos; conexión a subpedidos reales de la tienda, timer regresivo dinámico en ámbar ("Confirmar en: 3:45"), botones rápidos para "Aceptar y Preparar" y "Rechazar", y stepper en vivo con horas de la orden activa.
- **F-3 · Gráfico de ventas semanal:** Gráfico de barras SVG nativo para los 7 días de la semana con selección interactiva, KPIs de ticket promedio con `formatCents`, hora pico tingalesa (12:30 - 2:00 PM), ranking de productos con barras relativas y exportación CSV con nombres de platos y comensales.
- **F-4 · Gestión de menú y stock mejorada:** Botón de switch de disponibilidad inline de 1 solo toque ("Disponible" / "Agotado"), badges de alerta para productos próximos a agotarse ("¡Últimas X unidades!"), y formulario con previsualización en tiempo real idéntica al `ProductCard` del cliente.
- **F-5 · Configuración de tiempos de preparación:** Tiempos diferenciados por categoría (platos de fondo 25 min, entradas 15 min, bebidas 8 min, repostería 10 min), tolerancia climática por lluvia en Tingo María (+10 min), medios de cobro habilitados y timbres de cocina.

---

## BLOQUE G — Portal del Repartidor
**Archivos:** [`CourierRequestsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/courier/CourierRequestsPage.tsx) · [`CourierActiveDeliveryPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/courier/CourierActiveDeliveryPage.tsx) · [`CourierHistoryPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/courier/CourierHistoryPage.tsx) · [`CourierEarningsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/courier/CourierEarningsPage.tsx) · [`CourierLayout.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/layouts/CourierLayout.tsx)

### Estado: ✅ Completado

- **G-1 · Toggle de disponibilidad y zona:** Switch grande en el layout y en solicitudes con indicador verde pulsante ("En línea" / "En pausa") y visualización clara de la zona asignada actual en Tingo María.
- **G-2 · Pantalla de pedido activo ergonómica para moto:** Botones de acción táctiles de gran tamaño (`h-14` / 56px de altura mínima) para presionar en movimiento o con guantes ("Recogí el Pedido en Tienda", "Confirmar Entrega al Cliente", "Reportar Incidente"), dirección de entrega en tipografía grande (`text-xl sm:text-2xl font-black`), referencia local resaltada en ámbar y botón de llamada telefónica directa de un solo toque (`tel:+51...`).
- **G-3 · Solicitudes de carrera rápidas:** Tarjetas con ganancia neta destacada en verde (`+ S/ X.XX`), puntos de retiro (comercio) y destino (cliente con zona), distancia y tiempo estimado en moto (`~2.1 km • ~12 min`), y botones táctiles rápidos de aceptar/descartar (`min-h-[48px]`).
- **G-4 · Dashboard de ganancias mejorado:** 3 métricas clave ("Hoy", "Esta Semana", "Mejor Día"), gráfico interactivo de barras SVG nativo para los 7 días de la semana y registro detallado por cada viaje con tarifa liquidada.
- **G-5 · Historial con mapa de rutas:** Cada entrega completada incluye un acordeón para visualizar el mapa esquemático interactivo (`SchematicMap`) con el trayecto recorrido en Tingo María.

---

## BLOQUE H — Panel Admin
**Archivos:** [`AdminOverviewPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/admin/AdminOverviewPage.tsx) · [`AdminUsersPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/admin/AdminUsersPage.tsx) · [`AdminMerchantsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/admin/AdminMerchantsPage.tsx) · [`AdminReportsPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/admin/AdminReportsPage.tsx) · [`AdminAuditPage.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/features/admin/AdminAuditPage.tsx)

### Estado actual
- `AdminAuditPage` es funcional pero minimalista (solo lista de texto).
- `AdminReportsPage` tiene exportación CSV pero no visualización de datos.
- La aprobación de usuarios/comercios en `AdminUsersPage` y `AdminMerchantsPage` requiere varios pasos.

### Mejoras propuestas

#### H-1 · Aprobación rápida desde la Overview
- En `AdminOverviewPage`, la tarjeta "X usuarios pendientes de aprobación" debe tener un botón directo "Revisar ahora →" que lleva al listado filtrado.
- Preview inline del usuario pendiente (nombre, rol, fecha de solicitud) sin necesidad de abrir detalle.

#### H-2 · Visualización de datos en `AdminReportsPage`
- Gráfico de dona SVG para distribución de métodos de pago (Yape, Efectivo, Tarjeta).
- Gráfico de línea para volumen de pedidos de los últimos 7 días.
- Top 3 comercios por GMV con barra de progreso relativa.

#### H-3 · Audit log mejorado con filtros
- En `AdminAuditPage`, agregar filtros por: rol del actor, tipo de acción, rango de fechas.
- Color coding por rol: `primary` para Admin, `emerald` para Comercio, `sky` para Repartidor, gris para Cliente.
- Acción de "Ver contexto completo" en modal para logs con detalles extensos.

#### H-4 · Tabla de usuarios con acciones inline
- En `AdminUsersPage`, las acciones de aprobación/suspensión deben ejecutarse desde la tabla sin salir de la pantalla.
- Confirmación con modal contextual: "¿Aprobar cuenta de María López como Cliente?".

#### H-5 · Indicadores de salud de la plataforma
- En `AdminOverviewPage`, agregar sección "Alertas activas": pedidos en preparación > 30 min, comercios sin confirmar pedidos, repartidores sin ubicación reportada.

---

## BLOQUE I — Componentes Compartidos
**Archivos:** [`Navbar.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/components/shared/Navbar.tsx) · [`MobileNav.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/components/shared/MobileNav.tsx) · [`ProductCard.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/components/shared/ProductCard.tsx) · [`MerchantCard.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/components/shared/MerchantCard.tsx) · [`OrderTimeline.tsx`](file:///c:/Users/ThikPad/Desktop/qiycl/Frontend-Quickly/src/components/shared/OrderTimeline.tsx)

### Estado actual
- `Navbar.tsx` tiene 26 KB — muy grande, mezcla lógica de zonas, búsqueda, auth y carrito.
- `MobileNav.tsx` está bien pero sin animación de selección de ítem activo.
- `ProductCard.tsx` cumple los requisitos pero le falta el fallback SVG elegante en error de imagen.

### Mejoras propuestas

#### I-1 · Refactorización del `Navbar` (performance & mantenibilidad)
- Extraer `ZoneSelector` a su propio componente.
- Extraer `SearchBar` a su propio componente con debounce de 300ms.
- El `Navbar` resultante debe quedar ≤ 8 KB.

#### I-2 · Animación de ítem activo en `MobileNav`
- Al seleccionar una pestaña, el ícono sube levemente con `translateY(-2px)` y el label hace fade-in.
- Tab activo con subrayado `primary` de 2px.

#### I-3 · Fallback elegante en imágenes de `ProductCard` y `MerchantCard`
- Si la imagen externa falla (`onError`), mostrar un SVG de placeholder con el ícono de la categoría del producto (ej. `Utensils` para comida, `Pill` para farmacia).
- Sin imagen rota o cuadro gris vacío.

#### I-4 · `OrderTimeline` con estimación de llegada dinámica
- Mostrar junto a cada etapa el tiempo real transcurrido (ej. "Hace 5 min").
- La etapa activa con borde pulsante `animate-pulse` en `primary`.

#### I-5 · `PriceSummary` con desglose visual por tienda
- Si el carrito tiene items de múltiples comercios, desglosar subtotal + envío por comercio antes del total general.

---

## Resumen de Prioridades y Esfuerzo

| Código | Mejora | Impacto | Esfuerzo | Sprint |
|--------|--------|---------|----------|--------|
| B-1 | Productos del home contextualizados | 🔴 Crítico | S | 1 |
| G-1 | Toggle disponibilidad repartidor | 🔴 Alto | S | 1 |
| F-1 | Toggle abierto/cerrado en comercio | 🔴 Alto | S | 1 |
| C-2 | Barra de progreso del checkout | 🟠 Alto | S | 1 |
| I-3 | Fallback imágenes elegante | 🟠 Medio | XS | 1 |
| I-2 | Animación MobileNav | 🟡 Medio | XS | 1 |
| B-3 | Skeleton loaders | 🟠 Alto | M | 2 |
| F-3 | Gráfico ventas en reportes | 🟠 Alto | M | 2 |
| H-2 | Visualización datos admin | 🟠 Medio | M | 2 |
| C-4 | Instrucciones Yape/Plin | 🟠 Medio | S | 2 |
| D-1 | ETA prominente en seguimiento | 🟠 Alto | S | 2 |
| G-2 | UI repartidor optimizada para moto | 🔴 Alto | M | 2 |
| B-5 | PDP sticky add-to-cart | 🟠 Medio | M | 3 |
| E-1 | Perfil de cliente enriquecido | 🟡 Bajo | M | 3 |
| A-1 | Pantalla contraseña olvidada | 🟡 Bajo | M | 3 |
| I-1 | Refactor Navbar | 🟡 Técnico | L | 3 |
| H-5 | Alertas salud plataforma | 🟠 Medio | L | 3 |

> **Leyenda esfuerzo:** XS < 1h · S = 1-2h · M = 2-4h · L > 4h

---

## Principios Transversales a Respetar en Todas las Mejoras

1. **Contexto Tingo María siempre:** Ningún producto, imagen o referencia genérica. Todo debe evocar la selva alta, gastronomía local y las zonas reales de la ciudad.
2. **`formatCents()` obligatorio:** Sin excepción en cualquier precio o total.
3. **Touch targets ≥ 44px:** Todos los botones táctiles en vistas móviles.
4. **Tokens de color del sistema:** Sin hexadecimales sueltos ni clases arbitrarias de Tailwind (`text-[#...]`).
5. **Feedback inmediato en acciones:** Agregar al carrito, confirmar pedido, aprobar usuario — siempre con respuesta visual en < 200ms.
6. **Sin scroll horizontal:** Verificar en viewport de 375px (iPhone SE) como mínimo.
