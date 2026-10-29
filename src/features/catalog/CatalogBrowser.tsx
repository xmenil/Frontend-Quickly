import React, {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ShoppingBag, UtensilsCrossed, Coffee, Package, HeartPulse, Shirt, Store} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Input} from '../../components/ui/Input';
import {Dialog} from '../../components/ui/Dialog';
import {catalogApi, CatalogProduct, imageUrl} from '../../services/api/catalogApi';
import {operationsApi} from '../../services/api/operationsApi';
import {formatCents} from '../../lib/currency';
import {FavoriteButton, StoreReviews} from '../engagement/RealEngagementPages';
import {inputClass, PageTitle, Pager, panel, RemoteState, useRemote} from '../operations/shared';
import {RealProductContent} from './RealCatalogPages';

const categoryIcons: Record<string, typeof Package> = {
  prepared_food: UtensilsCrossed, beverages: Coffee, health: HeartPulse, clothing: Shirt,
};

function ProductCard({product, preview}: {product: CatalogProduct; preview: ()=>void}) {
  const prices = product.skus.map(sku=>sku.priceCents);
  const available = product.skus.some(sku=>sku.availableStock>0);
  return <article className="group bg-white rounded-2xl border border-border shadow-sm hover:border-primary-dark hover:shadow-card overflow-hidden flex flex-col min-w-0 transition-all">
    <Link to={`/producto/${product.id}`}>
      <div className="aspect-square w-full bg-surface-subtle overflow-hidden border-b border-border">
        {product.images[0] ? <img src={imageUrl(product.images[0].url)} alt={product.images[0].altText || product.name} loading="lazy" className="w-full h-full object-contain group-hover:scale-105 transition-transform"/> : <div className="w-full h-full flex flex-col gap-2 items-center justify-center text-ink-muted"><ShoppingBag aria-hidden className="w-10 h-10"/><span className="text-sm">Sin imagen</span></div>}
      </div>
      <h3 className="font-bold text-sm sm:text-base break-words px-3 pt-3 line-clamp-2">{product.name}</h3>
    </Link>
    <div className="p-3 flex flex-col gap-3 flex-1">
      <Link to={`/negocios/${product.storeId}`} className="text-sm text-ink-light flex items-center gap-1 min-w-0 min-h-11"><Store aria-hidden className="w-4 h-4 shrink-0"/><span className="truncate">{product.storeName}</span></Link>
      <p className={`text-sm font-semibold ${available?'text-selva':'text-destructive'}`}>{available?'Stock disponible':'Agotado'}</p>
      <p className="font-bold text-lg tabular-nums mt-auto">{prices.length ? <>{prices.length>1?'Desde ':''}{formatCents(Math.min(...prices))}</> : 'Sin presentaciones'}</p>
      <FavoriteButton kind="product" id={product.id}/>
      <Button variant="selva" size="sm" aria-label={`Vista rápida de ${product.name}`} onClick={preview}>Elegir presentación</Button>
    </div>
  </article>;
}

