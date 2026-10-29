import { test, expect, type Page } from '@playwright/test';
const id = (n: number) => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
const createdAt = new Date(Date.now() - 3600000).toISOString();
const courier = { id: id(60), userId: id(1), fullName: 'Repartidor de prueba API', email: 'courier@example.test', phone: '+51912345678', vehicleType: 'bicycle', plate: null, zoneId: id(3), zoneName: 'Zona de prueba', status: 'active', statusReason: null, isOnline: true, createdAt };
const ready = { id: id(8), purchaseId: id(9), code: 'QK-PRUEBA', storeId: id(6), storeName: 'Comercio de prueba API', status: 'ready', version: 8, subtotalCents: 2000, deliveryFeeCents: 350, totalCents: 2350, paymentStatus: 'pending', cashTenderCents: 5000, cashReceivedCents: null, collectedByUserId: null, createdAt, acceptanceExpiresAt: null, assignment: null as null | { id: string; courierUserId: string; status: string; version: number; agreedFeeCents: number },
 items: [{ skuId: id(4), productName: 'Producto de prueba', variantName: 'Grande', quantity: 2, unitPriceCents: 1000, note: '' }],
 destination: { recipientName: 'Destinatario de prueba', phone: '+51987654321', street: 'Jr. Amazonas', streetNumber: '123', reference: 'Portón verde' } as null | { recipientName: string; phone: string; street: string; streetNumber: string; reference: string },
 events: [{ status: 'ready', reason: 'Listo', occurredAt: createdAt }], incidents: [] as { id: string; description: string; createdAt: string }[] };
async function api(page: Page) {
 let order = structuredClone(ready); let online = true; const calls: { path: string; body: any }[] = [];
 await page.route('**/api/v1/**', async route => {
  const url = new URL(route.request().url()); const p = url.pathname.replace('/api/v1', ''); const method = route.request().method();
  if (p === '/auth/session') return route.fulfill({ json: { user: { id: courier.userId, fullName: courier.fullName, email: courier.email, phone: courier.phone, status: 'active', roles: ['courier'], createdAt, memberships: [], courierId: courier.id }, csrfToken: 'a'.repeat(64), expiresAt: '2027-01-01T00:00:00Z' } });
  if (p === '/courier/profile') return route.fulfill({ json: { ...courier, isOnline: online } });
  if (p === '/courier/profile/availability') { online = route.request().postDataJSON().isOnline; return route.fulfill({ json: { ...courier, isOnline: online } }); }
  if (p === '/courier/orders') { const scope = url.searchParams.get('scope'); const matches = scope === 'available' ? !order.assignment && online : scope === 'active' ? order.assignment && ['accepted', 'picked_up'].includes(order.assignment.status) : order.assignment?.status === 'delivered'; return route.fulfill({ json: { items: matches ? [order] : [], nextCursor: null } }); }
  if (p === '/orders/' + ready.id) return route.fulfill({ json: order });
  if (p === '/stores/' + ready.storeId) return route.fulfill({ json: { id: ready.storeId, name: ready.storeName, zone_id: id(3), zone_name: courier.zoneName, category_code: 'test', isOpen: true, accepting_orders: true, logoUrl: null, bannerUrl: null, address_text: 'Dirección de prueba del comercio', phone: '+51911111111' } });
  if (p === '/courier/earnings') return route.fulfill({ json: { from: url.searchParams.get('from'), to: url.searchParams.get('to'), currency: 'PEN', definition: 'Cohorte por creación del pedido [inicio, fin)', orders: 1, delivered: 1, cancelled: 0, deliveredSalesCents: 2350, cashCollectedCents: 2350, courierFeesCents: 350 } });
  if (method === 'POST') {
   const body = route.request().postDataJSON(); calls.push({ path: p, body });
   if (p.endsWith('/claim')) order = { ...order, assignment: { id: id(61), courierUserId: courier.userId, status: 'accepted', version: 4, agreedFeeCents: 350 } };
   else if (p.endsWith('/pickup')) order = { ...order, status: 'in_transit', assignment: { ...order.assignment!, status: 'picked_up', version: 5 } };
   else if (p.endsWith('/incidents')) order.incidents.push({ id: id(62), description: body.reason, createdAt });
   else if (p.endsWith('/deliver')) order = { ...order, status: 'delivered', paymentStatus: 'succeeded', cashReceivedCents: body.cashReceivedCents, collectedByUserId: courier.userId, destination: null, assignment: { ...order.assignment!, status: 'delivered', version: 6 } };
   return route.fulfill({ json: {} });
  }
  return route.fulfill({ status: 404, json: { message: 'No contemplado: ' + p } });
 }); return calls;
}
async function capture(page: Page, name: string, width: number) {
 await page.screenshot({ path: 'test-results/courier-' + name + '-' + width + '.png', fullPage: true });
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
for (const width of [1366, 390]) test('operación original del repartidor ' + width, async ({ page }) => {
 await page.setViewportSize({ width, height: 900 }); const calls = await api(page);
 await page.goto('/repartidor/solicitudes');
 await expect(page.getByRole('button', { name: /Aceptar entrega/ })).toBeEnabled(); await capture(page, 'solicitudes', width);
 await page.getByRole('button', { name: /Aceptar entrega/ }).click();
 await expect(page.getByRole('button', { name: 'Confirmar recojo' })).toBeEnabled();
 await page.reload(); await expect(page.getByRole('button', { name: 'Confirmar recojo' })).toBeEnabled(); await capture(page, 'recojo', width);
 await page.getByRole('button', { name: 'Confirmar recojo' }).click();
 await expect(page.getByRole('button', { name: 'Confirmar entrega', exact: true })).toBeEnabled(); await capture(page, 'entrega', width);
 await page.getByRole('button', { name: 'Reportar incidencia' }).click();
 await page.getByLabel('Comentario adicional (opcional)').fill('Comentario de prueba'); await page.getByRole('button', { name: 'Enviar incidencia' }).click();
 await expect(page.getByText('Incidencia enviada a soporte.')).toBeVisible(); await page.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
 await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
 await page.getByLabel('Efectivo recibido (S/)').fill('50'); await capture(page, 'confirmacion', width);
 await page.getByRole('button', { name: 'Finalizar entrega' }).click();
 await expect(page.getByRole('heading', { name: 'Historial de entregas' })).toBeVisible();
 await page.getByRole('button', { name: /Ver detalle de/ }).click(); await capture(page, 'historial', width);
 await page.reload(); await expect(page.getByRole('heading', { name: 'QK-PRUEBA', exact: true })).toBeVisible();
 await page.goto('/repartidor/ingresos'); await expect(page.getByText('Tarifas acumuladas')).toBeVisible(); await capture(page, 'ingresos', width);
 await page.getByLabel('Período').selectOption('semana'); await expect(page.getByText('Tarifas acumuladas')).toBeVisible();
 await page.goto('/repartidor/perfil'); await expect(page.getByText('Repartidor de prueba API')).toBeVisible(); await capture(page, 'perfil', width);
 await page.getByRole('button', { name: 'Pausar disponibilidad' }).click(); await expect(page.getByRole('button', { name: 'Activar disponibilidad' })).toBeVisible();
 expect(calls).toHaveLength(4);
 expect(calls[0]).toEqual({ path: '/courier/orders/' + ready.id + '/claim', body: { expectedVersion: 8 } });
 expect(calls[3]).toEqual({ path: '/courier/assignments/' + id(61) + '/deliver', body: { expectedVersion: 5, cashReceivedCents: 5000 } });
});
