import React,{useState} from 'react';
import {z} from 'zod';
import {Link,useNavigate} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {Input} from '../../components/ui/Input';
import {useRealCartStore,CartIntent,intent as intentSchema} from '../../store/realCartStore';
import {catalogApi,money} from '../../services/api/catalogApi';
import {orderingApi,PurchaseInput,cashCents} from '../../services/api/orderingApi';
import {operationsApi} from '../../services/api/operationsApi';
import {ApiError} from '../../services/api/apiClient';
import {useAuthStore} from '../../store/authStore';
import {Feedback,inputClass,PageTitle,panel,RemoteState,useRemote} from '../operations/shared';

export function RealCartPage(){
  const {items,notice,update,remove}=useRealCartStore();
  const resource=useRemote(`real-cart:${items.map(i=>`${i.productId}:${i.skuId}`).join('|')}`,async signal=>Promise.all(items.map(async intent=>{
    try{const product=await catalogApi.product(intent.productId,signal);return{intent,product,sku:product.skus.find(s=>s.id===intent.skuId)};}catch(error){if(error instanceof ApiError&&error.status===404)return{intent,product:null,sku:undefined};throw error;}
  })));
  const rows=resource.data?.map(row=>({...row,intent:items.find(i=>i.skuId===row.intent.skuId)||row.intent}));
  const selected=rows?.filter(i=>i.intent.selected)||[];const valid=selected.length>0&&selected.every(i=>i.product?.storeId===i.intent.storeId&&i.sku&&i.sku.availableStock>=i.intent.quantity);
  return <div className="space-y-6"><PageTitle detail="Selecciona productos de una tienda. Se revisarán precios y existencias antes de confirmar.">Mi carrito</PageTitle>{notice&&<p role="status">{notice}</p>}<RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/>
    {!items.length&&<section className={panel}><p>Tu carrito está vacío.</p><Link to="/" className="text-primary">Explorar productos</Link></section>}
    {!resource.error&&rows?.map(({intent,product,sku})=><article key={intent.skuId} className={panel}>
      <label className="flex gap-3 items-center"><input type="checkbox" checked={intent.selected} onChange={e=>update(intent.skuId,{selected:e.target.checked})}/><span className="font-bold">{product?.name||'Producto no disponible'}</span></label>
      {sku&&<p>{product?.storeName} · {sku.variantName} · {money(sku.priceCents)} · {sku.availableStock} disponibles</p>}
      <Input id={`qty-${intent.skuId}`} label="Cantidad" type="number" min={1} max={10000} value={intent.quantity} onChange={e=>update(intent.skuId,{quantity:Number(e.target.value)})}/>
      <Input id={`note-${intent.skuId}`} label="Nota para la tienda" maxLength={500} value={intent.note} onChange={e=>update(intent.skuId,{note:e.target.value})}/>
      {(!sku||sku.availableStock<intent.quantity)&&<p className="text-destructive">Revisa o retira esta presentación; no está disponible en esa cantidad.</p>}
      <Button variant="outline" onClick={()=>remove(intent.skuId)}>Quitar {product?.name||'producto'}</Button>
    </article>)}
    {valid&&<Link to="/checkout" className="inline-block bg-primary text-white font-semibold px-5 py-3 rounded-xl">Continuar con la compra</Link>}
  </div>;
}
interface Pending{key:string;body:PurchaseInput;snapshot:CartIntent[];}
const journalKey=(id:string)=>`quickly_checkout_intent_v1:${id}`;
const pendingSchema=z.object({key:z.string().uuid(),body:z.object({addressId:z.string().uuid(),paymentMethod:z.literal('cash'),items:z.array(z.object({skuId:z.string().uuid(),quantity:z.number().int().min(1).max(10000),note:z.string().max(500).optional()})).min(1).max(100),cashTenderCents:z.number().int().positive().max(100000000000000).nullable().optional(),expectedTotalCents:z.number().int().positive().max(100000000000000).optional()}),snapshot:z.array(intentSchema).min(1).max(100)});
export function pendingFor(id:string):Pending|null|'invalid'{try{const raw=sessionStorage.getItem(journalKey(id));if(!raw)return null;const result=pendingSchema.safeParse(JSON.parse(raw));return result.success?result.data:'invalid';}catch{return 'invalid';}}
export function RealCheckoutPage(){
  const userId=useAuthStore(s=>s.currentUser!.id);const {items,consume}=useRealCartStore();const selected=items.filter(i=>i.selected);const navigate=useNavigate();
  const [pending,setPending]=useState<Pending|null>(()=>{const value=pendingFor(userId);return value==='invalid'?null:value;});const [invalid,setInvalid]=useState(()=>pendingFor(userId)==='invalid');const [address,setAddress]=useState('');const [exact,setExact]=useState(true);const [cash,setCash]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [correctable,setCorrectable]=useState(false);
  const addresses=useRemote('checkout-addresses',signal=>operationsApi.addresses(signal));const addressId=address||addresses.data?.find(a=>a.isDefault&&a.zoneActive)?.id||addresses.data?.find(a=>a.zoneActive)?.id||'';
  let cashTenderCents:number|null=null;let inputError='';if(!exact)try{cashTenderCents=cashCents(cash);}catch(error){inputError=error instanceof Error?error.message:'Importe no válido';}
  const body:PurchaseInput={addressId,paymentMethod:'cash',items:selected.map(i=>({skuId:i.skuId,quantity:i.quantity,note:i.note})),cashTenderCents};
  const canQuote=!!addressId&&selected.length>0&&!inputError&&!pending&&!invalid;
  const quoted=useRemote(`quote:${canQuote}:${JSON.stringify(body)}`,signal=>canQuote?orderingApi.quote(body,signal):Promise.resolve(null));
  async function send(recover=false){
    setBusy(true);setError('');setCorrectable(false);let intent=pending;
    try{
      if(!intent){if(!quoted.data)throw new Error('Solicita una cotización vigente.');intent={key:crypto.randomUUID(),body:{...body,expectedTotalCents:quoted.data.totalCents},snapshot:selected.map(i=>({...i}))};sessionStorage.setItem(journalKey(userId),JSON.stringify(intent));setPending(intent);}
      let orderId:string;
      if(recover){try{orderId=(await orderingApi.attempt(intent.key)).id;}catch(error){if(!(error instanceof ApiError)||error.status!==404)throw error;orderId=(await orderingApi.create(intent.body,intent.key)).orderId;}}
      else orderId=(await orderingApi.create(intent.body,intent.key)).orderId;
      consume(intent.snapshot);try{sessionStorage.removeItem(journalKey(userId));}catch{/* Recovery remains safe with the same key. */}navigate(`/cliente/pedidos/${orderId}`,{replace:true});
    }catch(error){setError(error instanceof Error?error.message:'No se pudo confirmar la compra.');setCorrectable(error instanceof ApiError&&[400,404,409,422].includes(error.status)&&!['IDEMPOTENCY_CONFLICT'].includes(error.code));}
    finally{setBusy(false);}
  }
  return <div className="max-w-2xl mx-auto space-y-6"><PageTitle>Confirmar compra</PageTitle><Feedback error={error}/>
    {invalid?<section className={panel}><p>No se pudo leer la confirmación guardada. Revisa tus pedidos antes de iniciar otra compra.</p><Link to="/cliente/pedidos" className="text-primary font-semibold">Revisar mis pedidos</Link><Button variant="outline" onClick={()=>{try{sessionStorage.removeItem(journalKey(userId));setInvalid(false);}catch{setError('Habilita el almacenamiento del navegador para recuperar tus confirmaciones.');}}}>Ya revisé mis pedidos; descartar confirmación dañada</Button></section>:pending?<section className={panel}><h2 className="text-xl font-bold">Confirmación pendiente de recuperar</h2><p>Revisaremos la misma solicitud para recuperar su resultado sin duplicar la compra.</p><Button disabled={busy} onClick={()=>void send(true)}>Recuperar compra pendiente</Button>{correctable&&<Button variant="outline" onClick={()=>{sessionStorage.removeItem(journalKey(userId));setPending(null);setError('');quoted.reload();}}>Corregir solicitud</Button>}</section>:<>
      {!selected.length?<Link to="/carrito">Volver al carrito</Link>:<section className={panel}><RemoteState loading={addresses.loading} error={addresses.error} retry={addresses.reload}/>
        <fieldset disabled={busy} className="space-y-5"><label className="block font-semibold space-y-2">Dirección de entrega<select className={inputClass} value={addressId} onChange={e=>setAddress(e.target.value)}><option value="">Selecciona una dirección</option>{addresses.data?.filter(a=>a.zoneActive).map(a=><option key={a.id} value={a.id}>{a.label} · {a.street} {a.streetNumber}</option>)}</select></label><Link to="/cliente/direcciones" className="text-primary">Administrar direcciones</Link>
          <p className="font-semibold">Pago en efectivo al entregar</p><label className="flex gap-2 items-center"><input type="checkbox" checked={exact} onChange={e=>setExact(e.target.checked)}/>Pagaré con el importe exacto</label>{!exact&&<Input label="Pagaré con (S/)" type="number" step="0.01" min="0.01" value={cash} onChange={e=>setCash(e.target.value)} error={inputError}/>}
          <RemoteState loading={quoted.loading} error={quoted.error} retry={quoted.reload}/>
          {!quoted.error&&quoted.data&&<div className="space-y-3"><h2 className="text-xl font-bold">Revisa tu compra en {quoted.data.storeName}</h2>{quoted.data.items.map((i,index)=><p key={`${i.skuId}:${index}`}>{i.productName} · {i.variantName} × {i.quantity} · {money(i.unitPriceCents*i.quantity)}</p>)}<p>Productos: {money(quoted.data.subtotalCents)}</p><p>Envío: {money(quoted.data.deliveryFeeCents)}</p><p className="text-2xl font-bold">Total: {money(quoted.data.totalCents)}</p><p>Efectivo previsto: {money(quoted.data.cashTenderCents)} · Cambio: {money(quoted.data.cashChangeCents)}</p><p className="text-sm text-ink-light">El stock se reserva al confirmar. Si cambia el total, tendrás que revisarlo otra vez.</p><Button disabled={busy||quoted.loading} isLoading={busy} onClick={()=>void send()}>Confirmar compra en efectivo</Button></div>}
        </fieldset></section>}
    </>}
  </div>;
}
