import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { SchematicMap } from '../../components/shared/SchematicMap';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { formatCents } from '../../lib/currency';
import {
  Bike,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Package,
  Banknote,
  ShieldCheck,
  Check,
  CloudRain,
  ExternalLink,
  Navigation,
} from 'lucide-react';

export const CourierActiveDeliveryPage: React.FC = () => {
  const { purchases, couriers, courierAdvanceDelivery, courierReportIncident } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  // Active suborder assigned to this courier (status in listo_recoger or en_camino)
  const activeOrderData = purchases.flatMap((p) =>
    p.merchantOrders
      .filter(
        (mo) =>
          mo.courierId === currentCourier.id &&
          ['listo_recoger', 'en_camino'].includes(mo.status)
      )
      .map((mo) => ({
        ...mo,
        purchaseCode: p.code,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        addressSnapshot: p.addressSnapshot,
        paymentMethod: p.paymentMethod,
        cashPaid: p.cashAmountPaidCents,
        changeDue: p.changeDueCents,
      }))
  )[0];

  // Incident Modal State
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentReason, setIncidentReason] = useState('Lluvia intensa en Tingo María');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentSent, setIncidentSent] = useState(false);

  if (!activeOrderData) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 space-y-4 shadow-subtle my-4">
        <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
          <Bike className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-ink font-extrabold text-lg">No tienes entregas activas en ruta</h2>
          <p className="text-xs text-ink-light max-w-xs mx-auto">
            Revisa las solicitudes de los comercios para comenzar una nueva carrera en Tingo María.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => navigate('/repartidor/solicitudes')}
          className="min-h-[48px] px-6 font-bold shadow-subtle"
        >
          Ver Solicitudes Disponibles
        </Button>
      </div>
    );
  }

  const isAtStoreStage = activeOrderData.status === 'listo_recoger';
  const isInTransitStage = activeOrderData.status === 'en_camino';

  const handleConfirmPickup = () => {
    courierAdvanceDelivery(
      activeOrderData.id,
      currentCourier.id,
      'pickup',
      'Pedido retirado de la tienda'
    );
  };

  const handleConfirmDelivered = () => {
    courierAdvanceDelivery(
      activeOrderData.id,
      currentCourier.id,
      'delivered',
      activeOrderData.paymentMethod === 'efectivo'
        ? `Cobro en efectivo realizado: ${formatCents(activeOrderData.totalCents)}`
        : 'Entrega prepagada completada'
    );
    navigate('/repartidor/historial');
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    courierReportIncident(
      activeOrderData.id,
      currentCourier.id,
      incidentReason,
      incidentNote.trim() || 'Reportado en trayecto de entrega'
    );
    setIncidentSent(true);
    setTimeout(() => {
      setIncidentSent(false);
      setShowIncidentModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Active Trip Header Badge */}
      <div className="bg-ink text-white p-4 rounded-3xl shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Entrega en curso:</span>
              <span className="text-xs font-extrabold text-amber-300">{activeOrderData.purchaseCode}</span>
            </div>
            <div className="text-sm font-black text-white">
              {isAtStoreStage ? 'Paso 1: Retirar en Tienda' : 'Paso 2: En Ruta al Cliente'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Tu Ganancia</span>
          <span className="text-base font-black text-emerald-400 tabular-nums">
            +{formatCents(activeOrderData.deliveryFeeCents)}
          </span>
        </div>
      </div>

      {/* Schematic Map Route Visualization */}
      <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-subtle">
        <SchematicMap
          orderStatus={activeOrderData.status}
          merchantName={activeOrderData.merchantName}
          merchantAddress={activeOrderData.merchantAddress}
          customerAddress={`${activeOrderData.addressSnapshot.street} #${activeOrderData.addressSnapshot.number}`}
          courierName={currentCourier.name}
          courierPhone={currentCourier.phone}
        />
      </div>

      {/* G-2: Destination Address with BIG FONT for motorcycle drivers */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-subtle space-y-4">
        {/* Next Target Destination Banner */}
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider block">
            {isAtStoreStage ? '1. Punto de Retiro en Comercio' : '2. Dirección de Entrega Final'}
          </span>

          {/* G-2: Large Address Heading */}
          <h2 className="text-xl sm:text-2xl font-black text-ink leading-tight">
            {isAtStoreStage
              ? activeOrderData.merchantName
              : `${activeOrderData.addressSnapshot.street} #${activeOrderData.addressSnapshot.number}`}
          </h2>

          {/* Local Reference in highlighted card */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950 font-semibold flex items-start gap-2 mt-2">
            <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">Referencia en Tingo María:</span>
              <p className="mt-0.5">
                {isAtStoreStage
                  ? activeOrderData.merchantAddress
                  : activeOrderData.addressSnapshot.reference}
              </p>
            </div>
          </div>
        </div>

        {/* Client / Store Contact Card with 1-Tap Direct Call Button (G-2) */}
        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              {isAtStoreStage ? 'Contacto del Local' : 'Contacto del Cliente'}
            </span>
            <p className="font-extrabold text-sm text-ink truncate">
              {isAtStoreStage ? activeOrderData.merchantName : activeOrderData.customerName}
            </p>
            <p className="text-xs text-gray-600 font-semibold">
              {isAtStoreStage ? activeOrderData.merchantPhone : activeOrderData.customerPhone}
            </p>
          </div>

          {/* 1-Tap Call Button */}
          <a
            href={`tel:${(isAtStoreStage ? activeOrderData.merchantPhone : activeOrderData.customerPhone).replace(/\s+/g, '')}`}
            className="touch-target inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-subtle min-h-[48px] flex-shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>Llamar</span>
          </a>
        </div>

        {/* Payment and Change Alert */}
        {activeOrderData.paymentMethod === 'efectivo' ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <Banknote className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <span className="font-extrabold text-amber-950 block">Cobrar en Efectivo</span>
                <span className="text-amber-800 font-semibold">
                  Monto total: {formatCents(activeOrderData.totalCents)}
                </span>
              </div>
            </div>
            {activeOrderData.changeDue ? (
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl">
                Dar vuelto: {formatCents(activeOrderData.changeDue)}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-emerald-900 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>¡Pedido prepagado con Yape / Plin! No cobrar dinero al cliente.</span>
          </div>
        )}

        {/* Package snapshot summary */}
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-100 space-y-1">
          <span className="font-bold text-ink block">Contenido del paquete:</span>
          <p>{activeOrderData.items.map((i) => `${i.quantity}x ${i.productName}`).join(' • ')}</p>
        </div>
      </div>

      {/* G-2: BIG ACTION BUTTONS (h-14 / 56px minimum) for motorcycle use */}
      <div className="space-y-3 pt-2">
        {isAtStoreStage && (
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmPickup}
            className="w-full min-h-[56px] h-14 rounded-2xl text-base sm:text-lg font-black shadow-lg flex items-center justify-center gap-2 tracking-wide"
          >
            <Package className="w-6 h-6" />
            <span>Recogí el Pedido en Tienda</span>
          </Button>
        )}

        {isInTransitStage && (
          <Button
            type="button"
            variant="selva"
            onClick={handleConfirmDelivered}
            className="w-full min-h-[56px] h-14 rounded-2xl text-base sm:text-lg font-black shadow-lg flex items-center justify-center gap-2 tracking-wide"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>Confirmar Entrega al Cliente</span>
          </Button>
        )}

        {/* Incident Button (52px minimum) */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowIncidentModal(true)}
          className="w-full min-h-[50px] h-13 rounded-2xl text-xs sm:text-sm font-bold text-red-700 border-2 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Reportar Incidente / Lluvia / Demora</span>
        </Button>
      </div>

      {/* Incident Modal */}
      <Dialog
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        title="Reportar Incidente en Ruta"
        description="Notifica a la central de Quickly sobre contratiempos viales en Tingo María"
        maxWidth="sm"
      >
        {incidentSent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Incidente reportado a la administración. Tiempo ajustado en el mapa.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitIncident} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink block">Tipo de Inconveniente</label>
              <select
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                <option value="Lluvia intensa en Tingo María">Lluvia intensa / Crecida de río</option>
                <option value="Tráfico en Puente Corpac">Tráfico detenido en Puente Corpac</option>
                <option value="Cliente no contesta llamadas">Cliente no responde al celular</option>
                <option value="Dirección o referencia difícil">No se ubica la dirección</option>
                <option value="Avería mecánica en moto">Problema mecánico en la moto</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink block">Comentario Adicional (Opcional)</label>
              <textarea
                value={incidentNote}
                onChange={(e) => setIncidentNote(e.target.value)}
                placeholder="Detalla qué necesitas para que soporte te brinde asistencia..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowIncidentModal(false)}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                className="min-h-[44px] font-bold"
              >
                Enviar Reporte
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
