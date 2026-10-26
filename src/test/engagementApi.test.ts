import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {engagementApi} from '../services/api/engagementApi';
import {resetApiSession} from '../services/api/apiClient';
const id='10000000-0000-4000-8000-000000000001';
beforeEach(()=>resetApiSession());afterEach(()=>vi.unstubAllGlobals());
it('rechaza favoritos con identidad de producto inválida sin usar datos locales',async()=>{localStorage.setItem('favorites','["mock"]');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[{id:'mock',name:'Demo',kind:'product',available:true}],nextCursor:null}))));await expect(engagementApi.favorites()).rejects.toMatchObject({code:'INVALID_RESPONSE'});});
it('rechaza importes textuales de reportes y no los convierte en dinero',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({from:'2026-10-01T00:00:00Z',to:'2026-11-01T00:00:00Z',currency:'PEN',definition:'Cohorte',orders:1,delivered:1,cancelled:0,deliveredSalesCents:'1350',cashCollectedCents:1350,courierFeesCents:240}))));await expect(engagementApi.report('/admin/reports',{})).rejects.toMatchObject({code:'INVALID_RESPONSE'});});
it('un error remoto de soporte conserva el fallo y no devuelve conversaciones demo',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({code:'FORBIDDEN',message:'Sin permiso'}),{status:403})));await expect(engagementApi.ticket(true,id)).rejects.toMatchObject({status:403});});
it('rechaza contador de notificaciones incompatible con el contrato',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[],nextCursor:null,unreadCount:'2'}))));await expect(engagementApi.notifications()).rejects.toMatchObject({code:'INVALID_RESPONSE'});});
