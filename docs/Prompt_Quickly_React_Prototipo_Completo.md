# Prompt completo — Quickly: prototipo frontend de delivery

Copia desde “Actúa como…” hasta el final en la herramienta de desarrollo. Este encargo pide construir el prototipo; no entregar solamente una explicación o una propuesta.

Actúa como especialista en diseño de producto, UX/UI y desarrollo frontend con React. Construye un prototipo completo, navegable y funcional de **Quickly**, una plataforma web de delivery para Tingo María, Rupa Rupa, provincia de Leoncio Prado, Perú.

## 1. Contexto, alcance y fidelidad al informe

El informe “INNOVACIÓN II” propone centralizar negocios, productos, pedidos y entregas, conectando consumidores, comercios y repartidores. Incluye búsqueda por negocios y categorías, catálogo, carrito, confirmación de pedidos, seguimiento y gestión de productos y pedidos por los comercios. Prioriza comodidad desde el celular, claridad de precios, costo de envío y tiempo estimado de entrega.

La imagen del informe presenta pantallas de CLIENTE y PROVEEDOR, con buscador, categorías, productos destacados, carrito, dirección, seguimiento, historial de pedidos, panel del proveedor, indicadores, tienda, productos, pedidos, reportes y configuración. Utilízala como referencia, mejorando su organización y accesibilidad.

El login, recuperación de acceso, permisos, panel de repartidor, administración central, reglas de pago y reglas operativas son ampliaciones propuestas para hacer demostrable el recorrido completo. Documenta estas decisiones en el README; no las atribuyas como requisitos textuales del informe.

**Construye exclusivamente el frontend.** No implementes backend, servidores propios, bases de datos remotas, autenticación real, Firebase, Supabase, pagos reales, mensajería externa, IA ni conexiones a servicios privados. No requieras claves, cuentas ni variables secretas para ejecutar la demostración. Los datos y efectos operativos serán simulados localmente.

## 2. Tecnologías

Usa React, TypeScript y Vite para una SPA. Usa React Router en modo declarativo, Tailwind CSS, Zustand para estado compartido, React Hook Form y Zod para formularios, y Lucide React para iconos de interfaz. Usa Intl para moneda y fechas. Elige versiones estables compatibles entre sí, consulta su documentación actual y conserva el lockfile.

No mezcles distintas bibliotecas de estado o de componentes para resolver lo mismo. Usa componentes funcionales, hooks, tipos explícitos y separación por funcionalidades. No concentres la app en App.tsx.

## 3. Identidad visual y recursos

- Marca: Quickly. La referencia contiene un colibrí estilizado junto al nombre, en fucsia/magenta, sobre blanco y rosa muy claro.
- El informe no proporciona un logo independiente ni favicon. Si está disponible la imagen original, úsala para comprender la identidad; no uses la captura completa como logo.
- Implementa una interpretación SVG limpia del colibrí y el nombre, documentada como recreación provisional de la referencia, con versión compacta y favicon.svg legible a 16 y 32 px.
- El escudo de Fibonacci pertenece al instituto; no lo utilices como marca de Quickly.
- La referencia incluye “IA para impulsar negocios locales”, pero este alcance no implementa IA. Usa como texto propuesto “Conectando negocios locales” y no anuncies funciones inexistentes.
- Paleta inicial propuesta: primario #C60050, hover #A80043, fondo suave #FFF1F6, superficie #FFFFFF, texto #172033 y bordes #E5E7EB. Verifica contraste antes de fijar los tokens.
- Estética comercial, cercana y contemporánea: fotografías relevantes, tarjetas limpias, precios destacados, espacios amplios, bordes moderadamente redondeados y sombras discretas.
- Usa Inter o una tipografía sans-serif con fallback local. Base legible de 16 px; evita miniaturizar la interfaz de la captura.
- Incluye banner vinculado a Tingo María y su entorno, sin convertir la portada en una página turística. Usa recursos locales permitidos o imágenes con fallback estable. No dependas de URLs frágiles.
- Define tokens de color, espaciado, tipografía, radios y estados. No uses emojis como sistema de iconografía.
- Español natural de Perú; moneda PEN mostrada como S/ y fechas con zona America/Lima.
- Título y metadatos propios: “Quickly | Delivery en Tingo María”.

