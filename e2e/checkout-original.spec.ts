import { test, expect, type Page } from '@playwright/test';
const id = (n: number) => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
const createdAt = '2026-10-29T12:00:00Z';
const address = { id: id(2), label: 'Casa API', recipientName: 'Ana API', phone: '+51912345678', zoneId: id(3), zoneName: 'Zona API', zoneActive: true, street: 'Jr. Amazonas', streetNumber: '123', reference: 'Portón verde', isDefault: true, latitude: null, longitude: null };
const item = { skuId: id(4), productId: id(5), storeId: id(6), quantity: 2, note: 'Sin bolsa', selected: true, revision: id(7) };
const line = { skuId: item.skuId, productName: 'Producto de la API', variantName: 'Grande', quantity: 2, unitPriceCents: 1000, note: item.note };
const quote = { storeId: item.storeId, storeName: 'Tienda API', items: [line], subtotalCents: 2000, deliveryFeeCents: 350, totalCents: 2350, cashTenderCents: 2350, cashChangeCents: 0, paymentMethods: ['cash'] };
const order = { id: id(8), purchaseId: id(9), checkoutGroupId: null, code: 'PED-API', storeId: item.storeId, storeName: quote.storeName, status: 'pending', version: 1,
 subtotalCents: 2000, deliveryFeeCents: 350, totalCents: 2350, paymentStatus: 'pending', cashTenderCents: 5000, cashReceivedCents: null, collectedByUserId: null, createdAt, acceptanceExpiresAt: null, assignment: null,
 items: [line], destination: { recipientName: address.recipientName, phone: address.phone, street: address.street, streetNumber: address.streetNumber, reference: address.reference },
 events: [{ status: 'pending', reason: 'Pedido registrado por la API', occurredAt: createdAt }] };