export function CatalogBrowser({home=false}: {home?:boolean}) {
  const {id:storeId} = useParams();
  const [params,setParams] = useSearchParams();
  const [preview,setPreview] = useState<string>();
  const categories = useRemote('catalog-categories', signal=>catalogApi.categories(signal));
  const zones = useRemote('catalog-zones', signal=>operationsApi.zones(signal));
  const store = useRemote(`catalog-store:${storeId || ''}`, signal=>storeId?catalogApi.store(storeId,signal):Promise.resolve(null));
  const products = useRemote(`catalog-products:${storeId || ''}:${params}`, signal=>catalogApi.search({
    q:params.get('q') || undefined, category:params.get('category') || undefined, storeId,
    zoneId:params.get('zoneId') || undefined, available:params.get('available')==='true'?'true':undefined,
    minPriceCents:params.has('minPriceCents')?Number(params.get('minPriceCents')):undefined,
    maxPriceCents:params.has('maxPriceCents')?Number(params.get('maxPriceCents')):undefined,
    cursor:params.get('cursor') || undefined,
  },signal));
  const quick = useRemote(`catalog-preview:${preview || ''}`, signal=>preview?catalogApi.product(preview,signal):Promise.resolve(null));
  function category(id: string) {
    const next = new URLSearchParams(params); next.delete('cursor');
    if (id) next.set('category',id); else next.delete('category');
    setParams(next);
  }
  function filter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const next = new URLSearchParams();
    for (const key of ['q','category','zoneId','available']) if(form.get(key)) next.set(key,String(form.get(key)));
    for (const key of ['minPriceCents','maxPriceCents']) if(form.get(key)) next.set(key,String(Math.round(Number(form.get(key))*100)));
    setParams(next);
  }
  return <div className="space-y-5">
    {home && <section id="categorias" aria-label="Categorías de productos" className="space-y-3 scroll-mt-36">
      <h2 className="text-xl font-bold">Explora por categoría</h2>
      <RemoteState loading={categories.loading} error={categories.error} retry={categories.reload}/>
      {!categories.loading && !categories.error && categories.data && <>
        {!categories.data.length && <p>Todavía no hay categorías disponibles.</p>}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {[{id:'',code:'all',name:'Todas'},...categories.data].map(item=>{
            const Icon = categoryIcons[item.code] || Package;
            return <button type="button" key={item.id} onClick={()=>category(item.id)} aria-pressed={(params.get('category') || '')===item.id} className={`min-h-24 rounded-2xl border py-3 px-2 flex flex-col items-center gap-2 shadow-sm transition-colors hover:border-primary-dark ${((params.get('category') || '')===item.id)?'bg-primary-50 border-primary-dark':'bg-white border-border'}`}>
              <span className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-dark"><Icon aria-hidden className="w-6 h-6"/></span><span className="text-sm font-bold text-ink break-words">{item.name}</span>
            </button>;
          })}
        </div>
      </>}
    </section>}
    {home ? <h2 className="text-xl font-bold">Productos de tu ciudad</h2> : <PageTitle detail={store.data?(store.data.isOpen?'Recibiendo pedidos según su horario.':'El comercio está cerrado en este momento.'):'Explora productos y presentaciones de los comercios de tu ciudad.'}>{store.data?.name || 'Catálogo'}</PageTitle>}
    {storeId && <><RemoteState loading={store.loading} error={store.error} retry={store.reload}/>
      {!store.error && store.data && <>
        {store.data.bannerUrl && <img src={imageUrl(store.data.bannerUrl)} alt={`Banner de ${store.data.name}`} className="w-full max-h-64 object-contain rounded-2xl"/>}
        {store.data.logoUrl && <img src={imageUrl(store.data.logoUrl)} alt={`Logo de ${store.data.name}`} className="w-24 h-24 object-contain rounded-xl"/>}
        <FavoriteButton kind="store" id={storeId}/><StoreReviews storeId={storeId}/>
      </>}
      <Link to="/" className="inline-flex min-h-11 items-center text-primary-dark font-semibold">Todo el catálogo</Link>
    </>}
    {!home && <RemoteState loading={categories.loading} error={categories.error} retry={categories.reload}/>}
    <form key={`${storeId}:${params}`} onSubmit={filter} className={`${panel} grid sm:grid-cols-2 lg:grid-cols-3 gap-4 !space-y-0`} aria-label="Filtros del catálogo">
      <Input label="Buscar productos" name="q" maxLength={160} defaultValue={params.get('q') || ''}/>
      <label className="space-y-2 text-sm font-semibold">Categoría de producto<select className={inputClass} name="category" defaultValue={params.get('category') || ''}><option value="">Todas</option>{params.get('category') && !categories.data?.some(c=>c.id===params.get('category')) && <option value={params.get('category')!}>Categoría seleccionada</option>}{categories.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {!storeId && <div><label className="block space-y-2 text-sm font-semibold">Zona del negocio<select className={inputClass} name="zoneId" defaultValue={params.get('zoneId') || ''}><option value="">Todas</option>{params.get('zoneId') && !zones.data?.some(z=>z.id===params.get('zoneId')) && <option value={params.get('zoneId')!}>Zona seleccionada</option>}{zones.data?.map(z=><option key={z.id} value={z.id}>{z.name}</option>)}</select></label><RemoteState loading={zones.loading} error={zones.error} retry={zones.reload}/></div>}
      <Input label="Precio mínimo (S/)" name="minPriceCents" type="number" min="0" step="0.01" max="1000000" defaultValue={params.has('minPriceCents')?Number(params.get('minPriceCents'))/100:''}/>
      <Input label="Precio máximo (S/)" name="maxPriceCents" type="number" min="0" step="0.01" max="1000000" defaultValue={params.has('maxPriceCents')?Number(params.get('maxPriceCents'))/100:''}/>
      <div className="space-y-3"><label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" name="available" value="true" defaultChecked={params.get('available')==='true'}/>Solo con stock</label><Button variant="selva" type="submit">Buscar</Button></div>
    </form>
    <div aria-label="Resultados del catálogo" aria-busy={products.loading} className="space-y-5">
      <RemoteState loading={products.loading} error={products.error} retry={products.reload}/>
      {!products.loading && !products.error && products.data && <>
        {!products.data.items.length && <section className={panel}><h3 className="font-bold">No encontramos productos con estos filtros.</h3><p className="text-ink-light">Prueba otra búsqueda o vuelve a consultar más adelante.</p><Button variant="outline" onClick={()=>setParams({})}>Limpiar filtros</Button></section>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{products.data.items.map(product=><ProductCard key={product.id} product={product} preview={()=>setPreview(product.id)}/>)}</div>
        <Pager next={products.data.nextCursor} isFirst={!params.has('cursor')} onFirst={()=>{const next=new URLSearchParams(params);next.delete('cursor');setParams(next);}} onNext={()=>{const next=new URLSearchParams(params);if(products.data?.nextCursor)next.set('cursor',products.data.nextCursor);setParams(next);}}/>
      </>}
    </div>
    <Dialog isOpen={!!preview} onClose={()=>setPreview(undefined)} title="Vista rápida" maxWidth="4xl"><RemoteState loading={quick.loading} error={quick.error} retry={quick.reload}/>{!quick.loading && !quick.error && quick.data && <RealProductContent key={quick.data.id} product={quick.data}/>}</Dialog>
  </div>;
}