## 4. Usuarios y acceso simulado

Implementa cuatro roles: cliente, comercio/proveedor, repartidor y administrador. El administrador es una ampliación propuesta para gestionar la plataforma.

Crea inicio de sesión, registro de cliente, solicitud de registro de comercio, solicitud de registro de repartidor, recuperación simulada, restablecimiento simulado, mostrar/ocultar contraseña, validación de campos, sesión local, cerrar sesión y páginas de acceso denegado.

Incluye accesos de demostración claros para los cuatro roles. El administrador no se registra públicamente. Las solicitudes de comercio y repartidor deben aparecer pendientes en administración; al aprobarlas deben poder acceder a su panel. Las cuentas desactivadas deben mostrar un mensaje coherente.

La autenticación y recuperación son simulaciones. No envíes correos ni SMS y no solicites datos reales. Las credenciales de prueba se documentan; no almacenes contraseñas ni tokens reales. Garantiza que el registro simulado pueda continuarse mediante acceso de demostración sin depender de un proveedor externo.

Permite explorar el catálogo sin iniciar sesión. Si el visitante inicia checkout, solicita acceso y conserva el carrito y la ruta de retorno. Cada rol accede únicamente a su navegación y datos correspondientes dentro de la simulación; los guards de frontend no constituyen seguridad real.

## 5. Experiencia del cliente

Implementa:
1. Inicio comercial con buscador de productos y negocios, selector de dirección/zona, categorías, negocios y productos destacados.
2. Categorías: restaurantes, farmacias, bodegas, ropa y emprendedores. Incluye filtros por categoría, negocio abierto, disponibilidad, precio y tiempo estimado; ordenamiento y limpieza de filtros.
3. Página del negocio con nombre, imagen, categoría, descripción, dirección, horario, estado abierto/cerrado, envío estimado, tiempo estimado y catálogo.
4. Detalle de producto con imagen, descripción, precio, stock, cantidad, variaciones cuando existan y observación opcional. No inventes opciones para todos los productos.
5. Favoritos de negocios y productos, persistidos por usuario.
6. Carrito con modificación de cantidades, eliminación, agrupación por negocio y resumen monetario actualizado.
7. Checkout en pasos cortos: dirección y referencia → método de pago → revisión y confirmación. Permite regresar sin perder datos.
8. Direcciones guardadas: crear, editar, eliminar, marcar principal y elegir zona de cobertura. Incluye nombre del destinatario, teléfono ficticio, calle/número y referencia.
9. Pago simulado por efectivo, Yape/Plin o tarjeta. No solicites datos reales de tarjeta ni muestres QR cobrables; ofrece escenarios de pago aprobado y rechazado. Para efectivo, permite indicar con cuánto pagará y valida que alcance.
10. Confirmación con identificador, resumen, tiendas involucradas, costo de envío, total, estado y tiempo estimado.
11. Mis pedidos, detalle, historial, filtros por estado y fecha, cancelación permitida, valoración tras la entrega y “Volver a pedir”, revisando stock y precios actuales.
12. Seguimiento mediante timeline y mapa esquemático local con origen/destino y progreso simulado. No presentes GPS ni geolocalización en vivo como reales.
13. Perfil editable, preferencias de notificación, centro de notificaciones y ayuda con preguntas frecuentes y contacto simulado.

## 6. Experiencia del comercio/proveedor

