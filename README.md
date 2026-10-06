# Quickly — Plataforma de Delivery en Tingo María

Prototipo frontend navegable, funcional y responsive de **Quickly**, una plataforma web de delivery para **Tingo María, Rupa Rupa, provincia de Leoncio Prado, Huánuco, Perú**, basada en la propuesta y arquitectura conceptual del informe **INNOVACIÓN II**.

---

## 1. Requisitos y Comandos de Ejecución

### Requisitos del Sistema
- **Node.js**: v18.0.0 o superior (verificado y testeado en Node v24.11.1)
- **Gestor de paquetes**: `npm` v9.0.0+ (incluido con Node.js)

### Comandos de Ejecución
```bash
# 1. Instalar dependencias
npm install

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
│   │   └── shared/         # BrandLogo, ProductCard, MerchantCard, OrderTimeline, SchematicMap, DemoSwitcher
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
