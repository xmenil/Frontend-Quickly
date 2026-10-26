import { test, expect, Page } from '@playwright/test';
import { randomUUID, randomInt } from 'node:crypto';

const password = 'Solo-pruebas-navegador-42';
async function register(page: Page) {
  const email = `browser-${randomUUID()}@example.test`;
  await page.goto('/registro');
  await page.getByLabel('Nombres y apellidos').fill('Persona del navegador');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Celular').fill(`9${randomInt(10000000, 99999999)}`);
  await page.getByLabel(/^Contraseña/).fill(password);
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/cliente\/perfil$/);
  await expect(page.getByLabel('Nombres y apellidos')).toHaveValue('Persona del navegador');
  return email;
}

test('registro, cookie HttpOnly, recarga, perfil persistido y logout real', async ({ page, context }) => {
  await register(page);
  const session = (await context.cookies()).find((cookie) => cookie.name === 'quickly_session');
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie.includes('quickly_session'))).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('quickly_auth_v1'))).toBeNull();
  await page.getByLabel('Nombres y apellidos').fill('Nombre actualizado en servidor');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toHaveText('Tus datos se guardaron correctamente.');
  await page.reload();
  await expect(page.getByLabel('Nombres y apellidos')).toHaveValue('Nombre actualizado en servidor');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some((cookie) => cookie.name === 'quickly_session')).toBe(false);
  await page.goto('/cliente/perfil');
  await expect(page).toHaveURL(/\/login$/);
});

test('login inválido no crea sesión; cliente no accede a administración ni confirma compras mock', async ({ page }) => {
  const email = await register(page);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel(/^Contraseña/).fill('incorrecta');
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incorrectos');
  await page.getByLabel(/^Contraseña/).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/cliente\/perfil$/);
  await page.goto('/admin/usuarios');
  await expect(page).toHaveURL(/\/acceso-denegado$/);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Esta sección estará disponible próximamente' })).toBeVisible();
  await expect(page.getByRole('button', { name: /confirmar compra/i })).toHaveCount(0);
});

test('logout se sincroniza entre pestañas y perfil funciona en móvil', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const second = await context.newPage();
  await second.goto('/cliente/perfil');
  await expect(second.getByLabel('Nombres y apellidos')).toHaveValue('Persona del navegador');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(second).toHaveURL(/\/login$/);
});

test('storage manipulado no concede identidad; error de red ofrece reintento', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('quickly_auth_v1', JSON.stringify({ id: 'forged', role: 'admin' })));
  await page.goto('/admin/usuarios');
  await expect(page).toHaveURL(/\/login$/);
  await page.route('**/api/v1/auth/session', (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'No pudimos conectar con Quickly' })).toBeVisible();
  await page.unroute('**/api/v1/auth/session');
  await page.getByRole('button', { name: 'Reintentar conexión' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});
