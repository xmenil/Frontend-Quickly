import {FavoriteButton,StoreReviews} from '../engagement/RealEngagementPages';
import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import {useRealCartStore} from '../../store/realCartStore';
import { CatalogProduct, catalogApi, imageUrl, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { inputClass, PageTitle, Pager, panel, RemoteState, useRemote } from '../operations/shared';

export function RealProductContent({ product }: { product: CatalogProduct }) {
  const add=useRealCartStore(s=>s.add);const [quantity,setQuantity]=useState(1);const [message,setMessage]=useState('');
  const [skuId, setSku] = useState(product.skus[0]?.id || '');
  const sku = product.skus.find((row) => row.id === skuId) || product.skus[0];
  return <div className="grid md:grid-cols-2 gap-6">
    <div className="space-y-3">{product.images.length ? product.images.map((image) => <img key={image.id} src={imageUrl(image.url)} alt={image.altText || product.name} className="w-full max-h-96 object-contain rounded-xl bg-white" />) : <div className="h-52 bg-surface-subtle rounded-xl flex items-center justify-center text-ink-muted">Sin imagen</div>}</div>
    <div className="space-y-5"><Link to={`/negocios/${product.storeId}`} className="text-primary font-semibold">{product.storeName}</Link><h1 className="text-2xl font-bold">{product.name}</h1><FavoriteButton kind="product" id={product.id}/>
      {product.brand && <p className="text-sm">Marca: {product.brand}</p>}<p className="whitespace-pre-wrap">{product.description}</p>
      <label className="block space-y-2 text-sm font-semibold">Presentación<select className={inputClass} value={sku?.id || ''} onChange={(e) => setSku(e.target.value)}>{product.skus.map((item) => <option key={item.id} value={item.id}>{item.variantName} · {money(item.priceCents)}</option>)}</select></label>
      {sku && <><p className="text-3xl font-bold">{money(sku.priceCents)}</p><p>{sku.availableStock > 0 ? `${sku.availableStock} unidades disponibles` : 'Agotado'}</p><p className="text-sm text-ink-muted">Código: {sku.skuCode}</p></>}
      <Input label="Cantidad a comprar" type="number" min={1} max={Math.min(sku?.availableStock||1,10000)} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/>
      <Button disabled={!sku||sku.availableStock<quantity||!Number.isInteger(quantity)||quantity<1} onClick={()=>{try{add({skuId:sku!.id,productId:product.id,storeId:product.storeId},quantity);setMessage('Producto agregado al carrito.');}catch(error){setMessage(error instanceof Error?error.message:'No se pudo agregar.');}}}>Agregar al carrito</Button>{message&&<p role="status">{message}</p>}<Link to="/carrito" className="text-primary font-semibold">Ver carrito</Link>
    </div>
  </div>;
}
function RealProductCard({ product, preview }: { product: CatalogProduct; preview: () => void }) {
  const prices = product.skus.map((sku) => sku.priceCents); const available = product.skus.some((sku) => sku.availableStock > 0);
  return <article className={`${panel} !p-4 flex flex-col`}><Link to={`/producto/${product.id}`} className="space-y-3 block">
    {product.images[0] ? <img src={imageUrl(product.images[0].url)} alt={product.images[0].altText || product.name} className="h-40 w-full object-contain rounded-xl" /> : <div className="h-40 flex items-center justify-center bg-surface-subtle rounded-xl text-ink-muted">Sin imagen</div>}
    <h2 className="font-bold text-lg break-words">{product.name}</h2></Link><p className="text-sm text-ink-light">{product.storeName}</p>
    {!!prices.length && <p className="text-xl font-bold">{prices.length > 1 ? 'Desde ' : ''}{money(Math.min(...prices))}</p>}<p className="text-sm">{available ? 'Disponible' : 'Agotado'}</p>
    <FavoriteButton kind="product" id={product.id}/><Button variant="outline" size="sm" onClick={preview}>Vista rápida de {product.name}</Button></article>;
}
export function RealCatalogPage() {
  const { id: storeId } = useParams(); const [params,setParams] = useSearchParams(); const [preview,setPreview] = useState<string>();
  const resource = useRemote(`catalog:${storeId || ''}:${params.toString()}`, async (signal) => {
    const [page,categories,zones,store] = await Promise.all([
      catalogApi.search({ q: params.get('q') || undefined, category: params.get('category') || undefined, storeId,
        zoneId: params.get('zoneId') || undefined, available: params.get('available') === 'true' ? 'true' : undefined,
        minPriceCents: params.has('minPriceCents') ? Number(params.get('minPriceCents')) : undefined,
        maxPriceCents: params.has('maxPriceCents') ? Number(params.get('maxPriceCents')) : undefined,
        cursor: params.get('cursor') || undefined }, signal), catalogApi.categories(signal),operationsApi.zones(signal),
      storeId ? catalogApi.store(storeId,signal) : Promise.resolve(null),
    ]); return { page,categories,zones,store };
  });
  const quick = useRemote(`preview:${preview || ''}`, (signal) => preview ? catalogApi.product(preview,signal) : Promise.resolve(null));
  function filter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const next = new URLSearchParams();
    for (const key of ['q','category','zoneId','available']) if (form.get(key)) next.set(key,String(form.get(key)));
    for (const key of ['minPriceCents','maxPriceCents']) if (form.get(key)) next.set(key,String(Math.round(Number(form.get(key))*100)));
    setParams(next);
  }
  return <div className="space-y-6"><PageTitle detail={resource.data?.store ? (resource.data.store.isOpen ? 'Recibiendo pedidos según su horario.' : 'El comercio está cerrado en este momento.') : 'Explora productos y presentaciones de los comercios de tu ciudad.'}>{resource.data?.store?.name || 'Catálogo'}</PageTitle>
    {resource.data?.store?.bannerUrl && <img src={imageUrl(resource.data.store.bannerUrl)} alt={`Banner de ${resource.data.store.name}`} className="w-full max-h-64 object-contain rounded-2xl"/>}
    {resource.data?.store?.logoUrl && <img src={imageUrl(resource.data.store.logoUrl)} alt={`Logo de ${resource.data.store.name}`} className="w-24 h-24 object-contain rounded-xl"/>}
    {storeId&&<><FavoriteButton kind="store" id={storeId}/><StoreReviews storeId={storeId}/></>}<div className="flex gap-4 text-primary font-semibold"><Link to="/negocios">Ver negocios</Link>{storeId && <Link to="/">Todo el catálogo</Link>}</div>
    <form key={`${storeId}:${params.toString()}`} onSubmit={filter} className={`${panel} grid sm:grid-cols-2 lg:grid-cols-3 gap-4 !space-y-0`} aria-label="Filtros del catálogo">
      <Input label="Buscar productos" name="q" maxLength={160} defaultValue={params.get('q') || ''} />
      <label className="space-y-2 text-sm font-semibold">Categoría de producto<select className={inputClass} name="category" defaultValue={params.get('category') || ''}><option value="">Todas</option>{resource.data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {!storeId && <label className="space-y-2 text-sm font-semibold">Zona del negocio<select className={inputClass} name="zoneId" defaultValue={params.get('zoneId') || ''}><option value="">Todas</option>{resource.data?.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></label>}
      <Input label="Precio mínimo (S/)" name="minPriceCents" type="number" min="0" step="0.01" max="1000000" defaultValue={params.has('minPriceCents') ? Number(params.get('minPriceCents'))/100 : ''} />
      <Input label="Precio máximo (S/)" name="maxPriceCents" type="number" min="0" step="0.01" max="1000000" defaultValue={params.has('maxPriceCents') ? Number(params.get('maxPriceCents'))/100 : ''} />
      <div className="space-y-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="available" value="true" defaultChecked={params.get('available') === 'true'} />Solo con stock</label><Button type="submit">Buscar</Button></div>
    </form>
    <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.error && resource.data && <>{!resource.data.page.items.length && <section className={panel}><p>No encontramos productos con estos filtros.</p></section>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{resource.data.page.items.map((product) => <RealProductCard key={product.id} product={product} preview={() => setPreview(product.id)} />)}</div>
      <Pager next={resource.data.page.nextCursor} isFirst={!params.has('cursor')} onFirst={() => { const next = new URLSearchParams(params); next.delete('cursor'); setParams(next); }} onNext={() => { const next = new URLSearchParams(params); if (resource.data?.page.nextCursor) next.set('cursor',resource.data.page.nextCursor); setParams(next); }} />
    </>}
    <Dialog isOpen={!!preview} onClose={() => setPreview(undefined)} title="Vista rápida" maxWidth="4xl"><RemoteState loading={quick.loading} error={quick.error} retry={quick.reload} />{quick.data && !quick.error && <RealProductContent key={quick.data.id} product={quick.data} />}</Dialog>
  </div>;
}
export function RealProductDetailPage() {
  const { id = '' } = useParams(); const resource = useRemote(`product:${id}`, (signal) => catalogApi.product(id,signal));
  return <div className="space-y-6"><Link to="/" className="text-primary font-semibold">Volver al catálogo</Link><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />{!resource.error && resource.data && <section className={panel}><RealProductContent key={id} product={resource.data} /></section>}</div>;
}
export function RealMerchantsPage() {
  const resource = useRemote('public-stores', (signal) => catalogApi.stores(signal));
  return <div className="space-y-6"><PageTitle>Negocios</PageTitle><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {!resource.error && resource.data && <>{!resource.data.length && <p>Todavía no hay negocios disponibles.</p>}<div className="grid sm:grid-cols-2 gap-5">{resource.data.map((store) => <article key={store.id} className={panel}>{store.logoUrl && <img src={imageUrl(store.logoUrl)} alt={`Logo de ${store.name}`} className="w-20 h-20 object-contain rounded-xl"/>}<h2 className="text-xl font-bold">{store.name}</h2><p>{store.zone_name}</p><p>{store.isOpen ? 'Abierto' : 'Cerrado'}</p><Link className="text-primary font-semibold" to={`/negocios/${store.id}`}>Ver productos de {store.name}</Link></article>)}</div></>}
  </div>;
}