async function api(page: Page, state = { lost: false, group: false, posts: [] as { body: any; key?: string }[] }) {
 await page.addInitScript(({ item, group }) => {
  if (!localStorage.getItem('checkout_test_seed')) {
   localStorage.setItem('checkout_test_seed', '1'); localStorage.setItem('quickly_cart_real_v2', JSON.stringify(group ? [item, { ...item, skuId: '10000000-0000-4000-8000-000000000051', productId: '10000000-0000-4000-8000-000000000052', storeId: '10000000-0000-4000-8000-000000000050' }] : [item]));
  }
 }, { item, group: state.group });
 const second = { ...order, id: id(54), storeId: id(50), purchaseId: id(55), storeName: 'Segunda tienda', items: [{ ...line, skuId: id(51) }], checkoutGroupId: id(53) };
 const group = { id: id(53), createdAt, subtotalCents: 4000, deliveryFeeCents: 700, totalCents: 4700,
  orders: [order, second].map(o => ({ orderId: o.id, purchaseId: o.purchaseId, storeId: o.storeId, storeName: o.storeName, code: o.code, status: o.status, paymentStatus: o.paymentStatus, subtotalCents: o.subtotalCents, deliveryFeeCents: o.deliveryFeeCents, totalCents: o.totalCents })) };
 await page.route('**/api/v1/**', async route => {
  const p = new URL(route.request().url()).pathname.replace('/api/v1', '');
  if (p === '/auth/session') return route.fulfill({ json: { user: { id: id(1), fullName: 'Ana API', email: 'ana@example.test', phone: address.phone, status: 'active', roles: ['customer'], createdAt, memberships: [], courierId: null }, csrfToken: 'a'.repeat(64), expiresAt: '2027-01-01T00:00:00Z' } });
  if (p === '/me/addresses') return route.fulfill({ json: [address] });
  if (p === '/geography/zones') return route.fulfill({ json: [{ id: id(3), code: 'API', name: 'Zona API', description: 'Cobertura API', baseFeeCents: 350, estimatedMinutes: 20, isActive: true }] });
  if (p === '/payment-methods') return route.fulfill({ json: [{ code: 'cash', label: 'Efectivo', available: true, unavailableReason: null }] });
  if (p === '/checkout/quote') { const body = route.request().postDataJSON(); const cash = body.cashTenderCents ?? quote.totalCents; return route.fulfill({ json: { ...quote, cashTenderCents: cash, cashChangeCents: cash - quote.totalCents } }); }
  if (p === '/checkout/groups/quote') return route.fulfill({ json: { stores: [quote, { ...quote, storeId: second.storeId, storeName: second.storeName, items: second.items }], subtotalCents: 4000, deliveryFeeCents: 700, totalCents: 4700 } });
  if (p === '/purchases' || p === '/checkout/groups') {
   state.posts.push({ body: route.request().postDataJSON(), key: route.request().headers()['idempotency-key'] });
   if (state.lost) return route.abort('failed');
   return route.fulfill({ status: 201, json: state.group ? group : { orderId: order.id, purchaseId: order.purchaseId } });
  }
  if (p.startsWith('/me/checkout-attempts/')) return route.fulfill({ json: order });
  if (p.startsWith('/me/group-checkout-attempts/') || p.startsWith('/me/checkout-groups/')) return route.fulfill({ json: group });
  if (p === '/orders/' + order.id) return route.fulfill({ json: { ...order, checkoutGroupId: state.group ? group.id : null } });
  if (p === '/orders/' + second.id) return route.fulfill({ json: second });
  if (p === '/me/orders') return route.fulfill({ json: { items: state.group ? [{ ...order, checkoutGroupId: group.id }, second] : [order], nextCursor: null } });
  if (p === '/me/notifications') return route.fulfill({ json: { items: [], nextCursor: null, unreadCount: 0 } });
  if (p === '/catalog/categories' || p === '/stores') return route.fulfill({ json: [] });
  if (p === '/catalog/search') return route.fulfill({ json: { items: [], nextCursor: null } });
  return route.fulfill({ status: 404, json: { message: 'Ruta no contemplada en la prueba: ' + p } });
 });
 return state;
}
async function steps(page: Page, width: number, capture = 'checkout') {
 await page.goto('/checkout');
 await expect(page.getByRole('heading', { name: 'Finalizar pedido' })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Continuar al pago' })).toBeEnabled();
 await page.screenshot({ path: 'test-results/' + capture + '-direccion-' + width + '.png', fullPage: true });
 await page.getByRole('button', { name: 'Continuar al pago' }).click();
 await expect(page.getByRole('radio', { name: 'Yape / Plin' })).toBeDisabled();
 await page.getByRole('radio', { name: 'Efectivo contra entrega' }).check();
 const cash = page.getByLabel('Monto con el que pagarás');
 if (await cash.isEnabled()) await cash.fill('50');
 await page.screenshot({ path: 'test-results/' + capture + '-pago-' + width + '.png', fullPage: true });
 await page.getByRole('button', { name: 'Revisar pedido' }).click();
 await expect(page.getByRole('button', { name: /Confirmar pedido/ })).toBeEnabled();
 await page.screenshot({ path: 'test-results/' + capture + '-revision-' + width + '.png', fullPage: true });
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
for (const width of [1366, 390]) test('checkout y pedido en vista original ' + width, async ({ page }) => {
 await page.setViewportSize({ width, height: 900 }); const state = await api(page); await steps(page, width);
 await page.getByRole('button', { name: /Confirmar pedido/ }).click();
 await expect(page).toHaveURL(new RegExp('/cliente/pedidos/' + order.id + '$'));
 await expect(page.getByRole('heading', { name: 'Pedido registrado', exact: true })).toBeVisible();
 await expect(page.getByText('Producto de la API', { exact: true })).toBeVisible();
 await expect(page.getByRole('heading', { name: 'Subpedidos por Tienda (1)' })).toBeVisible();
 expect(state.posts).toHaveLength(1); expect(state.posts[0].body.expectedTotalCents).toBe(2350); expect(state.posts[0].key).toBeTruthy();
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quickly_cart_real_v2')!))).toEqual([]);
 await page.screenshot({ path: 'test-results/checkout-pedido-' + width + '.png', fullPage: true });
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.getByRole('link', { name: 'Seguimiento en Mapa' }).click();
 await expect(page.getByRole('heading', { name: 'Seguimiento del Pedido' })).toBeVisible();
 await expect(page.getByText('Pedido registrado por la API')).toBeVisible();
 await page.screenshot({ path: 'test-results/checkout-seguimiento-' + width + '.png', fullPage: true });
 await page.goto('/cliente/pedidos'); await expect(page.getByRole('heading', { name: 'Mis Pedidos' })).toBeVisible();
 await expect(page.getByRole('link', { name: 'Ver Detalle' })).toBeVisible();
});
test('respuesta perdida se recupera tras recarga sin duplicar', async ({ page }) => {
 const state = await api(page, { lost: true, group: false, posts: [] }); await steps(page, 1366, 'checkout-recuperacion');
 await page.getByRole('button', { name: /Confirmar pedido/ }).click();
 await expect(page.getByRole('button', { name: 'Recuperar o reintentar confirmación' })).toBeEnabled();
 await page.reload(); await page.getByRole('button', { name: 'Recuperar o reintentar confirmación' }).click();
 await expect(page).toHaveURL(new RegExp('/cliente/pedidos/' + order.id + '$'));
 expect(state.posts).toHaveLength(1);
});
test('compra de dos tiendas utiliza el detalle rico original', async ({ page }) => {
 const state = await api(page, { lost: false, group: true, posts: [] }); await steps(page, 1366, 'checkout-grupo');
 await page.getByRole('button', { name: /Confirmar pedido/ }).click();
 await expect(page).toHaveURL(new RegExp('/cliente/compras/' + id(53) + '$'));
 await expect(page.getByRole('heading', { name: 'Subpedidos por Tienda (2)' })).toBeVisible();
 expect(state.posts[0].body.cashTenderCents).toBeNull(); expect(state.posts[0].body.expectedTotalCents).toBe(4700);
 await page.getByRole('link', { name: 'Seguimiento en Mapa' }).click();
 await expect(page.getByRole('button', { name: /Segunda tienda/ })).toBeVisible();
});
