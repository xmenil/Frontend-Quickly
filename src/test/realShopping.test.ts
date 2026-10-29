import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {useRealCartStore} from '../store/realCartStore';
import {orderingApi,cashCents} from '../services/api/orderingApi';
import {resetApiSession} from '../services/api/apiClient';
import {pendingFor} from '../features/checkout/checkoutIntent';
const a={skuId:'10000000-0000-4000-8000-000000000001',productId:'20000000-0000-4000-8000-000000000001',storeId:'30000000-0000-4000-8000-000000000001'};
const b={skuId:'10000000-0000-4000-8000-000000000002',productId:'20000000-0000-4000-8000-000000000002',storeId:'30000000-0000-4000-8000-000000000002'};
beforeEach(()=>{localStorage.clear();sessionStorage.clear();resetApiSession();useRealCartStore.setState({items:[],notice:''});});afterEach(()=>vi.unstubAllGlobals());
it('selecciona varias tiendas y permite desmarcar una sin modificar las demás',()=>{useRealCartStore.getState().add(a,2);useRealCartStore.getState().add(b,1);const state=useRealCartStore.getState();expect(state.items).toHaveLength(2);expect(state.items.filter(i=>i.selected).map(i=>i.storeId)).toEqual([a.storeId,b.storeId]);state.update(a.skuId,{selected:false});expect(useRealCartStore.getState().items.filter(i=>i.selected).map(i=>i.skuId)).toEqual([b.skuId]);});
it('confirmar una compra retira solo las intenciones compradas que siguen sin cambios',()=>{const state=useRealCartStore.getState();state.add(a,2);const snapshot=useRealCartStore.getState().items.map(i=>({...i}));state.add(b,1);state.update(a.skuId,{quantity:3});state.consume(snapshot);expect(useRealCartStore.getState().items).toHaveLength(2);state.consume(useRealCartStore.getState().items.filter(i=>i.skuId===a.skuId));expect(useRealCartStore.getState().items[0].skuId).toBe(b.skuId);});
it('el carrito persistido solo guarda intención y no incorpora precios o identidad del navegador',()=>{localStorage.setItem('quickly_cart_v1',JSON.stringify([{id:'mock',price:1}]));useRealCartStore.getState().add(a,1);const stored=JSON.parse(localStorage.getItem('quickly_cart_real_v2')!);expect(stored[0]).not.toHaveProperty('priceCents');expect(stored[0]).not.toHaveProperty('userId');expect(stored[0].skuId).toBe(a.skuId);});
it('el precio del efectivo se convierte sin aceptar decimales adicionales ni importes negativos',()=>{expect(cashCents('20.01')).toBe(2001);expect(cashCents('0.29')).toBe(29);for(const value of ['0','-1','2.001','NaN'])expect(()=>cashCents(value)).toThrow();});
it('reintentar la compra transmite la misma clave y el total revisado, sin enviar un objeto de compra local',async()=>{const mock=vi.fn().mockResolvedValue(new Response(JSON.stringify({orderId:a.skuId,purchaseId:b.skuId})));vi.stubGlobal('fetch',mock);const body={addressId:a.productId,paymentMethod:'cash' as const,items:[{skuId:a.skuId,quantity:1}],expectedTotalCents:1350};await orderingApi.create(body,'same-intent');expect(mock.mock.calls[0][1].headers['Idempotency-Key']).toBe('same-intent');expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual(body);});
it('una cotización sin importes server válidos no permite usar datos demo',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({totalCents:'1350',items:[]}))));await expect(orderingApi.quote({addressId:a.productId,paymentMethod:'cash',items:[{skuId:a.skuId,quantity:1}]})).rejects.toMatchObject({code:'INVALID_RESPONSE'});});
it('una confirmación guardada dañada se distingue de la ausencia de una compra pendiente',()=>{expect(pendingFor('account')).toBeNull();sessionStorage.setItem('quickly_checkout_intent_v1:account',JSON.stringify({key:'../../mock',body:{total:1},snapshot:[null]}));expect(pendingFor('account')).toBe('invalid');});

it('recupera selección persistida de varias tiendas sin reducirla a una',()=>{
 useRealCartStore.getState().add(a,1);useRealCartStore.getState().add(b,2);
 useRealCartStore.setState({items:[]});window.dispatchEvent(new StorageEvent('storage',{key:'quickly_cart_real_v2'}));
 expect(useRealCartStore.getState().items.filter(i=>i.selected)).toHaveLength(2);
});
it('conserva el tipo de confirmación multitienda y su snapshot al recuperar una solicitud',()=>{
 useRealCartStore.getState().add(a,1);useRealCartStore.getState().add(b,1);
 const pending={key:crypto.randomUUID(),group:true,body:{addressId:a.productId,paymentMethod:'cash',items:[{skuId:a.skuId,quantity:1},{skuId:b.skuId,quantity:1}],expectedTotalCents:2700},snapshot:useRealCartStore.getState().items};
 sessionStorage.setItem('quickly_checkout_intent_v1:account',JSON.stringify(pending));expect(pendingFor('account')).toEqual(pending);
});
it('cotización multitienda inválida no permite confirmar importes recibidos sin validar',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({stores:[],totalCents:2700,subtotalCents:2100,deliveryFeeCents:600}))));
 await expect(orderingApi.groupQuote({addressId:a.productId,paymentMethod:'cash',items:[{skuId:a.skuId,quantity:1}]})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('un error al confirmar multitienda conserva el carrito y no reintenta la mutación',async()=>{
 useRealCartStore.getState().add(a,1);useRealCartStore.getState().add(b,1);
 const mock=vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));vi.stubGlobal('fetch',mock);
 await expect(orderingApi.groupCreate({addressId:a.productId,paymentMethod:'cash',items:[{skuId:a.skuId,quantity:1},{skuId:b.skuId,quantity:1}]},'same-group')).rejects.toMatchObject({code:'NETWORK_ERROR'});
 expect(mock).toHaveBeenCalledTimes(1);expect(mock.mock.calls[0][1].headers['Idempotency-Key']).toBe('same-group');expect(useRealCartStore.getState().items).toHaveLength(2);
});
