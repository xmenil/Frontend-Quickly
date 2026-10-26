import {z} from 'zod';
import type {components} from './contracts/schema';
import {apiRequest,ApiError} from './apiClient';
type S=components['schemas'];
export type PurchaseInput=S['CreatePurchaseDto'];export type Order=S['OrderDetailDto'];export type OrderSummary=S['OrderSummaryDto'];export type Quote=S['QuoteDto'];
const uuid=z.string().uuid();const cents=z.number().int().nonnegative();const date=z.string().datetime({offset:true});
const line=z.object({skuId:uuid,productName:z.string(),variantName:z.string(),quantity:z.number().int().positive(),unitPriceCents:cents,note:z.string()});
const assignment=z.object({id:uuid,courierUserId:uuid,status:z.enum(['accepted','picked_up','delivered','cancelled']),version:z.number().int(),agreedFeeCents:cents});
const summaryShape={id:uuid,purchaseId:uuid,code:z.string(),storeId:uuid,storeName:z.string(),status:z.enum(['pending','confirmed','preparing','ready','in_transit','delivered','cancelled','rejected']),version:z.number().int(),subtotalCents:cents,deliveryFeeCents:cents,totalCents:cents,paymentStatus:z.string(),cashTenderCents:cents.nullable(),cashReceivedCents:cents.nullable(),collectedByUserId:uuid.nullable(),createdAt:date,acceptanceExpiresAt:date.nullable(),assignment:assignment.nullable()};
const summary:z.ZodType<OrderSummary>=z.object(summaryShape);
const detail:z.ZodType<Order>=z.object({...summaryShape,items:z.array(line),destination:z.object({recipientName:z.string(),phone:z.string(),street:z.string(),streetNumber:z.string(),reference:z.string()}).nullable(),events:z.array(z.object({status:z.string(),reason:z.string(),occurredAt:date})),incidents:z.array(z.object({id:uuid,description:z.string(),createdAt:date})).optional()});
const quote:z.ZodType<Quote>=z.object({storeId:uuid,storeName:z.string(),subtotalCents:cents,deliveryFeeCents:cents,totalCents:cents,cashTenderCents:cents,cashChangeCents:cents,items:z.array(line),paymentMethods:z.array(z.string())});
function checked<T>(schema:z.ZodType<T>,value:unknown):T{const result=schema.safeParse(value);if(!result.success)throw new ApiError('La respuesta del servicio de pedidos no es válida.',0,'INVALID_RESPONSE');return result.data;}
export const orderingApi={
  quote:async(body:PurchaseInput,signal?:AbortSignal)=>checked(quote,await apiRequest('/checkout/quote',{method:'POST',body,signal})),
  create:async(body:PurchaseInput,key:string)=>checked(z.object({orderId:uuid,purchaseId:uuid}),await apiRequest('/purchases',{method:'POST',body,headers:{'Idempotency-Key':key},timeoutMs:30000})),
  attempt:async(key:string)=>checked(detail,await apiRequest(`/me/checkout-attempts/${key}`)),
  detail:async(id:string,signal?:AbortSignal)=>checked(detail,await apiRequest(`/orders/${id}`,{signal})),
  list:async(path:string,query:Record<string,string|undefined>={},signal?:AbortSignal)=>{const params=new URLSearchParams();Object.entries(query).forEach(([key,value])=>{if(value)params.set(key,value);});return checked(z.object({items:z.array(summary),nextCursor:uuid.nullable()}),await apiRequest(`${path}?${params}`,{signal}));},
  action:(path:string,body:unknown={})=>apiRequest(path,{method:'POST',body}),
  couriers:async(storeId:string,signal?:AbortSignal)=>checked(z.array(z.object({userId:uuid,fullName:z.string()})),await apiRequest(`/admin/courier-options?storeId=${storeId}`,{signal})),
};
export function cashCents(value:string):number{if(!/^\d+(?:\.\d{1,2})?$/.test(value))throw new Error('Ingresa un importe con hasta dos decimales.');const[whole,fraction='']=value.split('.');const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(!Number.isSafeInteger(result)||result<1||result>100000000000000)throw new Error('Importe fuera de rango.');return result;}
