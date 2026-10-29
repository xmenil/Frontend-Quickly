import { healthApi } from '../../services/api/healthApi';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { ApiError, apiRequest } from '../../services/api/apiClient';
import type { components } from '../../services/api/contracts/schema';
import { PageTitle, panel, RemoteState, useRemote } from './shared';

const schema: z.ZodType<components['schemas']['OperationsDto']> = z.object({
 checkedAt:z.string().datetime(),pendingEvents:z.number().int(),retryingEvents:z.number().int(),oldestPendingEventSeconds:z.number().nullable(),
 expiredPendingOrders:z.number().int(),activeAssignments:z.number().int(),openTickets:z.number().int(),poolTotal:z.number().int(),poolIdle:z.number().int(),poolWaiting:z.number().int(),alerts:z.array(z.string()),
});
const labels:Record<string,string>={OUTBOX_LAG:'Notificaciones con más de cinco minutos de retraso.',OUTBOX_RETRIES:'Eventos con cinco o más intentos fallidos.',ORDER_EXPIRATION_LAG:'Hay pedidos pendientes cuyo plazo venció.',DATABASE_POOL_WAITING:'Hay solicitudes esperando conexión a la base de datos.'};
export function OperationalHealthPage(){
 const health=useRemote('admin-health-checks', async signal => { const [live, ready] = await Promise.all([healthApi.live(signal), healthApi.ready(signal)]); return { live, ready }; });
 const resource=useRemote('operational-health',async signal=>{const parsed=schema.safeParse(await apiRequest('/admin/operations',{signal}));if(!parsed.success)throw new ApiError('No se pudo validar el estado operativo.',0,'INVALID_RESPONSE');return parsed.data;});
 return <div className="space-y-6"><PageTitle detail="Lectura operativa del servidor. Los avisos requieren revisión y no cambian pedidos ni cobros.">Estado operativo</PageTitle>
  <RemoteState loading={health.loading} error={health.error} retry={health.reload} />
  {health.data && !health.error && <section className={panel}><h2 className="text-xl font-bold">Conectividad del servicio</h2><p>Servicio disponible · Base de datos conectada</p><p>Consulta: {new Date(health.data.ready.timestamp).toLocaleString('es-PE')} · Versión: {health.data.ready.version}</p><p>Comprueba conexión; no verifica transacciones de pedidos ni cobros.</p></section>}
  <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/>
  {resource.data&&!resource.error&&<><section className={panel}><p>Consulta: {new Date(resource.data.checkedAt).toLocaleString('es-PE')}</p>
   <p>Eventos pendientes: {resource.data.pendingEvents} · Con reintentos: {resource.data.retryingEvents}</p><p>Antigüedad del evento pendiente más antiguo: {resource.data.oldestPendingEventSeconds === null ? 'Sin eventos pendientes' : resource.data.oldestPendingEventSeconds + ' segundos'}</p>
   <p>Pedidos pendientes vencidos: {resource.data.expiredPendingOrders}</p><p>Entregas activas: {resource.data.activeAssignments} · Tickets abiertos: {resource.data.openTickets}</p>
   <p>Conexiones DB: {resource.data.poolTotal} · Libres: {resource.data.poolIdle} · En espera: {resource.data.poolWaiting}</p>
   <Button variant="outline" disabled={resource.loading} onClick={() => { resource.reload(); health.reload(); }}>Actualizar estado</Button></section>
   <section className={panel}><h2 className="text-xl font-bold">Avisos operativos</h2>{resource.data.alerts.length?resource.data.alerts.map(code=><p key={code}>{labels[code]||'Revisa el estado operativo del servidor.'}</p>):<p>Sin avisos en esta consulta.</p>}<p>Esta pantalla no comprueba respaldos, HTTPS, espacio en disco ni liquidaciones. Consulta el manual de operación para esas verificaciones.</p></section></>}
 </div>;
}