Implementa un panel propio por comercio con:
- Resumen de ventas simuladas, pedidos pendientes, productos disponibles y actividad reciente, calculados desde los datos.
- “Mi tienda”: editar descripción, categoría, imágenes, horario, dirección, tiempo de preparación y estado abierto/cerrado.
- Productos: crear, editar, desactivar, reactivar, buscar y filtrar; precio, stock, categoría, descripción, imagen y variaciones opcionales. Formularios con validación y previsualización de imágenes.
- Gestión de pedidos: lista y detalle, productos, cantidades, notas, cliente/dirección, método y estado de pago; aceptar, rechazar indicando motivo, iniciar preparación y marcar listo.
- Solicitud de repartidor para pedidos listos y seguimiento de la entrega asignada.
- Reportes por período con ventas, unidades, productos destacados y pedidos por estado; exportación CSV local.
- Configuración de medios de pago simulados, horarios y preferencias.
- Notificaciones internas y ayuda.

Un comercio solo ve sus productos y subpedidos. Suspender un producto con historial no elimina registros anteriores. Al editar precio, los pedidos existentes conservan su precio de compra.

## 7. Experiencia del repartidor

Diseña prioritariamente para celular:
- Estado disponible/no disponible.
- Solicitudes de entrega de subpedidos listos: comercio, zona, dirección de retiro y entrega, cantidad de bultos simulada, pago y tarifa de reparto.
- Aceptar o rechazar una solicitud; al aceptar, asignarla una sola vez y retirarla de la lista disponible.
- Entrega activa con pasos: ir al comercio → confirmar retiro → en camino → confirmar entrega.
- Mapa esquemático y ruta simulada, direcciones y referencias visibles.
- Acción para registrar incidencia con motivo y nota; no marcar entregado automáticamente por una incidencia.
- Para efectivo, registrar cobro simulado al entregar. Para prepago, mostrar que no debe cobrar nuevamente.
- Historial, ingresos de reparto simulados calculados, perfil y notificaciones.
- Contacto local simulado con mensajes de demostración; no enviar WhatsApp, SMS ni llamadas reales.

## 8. Experiencia del administrador

Incluye:
- Resumen con usuarios, comercios, repartidores, pedidos activos y montos simulados.
- Gestión de usuarios y solicitudes de comercios/repartidores: aprobar, rechazar, activar y suspender, indicando motivo.
- Gestión de categorías y zonas de cobertura.
- Configuración de tarifa de envío por zona y comercio; defaults de demostración claramente identificados.
- Vista global de pedidos y subpedidos, filtros, detalle y asignación de repartidor disponible.
- Gestión de incidencias y solicitudes de ayuda con estado abierto/en revisión/resuelto.
- Reportes derivados de los datos y exportación CSV.
- Historial local de acciones relevantes con actor, fecha y entidad.
- Herramientas de demostración: cambiar rol, mostrar escenarios, simular error y restaurar datos con confirmación.

Cambiar de rol conserva operaciones. Restaurar datos limpia la sesión y repone el seed completo. No confundir estos dos controles.

## 9. Reglas de negocio propuestas para la demostración

El informe no define estas reglas con precisión; impleméntalas y documéntalas como decisiones del prototipo:

