---
name: quickly-ui
description: Reglas de diseño UI/UX para QUICKLY DELIVERY (React 18, TypeScript, Tailwind 3, Zustand, React Router 6, React Hook Form + Zod, Lucide). Usar siempre que se cree, rediseñe o revise una pantalla, componente, catálogo, formulario, carrito o flujo de checkout, para que la plataforma se sienta hecha a la medida de Tingo María y no como una plantilla genérica.
---

# QUICKLY DELIVERY — Skill de Diseño Frontend

## 1. Para quién y para qué se diseña

**Quickly** es la plataforma web de delivery centralizado de **Tingo María** (Provincia de Leoncio Prado, Huánuco, Perú). Conecta a consumidores locales con restaurantes amazónicos, farmacias, bodegas y emprendimientos de la selva, coordinados por repartidores locales.

Esto define las prioridades de diseño:

- **Consumidores:** Piden principalmente desde smartphones, muchas veces en la calle con conexión móvil 4G variable, bajo sol tropical intenso o lluvia. Requieren ver de inmediato qué locales están abiertos, cuánto cuesta el envío a su zona y cuánto tardará, sin pantallas recargadas.
- **Comercios afiliados:** Restaurantes, boticas y bodegas familiares. Necesitan ver pedidos entrantes con claridad, gestionar su menú y confirmar preparación con un solo toque sin perderse en opciones complejas.
- **Repartidores:** Operan en moto o bicicleta por Tingo María, Castillo Grande y Rupa Rupa. Usan la app con una sola mano, en movimiento y con guantes. Necesitan botones táctiles grandes (≥ 44×44 px), direcciones legibles con referencias locales y estados de pedido evidentes.
- **Contexto local tingalés:** La plataforma respeta la identidad de la selva alta: gastronomía típica (cecina, tacacho, juanes, patarashca), cacao y café de Leoncio Prado, y referencias geográficas reales (Plaza de Armas, Alameda Perú, Corpac, Bella Durmiente, UNAS).

**Principio rector:** Una interfaz de delivery parece profesional cuando es **rápida, transparente en tarifas y tiempos, con alto contraste bajo la luz solar y adaptada al uso móvil con el pulgar**. Parece generada por IA cuando incluye productos genéricos fuera de contexto (zapatillas de retail, gadgets), etiquetas en mayúsculas arbitrarias, o layouts rígidos que asfixian la pantalla.

---

## 2. Lista de prohibiciones (delatores de IA y malas prácticas)

No usar nunca, salvo instrucción explícita del usuario:

1. **Productos o categorías fuera de contexto:** Nada de zapatillas Vans, ofertas de retail de tecnología o marketplaces estilo AliExpress. El proyecto es delivery de comida, botica, bodega y productos de Tingo María.
2. **Etiquetas arbitrarias en mayúsculas:** Prohibido `CLIENTE`, `REPARTIDOR`, `DESTACADO`, `OFERTA` en mayúsculas y badges chillones.
3. **Layouts de escritorio forzados:** Prohibido incrustar carritos rígidos fijos de 4 columnas al lado del banner principal en el home que rompan el diseño en pantallas medianas o móviles.
4. **Steppers falsos o datos simulados congelados:** Nada de tarjetas que digan "Hoy, 10:24 am 2025" con fechas fijas si el usuario no tiene una orden real en curso.
5. **Formateo de dinero manual:** Prohibido usar `toFixed(2)` o `toLocaleString()` a mano. Todo precio o total pasa obligatoriamente por el helper `formatCents(cents)`.
6. **Colores hexadecimales sueltos en componentes:** No usar `#[0-9a-fA-F]{3,8}`, `text-[#...]` o `bg-[#...]`. Usar siempre los tokens del sistema (`primary`, `ink`, `surface`, `selva`, `warning`, `destructive`, `info`, `field`). Tampoco colores crudos de la paleta de Tailwind para estados (`emerald-600`, `amber-600`, `sky-600`).
7. **Texto gris claro sin contraste:** Prohibido `text-gray-400` sobre fondos blancos o grises claros. Causa rechazo en usuarios bajo la luz solar y viola WCAG AA (requiere ≥ 4.5:1). El texto secundario usa `text-ink-light`; los placeholders y ayudas, `text-ink-muted`.
8. **Botones táctiles menores a 44×44 px:** En vistas móviles, ninguna acción principal o de agregar puede medir menos del área táctil estándar.
9. **Ocultar costos de entrega o tiempos:** La tarifa base y el tiempo de despacho deben ser visibles en el catálogo y cabecera de zona, no revelarse recién en el último paso del checkout.
10. **Emojis como iconos de interfaz:** Usar exclusivamente la librería `lucide-react` con trazo consistente.
11. **Acciones sin retroalimentación de estado:** Pulsar `+ Agregar al carrito` no puede quedar mudo; debe mostrar confirmación inmediata (botón `bg-selva` temporal "¡Agregado!", badge dinámico).
12. **Degradados excesivos o glassmorphism decorativo:** Evitar fondos borrosos que ralenticen teléfonos de gama baja en la selva.
13. **Rellenos de estado con texto blanco fuera de los tokens:** `bg-emerald-600`, `bg-amber-600` y `bg-sky-600` con `text-white` dan 3.8:1, 3.2:1 y 4.1:1, por debajo del 4.5:1 exigido, y bajo el sol no se leen. Usar `bg-selva`, `bg-warning`, `bg-info` o `bg-destructive`.
14. **Bordes de campo demasiado claros:** `border-border` o `border-gray-200` en inputs y selectores hace que el usuario no vea dónde escribir. Usar `border-field`.

