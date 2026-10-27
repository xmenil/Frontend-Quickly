import {FavoriteButton} from '../engagement/RealEngagementPages';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {useRealCartStore} from '../../store/realCartStore';
import { CatalogProduct, catalogApi, imageUrl, money } from '../../services/api/catalogApi';
import {CatalogBrowser} from './CatalogBrowser';
import { inputClass, PageTitle, panel, RemoteState, useRemote } from '../operations/shared';

export function RealProductContent({ product }: { product: CatalogProduct }) {
  const add=useRealCartStore(s=>s.add);const [quantity,setQuantity]=useState(1);const [message,setMessage]=useState('');
  const [skuId, setSku] = useState(product.skus[0]?.id || '');
  const sku = product.skus.find((row) => row.id === skuId) || product.skus[0];
  return <div className="grid md:grid-cols-2 gap-6">
    <div className="space-y-3">{product.images.length ? product.images.map((image) => <img key={image.id} src={imageUrl(image.url)} alt={image.altText || product.name} className="w-full max-h-96 object-contain rounded-xl bg-white" />) : <div className="h-52 bg-surface-subtle rounded-xl flex items-center justify-center text-ink-muted">Sin imagen</div>}</div>
    <div className="space-y-5"><Link to={`/negocios/${product.storeId}`} className="text-primary-dark font-semibold">{product.storeName}</Link><h1 className="text-2xl font-bold">{product.name}</h1><FavoriteButton kind="product" id={product.id}/>
      {product.brand && <p className="text-sm">Marca: {product.brand}</p>}<p className="whitespace-pre-wrap">{product.description}</p>
      <label className="block space-y-2 text-sm font-semibold">Presentación<select className={inputClass} value={sku?.id || ''} onChange={(e) => setSku(e.target.value)}>{product.skus.map((item) => <option key={item.id} value={item.id}>{item.variantName} · {money(item.priceCents)}</option>)}</select></label>
      {sku && <><p className="text-3xl font-bold">{money(sku.priceCents)}</p><p>{sku.availableStock > 0 ? `${sku.availableStock} unidades disponibles` : 'Agotado'}</p><p className="text-sm text-ink-muted">Código: {sku.skuCode}</p></>}
      <Input label="Cantidad a comprar" type="number" min={1} max={Math.min(sku?.availableStock||1,10000)} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/>
      <Button variant="selva" disabled={!sku||sku.availableStock<quantity||!Number.isInteger(quantity)||quantity<1} onClick={()=>{try{add({skuId:sku!.id,productId:product.id,storeId:product.storeId},quantity);setMessage('Producto agregado al carrito.');}catch(error){setMessage(error instanceof Error?error.message:'No se pudo agregar.');}}}>Agregar al carrito</Button>{message&&<p role="status">{message}</p>}<Link to="/carrito" className="text-primary-dark font-semibold">Ver carrito</Link>
    </div>
  </div>;
}
export function RealCatalogPage({home=false}: {home?:boolean}) { return <CatalogBrowser home={home}/>; }
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
