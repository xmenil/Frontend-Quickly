import { test, expect, Page, Browser } from '@playwright/test';
import { randomUUID, randomInt } from 'node:crypto';
const password = 'Solo-pruebas-F2-browser-42';
async function register(page: Page, label: string) {
  const fullName = `Persona ${label} ${randomUUID().slice(0, 6)}`; const email = `${randomUUID()}@example.test`;
  await page.goto('/registro'); await page.getByLabel('Nombres y apellidos').fill(fullName);
  await page.getByLabel('Correo electrónico').fill(email); await page.getByLabel('Celular').fill(`9${randomInt(10000000, 99999999)}`);
  await page.getByLabel(/^Contraseña/).fill(password); await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/cliente\/perfil$/); return { fullName, email };
}
async function administrator(browser: Browser) {
  if (!process.env.BROWSER_ADMIN_EMAIL || !process.env.BROWSER_ADMIN_PASSWORD) throw new Error('Ejecutar mediante harness aislado');
  const context = await browser.newContext({ baseURL: 'http://localhost:5174' }); const page = await context.newPage();
  await page.goto('/login'); await page.getByLabel('Correo electrónico').fill(process.env.BROWSER_ADMIN_EMAIL);
  await page.getByLabel(/^Contraseña/).fill(process.env.BROWSER_ADMIN_PASSWORD); await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/resumen$/); return { context, page };
}
async function createZone(page: Page) {
  const name = `Zona ${randomUUID().slice(0, 8)}`;
  await page.goto('/admin/zonas'); await page.getByRole('button', { name: 'Crear zona', exact: true }).click();
  await page.getByLabel('Código de zona').fill(`z-${randomUUID().slice(0, 8)}`); await page.getByLabel('Nombre de zona').fill(name);
  await page.getByLabel('Descripción de cobertura').fill('Sector de prueba controlado'); await page.getByLabel('Tarifa de envío (S/)').fill('3.50');
  await page.getByRole('button', { name: 'Guardar zona' }).click(); await expect(page.getByText('Zona guardada correctamente.', { exact: true })).toBeVisible();
  return name;
}
function article(page: Page, name: string) { return page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) }); }
async function decision(page: Page, name: string, action: string, reason: string) {
  const row = article(page, name); await expect(row).toBeVisible(); await row.getByRole('button', { name: action, exact: true }).click();
  await row.getByLabel('Motivo de la decisión').fill(reason); await row.getByRole('button', { name: 'Confirmar decisión' }).click();
  await expect(page.getByText('Decisión registrada correctamente.', { exact: true })).toBeVisible();
}

test('F2: afiliación, aprobación, horarios y miembros con revocación de acceso', async ({ page, browser }) => {
  test.setTimeout(90000);
  const admin = await administrator(browser); const memberContext = await browser.newContext({ baseURL: 'http://localhost:5174' });
  try {
    const zone = await createZone(admin.page); await register(page, 'negocio'); const name = `Tienda ${randomUUID().slice(0, 8)}`;
    await page.goto('/registro/comercio'); await page.getByLabel('Nombre comercial').fill(name); await page.getByLabel('Categoría').selectOption('restaurantes');
    await page.getByLabel('Zona de la tienda').selectOption({ label: zone }); await page.getByLabel('Dirección del negocio').fill('Calle de negocio 20');
    await page.getByRole('button', { name: 'Enviar solicitud de comercio' }).click(); await expect(page).toHaveURL(/\/cliente\/solicitudes$/);
    await expect(article(page, name).getByText('Pendiente de aprobación', { exact: true })).toBeVisible();
    await admin.page.goto('/admin/comercios'); await decision(admin.page, name, 'Aprobar', 'Datos comerciales revisados');
    await page.getByRole('button', { name: 'Actualizar estado' }).click(); await expect(article(page, name).getByText('Aprobado', { exact: true })).toBeVisible();
    await article(page, name).getByRole('link', { name: 'Administrar tienda' }).click(); await expect(page.getByRole('heading', { name: 'Mis tiendas' })).toBeVisible();
    await page.getByRole('button', { name: 'Horarios', exact: true }).click(); await page.getByRole('button', { name: 'Agregar turno de lunes' }).click();
    await page.getByLabel(/^Apertura Lunes/).fill('00:00'); await page.getByLabel(/^Cierre Lunes/).fill('24:00');
    await page.getByRole('button', { name: 'Guardar horario', exact: true }).click(); await expect(page.getByText('Horario guardado correctamente.', { exact: true })).toBeVisible();
    await page.reload(); await page.getByRole('button', { name: 'Horarios', exact: true }).click(); await expect(page.getByLabel(/^Cierre Lunes/)).toHaveValue('24:00');
    const memberPage = await memberContext.newPage(); const member = await register(memberPage, 'operador');
    await page.getByRole('button', { name: 'Equipo', exact: true }).click(); await page.getByLabel('Correo de la persona').fill(member.email);
    await page.getByRole('button', { name: 'Guardar miembro' }).click(); await expect(page.getByText('Membresía guardada.', { exact: true })).toBeVisible();
    await memberPage.goto('/comercio/tienda'); await expect(memberPage.getByText('Tu acceso no permite modificar la configuración de esta tienda.')).toBeVisible();
    const row = page.getByRole('article').filter({ hasText: member.email }); await row.getByRole('button', { name: 'Revocar acceso' }).click(); await row.getByRole('button', { name: 'Confirmar revocación' }).click();
    await expect(page.getByText('Acceso revocado.', { exact: true })).toBeVisible(); await memberPage.reload(); await expect(memberPage).toHaveURL(/\/acceso-denegado$/);
  } finally { await memberContext.close(); await admin.context.close(); }
});