- Permite carrito con varios comercios. Al confirmar, crea una compra agrupadora y un subpedido por comercio, con seguimiento independiente.
- Desglosa el envío por cada comercio antes de confirmar. Ejemplo de tarifa configurable: S/ 5.00 por subpedido en zona central. No presentes esa cifra como una tarifa real del servicio.
- Cada subpedido puede tener un repartidor diferente. El estado de la compra agrupadora se deriva de sus subpedidos; muestra “Entrega parcial” cuando corresponda y “Finalizado con cancelaciones” si algunos fueron cancelados.
- Usa un único método de pago por compra agrupadora. Repartir montos y reembolsos por subpedido sin duplicar cobros.
- Guarda dinero en céntimos enteros y formatea al mostrarlo. Total = suma de productos + suma de envíos − descuentos aplicables; no añadas cargos ocultos.
- Revalida stock, variaciones, comercio abierto, cobertura y tarifa al confirmar. Reserva stock al crear el pedido y restáuralo una sola vez si se cancela o rechaza.
- Si falta información o un producto ya no está disponible, conserva los datos y explica cómo corregirlo.
- Desactiva el envío repetido del formulario y usa un identificador de intento para impedir pedidos duplicados.
- Un pago simulado rechazado no debe generar un pedido confirmado ni consumir stock.
- El cliente puede cancelar un subpedido mientras esté pendiente o confirmado, antes de iniciar preparación. Muestra la regla y pide confirmación. Después de ese punto puede solicitar ayuda.
- Si un subpedido prepagado se cancela/rechaza, registra reembolso simulado de sus productos y envío. Si era efectivo pendiente, no generes reembolso.
- La asignación de repartidor es posible cuando el subpedido está listo; solo un repartidor puede tenerlo asignado. Mantén separada la asignación del estado de preparación.
- Estados de subpedido: pendiente → confirmado → en preparación → listo para recoger → en camino → entregado. Cancelado y rechazado son ramas terminales. No permitas saltos ilegales.
- Estados de pago separados del pedido: pendiente, pagado, fallido, reembolso pendiente y reembolsado.
- Cada transición guarda hora, actor y nota opcional. El progreso se actualiza por acciones del comercio/repartidor; la simulación automática solo se activa explícitamente en modo demo.
- Totales, indicadores, notificaciones y reportes deben reflejar estos mismos registros.

## 10. Datos y simulación compartida

Crea datos ficticios coherentes: al menos 8 negocios repartidos entre las cinco categorías, 30 productos con imágenes, 3 repartidores y pedidos en diferentes estados. Puedes usar “La Selva Gourmet”, “Farmacia Vida”, “Mi Bodega” y “Moda Selva” como ejemplos ficticios inspirados en la captura, sin afirmar afiliaciones reales.

Incluye comercios cerrados, productos sin stock, un carrito vacío, una búsqueda sin resultados, un pedido rechazado, una incidencia, pago fallido y dirección fuera de cobertura.

Modela User, Merchant, Courier, Category, Product, ProductVariant, Address, CartItem, Purchase, MerchantOrder, OrderLineSnapshot, Payment, DeliveryAssignment, TrackingEvent, Notification, Review y SupportTicket. Relaciona por IDs estables.

Persiste los datos demo con localStorage versionado; conserva cambios al recargar y maneja JSON inválido, cuota excedida y migración/restauración. Usa sessionStorage para la sesión demo cuando corresponda. Las imágenes cargadas deben tener límite de tamaño y fallback; no persistas objetos File como si fueran JSON.

Centraliza los datos de los roles: el pedido del cliente aparece al comercio y la entrega al repartidor; sus cambios regresan al cliente. Si se abren varias pestañas del mismo navegador, sincroniza con storage events o BroadcastChannel. No prometas sincronización entre dispositivos.

El repositorio mock puede devolver Promises con demora breve para mostrar carga; no realices peticiones a un backend. Añade escenarios deterministas de éxito/error, no errores aleatorios que interrumpan la demostración.

## 11. Principios de UX/UI aplicados

Aplica estos principios en componentes y flujos, no solo en una lista documental.

**Gestalt:** proximidad para unir etiqueta, campo y error; semejanza para acciones equivalentes; región común para cada tienda y su subpedido; continuidad para checkout y seguimiento; figura/fondo para modales y foco; simplicidad perceptiva para reducir ruido. No sacrifiques información ni etiquetas para lograr una estética minimalista.

**Nielsen:** estado visible; lenguaje familiar; posibilidad de volver o cancelar; convenciones consistentes; prevención de errores; información visible que evita memorizar; favoritos/repetir pedidos para tareas frecuentes; contenido relevante; errores con explicación y solución; ayuda contextual. No bases la explicación de un error únicamente en un toast.

