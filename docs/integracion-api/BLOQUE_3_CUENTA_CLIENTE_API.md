# Bloque 3: identidad, solicitudes y cuenta del cliente

Fecha: 2026-10-29. Implementación dentro de las vistas originales. Se mantienen el router y los estilos globales.

## Implementado

- Login y registro usan respuestas validadas del backend. Se retiraron contraseñas por defecto en los wrappers, reintentos de login con un rol usado como contraseña y el código de verificación inventado cuando falla la red. Los códigos dev devueltos por backend solo se exponen en compilaciones de desarrollo.
- El backend ahora valida siempre el hash de contraseña: se retiró la excepción que aceptaba 123456 o Password123! para cuentas @quickly.pe, aunque su hash no coincidiera.
- Las guardas esperan la restauración de sesión y verifican roles/estado del usuario. Los layouts conservan su interfaz y usan membresías, tiendas y perfiles reales; al cambiar de cuenta se remonta el contenido privado.
- La selección de tienda procede del listado autorizado. Los contadores de los menús de comercio y administración ya consultan API. Sus páginas internas siguen sujetas a los bloques 4–7.
- Los cierres de sesión esperan la respuesta y muestran errores; no navegan anunciando un cierre que falló.
- Los formularios originales de afiliación comercial y postulación de reparto guardan mediante API. Nombre y teléfono de la cuenta se actualizan donde corresponde; categoría y zona provienen del backend. La zona de reparto se agrega como campo requerido en el formulario existente.
- Se consultan las solicitudes previas y su estado/motivo después de recargar. No hay aprobación ni concesión de roles desde el frontend.
- Favoritos consulta todas las páginas y resuelve productos/tiendas reales. Conserva pestañas, buscador, tarjetas y modal original; un favorito no disponible se identifica y puede quitarse sin inventar un producto.
- Notificaciones consulta todas las páginas, marca lectura individual/total y actualiza el menú. Vacío, carga y error se diferencian.
- Perfil guarda solo con éxito confirmado, consulta avatar y permite subir/quitar PNG mediante los endpoints existentes. Contadores y total pagado proceden de pedidos, direcciones, favoritos y avisos reales; el gasto se limita a subpedidos entregados y pagados.
- Ayuda guarda tickets y usa su UUID real. Vincula solo órdenes de la cuenta, consulta el historial y permite leer/enviar mensajes en la tarjeta original.
- Se corrigieron FAQ, tiempos de respuesta, teléfonos y WhatsApp ficticios. Los canales sin configuración quedan deshabilitados conservando sus tarjetas.
- El detalle original del pedido permite consultar los movimientos reales de pagos/reembolsos dentro de su tarjeta de pago.
- Recuperación de contraseña conserva su formulario, pero queda deshabilitada con explicación: no existe todavía un endpoint de restablecimiento. Se retiraron el correo precargado, el éxito falso y la contraseña temporal publicada.

## Fuentes API

Identidad: /auth/session, /auth/login, /auth/register, /auth/google, /auth/verification-code/send y /me.
Medios: /me/avatar.
Solicitudes y membresías: /merchant/stores, /merchant/categories, /courier/profile y /geography/zones.
Cuenta: /me/favorites, /me/notifications y sus operaciones de lectura.
Soporte: /me/tickets, /me/tickets/{id}, /tickets/{id}/messages y /me/orders para seleccionar una orden real.
Pagos: /me/purchases/{id}/payments.
Menús operativos: tiendas autorizadas, order-feed, perfil/disponibilidad de reparto, /admin/overview y tickets administrativos.

Las URLs usan los clientes existentes y el prefijo/configuración común /api/v1. No se introdujo acceso directo a tablas de Supabase.

## Verificación reducida solicitada

- Compilación del frontend y backend.
- Dos archivos existentes de sesión/permisos: 17 pruebas aprobadas.
- Una regresión crítica de login en backend: dos casos aprobados que comprueban que las contraseñas de demostración no evaden la validación.
- Revisión de tipos, diff y ausencia de useDataStore en las vistas de cliente e identidad intervenidas.
- No se ejecutó la suite completa ni recorridos de navegador para este bloque. No se afirma validación visual o funcional exhaustiva.
- No se ejecutaron migraciones, seeds ni escrituras contra Supabase. La validación con correo/Google reales, carga de medios y DB queda pendiente en el entorno de pruebas.

## Siguiente bloque

Continuar con el bloque 4: gestión de tienda, productos, variantes e inventario dentro de MerchantStorePage, MerchantProductsPage y MerchantSettingsPage. La eliminación completa del almacén mock y su aislamiento del bundle sigue reservada al bloque 8.

Ver [plan y checklist](PLAN_IMPLEMENTACION_POR_BLOQUES.md).
