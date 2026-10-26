import {z} from 'zod';
import {apiRequest,ApiError} from './apiClient';
import type {components} from './contracts/schema';
const uuid=z.string().uuid(),date=z.string().datetime({offset:true});
const favorite=z.object({id:uuid,kind:z.enum(['product','store']),name:z.string(),available:z.boolean()});
const review=z.object({id:uuid,rating:z.number().int().min(1).max(5),comment:z.string().nullable(),createdAt:date});
const notification=z.object({id:uuid,title:z.string(),message:z.string(),kind:z.string(),relativeUrl:z.string().nullable(),readAt:date.nullable(),createdAt:date});
const ticket=z.object({id:uuid,subject:z.string(),status:z.enum(['open','in_review','resolved']),priority:z.enum(['low','normal','high']),version:z.number().int(),createdAt:date,resolvedAt:date.nullable(),orderId:uuid.nullable()});
const message=z.object({id:uuid,authorUserId:uuid,body:z.string(),createdAt:date});
const report=z.object({from:date,to:date,currency:z.literal('PEN'),definition:z.string(),orders:z.number().int(),delivered:z.number().int(),cancelled:z.number().int(),deliveredSalesCents:z.number().nonnegative(),cashCollectedCents:z.number().nonnegative(),courierFeesCents:z.number().nonnegative()});
const audit=z.object({id:z.string().regex(/^\d+$/),actorUserId:uuid.nullable(),action:z.string(),entityType:z.string(),entityId:uuid,requestId:uuid,occurredAt:date});
const page=<T extends z.ZodTypeAny>(item:T)=>z.object({items:z.array(item),nextCursor:z.string().nullable()});
function checked<T>(schema:z.ZodType<T>,value:unknown):T{const result=schema.safeParse(value);if(!result.success)throw new ApiError('No se pudo validar la respuesta del servidor.',502,'INVALID_RESPONSE');return result.data;}
async function get<T>(path:string,schema:z.ZodType<T>,signal?:AbortSignal){return checked(schema,await apiRequest(path,{signal}));}
const query=(cursor?:string)=>cursor?`?cursor=${encodeURIComponent(cursor)}`:'';
export const engagementApi={
 favorites:(cursor?:string,signal?:AbortSignal)=>get('/me/favorites'+query(cursor),page(favorite),signal),
 favorite:(kind:'product'|'store',id:string,enabled:boolean)=>apiRequest(`/me/favorites/${kind==='product'?'products':'stores'}/${id}`,{method:enabled?'PUT':'DELETE'}),
 reviews:(id:string,cursor?:string,signal?:AbortSignal)=>get(`/stores/${id}/reviews`+query(cursor),page(review).extend({count:z.number().int(),average:z.number().nullable()}),signal),
 review:(id:string,body:components['schemas']['ReviewInput'])=>apiRequest(`/orders/${id}/reviews`,{method:'POST',body}),
 notifications:(cursor?:string,signal?:AbortSignal)=>get('/me/notifications'+query(cursor),page(notification).extend({unreadCount:z.number().int()}),signal),
 read:(id?:string)=>apiRequest(id?`/me/notifications/${id}/read`:'/me/notifications/read-all',{method:'PATCH'}),
 tickets:(admin:boolean,cursor?:string,signal?:AbortSignal)=>get(`/${admin?'admin':'me'}/tickets`+query(cursor),page(ticket),signal),
 ticket:(admin:boolean,id:string,signal?:AbortSignal)=>get(`/${admin?'admin':'me'}/tickets/${id}`,ticket.extend({messages:z.array(message)}),signal),
 createTicket:async(body:components['schemas']['TicketInput'])=>checked(ticket,await apiRequest('/me/tickets',{method:'POST',body})),
 message:(id:string,body:components['schemas']['MessageInput'])=>apiRequest(`/tickets/${id}/messages`,{method:'POST',body}),
 decide:(id:string,body:components['schemas']['TicketDecision'])=>apiRequest(`/admin/tickets/${id}/decisions`,{method:'POST',body}),
 report:(path:string,range:{from?:string;to?:string},signal?:AbortSignal)=>get(path+'?'+new URLSearchParams(Object.entries(range).filter((entry):entry is [string,string]=>!!entry[1])),report,signal),
 audit:(cursor?:string,action?:string,signal?:AbortSignal)=>get('/admin/audit?'+new URLSearchParams({...cursor?{cursor}:{},...action?{action}:{}}),page(audit),signal),
};