---

## 3. Sistema de color y tokens

Los tokens viven en `src/styles/index.css` (variables `--color-*` en canales RGB) y se exponen como clases en `tailwind.config.js`. Los componentes usan solo esas clases: nunca hex sueltos ni colores crudos de la paleta de Tailwind para estados, porque `emerald-600`, `amber-600` y `sky-600` no cumplen contraste con texto blanco.

### Marca y superficies

- **Acento Primario (Berry Carmine):**
  - `primary` (`#BE185D`): Color de marca y acción principal (botones primarios, carrito activo, enlaces clave). Contraste con blanco: 6.0:1.
  - `primary-hover` (`#9D174D`): Estado hover y presionado (7.9:1).
  - `primary-50` (`#FDF2F8`, alias `primary-light`): Fondos suaves para categorías seleccionadas, badges sutiles y alertas informativas. Texto `primary` encima: 5.5:1.
- **Superficies y Fondos:**
  - `surface` (`#FFFFFF`): Fondo de tarjetas, modales y hojas inferiores.
  - `background` (`#F9FAFB`): Fondo general de la aplicación (gris muy claro, descansado).
  - `surface-subtle` (`#F3F4F6`): Fondos de contenedores secundarios y selectores.
- **Tipografía y Contraste:**
  - `ink` (`#172033`): Texto principal de títulos, precios y etiquetas prioritarias (16:1 sobre blanco).
  - `ink-light` (`#4B5563`): Descripciones y textos secundarios (7.6:1).
  - `ink-muted` (`#6B7280`): Placeholders, ayudas y metadatos pequeños (4.8:1 sobre blanco). Nunca un gris más claro.
- **Bordes:**
  - `border` (`#E5E7EB`): Divisores y contornos de tarjetas. No se usa en campos de formulario.
  - `field` (`#838D9D`): Borde de inputs y selectores (3.1:1 o más sobre cualquier superficie).

### Semántica de Estados de Delivery

Cada estado tiene cuatro tonos: `DEFAULT` (relleno con texto blanco, y también texto sobre fondo blanco), `soft` (fondo suave), `border` (contorno suave) y `strong` (texto sobre el fondo suave).

| Estado | Token | Relleno con texto blanco | Fondo suave con texto | Uso en Quickly |
|---|---|---|---|---|
| **Abierto / Entregado / Disponible** | `selva` | `bg-selva text-white` (5.5:1) | `bg-selva-soft text-selva-strong border-selva-border` (7.3:1) | Comercio abierto ahora, pedido entregado con éxito, stock disponible. |
| **En camino / Preparación / Atención** | `warning` | `bg-warning text-white` (5.0:1) | `bg-warning-soft text-warning-strong border-warning-border` (6.8:1) | Pedido en ruta con repartidor, en cocina, últimos productos. |
| **Cerrado / Cancelado / Agotado** | `destructive` | `bg-destructive text-white` (4.8:1) | `bg-destructive-soft text-destructive-strong border-destructive-border` (5.9:1) | Comercio cerrado, orden cancelada, sin stock. |
| **En proceso / Informativo** | `info` | `bg-info text-white` (5.9:1) | `bg-info-soft text-info-strong border-info-border` (7.1:1) | Pedido confirmado, seguimiento de ruta, zona de reparto. |

### Reglas de color

- Un solo acento: `primary` se reserva para la acción principal, el carrito activo y los enlaces clave. Los colores de estado no se usan como decoración.
- Los rellenos con texto blanco usan solo `bg-selva`, `bg-warning`, `bg-destructive` o `bg-info`. Nunca `bg-emerald-600`, `bg-amber-600` ni `bg-sky-600`.
- Texto de estado sobre fondo blanco: `text-selva`, `text-warning`, `text-destructive` o `text-info` (todos con 4.8:1 o más). Sobre su fondo suave, el tono `strong`.
- El color nunca es el único indicador de estado: acompañarlo con texto o icono (bajo el sol y con daltonismo el color solo no alcanza).
- Contraste mínimo 4.5:1 para texto normal y 3:1 para bordes de campos, foco e iconos informativos.

