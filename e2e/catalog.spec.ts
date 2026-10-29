import { test, expect, Page } from '@playwright/test';
import { randomUUID, randomInt } from 'node:crypto';

async function imageFile(page: Page){
  const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#8b4513';ctx.fillRect(0,0,64,64);return canvas.toDataURL('image/png').split(',')[1];});
  return {name:'imagen.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')};
}

test('F3: comercio publica producto, variantes, stock e imagen; otra sesión consulta y respeta archivo', async ({ page,browser,request }) => {
  test.setTimeout(120000);
  const origin = { Origin: 'http://localhost:5174' };
  const login = await request.post('/api/v1/auth/login',{ headers: origin, data: { email: process.env.BROWSER_ADMIN_EMAIL, password: process.env.BROWSER_ADMIN_PASSWORD } });
  expect(login.status()).toBe(200); const adminHeaders = { ...origin,'X-CSRF-Token': (await login.json()).csrfToken };
  const zone = await request.post('/api/v1/admin/zones',{ headers: adminHeaders, data: { code: `f3-${randomUUID().slice(0,8)}`, name: `Zona catálogo ${randomUUID().slice(0,8)}`, description: 'Cobertura de prueba', baseFeeCents: 300, estimatedMinutes: 20 } });
  expect(zone.status()).toBe(201); const zoneId = (await zone.json()).id;
  await page.goto('/registro');await page.getByLabel('Nombres y apellidos').fill('Comercio Catálogo');await page.getByLabel('Correo electrónico').fill(`${randomUUID()}@example.test`);
  await page.getByLabel('Celular').fill(`9${randomInt(10000000,99999999)}`);await page.getByLabel(/^Contraseña/).fill('Solo-pruebas-F3-browser-42');
  await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(page).toHaveURL(/\/cliente\/perfil$/);
  const session = await (await page.request.get('/api/v1/auth/session')).json();const ownerHeaders = { ...origin,'X-CSRF-Token': session.csrfToken };
  const store = await page.request.post('/api/v1/merchant/stores',{ headers: ownerHeaders, data: { categoryCode:'restaurantes',zoneId,name:`Negocio catálogo ${randomUUID().slice(0,8)}`,addressText:'Calle de pruebas 20',phone:'+51999999888' } });
  expect(store.status()).toBe(201);const storeId=(await store.json()).id;
  const approval = await request.post(`/api/v1/admin/stores/${storeId}/decisions`,{ headers:adminHeaders,data:{decision:'approve',reason:'Información verificada en pruebas'} });expect(approval.status()).toBe(201);
  await page.goto(`/comercio/tienda?store=${storeId}`);await page.getByRole('button',{name:'Imágenes de tienda',exact:true}).click();
  const picture=await imageFile(page);
  for(const kind of ['logo','banner']){
    await page.getByLabel(`Archivo para ${kind}`).setInputFiles(picture);await page.getByRole('button',{name:`Guardar ${kind}`,exact:true}).click();
    await expect(page.getByText(`${kind === 'logo' ? 'Logo' : 'Banner'} guardado correctamente.`,{exact:true})).toBeVisible();
  }
  const productName=`Café ${randomUUID().slice(0,8)}`;
  await page.goto(`/comercio/productos?store=${storeId}`);await page.getByRole('button',{name:'Nuevo producto',exact:true}).click();
  const creation=page.getByRole('form',{name:'Crear producto'});
  await creation.getByLabel('Nombre del producto').fill(productName);await creation.getByLabel('Categoría de producto').selectOption({label:'Bebidas'});
  await creation.getByLabel('Código SKU').fill(`CAFE-${randomUUID()}`);await creation.getByLabel('Nombre de presentación').fill('Pequeño');await creation.getByLabel('Precio (S/)').fill('10.50');await creation.getByLabel('Existencia inicial').fill('4');
  await creation.getByRole('button',{name:'Publicar producto',exact:true}).click();await expect(page.getByRole('heading',{name:productName,exact:true})).toBeVisible();
  const productId=new URL(page.url()).searchParams.get('product');expect(productId).toBeTruthy();
  const small=page.getByRole('form',{name:'Editar presentación Pequeño'});await small.getByLabel('Precio (S/)').fill('11.50');
  const priceSaved=page.waitForResponse(response=>response.url().includes('/merchant/skus/')&&response.request().method()==='PATCH');
  await small.getByRole('button',{name:'Guardar presentación'}).click();expect((await priceSaved).status()).toBe(200);
  await expect(small.getByLabel('Precio (S/)')).toHaveValue('11.50');
  const adjustment=page.getByRole('form',{name:'Ajustar stock de Pequeño'});await adjustment.getByLabel('Cantidad del ajuste').fill('-1');await adjustment.getByLabel('Motivo del ajuste').fill('Merma documentada');await adjustment.getByRole('button',{name:'Registrar ajuste'}).click();
  await expect(page.getByText('Existencia física: 3 · Reservado: 0 · Disponible: 3',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ver movimientos',exact:true}).click();await expect(page.getByText('Merma documentada',{exact:true})).toBeVisible();
  await page.getByText('Agregar presentación',{exact:true}).click();
  const addition=page.locator('details').filter({hasText:'Agregar presentación'});await addition.getByLabel('Código SKU').fill(`GRANDE-${randomUUID()}`);await addition.getByLabel('Nombre de presentación').fill('Grande');await addition.getByLabel('Precio (S/)').fill('18.50');await addition.getByLabel('Existencia inicial').fill('2');await addition.getByRole('button',{name:'Crear presentación'}).click();
  await expect(page.getByRole('heading',{name:/Grande ·/})).toBeVisible();
  await page.getByLabel('Archivo de imagen').setInputFiles(picture);await page.getByRole('button',{name:'Publicar imagen',exact:true}).click();
  await expect(page.getByRole('img',{name:productName,exact:true})).toBeVisible();
  const visitor=await browser.newContext({baseURL:'http://localhost:5174',viewport:{width:390,height:844}});const shopper=await visitor.newPage();
  try {
    await shopper.goto(`/negocios/${storeId}`);await expect(shopper.getByRole('img',{name:/^Logo de /})).toBeVisible();await expect(shopper.getByRole('img',{name:/^Banner de /})).toBeVisible();
    expect(await shopper.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shopper.screenshot({path:'../.tmp/f3-store-branding-mobile.png',fullPage:true});
    await shopper.goto(`/?q=${encodeURIComponent(productName)}`);await expect(shopper.getByRole('heading',{name:productName,exact:true})).toBeVisible();await shopper.getByRole('button',{name:`Vista rápida de ${productName}`}).click();
    const dialog=shopper.getByRole('dialog',{name:'Vista rápida'});await expect(dialog).toBeVisible();await expect(dialog.getByLabel('Presentación')).toContainText('11.50');
    await shopper.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
    await shopper.goto(`/producto/${productId}`);await expect(shopper.getByRole('heading',{name:productName,exact:true})).toBeVisible();
    const largeId=await shopper.getByLabel('Presentación').locator('option').filter({hasText:'Grande'}).getAttribute('value');
    await shopper.getByLabel('Presentación').selectOption(largeId!);await expect(shopper.getByText(/^S\/\s*18\.50$/)).toBeVisible();
    await expect(shopper.getByRole('img',{name:productName,exact:true})).toBeVisible();expect(await shopper.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await shopper.screenshot({path:'../.tmp/f3-catalog-mobile.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:'../.tmp/f3-merchant-mobile.png',fullPage:true});
    const edit=page.getByRole('form',{name:'Editar producto'});await edit.getByLabel('Producto publicado').uncheck();
    const archiveSaved=page.waitForResponse(response=>response.url().endsWith(`/merchant/products/${productId}`)&&response.request().method()==='PATCH');
    await edit.getByRole('button',{name:'Guardar producto',exact:true}).click();expect((await archiveSaved).status()).toBe(200);await expect(edit.getByLabel('Producto publicado')).not.toBeChecked();
    await shopper.reload();await expect(shopper.getByRole('alert')).toContainText('Producto no disponible');
    await shopper.route('**/api/v1/catalog/search*',route=>route.abort());await shopper.goto('/');await expect(shopper.getByRole('alert')).toContainText('No se pudo conectar');await expect(shopper.getByText(productName,{exact:true})).toHaveCount(0);
  } finally { await visitor.close(); }
});

test('F3: avatar privado persiste, tolera fallo de carga y se elimina desde el perfil móvil',async({page,browser})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/registro');await page.getByLabel('Nombres y apellidos').fill('Persona Avatar');
  await page.getByLabel('Correo electrónico').fill(`${randomUUID()}@example.test`);await page.getByLabel('Celular').fill(`9${randomInt(10000000,99999999)}`);await page.getByLabel(/^Contraseña/).fill('Solo-pruebas-F3-avatar-42');
  await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(page).toHaveURL(/\/cliente\/perfil$/);
  const picture=await imageFile(page);await page.getByLabel('Archivo para avatar').setInputFiles(picture);await page.getByRole('button',{name:'Guardar avatar',exact:true}).click();
  await expect(page.getByText('Avatar guardado correctamente.',{exact:true})).toBeVisible();const avatar=page.getByRole('img',{name:'Avatar',exact:true});await expect(avatar).toBeVisible();
  const url=await avatar.getAttribute('src');const stranger=await browser.newContext({baseURL:'http://localhost:5174'});
  try{expect((await stranger.request.get(url!)).status()).toBe(401);}finally{await stranger.close();}
  await page.reload();await expect(avatar).toBeVisible();await expect(page.getByLabel('Nombres y apellidos')).toHaveValue('Persona Avatar');
  await page.route('**/api/v1/me/avatar',async route=>{if(route.request().method()==='PUT')await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'UNAVAILABLE',message:'Carga temporalmente indisponible'})});else await route.continue();});
  await page.getByLabel('Archivo para avatar').setInputFiles(picture);await page.getByRole('button',{name:'Guardar avatar',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Carga temporalmente indisponible');await expect(avatar).toHaveAttribute('src',url!);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'../.tmp/f3-avatar-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Quitar avatar',exact:true}).click();await expect(page.getByText('Avatar eliminado correctamente.',{exact:true})).toBeVisible();await expect(avatar).toHaveCount(0);await page.reload();await expect(avatar).toHaveCount(0);
});
