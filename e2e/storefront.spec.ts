import { test, expect, type Page } from '@playwright/test';

const store = {
  id: '30000000-0000-4000-8000-000000000001', name: 'Comercio de prueba API', category_code: 'ropa',
  zone_id: '40000000-0000-4000-8000-000000000001', zone_name: 'Zona de prueba', address_text: 'Calle de prueba 20', phone: '+51912345678',
  description: 'Información devuelta por el servidor de prueba.', isOpen: true, accepting_orders: true,
  preparation_minutes: 18, minimum_order_cents: 1000, base_fee_cents: 350, rating_average: null, rating_count: 0,
  logoUrl: null, bannerUrl: null, openingIntervals: [{ weekday: 1, opens_at: '08:00:00', closes_at: '20:00:00' }],
};
const product = {
  id: '20000000-0000-4000-8000-000000000001', storeId: store.id, storeName: store.name,
  categoryId: '40000000-0000-4000-8000-000000000002', name: 'Camisa disponible de la API', description: 'Algodón', brand: 'Marca de prueba', isActive: true, position: 0, images: [],
  skus: [
    { id: '10000000-0000-4000-8000-000000000001', skuCode: 'PEQ', variantName: 'Pequeña', priceCents: 1000, barcode: null, isActive: true, availableStock: 3 },
    { id: '10000000-0000-4000-8000-000000000002', skuCode: 'GRA', variantName: 'Grande', priceCents: 2350, barcode: null, isActive: true, availableStock: 2 },
  ],
};
async function api(page: Page, state = { fail: false, empty: false }) {
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace('/api/v1', '');
    if (p === '/auth/session') return route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED', message: 'Sin sesión' } });
    if (p === '/stores') return route.fulfill({ json: state.empty ? [] : [store] });
    if (p === `/stores/${store.id}`) return route.fulfill({ json: store });
    if (p === '/catalog/search') return route.fulfill({ status: state.fail ? 503 : 200, json: state.fail ? { message: 'Catálogo temporalmente indisponible' } : { items: state.empty ? [] : [product], nextCursor: null } });
    if (p === '/catalog/categories') return route.fulfill({ json: [{ id: product.categoryId, code: 'clothing', name: 'Ropa' }] });
    if (p === `/products/${product.id}`) return route.fulfill({ json: product });
    if (p.startsWith('/products/')) return route.fulfill({ status: 404, json: { message: 'Producto no disponible' } });
    if (p.endsWith('/reviews')) return route.fulfill({ json: { items: [], nextCursor: null, count: 0, average: null } });
    return route.fulfill({ json: [] });
  });
}

test('vistas originales: listado, detalle, SKU y carrito funcionan en escritorio y móvil', async ({ page }) => {
  await api(page);
  await page.goto('/negocios?categoria=ropa');
  await expect(page.getByRole('heading', { name: 'Textiles & Confección', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Productos (1)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Comercios (1)' })).toBeVisible();
  await expect(page.getByPlaceholder(/Buscar productos por nombre, marca o tienda/)).toBeVisible();
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Filtros del catálogo' })).toHaveCount(0);
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/storefront-list-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole('heading', { name: product.name }).click();
  await expect(page).toHaveURL(new RegExp(`/producto/${product.id}$`));
  await expect(page.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Grande', exact: true }).click();
  await expect(page.getByText(/23\.50/).first()).toBeVisible();
  await expect(page.getByText(/% OFF|500 vendidos|175 calificaciones/)).toHaveCount(0);
  await page.screenshot({ path: 'test-results/storefront-product-1366.png', fullPage: true });
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  await page.goto('/carrito');
  await expect(page.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  await expect(page.getByText('Grande', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quickly_cart_real_v2')!)[0].skuId)).toBe(product.skus[1].id);
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/storefront-cart-390.png', fullPage: true });
});

test('error, vacío y 404 mantienen la vista original sin entidades mock', async ({ page }) => {
  const state = { fail: true, empty: false };
  await api(page, state);
  await page.goto('/negocios?q=camisa');
  await expect(page.getByRole('alert')).toHaveText('Catálogo temporalmente indisponible');
  await expect(page.getByRole('heading', { name: product.name })).toHaveCount(0);
  state.fail = false; state.empty = true;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByText('No encontramos productos con "camisa"')).toBeVisible();
  await page.goto('/producto/20000000-0000-4000-8000-000000000099');
  await expect(page.getByRole('alert')).toHaveText('Producto no disponible');
  await expect(page.getByRole('button', { name: 'Comprar ahora' })).toHaveCount(0);
  await page.goto('/');
  await expect(page.getByText('No hay productos destacados disponibles en este momento.')).toBeVisible();
  await expect(page.getByText('No hay comercios activos disponibles.')).toBeVisible();
});