---

## 4. Tipografía y formato de datos

- **Familia tipográfica:** `Inter`, con pila de respaldo del sistema `system-ui, -apple-system, sans-serif`.
- **Pesos autorizados:** `font-medium` (500), `font-semibold` (600) y `font-bold` (700) para precios y encabezados clave. No abusar de `font-black` (900).
- **Formato monetario oficial:** Los precios se almacenan en **centavos enteros** (`priceCents: 2800`). Se formatean exclusivamente con:
  ```ts
  import { formatCents } from '@/lib/currency';
  formatCents(2800); // -> "S/ 28.00"
  ```
- **Números tabulares:** Usar siempre `tabular-nums` en montos, subtotales, totales de carrito y tiempos estimados para evitar saltos visuales al cambiar cantidades.
- **Códigos de pedido:** Prefijo oficial `QK-XXXXXX` (ej. `#QK-1258`) en `font-bold text-ink`.
- **Títulos y etiquetas:** Escribir en minúsculas naturales (ej. "Restaurantes amazónicos", "Platos más pedidos"), nunca en Title Case forzado ni en MAYÚSCULAS.

---

## 5. Espaciado, rejilla, radios y sombras

- **Escala de espaciado:** Múltiplos de 4 px (`gap-2`, `gap-3`, `gap-4`, `p-4`, `p-6`). Evitar valores arbitrarios (`p-[11px]`).
- **Radios:**
  - `rounded-xl` (12 px): Botones, inputs y selectores de filtro.
  - `rounded-2xl` (16 px): Tarjetas de productos, comercios y contenedores principales.
  - `rounded-full`: Avatares, badges de estado y selector de zonas.
- **Sombras:**
  - `shadow-subtle` / `shadow-sm`: Tarjetas de productos y comercios.
  - `shadow-floating` / `shadow-xl`: Barra flotante de carrito inferior y barra de navegación móvil (`MobileNav`).
- **Márgenes de seguridad móvil:**
  - Todo layout público debe incluir `pb-24 md:pb-12` en su `<main>` para que la barra de navegación móvil o la barra flotante de carrito no tape botones de compra o textos de pie.
  - `MobileNav` y `FloatingCartBar` agregan `pb-safe` (definido en `index.css`) para no chocar con la barra de gestos de iOS.

---

## 6. Componentes del sistema Quickly

### `ProductCard`
- Imagen con aspect ratio `4/3` o `1/1`, con fallback SVG elegante si la imagen externa falla.
- Indicador de stock ("Agotado" en rojo, "¡Últimos X!" en ámbar).
- Nombre del plato o producto en 1 o 2 líneas con `line-clamp-2`.
- Precio destacado con `formatCents(product.priceCents)`.
- Botón de agregar al carrito con **altura mínima de 44 px** y feedback de estado:
  - Estado normal: `+ Agregar al carrito`.
  - Al pulsar: cambia durante 1.5s a `bg-selva text-white` con icono `Check` ("¡Agregado!") antes de volver a su estado normal.

### `MerchantCard`
- Portada con aspect ratio `16/9`.
- Badge flotante con calificación real (★ 4.8) y total de opiniones.
- Si el comercio está cerrado: overlay oscuro claro con aviso "Cerrado en este momento".
- Metadatos esenciales: tiempo de preparación (`20-35 min`) y costo de envío (`Envío: S/ 4.00`).

### `FloatingCartBar` (Barra Flotante de Carrito)
- Se activa de forma automática cuando `cartCount > 0`.
- Posición fija inferior (`fixed bottom-20 md:bottom-6`), centrada y accesible.
- Muestra: cantidad de ítems (`X productos`), total acumulado (`Total: S/ XX.XX`) y botón directo `Ver pedido →`.

### `Navbar` y `MobileNav`
- Barra superior con selector de zona de Tingo María (`Centro`, `Rupa Rupa Norte`, `Castillo Grande`, `Afilador`).
- Buscador accesible en escritorio y móvil.
- `MobileNav` fijo abajo con 5 accesos directos: Inicio, Comercios, Carrito (con badge de cantidad), Pedidos y Perfil.

### `OrderTimeline` (Seguimiento de Pedido)
- 5 etapas claras:
  1. `pendiente`: Pedido recibido por el sistema.
  2. `confirmado`: Comercio aceptó el pedido.
  3. `en_preparacion`: Cocina/comercio preparando.
  4. `en_camino`: Repartidor asignado en ruta a la dirección.
  5. `entregado`: Pedido finalizado en puerta.