test('F2: reparto rechazado, corrección, aprobación, disponibilidad y suspensión', async ({ page, browser }) => {
  test.setTimeout(90000); const admin = await administrator(browser);
  try {
    const zone = await createZone(admin.page); const person = await register(page, 'reparto');
    await page.goto('/registro/repartidor'); await page.getByLabel('Zona de reparto').selectOption({ label: zone });
    await page.getByRole('button', { name: 'Enviar solicitud de reparto' }).click(); await expect(page).toHaveURL(/\/cliente\/solicitudes$/);
    await admin.page.goto('/admin/repartidores'); await decision(admin.page, person.fullName, 'Rechazar', 'Completa la información del vehículo');
    await page.getByRole('button', { name: 'Actualizar estado' }).click(); await expect(page.getByText('Completa la información del vehículo', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Ver o corregir solicitud', exact: true }).click(); await page.getByLabel('Vehículo', { exact: false }).first().selectOption('motorcycle');
    await page.getByLabel('Placa del vehículo').fill('F2-123'); await page.getByRole('button', { name: 'Guardar perfil de reparto' }).click();
    await admin.page.goto('/admin/repartidores'); await decision(admin.page, person.fullName, 'Aprobar', 'Vehículo revisado');
    await page.getByRole('button', { name: 'Actualizar estado' }).click(); await page.getByRole('link', { name: 'Ver perfil de reparto', exact: true }).click();
    await page.getByRole('button', { name: 'Activar disponibilidad' }).click(); await expect(page.getByText('Disponible para recibir entregas', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByText('Disponible para recibir entregas', { exact: true })).toBeVisible();
    await admin.page.getByLabel('Estado de solicitudes').selectOption('active'); await decision(admin.page, person.fullName, 'Suspender', 'Revisión operativa temporal');
    await page.goto('/cliente/solicitudes'); await expect(page.getByText('Revisión operativa temporal', { exact: true })).toBeVisible();
    await page.goto('/repartidor/perfil'); await expect(page).toHaveURL(/\/acceso-denegado$/);
  } finally { await admin.context.close(); }
});

test('F2: direcciones reales, predeterminada, zona inactiva y archivo en móvil', async ({ page, browser }) => {
  test.setTimeout(90000); const admin = await administrator(browser);
  try {
    const zone = await createZone(admin.page); await page.setViewportSize({ width: 390, height: 844 }); await register(page, 'direccion');
    await page.goto('/cliente/direcciones');
    for (const label of ['Casa','Trabajo']) {
      await page.getByRole('button', { name: 'Agregar dirección' }).click(); await page.getByLabel('Nombre de la dirección').fill(label);
      await page.getByLabel('Calle o avenida').fill('Calle de prueba'); await page.getByLabel('Número', { exact: false }).fill('15');
      await page.getByLabel('Zona de cobertura').selectOption({ label: zone }); await page.getByRole('button', { name: 'Guardar dirección', exact: true }).click();
      await expect(page.getByText('Dirección guardada correctamente.', { exact: true })).toBeVisible();
    }
    await article(page, 'Trabajo').getByRole('button', { name: 'Definir como predeterminada' }).click(); await expect(article(page, 'Trabajo').getByText('Predeterminada', { exact: true })).toBeVisible();
    await page.reload(); await expect(article(page, 'Trabajo').getByText('Predeterminada', { exact: true })).toBeVisible();
    await article(admin.page, zone).getByRole('button', { name: 'Editar zona' }).click(); await admin.page.getByLabel('Zona habilitada').uncheck();
    await admin.page.getByLabel('Motivo del cambio de zona').fill('Cobertura en revisión'); await admin.page.getByRole('button', { name: 'Guardar zona' }).click();
    await expect(admin.page.getByText('Zona guardada correctamente.', { exact: true })).toBeVisible();
    await page.reload(); await expect(article(page, 'Casa').getByText(/Zona inactiva/)).toBeVisible();
    await article(page, 'Trabajo').getByRole('button', { name: 'Archivar dirección' }).click(); await article(page, 'Trabajo').getByRole('button', { name: 'Confirmar archivo' }).click();
    await expect(article(page, 'Trabajo')).toHaveCount(0); await expect(article(page, 'Casa').getByText('Predeterminada', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally { await admin.context.close(); }
});

test('F2: administración suspende y reactiva cuentas sin restaurar la sesión revocada', async ({ page, browser }) => {
  test.setTimeout(90000); const admin = await administrator(browser);
  try {
    const person = await register(page, 'cuenta'); await admin.page.goto('/admin/usuarios');
    const row = article(admin.page, person.fullName); await row.getByRole('button', { name: 'Suspender cuenta' }).click();
    await row.getByLabel('Motivo del cambio de cuenta').fill('Cuenta bajo revisión'); await row.getByRole('button', { name: 'Confirmar cambio de cuenta' }).click();
    await expect(admin.page.getByText('Estado de cuenta actualizado.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Guardar cambios' }).click(); await expect(page).toHaveURL(/\/login$/);
    await row.getByRole('button', { name: 'Activar cuenta' }).click(); await row.getByLabel('Motivo del cambio de cuenta').fill('Revisión finalizada');
    await row.getByRole('button', { name: 'Confirmar cambio de cuenta' }).click(); await expect(admin.page.getByText('Estado de cuenta actualizado.', { exact: true })).toBeVisible();
    await page.goto('/cliente/perfil'); await expect(page).toHaveURL(/\/login$/); await page.getByLabel('Correo electrónico').fill(person.email);
    await page.getByLabel(/^Contraseña/).fill(password); await page.getByRole('button', { name: 'Ingresar', exact: true }).click(); await expect(page).toHaveURL(/\/cliente\/perfil$/);
  } finally { await admin.context.close(); }
});
