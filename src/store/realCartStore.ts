import {create} from 'zustand';
import {z} from 'zod';
const key='quickly_cart_real_v2';
export const intent=z.object({skuId:z.string().uuid(),productId:z.string().uuid(),storeId:z.string().uuid(),quantity:z.number().int().min(1).max(10000),note:z.string().max(500),selected:z.boolean(),revision:z.string().uuid()});
export type CartIntent=z.infer<typeof intent>;
function read(){try{const raw=localStorage.getItem(key);if(!raw)return{items:[] as CartIntent[],notice:localStorage.getItem('quickly_cart_v1')?'El carrito anterior debe reconstruirse desde el catálogo actual.':''};const parsed=z.array(intent).max(100).safeParse(JSON.parse(raw));if(!parsed.success)return{items:[],notice:'Reconstruye tu carrito desde el catálogo actual.'};const unique=[...new Map(parsed.data.map(i=>[i.skuId,i])).values()];return{items:unique,notice:''};}catch{return{items:[],notice:'No se pudo recuperar el carrito de este navegador.'};}}
interface State{items:CartIntent[];notice:string;add:(i:Pick<CartIntent,'skuId'|'productId'|'storeId'>,quantity:number)=>void;update:(id:string,changes:Partial<Pick<CartIntent,'quantity'|'note'|'selected'>>)=>void;remove:(id:string)=>void;consume:(snapshot:CartIntent[])=>void;clear:()=>void;selectStoreItems:(storeId:string,selected:boolean)=>void;}
export const useRealCartStore=create<State>((set,get)=>{
  function save(items:CartIntent[]){let notice='';try{localStorage.setItem(key,JSON.stringify(items));}catch{notice='Los cambios del carrito no pudieron guardarse en este navegador.';}set({items,notice});}
  return{...read(),add:(value,quantity)=>{if(!Number.isInteger(quantity)||quantity<1)throw new Error('Cantidad no válida');const items=get().items;const old=items.find(i=>i.skuId===value.skuId);if(items.length>=100&&!old)throw new Error('El carrito admite hasta 100 presentaciones');if((old?.quantity||0)+quantity>10000)throw new Error('La cantidad supera el máximo permitido');const item={...value,quantity:(old?.quantity||0)+quantity,note:old?.note||'',selected:true,revision:crypto.randomUUID()};save([...items.filter(i=>i.skuId!==value.skuId),item]);},
    update:(id,changes)=>{if(changes.quantity!==undefined&&(!Number.isInteger(changes.quantity)||changes.quantity<1||changes.quantity>10000))return;const target=get().items.find(i=>i.skuId===id);if(!target)return;save(get().items.map(i=>i.skuId===id?{...i,...changes,revision:crypto.randomUUID()}:i));},
    remove:(id)=>save(get().items.filter(i=>i.skuId!==id)),consume:(snapshot)=>save(get().items.filter(i=>!snapshot.some(s=>s.skuId===i.skuId&&s.revision===i.revision&&s.quantity===i.quantity))),
    clear:()=>save([]),
    selectStoreItems:(storeId,selected)=>save(get().items.map(i=>i.storeId===storeId?{...i,selected,revision:crypto.randomUUID()}:i))};
});
window.addEventListener('storage',event=>{if(event.key===key)useRealCartStore.setState(read());});
