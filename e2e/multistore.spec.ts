import {test,expect,Page} from '@playwright/test';
import {randomUUID,randomInt} from 'node:crypto';
const origin={Origin:'http://localhost:5174'};
async function register(page:Page,label:string){
 await page.goto('/registro');await page.getByLabel('Nombres y apellidos').fill(`Persona ${label}`);
 await page.getByLabel('Correo electrónico').fill(`${randomUUID()}@example.test`);await page.getByLabel('Celular').fill(`9${randomInt(10000000,99999999)}`);
 await page.getByLabel(/^Contraseña/).fill('Solo-pruebas-F7-browser-42');await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();
 await expect(page).toHaveURL(/\/cliente\/perfil$/);return(await page.request.get('/api/v1/auth/session')).json();
}
test('F7: carrito multitienda, envíos desglosados, recuperación sin duplicados y cancelación independiente en móvil',async({page,browser})=>{
 test.setTimeout(150000);const adminContext=await browser.newContext({baseURL:'http://localhost:5174'});const merchantContext=await browser.newContext({baseURL:'http://localhost:5174'});
 const admin=await adminContext.newPage(),merchant=await merchantContext.newPage();
 try{
  await admin.goto('/login');await admin.getByLabel('Correo electrónico').fill(process.env.BROWSER_ADMIN_EMAIL!);await admin.getByLabel(/^Contraseña/).fill(process.env.BROWSER_ADMIN_PASSWORD!);
  await admin.getByRole('button',{name:'Ingresar',exact:true}).click();await expect(admin).toHaveURL(/\/admin\/resumen$/);
  const adminSession=await(await admin.request.get('/api/v1/auth/session')).json();const ah={...origin,'X-CSRF-Token':adminSession.csrfToken};
  const zoneResult=await admin.request.post('/api/v1/admin/zones',{headers:ah,data:{code:`f7-${randomUUID().slice(0,8)}`,name:'Zona F7 browser',description:'Zona de prueba',baseFeeCents:300,estimatedMinutes:20}});expect(zoneResult.status()).toBe(201);const zoneId=(await zoneResult.json()).id;
  const customer=await register(page,'Cliente F7');const owner=await register(merchant,'Comercio F7');
  const ch={...origin,'X-CSRF-Token':customer.csrfToken},mh={...origin,'X-CSRF-Token':owner.csrfToken};
  expect((await page.request.post('/api/v1/me/addresses',{headers:ch,data:{zoneId,label:'Casa F7',recipientName:customer.user.fullName,phone:customer.user.phone,street:'Destino F7',streetNumber:'20',isDefault:true}})).status()).toBe(201);
  const categories=await(await merchant.request.get('/api/v1/catalog/categories')).json();
  const products=[];
  for(const suffix of ['A','B']){
   const storeResult=await merchant.request.post('/api/v1/merchant/stores',{headers:mh,data:{categoryCode:'restaurantes',zoneId,name:`Tienda F7 ${suffix}`,addressText:'Calle tienda 10',phone:owner.user.phone}});expect(storeResult.status()).toBe(201);const storeId=(await storeResult.json()).id;
   expect((await admin.request.post(`/api/v1/admin/stores/${storeId}/decisions`,{headers:ah,data:{decision:'approve',reason:'Validación multitienda'}})).status()).toBe(201);
   expect((await merchant.request.put(`/api/v1/merchant/stores/${storeId}/hours`,{headers:mh,data:{intervals:Array.from({length:7},(_,i)=>({weekday:i+1,opensAt:'00:00',closesAt:'24:00'}))}})).status()).toBe(200);
   const result=await merchant.request.post(`/api/v1/merchant/stores/${storeId}/products`,{headers:mh,data:{categoryId:categories[0].id,name:`Producto F7 ${suffix}`,skuCode:`F7-${randomUUID()}`,variantName:'Unidad',priceCents:1050,initialStock:5}});expect(result.status()).toBe(201);products.push(await result.json());
  }
  for(const product of products){await page.goto(`/producto/${product.productId}`);await page.getByRole('button',{name:'Agregar al carrito',exact:true}).click();await expect(page.getByText('Producto agregado al carrito.',{exact:true})).toBeVisible();}
  await page.goto('/carrito');await expect(page.getByRole('checkbox')).toHaveCount(2);for(const box of await page.getByRole('checkbox').all())await expect(box).toBeChecked();
  await page.reload();await expect(page.getByRole('checkbox')).toHaveCount(2);for(const box of await page.getByRole('checkbox').all())await expect(box).toBeChecked();
  await page.getByRole('link',{name:'Continuar con la compra',exact:true}).click();await expect(page.getByText(/^Total: S\/\s*27\.00$/)).toBeVisible();
  await expect(page.getByText(/^Envíos \(2 tiendas\): S\/\s*6\.00$/)).toBeVisible();await expect(page.getByText(/^A pagar a esta entrega: S\/\s*13\.50$/)).toHaveCount(2);
  let creates=0;await page.route('**/api/v1/checkout/groups',async route=>{creates++;const response=await route.fetch();expect(response.status()).toBe(201);await route.abort('failed');});
  await page.getByRole('button',{name:'Confirmar compra en efectivo',exact:true}).click();await expect(page.getByRole('alert')).toContainText('No se pudo conectar');await page.reload();
  await page.getByRole('button',{name:'Recuperar compra pendiente',exact:true}).click();await expect(page).toHaveURL(/\/cliente\/compras\/[0-9a-f-]+$/);
  const groupUrl=page.url();await expect(page.getByText('Pedidos confirmados: 2',{exact:true})).toBeVisible();expect(creates).toBe(1);
  const orders=await(await page.request.get('/api/v1/me/orders')).json();expect(orders.items).toHaveLength(2);expect(new Set(orders.items.map((o:{purchaseId:string})=>o.purchaseId)).size).toBe(2);
  const order=orders.items[0];await page.goto(`/cliente/pedidos/${order.id}`);await expect(page.getByRole('link',{name:'Ver los pedidos de esta compra multitienda',exact:true})).toBeVisible();
  expect((await page.request.post(`/api/v1/orders/${order.id}/cancellations`,{headers:ch,data:{expectedVersion:0,reason:'Cancelar solo una tienda'}})).status()).toBe(201);
  await page.setViewportSize({width:390,height:844});await page.goto(groupUrl);await expect(page.getByText(/Cobro cancelado:/)).toBeVisible();await expect(page.getByText(/Efectivo por entregar:/)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/carrito');await expect(page.getByText('Tu carrito está vacío.',{exact:true})).toBeVisible();
 }finally{await adminContext.close();await merchantContext.close();}
});
