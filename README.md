# Quickly — Plataforma de Delivery en Tingo María

Frontend React de **Quickly**, una plataforma web de delivery para **Tingo María, Rupa Rupa, provincia de Leoncio Prado, Huánuco, Perú**. F1 integra registro, login, restauración/cierre de sesión y perfil con la API NestJS y PostgreSQL en Docker. Las vistas originales consumen la API; los almacenes y cuentas del prototipo se retiraron en el bloque 8.

## Estado actual: bloques de integración 1–8

Carrito real permite seleccionar productos de varias tiendas, cotizar envíos por tienda y confirmar una vez. Cada tienda genera su pedido/entrega/cobro independiente, con efectivo exacto previsto por entrega y recuperación segura de la misma confirmación. Resumen en `/cliente/compras/:id`; cancelación y seguimiento por pedido. Una tienda conserva el flujo de efectivo con cambio de F4.

Pasarela F6 pendiente por decisión del usuario. Google, GPS, promociones, carrito remoto y liquidaciones de F7 pendientes. Reglas y evidencia actualizadas se conservan en el workspace versionado del backend (`docs/workspace/docs/harness/`). No se declara piloto/despliegue real completado.

Entrega de desarrollo en rama `feat/integracion-backend-f0-f2`, sin fusionar a `main`. El plan completo, decisiones, evidencia y pasos para continuar están en [el relevo del backend](https://github.com/xmenil/Quickly-backend/blob/main/docs/RELEVO_F2.md). Clonar backend y frontend como carpetas hermanas para ejecutar el harness conjunto.

F2 conecta solicitudes y correcciones de comercio/reparto, seguimiento en `/cliente/solicitudes`, direcciones, perfil comercial con horarios/equipo, disponibilidad del repartidor y administración de solicitudes, usuarios y zonas. Las decisiones y los permisos proceden del servidor; los formularios presentan errores, estados vacíos y carga sin recurrir a datos simulados.

Para la primera administración: registrar una cuenta personal y, desde `backend/`, ejecutar `npm run admin:bootstrap -- --email tu-correo@ejemplo.com`. Restaurar sesión y crear las zonas reales en administración. Solo después se pueden presentar solicitudes y crear direcciones. No existen credenciales administrativas predeterminadas ni zonas ficticias en desarrollo. Ver `backend/README.md` para reglas y migraciones.

Desde `backend/`, iniciar `npm run dev:db` y `npm run start:dev`. En otra terminal, desde `Frontend-Quickly/`, ejecutar `npm ci` y `npm run dev`; abrir `http://localhost:5173`.

La identidad se consulta exclusivamente en la API. Vite hace proxy de `/api` a `http://127.0.0.1:3000` conservando Origin. La cookie HttpOnly queda bajo el mismo origen web; el cliente envía credenciales y CSRF automáticamente. `.env.example` permite ajustar la URL base y el proxy. El perfil se carga al abrir/recargar, se guarda en servidor y se limpia al recibir 401 o cerrar sesión. Un error de conexión ofrece reintento y no crea una identidad ficticia.

El modo demo y sus accesos rápidos fueron retirados. Las capacidades sin servicio real muestran indisponibilidad en sus controles originales.

### Contratos, caché y pruebas

- Identidad tipada desde OpenAPI: `src/services/api/contracts/`. `identityApi` valida respuestas en ejecución con Zod.
- Tras cambiar un DTO backend: compilar backend, ejecutar allí `npm run contracts:export`, luego aquí `npm run contracts:sync`. `npm run contracts:check` detecta diferencias de tipos y, si existe el repositorio hermano, diferencias con su OpenAPI.
- Estrategia inicial de caché: identidad en memoria de `authStore`, respuestas privadas sin almacenamiento persistente, cancelación/invalidación por generación de sesión. Los dominios posteriores añadirán sus consultas por recurso sobre el mismo cliente; no se reintroduce una DB global en localStorage.
- `npm test` ejecuta regresiones con respuestas controladas de API; no carga cuentas ni stock del prototipo. La persistencia se verifica por separado mediante las suites SQL/HTTP y el recorrido original de navegador.
- Desde la raíz del workspace, `node scripts/check-workspace.cjs` ejecuta el harness integral; necesita ambos repositorios con `npm ci` y Docker disponible.
- Desde backend: `npm run harness:browser` prueba Edge/Chromium real, con API y Vite temporales y una DB Docker aleatoria. No ejecutar Playwright directamente contra la DB de desarrollo. En Windows usa Edge instalado; en Linux instalar Chromium mediante `npx playwright install --with-deps chromium` desde el frontend.
- El workflow frontend valida contrato local, compilación y pruebas. El E2E integrado requiere ambos repositorios; su ejecución remota depende de disponer de ambos checkouts.

### Despliegue

F8 incorpora Dockerfile y `deploy/Caddyfile` para servir el build real y `/api` en el mismo origen HTTPS junto con `backend/deploy/compose.staging.yml`. Ensayo aislado desde backend: `npm run test:staging`. Verifica cookie Secure/HttpOnly, CSRF, SPA, monitor administrativo y persistencia tras reiniciar API. No cambia el despliegue actual de main ni publica automáticamente.

Administración añade `/admin/operacion` para avisos reales de outbox, vencimientos y pool. Staging público/piloto, alertas externas, copias remotas y correcciones mayores de dependencias siguen pendientes; revisar `docs/workspace/docs/harness/` en backend.

La integración se verifica localmente mediante proxy del mismo origen. Antes de publicar la versión real, configurar el proxy `/api` hacia el backend desplegado y HTTPS con `SESSION_COOKIE_SECURE=true`, junto con los orígenes exactos en `CORS_ORIGIN`. La reescritura SPA existente de Vercel no sustituye ese proxy: requiere su destino público cuando se despliegue la API. La validación en un staging público queda como requisito de despliegue antes del piloto.

El resto del documento conserva la descripción histórica del prototipo. El estado vigente y la evidencia SQL/HTTP local se detallan en [el bloque 8](docs/integracion-api/BLOQUE_8_RETIRADA_MOCKS_VALIDACION_INTEGRAL.md); esa descripción histórica no habilita cuentas ni operaciones de demostración.

---

## 1. Requisitos y Comandos de Ejecución

### Requisitos del Sistema
- **Node.js**: 22 (mismo entorno que el backend y CI).
- **Gestor de paquetes**: `npm` v9.0.0+ (incluido con Node.js)

### Comandos de Ejecución
```bash
# 1. Instalar dependencias
npm ci

# 2. Iniciar el servidor de desarrollo local
npm run dev

# 3. Ejecutar pruebas unitarias y de reglas de negocio con Vitest
npm test

# 4. Construir bundle de producción
npm run build

# 5. Previsualizar bundle de producción localmente
npm run preview
```

---

## 2. Tecnologías y Arquitectura Frontend

| Capa / Responsabilidad | Tecnología |
| :--- | :--- |
| **Núcleo & SPA** | React 18, TypeScript, Vite 6 |
| **Enrutamiento** | React Router v6 (declarativo con `createBrowserRouter`) |
| **Diseño y Estilos** | Tailwind CSS con tokens de identidad Quickly |
| **Gestión de Estado Global** | Zustand (con persistencia en `localStorage` y sincronización entre pestañas) |
| **Validación de Formularios** | React Hook Form + Zod (`@hookform/resolvers`) |
| **Iconografía** | Lucide React |
| **Moneda y Fechas** | `Intl.NumberFormat` (PEN / S/ con céntimos enteros) y `Intl.DateTimeFormat` (América/Lima) |
| **Pruebas Automatizadas** | Vitest + Testing Library |

### Estructura del Proyecto
```
d:/App-deliveri/
├── public/                 # Favicon SVG y assets estáticos
├── src/
│   ├── app/                # Router declarativo y configuración de rutas
│   ├── components/
│   │   ├── ui/             # Button, Input, Select, Dialog, Drawer, Tabs, Badge, EmptyState
│   │   └── shared/         # BrandLogo, ProductCard, MerchantCard, OrderTimeline, SchematicMap, RoleSwitcher
│   ├── domain/             # Types, reglas de transición de pedidos, reglas de cálculo monetario
│   ├── features/           # auth, catalog, cart, checkout, orders, customer, merchant, courier, admin
│   ├── layouts/            # PublicLayout, CustomerLayout, MerchantLayout, CourierLayout, AdminLayout, AuthLayout
│   ├── lib/                # Utilidades, cálculo de moneda (céntimos), fechas (America/Lima)
│   ├── mocks/              # Seed inicial realista para Tingo María
│   ├── store/              # authStore, cartStore, dataStore
│   ├── styles/             # index.css y tokens Tailwind
│   └── test/               # Pruebas automatizadas de reglas de negocio
├── package.json
└── vite.config.ts
```

---

## 3. Accesos y Credenciales de Demostración (1 Clic)

El sistema incluye una **barra flotante de demostración (Demo Switcher)** en la esquina inferior que permite alternar instantáneamente entre los cuatro roles sin reiniciar operaciones:

| Rol | Usuario de Prueba | Correo Demo | Contraseña Demo | Propósito en la Demostración |
| :--- | :--- | :--- | :--- | :--- |
| **👤 Cliente** | Nilver Valdivia | `cliente@quickly.pe` | `123456` | Explorar tiendas, armar carrito multitienda, checkout, cancelar pedidos y seguimiento en mapa. |
| **🏪 Comercio** | La Selva Gourmet | `comercio@quickly.pe` | `123456` | Administrar catálogo, aceptar/rechazar pedidos, avanzar comanda en cocina y solicitar repartidor. |
| **🛵 Repartidor** | Carlos Ramos (Moto) | `repartidor@quickly.pe` | `123456` | Ponerse en línea, aceptar solicitud de entrega, retirar de tienda y confirmar entrega con cobro de efectivo. |
| **🛡️ Administrador** | Administradora Central | `admin@quickly.pe` | `123456` | Aprobar solicitudes pendientes, asignar repartidores, ver auditoría y monitorear plataforma. |

---

## 4. Matriz Funcional Completa

| Funcionalidad | Pantalla / Ruta | Acción Comprobable | Origen del Requisito |
| :--- | :--- | :--- | :--- |
| **Buscador y Exploración** | Portada (`/`) | Búsqueda por texto ("tacacho", "panadol") y filtros por categoría | Informe INNOVACIÓN II |
| **Catálogo de Comercios** | `/negocios` | Filtrar por abiertos ahora, ordenar por calificación, menor tiempo o envío | Informe INNOVACIÓN II |
| **Página del Comercio** | `/negocios/:id` | Ver horarios, estado abierto/cerrado, tarifa, tiempo y catálogo de platos | Informe INNOVACIÓN II |
| **Detalle de Producto** | Modal en `/negocios/:id` | Seleccionar variantes (personal/familiar), notas y validar stock | Informe INNOVACIÓN II |
| **Carrito Multitienda** | `/carrito` | Agrupación por negocio, modificación de cantidades y desglose de envíos | Ampliación propuesta |
| **Checkout en 3 Pasos** | `/checkout` | 1: Dirección → 2: Método de pago (Efectivo/Yape/Tarjeta) → 3: Confirmación | Informe INNOVACIÓN II |
| **Cálculo de Efectivo** | `/checkout` | Valida que el efectivo cubra el total e indica el vuelto para el repartidor | Ampliación propuesta |
| **Mis Pedidos** | `/cliente/pedidos` | Historial de compras con filtros de estado y enlaces a detalle | Informe INNOVACIÓN II |
| **Detalle y Cancelación** | `/cliente/pedidos/:id` | Cancelación permitida antes de cocina; restaura stock y genera reembolso | Ampliación propuesta |
| **Valoración de Entrega** | `/cliente/pedidos/:id` | Calificar al comercio con 1 a 5 estrellas y reseña tras la entrega | Informe INNOVACIÓN II |
| **Volver a Pedir** | `/cliente/pedidos/:id` | Reagrega productos al carrito revalidando precios y stock actual | Informe INNOVACIÓN II |
| **Seguimiento con Mapa** | `/cliente/seguimiento/:id` | Mapa esquemático de Tingo María con ruta y progreso simulado del repartidor | Informe INNOVACIÓN II |
| **Gestión de Tienda** | `/comercio/tienda` | Resumen de ventas netas, pedidos por atender y botón abrir/cerrar local | Informe INNOVACIÓN II |
| **Edición de Tienda** | `/comercio/perfil-tienda` | Modificar descripción, horarios, tiempo de preparación y banner | Informe INNOVACIÓN II |
| **Productos de Tienda** | `/comercio/productos` | Crear, editar precio, stock, desactivar y previsualizar imagen | Informe INNOVACIÓN II |
| **Comandas y Cocina** | `/comercio/pedidos` | Aceptar pedido, rechazar con motivo, pasar a cocina y marcar listo | Informe INNOVACIÓN II |
| **Exportación CSV Ventas** | `/comercio/reportes` | Descarga archivo `.csv` real con métricas de ventas locales | Ampliación propuesta |
| **Solicitudes de Repartidor** | `/repartidor/solicitudes` | Visualizar pedidos listos en restaurantes y aceptar carrera | Ampliación propuesta |
| **Entrega en Ruta (Móvil)** | `/repartidor/entrega-activa` | Pasos táctiles: 1: Retiro en tienda → 2: En camino → 3: Confirmar entrega | Ampliación propuesta |
| **Incidencias en Reparto** | `/repartidor/entrega-activa` | Reportar problema en ruta (lluvia, tráfico) sin forzar entrega | Ampliación propuesta |
| **Ganancias de Repartidor** | `/repartidor/ingresos` | Desglose acumulado de tarifas por carrera en Soles | Ampliación propuesta |
| **Aprobación de Solicitudes**| `/admin/usuarios` | Aprobar o rechazar nuevas solicitudes de tiendas y repartidores | Ampliación propuesta |
| **Zonas de Cobertura** | `/admin/zonas` | Zonas configurables de Tingo María (Centro, Rupa Rupa, Castillo Grande) | Ampliación propuesta |
| **Soporte e Incidencias** | `/admin/incidencias` | Revisar reclamos de clientes y responder directamente | Ampliación propuesta |
| **Registro de Auditoría** | `/admin/auditoria` | Bitácora de transiciones y acciones de cada actor | Ampliación propuesta |
| **Restauración a Semilla** | Botón en Demo Switcher | Restablece todos los datos de `localStorage` al estado de fábrica | Ampliación propuesta |

---

## 5. Reglas de Negocio Implementadas

1. **Carrito Multitienda y Subpedidos**:
   - Una compra (`Purchase`) puede incluir productos de varios comercios.
   - Al confirmar, se genera una orden agrupadora con código `QK-XXXXXX` y subpedidos independientes (`MerchantOrder`) por cada negocio.
   - Cada subpedido tiene su propia tarifa de envío y asignación de repartidor independiente.
2. **Derivación de Estados**:
   - El estado de la orden matriz se deriva automáticamente: si un subpedido se entrega y otro sigue en camino, muestra **"Entrega parcial"**; si todos se entregan, muestra **"Completado"**.
3. **Manejo Monetario Seguro**:
   - El dinero se gestiona internamente en **céntimos enteros** (`totalCents: 2800` = S/ 28.00) para eliminar errores de redondeo de punto flotante.
   - Se formatea mediante `Intl.NumberFormat` con código de moneda `PEN` y símbolo `S/`.
4. **Reserva y Restauración Única de Stock**:
   - Al confirmar la compra, se deduce el stock de cada producto.
   - Si el cliente cancela o el comercio rechaza el pedido, **el stock se restaura exactamente una vez**.
   - Los intentos repetidos de cancelación son bloqueados por la máquina de estados.
5. **Reembolsos Simulados**:
   - Para pagos con Yape/Plin o Tarjeta, la cancelación genera un reembolso simulado automático de productos + envío.
   - Para pedidos en efectivo no entregados, no se genera reembolso monetario ya que el cobro ocurre contra entrega.
6. **Cancelación por el Cliente**:
   - El cliente solo puede cancelar mientras el subpedido esté en `pendiente` o `confirmado`. Una vez iniciado `en_preparacion` en cocina, el botón se bloquea y se orienta al canal de soporte.

---

## 6. Principios de UX/UI y Diseño Aplicados

- **Identidad Visual**:
  - Logotipo con recreación e interpretación SVG del **colibrí Quickly** en color magenta/fucsia (`#C60050`) y subtítulo oficial *"Conectando negocios locales"*.
  - Paleta primaria: Primario `#C60050`, Hover `#A80043`, Fondo suave `#FFF1F6`, Superficie `#FFFFFF`, Texto `#172033`, Bordes `#E5E7EB`.
  - Acentos selváticos amazónicos (`#059669` / verde esmeralda) que evocan la vegetación de Tingo María.
- **Leyes de Gestalt**:
  - *Región Común*: Los subpedidos y sus respectivos envíos se agrupan en contenedores visuales separados por comercio.
  - *Proximidad*: Las etiquetas de formulario, campos y mensajes de error están estrechamente vinculados.
- **Heurísticas de Nielsen**:
  - *Estado visible del sistema*: Badges de estado acompañados de texto e icono (no solo color), timeline de seguimiento y mapa esquemático.
  - *Prevención de errores*: Validación de efectivo insuficiente, confirmación modal antes de cancelar y bloqueo de pedidos con tiendas cerradas.
  - *Flexibilidad y eficiencia*: Accesos de 1 clic para demostración, "Volver a pedir" y botones rápidos de favoritos.
- **Accesibilidad y Responsive (WCAG 2.2 AA)**:
  - Objetivos táctiles mínimos de **44 × 44 px** en botones e interactivos móviles (`.touch-target`).
  - Navegación móvil con **Bottom Navigation Bar** fijada en pantalla.
  - Contraste superior a 4.5:1 verificado en texto normal y 3:1 en encabezados.
  - Soporte de reducción de movimiento (`prefers-reduced-motion`).

---

## 7. Secuencia de Demostración Paso a Paso

1. **Paso 1: Exploración como Cliente**
   - Ingresa a `http://localhost:5173/` y explora las categorías de Tingo María.
   - Haz clic en **La Selva Gourmet** y agrega un *Tacacho con Cecina*.
   - Ve a **Cacao & Café Tingo** y agrega una *Tableta de Chocolate 70% Cacao*.
2. **Paso 2: Carrito y Checkout**
   - Entra al carrito: observa que están agrupados por tienda con sus costos de envío independientes.
   - Avanza al checkout: selecciona una dirección en el Centro de Tingo María.
   - Elige método de pago (ej. Efectivo con billete de S/ 50.00 o Yape) y confirma.
3. **Paso 3: Recepción en Comercio**
   - En la barra inferior demo, haz clic en **[🏪 Comercio]**.
   - Accede a la pestaña **Gestión de Pedidos**: verás la orden recién creada.
   - Haz clic en **Aceptar Pedido** → **Iniciar Preparación en Cocina** → **Marcar Listo para Recojo**.
4. **Paso 4: Reparto**
   - En la barra demo, haz clic en **[🛵 Repartidor]**.
   - En **Solicitudes**, verás el subpedido listo: presiona **Aceptar y Asignar Entrega**.
   - Sigue los pasos: pulsa **Confirmar Retiro en Tienda** y luego **Confirmar Entrega Realizada**.
5. **Paso 5: Administración Central**
   - En la barra demo, haz clic en **[🛡️ Admin]**.
   - En **Usuarios y Solicitudes**, aprueba a *Elena Dávila - Panadería Amazonia*.
   - Explora el historial de auditoría y las métricas de la plataforma.
6. **Paso 6: Restauración de Datos**
   - Para regresar la aplicación a su estado inicial, haz clic en **Restaurar datos** en el Demo Switcher.
