import {test,expect,Page} from '@playwright/test';
import {randomUUID,randomInt} from 'node:crypto';

const origin={Origin:'http://localhost:5174'};
async function register(page:Page,label:string) {
  await page.goto('/registro');
  await page.getByLabel('Nombres y apellidos').fill(label);
  await page.getByLabel('Correo electrónico').fill(`${randomUUID()}@example.test`);
  await page.getByLabel('Celular').fill(`9${randomInt(10000000,99999999)}`);
  await page.getByLabel(/^Contraseña/).fill('Solo-pruebas-Portada-42');
  await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();
  await expect(page).toHaveURL(/\/cliente\/perfil$/);
  return (await page.request.get('/api/v1/auth/session')).json();
}

test('Portada: catálogo PostgreSQL, filtros, paginación, SKU, favoritos y carrito sin perder el diseño',async({page,browser,request})=>{
  test.setTimeout(150000);
  const ownerContext=await browser.newContext({baseURL:'http://localhost:5174'});
  const owner=await ownerContext.newPage();
  const prefix=`Café portada ${randomUUID().slice(0,6)}`;
  try {
    const login=await request.post('/api/v1/auth/login',{headers:origin,data:{email:process.env.BROWSER_ADMIN_EMAIL,password:process.env.BROWSER_ADMIN_PASSWORD}});
    expect(login.status()).toBe(200);
    const ah={...origin,'X-CSRF-Token':(await login.json()).csrfToken};
    const zoneResponse=await request.post('/api/v1/admin/zones',{headers:ah,data:{code:`home-${randomUUID().slice(0,8)}`,name:'Zona portada',description:'Fixture aislado',baseFeeCents:300,estimatedMinutes:20}});
    expect(zoneResponse.status()).toBe(201); const zoneId=(await zoneResponse.json()).id;
    const session=await register(owner,'Comercio portada');
    const oh={...origin,'X-CSRF-Token':session.csrfToken};
    const storeResponse=await owner.request.post('/api/v1/merchant/stores',{headers:oh,data:{categoryCode:'restaurantes',zoneId,name:`Tienda ${prefix}`,addressText:'Calle de prueba 10',phone:session.user.phone}});
    expect(storeResponse.status()).toBe(201);const storeId=(await storeResponse.json()).id;
    expect((await request.post(`/api/v1/admin/stores/${storeId}/decisions`,{headers:ah,data:{decision:'approve',reason:'Validación portada aislada'}})).status()).toBe(201);
    const categories=await(await owner.request.get('/api/v1/catalog/categories')).json();
    const category=categories.find((c:{code:string})=>c.code==='beverages');
    let productId='';
    for(let i=0;i<25;i++) {
      const response=await owner.request.post(`/api/v1/merchant/stores/${storeId}/products`,{headers:oh,data:{categoryId:category.id,name:`${prefix} ${String(i).padStart(2,'0')}`,skuCode:`HOME-${randomUUID()}`,variantName:'Pequeño',priceCents:1050,initialStock:i===20?0:5}});
      expect(response.status()).toBe(201);if(i===0)productId=(await response.json()).productId;
    }
    expect((await owner.request.post(`/api/v1/merchant/products/${productId}/skus`,{headers:oh,data:{skuCode:`HOME-L-${randomUUID()}`,variantName:'Grande',priceCents:1850,initialStock:2}})).status()).toBe(201);
    await register(page,'Cliente portada');
    await page.goto('/');
    await page.getByLabel('Buscar en Quickly',{exact:true}).fill(prefix);
    await page.getByLabel('Buscar en Quickly',{exact:true}).press('Enter');
    const results=page.getByLabel('Resultados del catálogo');
    await expect(results.getByRole('article')).toHaveCount(24);
    await page.getByRole('button',{name:'Siguiente página',exact:true}).click();
    await expect(results.getByRole('article')).toHaveCount(1);
    await page.getByRole('button',{name:'Primera página',exact:true}).click();
    await expect(results.getByRole('article')).toHaveCount(24);
    await page.getByRole('region',{name:'Categorías de productos'}).getByRole('button',{name:'Bebidas',exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
    await expect(results.getByRole('article')).toHaveCount(24);
    await page.getByLabel('Precio máximo (S/)').fill('5');
    await page.getByRole('form',{name:'Filtros del catálogo'}).getByRole('button',{name:'Buscar',exact:true}).click();
    await expect(results.getByText('No encontramos productos con estos filtros.',{exact:true})).toBeVisible();
    await page.goto(`/?q=${encodeURIComponent(prefix+' 00')}`);
    const card=results.getByRole('article');
    await expect(card.getByRole('heading',{name:prefix+' 00',exact:true})).toBeVisible();
    await card.getByRole('button',{name:'Guardar favorito',exact:true}).click();
    await expect(card.getByRole('button',{name:'Guardado en favoritos',exact:true})).toBeVisible();
    await card.getByRole('button',{name:`Vista rápida de ${prefix} 00`,exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Vista rápida'});
    const large=await dialog.getByLabel('Presentación').locator('option').filter({hasText:'Grande'}).getAttribute('value');
    await dialog.getByLabel('Presentación').selectOption(large!);
    await dialog.getByLabel('Cantidad a comprar').fill('2');
    await dialog.getByRole('button',{name:'Agregar al carrito',exact:true}).click();
    await expect(dialog.getByText('Producto agregado al carrito.',{exact:true})).toBeVisible();
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('link',{name:'Ver carrito con 2 productos',exact:true})).toBeVisible();
    for(const width of [390,768,1440]) {
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`../.tmp/portada-${width}.png`,fullPage:true});
      if(width===390)await page.screenshot({path:'../.tmp/portada-mobile-viewport.png'});
    }
    await page.goto('/cliente/favoritos');
    await expect(page.getByRole('heading',{name:prefix+' 00',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Quitar favorito',exact:true}).click();
    await expect(page.getByRole('heading',{name:prefix+' 00',exact:true})).toHaveCount(0);
    await page.goto(`/?q=${encodeURIComponent(prefix+' 20')}`);
    await expect(results.getByText('Agotado',{exact:true})).toBeVisible();
    await results.getByRole('button',{name:`Vista rápida de ${prefix} 20`,exact:true}).click();
    await expect(dialog.getByRole('button',{name:'Agregar al carrito',exact:true})).toBeDisabled();
    await page.keyboard.press('Escape');
    await page.goto('/carrito');
    await expect(page.getByText(prefix+' 00',{exact:true})).toBeVisible();
    await expect(page.getByRole('article').getByText(/ · Grande · /)).toBeVisible();
    await page.goto('/');
    const stores=page.getByRole('region',{name:'Comercios en Quickly'});
    const storeCard=stores.getByRole('article').filter({hasText:`Tienda ${prefix}`});
    await storeCard.getByRole('button',{name:'Guardar favorito',exact:true}).click();
    await expect(storeCard.getByRole('button',{name:'Guardado en favoritos',exact:true})).toBeVisible();
    await storeCard.getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`/negocios/${storeId}$`));
    await expect(page.getByRole('heading',{name:`Tienda ${prefix}`,exact:true})).toBeVisible();
  } finally {await ownerContext.close();}
});

test('Portada: carga, vacío y errores independientes con reintento sin productos demo',async({page})=>{
  let searchFails=true,categoriesFail=true;
  let release!: ()=>void;
  const ready=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/v1/catalog/search*',async route=>{await ready;await route.fulfill({status:searchFails?503:200,json:searchFails?{message:'Catálogo temporalmente indisponible'}:{items:[],nextCursor:null}});});
  await page.route('**/api/v1/catalog/categories',route=>route.fulfill({status:categoriesFail?503:200,json:categoriesFail?{message:'Categorías temporalmente indisponibles'}:[]}));
  await page.route('**/api/v1/stores',route=>route.fulfill({json:[]}));
  await page.route('**/api/v1/geography/zones',route=>route.fulfill({json:[]}));
  await page.goto('/');
  const results=page.getByLabel('Resultados del catálogo');
  await expect(results.getByRole('status')).toHaveText('Cargando información…');
  release();
  await expect(results.getByRole('alert')).toHaveText('Catálogo temporalmente indisponible');
  await expect(results.getByRole('article')).toHaveCount(0);
  await expect(page.getByText('Todavía no hay comercios disponibles.',{exact:true})).toBeVisible();
  const categories=page.getByRole('region',{name:'Categorías de productos'});
  await expect(categories.getByRole('alert')).toHaveText('Categorías temporalmente indisponibles');
  searchFails=false;
  await results.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(results.getByText('No encontramos productos con estos filtros.',{exact:true})).toBeVisible();
  await expect(categories.getByRole('alert')).toBeVisible();
  categoriesFail=false;
  await categories.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(categories.getByText('Todavía no hay categorías disponibles.',{exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'../.tmp/portada-vacia-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
