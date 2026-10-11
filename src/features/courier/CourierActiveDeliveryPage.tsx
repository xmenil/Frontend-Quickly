import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCents } from '../../lib/currency';
import { Bike, MapPin, Phone, CheckCircle2, AlertCircle, Package, ChevronDown } from 'lucide-react';

export const CourierActiveDeliveryPage: React.FC = () => {
  const { purchases, couriers, courierAdvanceDelivery, courierReportIncident } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const currentCourier = couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) || couriers[0];
  const activeOrderData = purchases.flatMap((purchase) =>
    purchase.merchantOrders
      .filter((order) => Boolean(currentCourier) && order.courierId === currentCourier?.id && ['listo_recoger', 'en_camino'].includes(order.status))
      .map((order) => ({
        ...order, purchaseCode: purchase.code, customerName: purchase.customerName,
        customerPhone: purchase.customerPhone, addressSnapshot: purchase.addressSnapshot,
        paymentMethod: purchase.paymentMethod, changeDue: purchase.changeDueCents,
      }))
  )[0];
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReason, setIncidentReason] = useState('Lluvia intensa en Tingo María');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentSent, setIncidentSent] = useState(false);
  const [incidentError, setIncidentError] = useState('');
  const [confirmDelivery, setConfirmDelivery] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  if (!currentCourier) return <EmptyState title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />;
  if (!activeOrderData) return <EmptyState icon={<Bike className="h-8 w-8" aria-hidden="true" />} title="No tienes una entrega activa" description="Revisa las solicitudes para comenzar una nueva entrega." actionText="Ver solicitudes" onAction={() => navigate('/repartidor/solicitudes')} />;

  const atStore = activeOrderData.status === 'listo_recoger';
  const contactName = atStore ? activeOrderData.merchantName : activeOrderData.customerName;
  const contactPhone = atStore ? activeOrderData.merchantPhone : activeOrderData.customerPhone;
  const destination = atStore ? activeOrderData.merchantAddress : `${activeOrderData.addressSnapshot.street} #${activeOrderData.addressSnapshot.number}`;
  const paymentLabels = { pagado: 'Pagado', pendiente: 'Pendiente', fallido: 'Fallido', reembolso_pendiente: 'Reembolso pendiente', reembolsado: 'Reembolsado' };

  const advanceDelivery = (step: 'pickup' | 'delivered') => {
    setActionError('');
    setNotice('');
    try {
      const result = courierAdvanceDelivery(activeOrderData.id, currentCourier.id, step,
        step === 'pickup' ? 'Pedido retirado de la tienda' :
          activeOrderData.paymentMethod === 'efectivo' ? `Cobro en efectivo realizado: ${formatCents(activeOrderData.totalCents)}` : 'Entrega prepagada completada');
      if (!result.success) {
        setActionError(result.message || 'No se pudo confirmar este paso. Revisa el pedido e inténtalo nuevamente.');
        return;
      }
      if (step === 'pickup') setNotice('Recojo confirmado. Continúa con la entrega al cliente.');
      else navigate('/repartidor/historial', { state: { deliveryNotice: `Entrega ${activeOrderData.purchaseCode} confirmada.` } });
    } catch {
      setActionError('No se pudo completar la acción. Revisa el estado del pedido antes de volver a intentarlo.');
    }
  };

  const handleSubmitIncident = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIncidentError('');
    try {
      const previousIds = new Set(useDataStore.getState().tickets.map((ticket) => ticket.id));
      courierReportIncident(activeOrderData.id, currentCourier.id, incidentReason, incidentNote.trim() || 'Reportado en trayecto de entrega');
      const saved = useDataStore.getState().tickets.some((ticket) => !previousIds.has(ticket.id) && ticket.orderId === activeOrderData.purchaseCode && ticket.userRole === 'repartidor');
      if (!saved) {
        setIncidentError('No se pudo enviar la incidencia. Conservamos tu comentario para que puedas intentarlo nuevamente.');
        return;
      }
      setIncidentSent(true);
    } catch {
      setIncidentError('No se pudo enviar la incidencia. Revisa el caso antes de volver a intentarlo.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Entrega activa</h1>
          <p className="text-sm font-bold text-ink">{activeOrderData.purchaseCode}</p>
          <Badge variant="info">{atStore ? 'Paso 1: recojo' : 'Paso 2: entrega'}</Badge>
        </div>
        <div className="text-right"><p className="text-xs text-ink-muted">Tarifa de entrega</p><p className="text-lg font-bold tabular-nums text-ink">{formatCents(activeOrderData.deliveryFeeCents)}</p></div>
      </header>
      {notice && <p role="status" className="rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">{notice}</p>}
      {actionError && !confirmDelivery && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong">{actionError}</p>}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="courier-next-step" className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-subtle sm:p-6">
          <div className="space-y-2">
            <h2 id="courier-next-step" className="text-base font-semibold text-ink">{atStore ? 'Recoger en el comercio' : 'Entregar al cliente'}</h2>
            <p className="break-words text-lg font-semibold text-ink">{destination}</p>
            <p className="break-words text-sm text-ink-light">{contactName}</p>
          </div>
          {!atStore && <div className="flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong"><MapPin className="h-5 w-5 shrink-0" aria-hidden="true" /><p className="min-w-0 break-words">Referencia: {activeOrderData.addressSnapshot.reference || 'Sin referencia registrada'}</p></div>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="min-w-0 space-y-1"><p className="text-xs text-ink-muted">{atStore ? 'Contacto del comercio' : 'Contacto del cliente'}</p><p className="text-sm tabular-nums text-ink">{contactPhone || 'Sin celular registrado'}</p></div>
            {contactPhone && <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-50"><Phone className="h-4 w-4" aria-hidden="true" />Llamar</a>}
          </div>
          <div className={`space-y-2 rounded-xl border p-3 text-sm ${activeOrderData.paymentMethod === 'efectivo' ? 'border-warning-border bg-warning-soft text-warning-strong' : 'border-info-border bg-info-soft text-info-strong'}`}>
            <p className="font-semibold">{activeOrderData.paymentMethod === 'efectivo' ? 'Cobro en efectivo' : 'Pago digital'}</p>
            <p className="flex flex-wrap justify-between gap-2">Total de este pedido <span className="font-semibold tabular-nums">{formatCents(activeOrderData.totalCents)}</span></p>
            <p className="text-xs">Estado de pago: {paymentLabels[activeOrderData.paymentStatus]}</p>
            {activeOrderData.paymentMethod === 'efectivo' && Boolean(activeOrderData.changeDue) && <p className="text-xs">Vuelto registrado para la compra: <span className="font-semibold tabular-nums">{formatCents(activeOrderData.changeDue || 0)}</span></p>}
            <p className="text-xs">{activeOrderData.paymentMethod === 'efectivo' ? 'Verifica el cobro antes de confirmar la entrega.' : 'Verifica el estado de pago antes de entregar.'}</p>
          </div>
          <Button type="button" variant="primary" className="min-h-14 w-full gap-2 text-base" onClick={() => { if (atStore) advanceDelivery('pickup'); else { setActionError(''); setConfirmDelivery(true); } }}><Package className="h-5 w-5" aria-hidden="true" />{atStore ? 'Confirmar recojo' : 'Confirmar entrega'}</Button>
          <Button type="button" variant="outline" className="w-full gap-2 text-sm" onClick={() => { setIncidentSent(false); setIncidentError(''); setShowIncidentModal(true); }}><AlertCircle className="h-4 w-4" aria-hidden="true" />Reportar incidencia</Button>
        </section>

        <section aria-labelledby="courier-order-details" className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <h2 id="courier-order-details" className="text-base font-semibold text-ink">Detalle del pedido</h2>
          <ul className="divide-y divide-border text-sm">{activeOrderData.items.map((item, index) => <li key={index} className="flex items-start gap-3 py-3"><span className="shrink-0 font-semibold tabular-nums text-ink">{item.quantity} ×</span><span className="min-w-0 break-words text-ink-light">{item.productName}</span></li>)}</ul>
          <details className="border-t border-border pt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl text-sm font-medium text-primary">Ver recorrido de referencia<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
            <p className="mt-2 text-xs text-ink-muted">Esquema de recojo y entrega. No representa una ubicación GPS ni una distancia calculada.</p>
            <ol className="mt-4 space-y-4 border-l border-border pl-4 text-sm">
              <li className="space-y-1"><p className="font-semibold text-ink">1. {activeOrderData.merchantName}</p><p className="break-words text-ink-light">{activeOrderData.merchantAddress}</p></li>
              <li className="space-y-1"><p className="font-semibold text-ink">2. {activeOrderData.customerName}</p><p className="break-words text-ink-light">{activeOrderData.addressSnapshot.street} #{activeOrderData.addressSnapshot.number}</p></li>
            </ol>
          </details>
        </section>
      </div>

      <Dialog isOpen={confirmDelivery} onClose={() => setConfirmDelivery(false)} title="Confirmar entrega" description="Confirma cuando el cliente haya recibido el pedido y hayas verificado el pago." maxWidth="sm">
        <div className="space-y-4">
          <p className="break-words text-sm text-ink-light">{activeOrderData.customerName} · {activeOrderData.purchaseCode}</p>
          {actionError && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">{actionError}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setConfirmDelivery(false)}>Cancelar</Button><Button type="button" onClick={() => advanceDelivery('delivered')}>Finalizar entrega</Button></div>
        </div>
      </Dialog>

      <Dialog isOpen={showIncidentModal} onClose={() => setShowIncidentModal(false)} title="Reportar incidencia" description="Registra el inconveniente para que soporte pueda revisarlo." maxWidth="md">
        {incidentSent ? <div className="space-y-4"><p role="status" className="flex items-start gap-2 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />Incidencia enviada a soporte.</p><Button type="button" variant="outline" onClick={() => { setShowIncidentModal(false); setIncidentNote(''); }}>Cerrar</Button></div> : (
          <form onSubmit={handleSubmitIncident} className="space-y-4">
            <Select id="courier-incident-reason" label="Tipo de inconveniente" value={incidentReason} onChange={(event) => setIncidentReason(event.target.value)}>
              <option value="Lluvia intensa en Tingo María">Lluvia intensa o crecida de río</option>
              <option value="Tráfico en Puente Corpac">Tráfico detenido en Puente Corpac</option>
              <option value="Cliente no contesta llamadas">Cliente no responde al celular</option>
              <option value="Dirección o referencia difícil">No se ubica la dirección</option>
              <option value="Avería mecánica en moto">Problema mecánico en la moto</option>
            </Select>
            <div className="space-y-2"><label htmlFor="courier-incident-note" className="block text-sm font-semibold text-ink">Comentario adicional (opcional)</label><textarea id="courier-incident-note" value={incidentNote} onChange={(event) => setIncidentNote(event.target.value)} rows={3} placeholder="Explica qué ocurrió y qué ayuda necesitas" className="w-full rounded-xl border border-field bg-surface p-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            {incidentError && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">{incidentError}</p>}
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => setShowIncidentModal(false)}>Cancelar</Button><Button type="submit">Enviar incidencia</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
