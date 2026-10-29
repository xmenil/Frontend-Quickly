import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { orderingApi } from '../../services/api/orderingApi';
import { money } from '../../services/api/catalogApi';
import { PageTitle, panel, RemoteState, useRemote } from '../operations/shared';
import { orderLabels } from '../orders/RealOrderPages';

export function GroupCheckoutPage() {
  const { id = '' } = useParams();
  const resource = useRemote(`checkout-group:${id}`, signal => orderingApi.groupDetail(id, signal));
  return <div className="space-y-6"><PageTitle detail="Cada tienda gestiona su propio pedido, entrega y cobro en efectivo.">Tu compra de varias tiendas</PageTitle>
    <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data && <><section className={panel}><p>Pedidos confirmados: {resource.data.orders.length}</p>
      <p>Productos: {money(resource.data.subtotalCents)}</p><p>Envíos: {money(resource.data.deliveryFeeCents)}</p>
      <p className="text-xl font-bold">Total confirmado: {money(resource.data.totalCents)}</p>
      <p>Este importe corresponde a la confirmación original. Consulta el estado y cobro de cada pedido; los cancelados no se cobran.</p>
      <Button variant="outline" onClick={resource.reload}>Actualizar pedidos</Button></section>
      {resource.data.orders.map(order => <article className={panel} key={order.orderId}><h2 className="text-xl font-bold">{order.storeName}</h2>
        <p>{order.code} · {orderLabels[order.status] || order.status}</p><p>Productos: {money(order.subtotalCents)} · Envío: {money(order.deliveryFeeCents)}</p>
        <p className="font-semibold">{order.paymentStatus === 'succeeded' ? 'Efectivo cobrado' : order.paymentStatus === 'cancelled' ? 'Cobro cancelado' : 'Efectivo por entregar'}: {money(order.totalCents)}</p>
        <Link className="text-primary font-semibold" to={`/cliente/pedidos/${order.orderId}`}>Ver pedido {order.code}</Link></article>)}
    </>}
    <Link className="text-primary" to="/cliente/pedidos">Ver todos mis pedidos</Link>
  </div>;
}
