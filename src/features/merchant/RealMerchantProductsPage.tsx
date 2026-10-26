import React, { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { catalogApi, CatalogProduct, CatalogSku, imageUrl, InventoryItem, priceCents } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { prepareImage } from '../../services/media/prepareImage';
import { Feedback, inputClass, PageTitle, Pager, panel, RemoteState, useRemote } from '../operations/shared';

type Category = { id: string; name: string };
type EditorProps = { product: CatalogProduct; categories: Category[]; saved: () => void };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo guardar el cambio.';

function ProductEditor({ product, categories, saved }: EditorProps) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try { await catalogApi.update(product.id,{ name: String(data.get('name')), description: String(data.get('description')), brand: String(data.get('brand')),
      categoryId: String(data.get('categoryId')), position: Number(data.get('position')), isActive: data.get('isActive') === 'on' }); saved(); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} aria-label="Editar producto" className={panel}><fieldset disabled={busy} className="space-y-4">
    <h2 className="text-xl font-bold">Datos del producto</h2><Input label="Nombre del producto" name="name" required maxLength={160} defaultValue={product.name} />
    <label className="block text-sm font-semibold space-y-2">Categoría de producto<select className={inputClass} name="categoryId" defaultValue={product.categoryId} required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="block text-sm font-semibold space-y-2">Descripción<textarea name="description" className={inputClass} rows={4} maxLength={4000} defaultValue={product.description} /></label>
    <Input label="Marca" name="brand" maxLength={100} defaultValue={product.brand || ''} /><Input label="Orden de presentación" name="position" type="number" min={0} max={1000000} defaultValue={product.position} required />
    <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={product.isActive} />Producto publicado</label>
    <p className="text-sm text-ink-light">Al despublicar conservas sus variantes, existencias e historial.</p><Feedback error={error} /><Button type="submit" isLoading={busy}>Guardar producto</Button>
  </fieldset></form>;
}
function SkuFields({ sku, stock, initial = false }: { sku?: CatalogSku; stock?: InventoryItem; initial?: boolean }) {
  const prefix = useId();
  return <><Input id={`${prefix}-code`} label="Código SKU" name="skuCode" required maxLength={100} defaultValue={sku?.skuCode || ''} />
    <Input id={`${prefix}-variant`} label="Nombre de presentación" name="variantName" required maxLength={100} defaultValue={sku?.variantName || 'Estándar'} />
    <Input id={`${prefix}-price`} label="Precio (S/)" name="price" type="number" min="0.01" max="1000000" step="0.01" required defaultValue={sku ? (sku.priceCents/100).toFixed(2) : ''} />
    <Input id={`${prefix}-barcode`} label="Código de barras" name="barcode" maxLength={100} defaultValue={sku?.barcode || ''} />
    <Input id={`${prefix}-threshold`} label="Alerta de stock mínimo" name="lowStockThreshold" type="number" required min={0} max={2147483647} defaultValue={stock?.lowStockThreshold ?? 5} />
    {initial && <Input id={`${prefix}-stock`} label="Existencia inicial" name="initialStock" type="number" required min={0} max={2147483647} defaultValue={0} />}
    {sku && <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={sku.isActive} />Presentación activa</label>}</>;
}
function skuInput(data: FormData) {
  return { skuCode: String(data.get('skuCode')), variantName: String(data.get('variantName')), priceCents: priceCents(String(data.get('price'))),
    barcode: String(data.get('barcode')), lowStockThreshold: Number(data.get('lowStockThreshold')) };
}
function SkuEditor({ sku, stock, saved }: { sku: CatalogSku; stock?: InventoryItem; saved: () => void }) {
  const prefix = useId();
  const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [history,setHistory] = useState(false); const [cursor,setCursor] = useState<string>();
  const movements = useRemote(`movements:${sku.id}:${history}:${cursor || ''}`, (signal) => history ? catalogApi.movements(sku.id,cursor,signal) : Promise.resolve([]));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try { await catalogApi.updateSku(sku.id,{ ...skuInput(data), isActive: data.get('isActive') === 'on' }); saved(); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  async function adjust(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError('');
    try { await catalogApi.adjust(sku.id,{ quantity: Number(data.get('quantity')), reason: String(data.get('reason')) }); form.reset(); movements.reload(); saved(); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <section className={panel}><h3 className="text-xl font-bold">{sku.variantName} · {sku.skuCode}</h3>
    {stock && <div className="rounded-xl bg-surface-subtle p-4 space-y-1"><p>Existencia física: {stock.onHand} · Reservado: {stock.reserved} · Disponible: {stock.available}</p>{stock.lowStock && <p className="text-amber-800 font-semibold">Stock bajo</p>}</div>}
    <form onSubmit={submit} aria-label={`Editar presentación ${sku.variantName}`}><fieldset disabled={busy} className="space-y-4"><SkuFields sku={sku} stock={stock} /><Button type="submit" isLoading={busy}>Guardar presentación</Button></fieldset></form>
    <form onSubmit={adjust} aria-label={`Ajustar stock de ${sku.variantName}`} className="space-y-4 border-t border-border pt-5"><h4 className="font-bold">Ajuste de existencia física</h4><p className="text-sm text-ink-light">Usa una cantidad positiva para ingreso y negativa para merma o corrección. Las unidades reservadas se conservan.</p>
      <fieldset disabled={busy} className="space-y-4"><Input id={`${prefix}-quantity`} label="Cantidad del ajuste" name="quantity" type="number" min={-2147483647} max={2147483647} required /><Input id={`${prefix}-reason`} label="Motivo del ajuste" name="reason" maxLength={500} required /><Button type="submit" variant="outline" isLoading={busy}>Registrar ajuste</Button></fieldset></form><Feedback error={error} />
    <Button variant="ghost" onClick={() => setHistory(!history)}>{history ? 'Ocultar movimientos' : 'Ver movimientos'}</Button>
    {history && <div className="space-y-3"><RemoteState loading={movements.loading} error={movements.error} retry={movements.reload} />{!movements.error && movements.data?.map((row) => <article className="border border-border rounded-xl p-3" key={row.id}><p>{new Date(row.createdAt).toLocaleString('es-PE')} · {row.quantity > 0 ? '+' : ''}{row.quantity} · Existencia: {row.onHandAfter}</p><p>{row.reason}</p></article>)}
      {!movements.data?.length && !movements.loading && <p>Sin movimientos en esta página.</p>}<div className="flex gap-3"><Button variant="outline" disabled={!cursor} onClick={() => setCursor(undefined)}>Primeros movimientos</Button><Button variant="outline" disabled={movements.data?.length !== 50} onClick={() => setCursor(movements.data?.at(-1)?.id)}>Más movimientos</Button></div></div>}
  </section>;
}
function AddSku({ productId, saved }: { productId: string; saved: () => void }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setError('');
    try { await catalogApi.addSku(productId,{ ...skuInput(data), initialStock: Number(data.get('initialStock')) }); form.reset(); saved(); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <details className={panel}><summary className="font-bold cursor-pointer">Agregar presentación</summary><form onSubmit={submit}><fieldset disabled={busy} className="space-y-4 pt-5"><SkuFields initial /><Feedback error={error} /><Button type="submit" isLoading={busy}>Crear presentación</Button></fieldset></form></details>;
}
function ImagesEditor({ product, saved }: { product: CatalogProduct; saved: () => void }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const file = data.get('file'); setBusy(true); setError('');
    try { if (!(file instanceof File) || !file.size) throw new Error('Selecciona una imagen.');
      await catalogApi.image(product.id,{ content: await prepareImage(file), altText: String(data.get('altText')), position: Number(data.get('position')) }); form.reset(); saved(); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  async function remove(id: string) { setBusy(true); setError(''); try { await catalogApi.removeImage(product.id,id); saved(); } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); } }
  return <section className={panel}><h2 className="text-xl font-bold">Imágenes del producto</h2><p className="text-sm">Hasta 10 imágenes. La posición 0 es la portada. Una nueva carga reemplaza la imagen de esa posición.</p>
    <div className="grid sm:grid-cols-2 gap-4">{product.images.map((image) => <div key={image.id} className="space-y-2"><img src={imageUrl(image.url)} alt={image.altText || product.name} className="h-36 object-contain w-full" /><p>Posición {image.position}</p><Button variant="outline" disabled={busy} onClick={() => void remove(image.id)}>Quitar imagen {image.position}</Button></div>)}</div>
    <form onSubmit={submit}><fieldset disabled={busy} className="space-y-4"><Input label="Archivo de imagen" name="file" type="file" accept="image/png,image/jpeg,image/webp" required /><Input label="Descripción de la imagen" name="altText" maxLength={200} defaultValue={product.name} /><Input label="Posición de imagen" name="position" type="number" min={0} max={9} defaultValue={0} required /><Feedback error={error} /><Button type="submit" isLoading={busy}>Publicar imagen</Button></fieldset></form>
  </section>;
}
function NewProduct({ storeId, categories, created }: { storeId: string; categories: Category[]; created: (id: string) => void }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try { const result = await catalogApi.create(storeId,{ ...skuInput(data), categoryId: String(data.get('categoryId')), name: String(data.get('name')), description: String(data.get('description')), brand: String(data.get('brand')), initialStock: Number(data.get('initialStock')) }); created(result.productId); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className={panel} aria-label="Crear producto"><h2 className="text-xl font-bold">Nuevo producto</h2><fieldset disabled={busy} className="space-y-4">
    <Input label="Nombre del producto" name="name" required maxLength={160} /><label className="block text-sm font-semibold space-y-2">Categoría de producto<select name="categoryId" className={inputClass} required><option value="">Selecciona una categoría</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <Input label="Descripción del producto" name="description" maxLength={4000} /><Input label="Marca" name="brand" maxLength={100} /><SkuFields initial /><Feedback error={error} /><Button type="submit" isLoading={busy}>Publicar producto</Button>
  </fieldset></form>;
}
export function RealMerchantProductsPage() {
  const [params,setParams] = useSearchParams(); const selected = params.get('store') || ''; const productId = params.get('product') || '';
  const [cursor,setCursor] = useState<string>(); const [storeCursor,setStoreCursor] = useState<string>(); const [creating,setCreating] = useState(false);
  const resource = useRemote(`merchant-products:${selected}:${productId}:${cursor || ''}:${storeCursor || ''}`, async (signal) => {
    const [stores,categories] = await Promise.all([operationsApi.ownStores({ cursor: storeCursor },signal),catalogApi.categories(signal)]);
    const id = selected || stores.items[0]?.id; if (!id) return { stores,categories,store: null };
    const store = await operationsApi.store(id,signal);
    if (store.status !== 'active') return { stores,categories,store };
    const [products,inventory,product] = await Promise.all([catalogApi.products(id,{ cursor },signal),catalogApi.inventory(id,signal),productId ? catalogApi.ownProduct(productId,signal) : Promise.resolve(null)]);
    if (product && product.storeId !== id) throw new Error('El producto no pertenece a la tienda seleccionada.');
    return { stores,categories,store,products,inventory,product };
  });
  const data = resource.data; const store = data?.store; const canEdit = !!store && ['owner','manager','admin'].includes(store.membershipRole);
  function selectProduct(id?: string) { setParams({ store: store!.id, ...(id ? { product: id } : {}) }); setCreating(false); }
  return <div className="space-y-6"><PageTitle detail="Publica productos, administra presentaciones y registra movimientos de existencias.">Productos e inventario</PageTitle><Link to="/comercio/tienda" className="text-primary font-semibold">Administrar tienda</Link>
    <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.error && data && <>{!store ? <section className={panel}>No tienes una tienda habilitada.</section> : <>
      <section className={panel}><label className="block space-y-2 font-semibold">Tienda del catálogo<select className={inputClass} value={store.id} onChange={(e) => { setParams({ store: e.target.value }); setCursor(undefined); setCreating(false); }}>{!data.stores.items.some((s) => s.id === store.id) && <option value={store.id}>{store.name}</option>}{data.stores.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <Pager next={data.stores.nextCursor} isFirst={!storeCursor} onFirst={() => setStoreCursor(undefined)} onNext={() => setStoreCursor(data.stores.nextCursor || undefined)} /></section>
      {store.status !== 'active' ? <p>La tienda necesita aprobación activa para administrar su catálogo.</p> : <>
        {!canEdit && <p>Tu rol permite consultar productos e inventario.</p>}
        <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => { selectProduct(); resource.reload(); }}>Ver listado</Button>{canEdit && <Button onClick={() => { selectProduct(); setCreating(true); }}>Nuevo producto</Button>}</div>
        {creating && canEdit ? <NewProduct key={store.id} storeId={store.id} categories={data.categories} created={(id) => { selectProduct(id); resource.reload(); }} /> : data.product ? <>
          <h2 className="text-2xl font-bold">{data.product.name}</h2>{canEdit && <><ProductEditor key={data.product.id} product={data.product} categories={data.categories} saved={resource.reload} /><ImagesEditor product={data.product} saved={resource.reload} /></>}
          {data.product.skus.map((sku) => canEdit ? <SkuEditor key={sku.id} sku={sku} stock={data.inventory?.find((s) => s.skuId === sku.id)} saved={resource.reload} /> : <p key={sku.id}>{sku.variantName}: {sku.availableStock} disponibles</p>)}
          {canEdit && <AddSku productId={data.product.id} saved={resource.reload} />}
        </> : <>
          {!data.products?.items.length && <section className={panel}>Esta tienda todavía no tiene productos.</section>}
          <div className="grid sm:grid-cols-2 gap-4">{data.products?.items.map((product) => <article key={product.id} className={panel}><h2 className="text-xl font-bold">{product.name}</h2><p>{product.isActive ? 'Publicado' : 'Archivado'}</p>{data.inventory?.filter((s) => s.productId === product.id).map((s) => <p key={s.skuId}>{s.variantName}: {s.available} disponibles{s.lowStock ? ' · Stock bajo' : ''}</p>)}<Button variant="outline" onClick={() => selectProduct(product.id)}>{canEdit ? 'Gestionar' : 'Consultar'} {product.name}</Button></article>)}</div>
          <Pager next={data.products?.nextCursor || null} isFirst={!cursor} onFirst={() => setCursor(undefined)} onNext={() => setCursor(data.products?.nextCursor || undefined)} />
        </>}
      </>}
    </>}</>}
  </div>;
}