- Estimación de llegada transparente y contacto directo con el repartidor.

---

## 7. Zonas y Cobertura en Tingo María

Toda lógica de entrega, costos y tiempos debe respetar las zonas reales de la ciudad:

| Zona ID | Nombre de Zona | Cobertura / Referencias | Tarifa Base | Tiempo Estimado |
|---|---|---|---|---|
| `z_centro` | Centro de Tingo María | Plaza de Armas, Jr. Raymondi, Alameda Perú, Jr. Ucayali | `S/ 4.00` | 20 min |
| `z_rupa_norte` | Rupa Rupa Norte / UNAS | Av. Universitaria, Campus UNAS, Bella Durmiente | `S/ 5.00` | 25 min |
| `z_rupa_sur` | Rupa Rupa Sur / Afilador | Sector Afilador, Jr. Monzón, salida a Huánuco | `S/ 5.50` | 30 min |
| `z_castillo_grande` | Castillo Grande | Cruzando Puente Corpac, Aeropuerto, Las Orquídeas | `S/ 6.50` | 35 min |
| `z_naranjillo` | Naranjillo Periférica | Carretera Central Norte, zona rural cercana | `S/ 8.00` | 45 min |

---

## 8. Formularios y Validación (React Hook Form + Zod)

- Cada campo tiene etiqueta `<label>` visible encima del input; el placeholder solo sirve como ejemplo.
- Campos y selectores: `border border-field bg-surface rounded-xl`. El borde `border` es demasiado claro para un campo. El placeholder usa `text-ink-muted`; el tamaño de 16 px ya viene fijado en `index.css` (evita el zoom automático de iOS).
- Validaciones en español peruano claro:
  - Teléfono: `"Ingresa un celular válido de 9 dígitos (ej. 962 123 456)"`.
  - Dirección: `"Indica calle o jirón y número (ej. Jr. Amazonas 123)"`.
  - Referencia: `"Indica una referencia (ej. frente al parque, portón verde)"`.
- Teclado móvil óptimo:
  - `inputMode="tel"` para celulares.
  - `inputMode="numeric"` para cantidades o códigos de confirmación.
- Manejo de botones de envío: estado de carga deshabilitado mientras se procesa la solicitud.

---

## 9. Accesibilidad y Responsive (Mínimos No Negociables)

- **Touch targets:** Mínimo `44×44 px` para cualquier botón táctil en dispositivos móviles. Usar `h-11` o la clase `touch-target` (definida en `index.css`).
- **Contraste de color:** Ratio mínimo de `4.5:1` para texto normal contra el fondo.
- **Navegación por teclado:** Foco visible claro. `index.css` ya define `:focus-visible` de forma global (contorno de 2 px en `primary` con separación de 2 px); no usar `outline-none` sin un reemplazo equivalente.
- **Scroll horizontal prohibido:** Ningún contenedor debe provocar desbordamiento o scroll horizontal en la pantalla del celular.
- **Soporte de lectores de pantalla:** Botones que solo contienen iconos (favoritos, eliminar del carrito, buscar) deben tener siempre `aria-label` descriptivo.

---

## 10. Checklist Final antes de dar por completada una pantalla

- [ ] ¿Los productos y comercios corresponden a la realidad de Tingo María y Leoncio Prado?
- [ ] ¿Todos los precios y subtotales usan `formatCents` y `tabular-nums`?
- [ ] ¿Los botones y selectores táctiles miden al menos 44 px de altura en móvil?
- [ ] ¿El botón de agregar al carrito ofrece feedback visual inmediato ("¡Agregado!")?
- [ ] ¿La barra flotante de carrito se muestra correctamente cuando hay productos?
- [ ] ¿El costo de envío y el tiempo estimado son visibles desde la navegación inicial?
- [ ] ¿No hay degradados vacíos, emojis en lugar de iconos ni etiquetas en mayúsculas de IA?
- [ ] ¿Los colores respetan los tokens (`primary`, `ink`, `selva`, `warning`, `destructive`, `info`, `field`) sin hex sueltos ni colores crudos de Tailwind (`emerald-600`, `amber-600`, `sky-600`)?
- [ ] ¿Los rellenos de estado con texto blanco usan `bg-selva`, `bg-warning`, `bg-destructive` o `bg-info`?
- [ ] ¿Los campos usan `border-field` y los placeholders `text-ink-muted`?
- [ ] ¿El texto secundario tiene suficiente contraste (usando `text-ink-light`, nunca `text-gray-400` sobre fondos claros)?
- [ ] ¿La vista se probó en pantalla móvil sin scroll horizontal?