**Otros criterios:** objetivos táctiles amplios y próximos a su contexto de uso; elección progresiva mediante categorías/filtros; patrones conocidos de comercio electrónico; una acción principal por bloque; iconos acompañados de texto cuando su función no sea evidente; campos divididos en grupos manejables. Evita afirmar tiempos o porcentajes de mejora sin haberlos medido.

## 12. Accesibilidad, responsive y estados

Diseña con WCAG 2.2 AA como objetivo y documenta qué verificaste, sin declarar certificación.

- Contraste mínimo 4.5:1 en texto normal y 3:1 en texto grande; estados con texto/icono además del color.
- Navegación por teclado, foco visible, orden lógico, labels reales, HTML semántico, textos alternativos y nombres accesibles.
- Modales con foco contenido, cierre con Escape cuando sea adecuado y retorno del foco al disparador.
- Mensajes de error asociados al campo, resumen de errores y avisos relevantes mediante regiones live.
- Objetivo táctil de diseño de 44 × 44 px para controles principales; diferéncialo del mínimo AA de 24 × 24 px, que tiene excepciones.
- Respeta prefers-reduced-motion, evita carruseles con avance obligatorio y permite pausar cualquier movimiento.
- Soporta ancho de 360 px, tablet de 768 px y escritorio de 1440 px, además de zoom y reflow. Evita scroll horizontal de la página.
- Cliente: navegación inferior en móvil y header en escritorio. Comercio/admin: sidebar en escritorio y menú compacto en móvil. Repartidor: una acción principal clara para cada etapa.
- Convierte tablas en tarjetas o permite desplazamiento contenido cuando sea necesario; no ocultes datos críticos.
- Incluye estados de carga, vacío, éxito, error, deshabilitado, sin resultados, no autorizado y 404, cada uno con una salida útil.

## 13. Arquitectura frontend

Organiza el proyecto por funcionalidades. Usa esta distribución:

| Ruta | Responsabilidad |
| --- | --- |
| public/ | favicon y recursos públicos necesarios |
| src/app/ | composición, providers, router, guards y configuración |
| src/assets/ | marca, imágenes e ilustraciones locales |
| src/styles/ | estilos globales y tokens |
| src/layouts/ | PublicLayout, CustomerLayout, MerchantLayout, CourierLayout, AdminLayout y AuthLayout |
| src/components/ui/ | Button, Input, Select, Dialog, Drawer, Tabs, Badge, Toast, Skeleton y EmptyState |
| src/components/shared/ | ProductCard, MerchantCard, OrderTimeline, AddressForm, PriceSummary y DemoSwitcher |
| src/features/ | auth, catalog, cart, checkout, orders, tracking, customer, merchant, courier, admin, notifications y support |
| src/domain/ | tipos, estados, políticas de transición, disponibilidad y cálculo monetario |
| src/services/ | contratos y repositorios mock, sin lógica visual |
| src/store/ | estado compartido, persistencia, selectores y sincronización |
| src/mocks/ | seed, fixtures y escenarios deterministas |
| src/lib/ | validación, utilidades, moneda y fechas |
| src/test/ | configuración y pruebas de comportamiento |

Dentro de cada feature usa pages/, components/, hooks/ y schemas/ solo si hacen falta; evita directorios vacíos. Los componentes compartidos no importan páginas de features. Las páginas componen UI; los repositorios simulan operaciones; domain contiene reglas; store mantiene la fuente de verdad.

Usa estado local para interacciones visuales efímeras, estado global para sesión/carrito/registros compartidos y parámetros de URL para búsquedas y filtros. Deriva totales e indicadores mediante selectores; no dupliques los mismos datos en diferentes stores. Comparte un solo contrato de pedido entre roles. Carga diferida por grupos de rutas cuando resulte útil.

Rutas mínimas: /, /negocios, /negocios/:id, /productos/:id, /carrito, /checkout, /login, /registro, /registro/comercio, /registro/repartidor, /recuperar-acceso y /restablecer-acceso-demo.

