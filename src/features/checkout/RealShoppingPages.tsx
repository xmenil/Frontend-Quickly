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
  return <div className="space-y-6"><PageTitle detail="Selecciona productos de una o varias tiendas. Cada tienda tendrá su propio envío y cobro; revisa el desglose antes de confirmar.">Mi carrito</PageTitle>{notice&&<p role="status">{notice}</p>}<RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/>
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
interface Pending{key:string;body:PurchaseInput;snapshot:CartIntent[];group?:boolean;}
const journalKey=(id:string)=>`quickly_checkout_intent_v1:${id}`;
const pendingSchema=z.object({key:z.string().uuid(),group:z.boolean().optional(),body:z.object({addressId:z.string().uuid(),paymentMethod:z.literal('cash'),items:z.array(z.object({skuId:z.string().uuid(),quantity:z.number().int().min(1).max(10000),note:z.string().max(500).optional()})).min(1).max(100),cashTenderCents:z.number().int().positive().max(100000000000000).nullable().optional(),expectedTotalCents:z.number().int().positive().max(100000000000000).optional()}),snapshot:z.array(intentSchema).min(1).max(100)});
export function pendingFor(id:string):Pending|null|'invalid'{try{const raw=sessionStorage.getItem(journalKey(id));if(!raw)return null;const result=pendingSchema.safeParse(JSON.parse(raw));return result.success?result.data:'invalid';}catch{return 'invalid';}}
import {
  MapPin,
  Banknote,
  Store,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export function RealCheckoutPage() {
  const userId = useAuthStore((s) => s.currentUser!.id);
  const { items, consume } = useRealCartStore();
  const selected = items.filter((i) => i.selected);
  const navigate = useNavigate();

  const [pending, setPending] = useState<Pending | null>(() => {
    const value = pendingFor(userId);
    return value === 'invalid' ? null : value;
  });
  const [invalid, setInvalid] = useState(() => pendingFor(userId) === 'invalid');
  const [address, setAddress] = useState('');
  const [exact, setExact] = useState(true);
  const [cash, setCash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [correctable, setCorrectable] = useState(false);

  const addresses = useRemote('checkout-addresses', (signal) => operationsApi.addresses(signal));
  const addressId =
    address ||
    addresses.data?.find((a) => a.isDefault && a.zoneActive)?.id ||
    addresses.data?.find((a) => a.zoneActive)?.id ||
    '';

  const selectedAddressObj = addresses.data?.find((a) => a.id === addressId);
  const multi = new Set(selected.map((i) => i.storeId)).size > 1;

  let cashTenderCents: number | null = null;
  let inputError = '';
  if (!multi && !exact) {
    try {
      cashTenderCents = cashCents(cash);
    } catch (error) {
      inputError = error instanceof Error ? error.message : 'Importe no válido';
    }
  }

  const body: PurchaseInput = {
    addressId,
    paymentMethod: 'cash',
    items: selected.map((i) => ({ skuId: i.skuId, quantity: i.quantity, note: i.note })),
    cashTenderCents,
  };

  const canQuote = !!addressId && selected.length > 0 && !inputError && !pending && !invalid;
  const quoted = useRemote(`quote:${canQuote}:${multi}:${JSON.stringify(body)}`, async (signal) => {
    if (!canQuote) return null;
    if (multi) return orderingApi.groupQuote(body, signal);
    const single = await orderingApi.quote(body, signal);
    return {
      stores: [single],
      subtotalCents: single.subtotalCents,
      deliveryFeeCents: single.deliveryFeeCents,
      totalCents: single.totalCents,
    };
  });

  async function send(recover = false) {
    setBusy(true);
    setError('');
    setCorrectable(false);
    let intent = pending;
    try {
      if (!intent) {
        if (!quoted.data) throw new Error('Solicita una cotización vigente.');
        intent = {
          key: crypto.randomUUID(),
          group: multi,
          body: { ...body, expectedTotalCents: quoted.data.totalCents },
          snapshot: selected.map((i) => ({ ...i })),
        };
        sessionStorage.setItem(journalKey(userId), JSON.stringify(intent));
        setPending(intent);
      }
      let destination: string;
      if (intent.group) {
        let result;
        if (recover) {
          try {
            result = await orderingApi.groupAttempt(intent.key);
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 404) throw error;
            result = await orderingApi.groupCreate(intent.body, intent.key);
          }
        } else {
          result = await orderingApi.groupCreate(intent.body, intent.key);
        }
        destination = `/cliente/compras/${result.id}`;
      } else {
        let orderId: string;
        if (recover) {
          try {
            orderId = (await orderingApi.attempt(intent.key)).id;
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 404) throw error;
            orderId = (await orderingApi.create(intent.body, intent.key)).orderId;
          }
        } else {
          orderId = (await orderingApi.create(intent.body, intent.key)).orderId;
        }
        destination = `/cliente/pedidos/${orderId}`;
      }
      consume(intent.snapshot);
      try {
        sessionStorage.removeItem(journalKey(userId));
      } catch {
        /* Recovery remains safe with the same key. */
      }
      navigate(destination, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo confirmar la compra.');
      setCorrectable(
        error instanceof ApiError &&
          [400, 404, 409, 422].includes(error.status) &&
          !['IDEMPOTENCY_CONFLICT'].includes(error.code)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 pb-28 sm:px-6 lg:px-8">
      {/* Navegación hacia atrás */}
      <div className="flex items-center justify-between">
        <Link
          to="/carrito"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-primary hover:text-primary-hover"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Volver al carrito
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="h-4 w-4" /> Pago 100% contra entrega
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">Confirmar compra</h1>
        <p className="text-sm text-ink-light">
          {multi
            ? 'Compra multitienda: cada comercio despachará de forma independiente con entrega y cobro en efectivo.'
            : 'Revisa tu dirección, pago contra entrega en efectivo y el desglose oficial del pedido.'}
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">No se pudo procesar la confirmación</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {invalid ? (
        <section className="rounded-2xl border border-warning-border bg-surface p-6 shadow-subtle space-y-4">
          <h2 className="text-lg font-bold text-ink">Confirmación no recuperable</h2>
          <p className="text-sm text-ink-light">
            No se pudo leer la confirmación guardada en este navegador. Por seguridad, revisa tus pedidos antes de iniciar otra compra para evitar duplicados.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/cliente/pedidos" className="inline-flex items-center justify-center font-medium rounded-xl bg-primary text-white px-4 py-2 text-sm">
              Revisar mis pedidos
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  sessionStorage.removeItem(journalKey(userId));
                  setInvalid(false);
                } catch {
                  setError('Habilita el almacenamiento del navegador para continuar.');
                }
              }}
            >
              Ya revisé; descartar confirmación dañada
            </Button>
          </div>
        </section>
      ) : pending ? (
        <section className="rounded-2xl border border-primary/40 bg-surface p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5 text-primary">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <h2 className="text-lg font-bold text-ink">Confirmación pendiente de recuperación</h2>
          </div>
          <p className="text-sm text-ink-light">
            Revisaremos la solicitud original con su clave idempotente para recuperar el resultado oficial sin duplicar compras ni pedidos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void send(true)} className="gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Recuperar compra pendiente
            </Button>
            {correctable && (
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem(journalKey(userId));
                  setPending(null);
                  setError('');
                  quoted.reload();
                }}
              >
                Corregir solicitud
              </Button>
            )}
          </div>
        </section>
      ) : !selected.length ? (
        <section className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
          <p className="text-base text-ink-light">No tienes productos seleccionados para comprar.</p>
          <Link to="/carrito" className="inline-block text-primary font-semibold hover:underline">
            Ir al carrito y seleccionar productos
          </Link>
        </section>
      ) : (
        <div className="space-y-6">
          {/* Paso 1: Dirección de entrega */}
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-ink">Dirección de entrega</h2>
              </div>
              <Link to="/cliente/direcciones" className="text-xs font-semibold text-primary hover:underline">
                Gestionar direcciones
              </Link>
            </div>

            <RemoteState loading={addresses.loading} error={addresses.error} retry={addresses.reload} />

            {addresses.data && addresses.data.filter((a) => a.zoneActive).length === 0 ? (
              <div className="rounded-xl border border-warning-border bg-warning-soft p-4 text-sm text-warning-strong space-y-2">
                <p className="font-semibold">No tienes direcciones con cobertura activa en Tingo María.</p>
                <Link to="/cliente/direcciones" className="inline-block font-bold underline">
                  Agregar una dirección en zona de cobertura
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <label htmlFor="checkout-address-select" className="block text-sm font-semibold text-ink">
                  Selecciona el destino del pedido
                </label>
                <select
                  id="checkout-address-select"
                  className={inputClass}
                  value={addressId}
                  onChange={(e) => setAddress(e.target.value)}
                >
                  <option value="">Selecciona una dirección...</option>
                  {addresses.data
                    ?.filter((a) => a.zoneActive)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.street} {a.streetNumber} ({a.zoneName})
                      </option>
                    ))}
                </select>

                {selectedAddressObj && (
                  <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary-50/20 p-3.5 text-xs text-ink">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-ink">{selectedAddressObj.label}</p>
                      <p className="text-ink-light">
                        {selectedAddressObj.street} {selectedAddressObj.streetNumber}
                        {selectedAddressObj.reference ? ` · Ref: ${selectedAddressObj.reference}` : ''}
                      </p>
                      <p className="font-medium text-primary">Zona: {selectedAddressObj.zoneName}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Paso 2: Método de pago */}
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                2
              </span>
              <h2 className="text-lg font-bold text-ink">Método de pago</h2>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-surface-subtle p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <Banknote className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Pago en efectivo contra entrega</p>
                <p className="text-xs text-ink-light">
                  Pagas directamente al repartidor al momento de recibir tu pedido.
                </p>
              </div>
            </div>

            {multi ? (
              <p className="rounded-xl border border-border bg-surface-subtle p-3.5 text-xs text-ink-light leading-relaxed">
                ℹ️ Esta es una compra multitienda. Cada comercio enviará su propio repartidor y cobrará en efectivo de manera independiente. Te recomendamos preparar el monto exacto para cada entrega.
              </p>
            ) : (
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 text-sm font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exact}
                    onChange={(e) => setExact(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>Pagaré con el importe exacto</span>
                </label>

                {!exact && (
                  <div className="max-w-xs space-y-1 pt-1">
                    <Input
                      label="¿Con cuánto pagarás en efectivo? (S/)"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ej. 50.00"
                      value={cash}
                      onChange={(e) => setCash(e.target.value)}
                      error={inputError}
                    />
                    <p className="text-xs text-ink-muted">
                      El repartidor llevará el cambio exacto para este importe.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Paso 3: Cotización oficial en tiempo real */}
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                3
              </span>
              <h2 className="text-lg font-bold text-ink">Cotización y confirmación</h2>
            </div>

            <RemoteState loading={quoted.loading} error={quoted.error} retry={quoted.reload} />

            {!quoted.error && quoted.data && (
              <div className="space-y-5">
                {quoted.data.stores.map((store) => (
                  <article
                    key={store.storeId}
                    className="rounded-xl border border-border bg-surface-subtle/40 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-primary font-bold text-base border-b border-border/60 pb-2">
                      <Store className="h-5 w-5" />
                      <span>{store.storeName}</span>
                    </div>

                    <ul className="divide-y divide-border/60 text-xs text-ink space-y-2 pt-1">
                      {store.items.map((i, index) => (
                        <li key={`${i.skuId}:${index}`} className="flex justify-between items-start pt-2">
                          <div>
                            <span className="font-semibold text-sm">{i.productName}</span>
                            <span className="text-ink-muted"> ({i.variantName})</span>
                            <p className="text-ink-light">Cantidad: {i.quantity}</p>
                            {i.note && <p className="italic text-ink-muted">Nota: "{i.note}"</p>}
                          </div>
                          <span className="font-bold tabular-nums text-sm">
                            {money(i.unitPriceCents * i.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-border/80 pt-2.5 text-xs space-y-1 text-ink-light">
                      <div className="flex justify-between">
                        <span>Productos:</span>
                        <span className="tabular-nums font-medium text-ink">{money(store.subtotalCents)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa de envío ({selectedAddressObj?.zoneName || 'Zona'}):</span>
                        <span className="tabular-nums font-medium text-ink">{money(store.deliveryFeeCents)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-ink pt-1 border-t border-border/60">
                        <span>Total de esta entrega:</span>
                        <span className="tabular-nums text-primary">{money(store.totalCents)}</span>
                      </div>
                      {store.cashTenderCents > 0 && store.cashChangeCents > 0 && (
                        <div className="flex justify-between text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-1 font-semibold">
                          <span>Pagas con {money(store.cashTenderCents)}:</span>
                          <span>Vuelto previsto: {money(store.cashChangeCents)}</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {/* Resumen Total */}
                <div className="rounded-xl border border-primary/30 bg-primary-50/20 p-4 space-y-3">
                  <div className="flex justify-between text-base font-bold text-ink">
                    <span>Total general a pagar en efectivo:</span>
                    <span className="text-2xl font-extrabold text-primary tabular-nums">
                      {money(quoted.data.totalCents)}
                    </span>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed">
                    El inventario se reserva de forma segura al pulsar el botón. Cada pedido se registrará con clave de idempotencia única.
                  </p>

                  <Button
                    disabled={busy || quoted.loading || !addressId}
                    isLoading={busy}
                    onClick={() => void send()}
                    className="min-h-12 w-full gap-2 text-base font-semibold shadow-md"
                  >
                    Confirmar pedido en efectivo
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