Bajo /cliente incluye pedidos/:id, seguimiento/:id, direcciones, favoritos, perfil y notificaciones. Bajo /comercio incluye tienda, productos, pedidos/:id, seguimiento, reportes y configuracion. Bajo /repartidor incluye solicitudes, entregas/:id, historial, ingresos y perfil. Bajo /admin incluye usuarios, comercios, repartidores, pedidos, categorias, zonas, incidencias, reportes y configuracion. Añade acceso-denegado y catch-all 404.

## 14. Entregables y ejecución

Entrega código completo que pueda instalarse y ejecutarse con npm install, npm run dev y npm run build. Documenta los requisitos reales de Node y los comandos.

Incluye README con arquitectura, credenciales/accesos demo, decisiones añadidas, limitaciones del frontend, restablecimiento de datos, secuencia de demostración, referencias UX y matriz funcional. En la matriz vincula funcionalidad → pantalla → acción comprobable → requisito del informe o ampliación propuesta.

Incluye una nota visual breve con tokens y ejemplos concretos de principios de diseño aplicados. No llenes la interfaz del producto con nombres de librerías, estructuras del proyecto ni explicaciones técnicas; reserva eso al README y al área demo.

No entregues botones decorativos, enlaces vacíos, paneles desconectados, TODO críticos, métricas fijas incongruentes o formularios que solo muestran alert sin cambiar datos. Toda acción visible debe funcionar, validar o explicar por qué está deshabilitada.

Si encuentras un detalle no definido, adopta una decisión pequeña y coherente, documéntala y continúa. No reduzcas el encargo a una landing page ni a capturas estáticas. Completa todos los módulos de esta especificación.

## 15. Criterios de aceptación y demostración

Verifica estos recorridos antes de terminar:
1. Visitante explora, filtra y agrega productos; inicia sesión y conserva el carrito.
2. Cliente registra una dirección, compra productos de dos negocios y ve envíos/subpedidos separados.
3. Comercio ve su subpedido, lo acepta, prepara y marca listo.
4. Repartidor disponible acepta, retira, inicia trayecto y confirma entrega; el cliente ve las mismas transiciones.
5. Un pago rechazado permite corregir/reintentar sin consumir stock ni duplicar pedidos.
6. Cancelar/rechazar restaura stock una sola vez y registra correctamente el reembolso simulado.
7. Un comercio nuevo es aprobado por administración y puede cargar productos; solo ve sus datos.
8. Búsquedas, favoritos, perfiles, exportaciones, incidencias y notificaciones funcionan.
9. Recargar conserva datos; cambiar rol mantiene operaciones; restaurar devuelve el seed.
10. El flujo principal puede completarse en móvil y con teclado; no hay rutas rotas ni errores de consola no resueltos.

Añade pruebas de comportamiento con Vitest y React Testing Library para cálculos monetarios, transiciones, reserva/restauración de stock, aislamiento por rol en la simulación y creación de compra con subpedidos. Usa pruebas manuales o automatizadas del recorrido integrado; registra los resultados reales. No afirmes pruebas que no ejecutaste.

Presenta al finalizar cómo ejecutar, acceder a cada rol y demostrar el ciclo completo. Indica cualquier limitación restante con precisión.

Referencias de diseño y tecnología para consultar:
- React: https://react.dev/learn/thinking-in-react
- Vite: https://vite.dev/guide/
- React Router: https://reactrouter.com/start/declarative/installation
- Tailwind CSS: https://tailwindcss.com/docs
- Zustand: https://zustand.docs.pmnd.rs/
- React Hook Form: https://react-hook-form.com/
- Zod: https://zod.dev/
- Lucide React: https://lucide.dev/guide/react/
- Nielsen: https://www.nngroup.com/articles/ten-usability-heuristics/
- Gestalt/proximidad: https://www.nngroup.com/articles/gestalt-proximity/
- WCAG: https://www.w3.org/WAI/WCAG22/Understanding/

