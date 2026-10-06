import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { SchematicMap } from '../../components/shared/SchematicMap';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { formatCents } from '../../lib/currency';
import {
  Bike,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Banknote,
  ShieldCheck,
} from 'lucide-react';

export const CourierActiveDeliveryPage: React.FC = () => {
  const { purchases, couriers, courierAdvanceDelivery, courierReportIncident } = useDataStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const currentCourier =
    couriers.find((c) => c.ownerUserId === currentUser?.id || c.id === currentUser?.courierId) ||
    couriers[0];

  // Find active suborder assigned to this courier (status in listo_recoger or en_camino)
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
  const [incidentReason, setIncidentReason] = useState('Tránsito detenido por lluvia');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentSent, setIncidentSent] = useState(false);

  // Simulated Call / SMS Modal
  const [simulatedContactTarget, setSimulatedContactTarget] = useState<string | null>(null);

  if (!activeOrderData) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
        <Bike className="w-12 h-12 mx-auto text-slate-600 mb-2" />
        <h2 className="text-white font-bold text-base">No tienes entregas activas</h2>
        <p className="text-xs">
          Acepta una solicitud en la pestaña "Solicitudes" para comenzar una entrega en Tingo María.
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => navigate('/repartidor/solicitudes')}
        >
          Ver Solicitudes Disponibles
        </Button>
      </div>
    );
  }

  const isAtStoreStage = activeOrderData.status === 'listo_recoger';
  const isInTransitStage = activeOrderData.status === 'en_camino';

  const handleConfirmPickup = () => {
    courierAdvanceDelivery(activeOrderData.id, currentCourier.id, 'pickup', 'Pedido retirado de la tienda');
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

  const handleSubmitIncident = () => {
    courierReportIncident(
      activeOrderData.id,
      currentCourier.id,
      incidentReason,
      incidentNote || 'Incidencia reportada por el repartidor.'
    );
    setIncidentSent(true);
    setTimeout(() => {
      setIncidentSent(false);
      setShowIncidentModal(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Active Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Entrega en Curso
          </span>
          <h1 className="text-lg font-black text-white">{activeOrderData.purchaseCode}</h1>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Tarifa a cobrar</span>
          <span className="text-base font-extrabold text-emerald-400">
            {formatCents(activeOrderData.deliveryFeeCents)}
          </span>
        </div>
      </div>

      {/* Step Tracker Pills */}
      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
        <div
          className={`p-3 rounded-2xl border flex items-center gap-2 ${
            isAtStoreStage
              ? 'bg-primary/20 border-primary text-white ring-2 ring-primary/40'
              : 'bg-slate-950 border-slate-800 text-emerald-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Retiro en Comercio</span>
        </div>

        <div
          className={`p-3 rounded-2xl border flex items-center gap-2 ${
            isInTransitStage
              ? 'bg-primary/20 border-primary text-white ring-2 ring-primary/40'
              : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Entrega al Cliente</span>
        </div>
      </div>

      {/* Schematic Map View */}
      <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <SchematicMap
          orderStatus={activeOrderData.status}
          merchantName={activeOrderData.merchantName}
          merchantAddress={activeOrderData.merchantAddress}
          customerAddress={`${activeOrderData.addressSnapshot.street} #${activeOrderData.addressSnapshot.number}`}
          courierName={currentCourier.name}
        />
      </div>

      {/* Current Stage Instruction Box */}
      {isAtStoreStage && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3">
          <div className="flex items-center justify-between text-xs text-primary font-bold">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              <span>PASO 1: Dirígete a la tienda</span>
            </span>
            <button
              type="button"
              onClick={() => setSimulatedContactTarget(activeOrderData.merchantName)}
              className="touch-target p-1 text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <Phone className="w-3.5 h-3.5" /> Llamar
            </button>
          </div>

          <div>
            <h3 className="font-extrabold text-white text-base">{activeOrderData.merchantName}</h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {activeOrderData.merchantAddress}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Teléfono local: {activeOrderData.merchantPhone}
            </p>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl text-xs text-slate-300 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">
              Verifica los paquetes:
            </span>
            {activeOrderData.items.map((it, idx) => (
              <p key={idx}>
                • {it.quantity}x {it.productName}
              </p>
            ))}
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleConfirmPickup}
            className="w-full text-base font-bold shadow-lg"
          >
            <Package className="w-5 h-5 mr-2" />
            <span>Confirmar Retiro en Tienda</span>
          </Button>
        </div>
      )}

      {isInTransitStage && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>PASO 2: En camino al destino del cliente</span>
            </span>
            <button
              type="button"
              onClick={() => setSimulatedContactTarget(activeOrderData.customerName)}
              className="touch-target p-1 text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <Phone className="w-3.5 h-3.5" /> Llamar al cliente
            </button>
          </div>

          <div>
            <h3 className="font-extrabold text-white text-base">{activeOrderData.customerName}</h3>
            <p className="text-xs text-slate-200 font-bold mt-0.5">
              {activeOrderData.addressSnapshot.street} #{activeOrderData.addressSnapshot.number}
            </p>
            <p className="text-xs text-amber-300 mt-1 font-medium bg-amber-950/40 p-2 rounded-xl border border-amber-900/50">
              Ref: {activeOrderData.addressSnapshot.reference}
            </p>
          </div>

          {/* Cash collection alert or prepay notice */}
          {activeOrderData.paymentMethod === 'efectivo' ? (
            <div className="p-3 bg-amber-900/40 border border-amber-700/60 rounded-2xl space-y-1 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span>COBRAR EN EFECTIVO: {formatCents(activeOrderData.totalCents)}</span>
              </div>
              {activeOrderData.changeDue && activeOrderData.changeDue > 0 ? (
                <p className="text-[11px] text-amber-300">
                  ⚠️ El cliente paga con {formatCents(activeOrderData.cashPaid || 0)}. Entregar vuelto de{' '}
                  <strong>{formatCents(activeOrderData.changeDue)}</strong>.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Pedido ya prepagado con Yape/Tarjeta. ¡NO COBRAR AL CLIENTE!</span>
            </div>
          )}

          <Button
            type="button"
            variant="selva"
            size="lg"
            onClick={handleConfirmDelivered}
            className="w-full text-base font-bold shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span>Confirmar Entrega Realizada</span>
          </Button>
        </div>
      )}

      {/* Report Incident Trigger */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowIncidentModal(true)}
          className="touch-target w-full text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 p-2.5 rounded-2xl border border-red-900/40 flex items-center justify-center gap-2 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reportar Incidencia en Ruta</span>
        </button>
      </div>

      {/* Incident Modal */}
      <Dialog
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        title="Reportar Incidencia"
        description="Registra un evento imprevisto. Esto no cancela la entrega automáticamente."
        maxWidth="sm"
      >
        {incidentSent ? (
          <div className="p-4 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-ink">Incidencia reportada a soporte</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Motivo del retraso o problema"
              value={incidentReason}
              onChange={(e) => setIncidentReason(e.target.value)}
              required
            />
            <div>
              <label className="text-xs font-bold text-ink block mb-1">Nota o detalle</label>
              <textarea
                value={incidentNote}
                onChange={(e) => setIncidentNote(e.target.value)}
                placeholder="Ej: Lluvia torrencial en la Alameda, puente temporalmente bloqueado..."
                rows={3}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-ink"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowIncidentModal(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleSubmitIncident}>
                Enviar Reporte
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Simulated Contact Modal */}
      <Dialog
        isOpen={Boolean(simulatedContactTarget)}
        onClose={() => setSimulatedContactTarget(null)}
        title={`Contacto Simulado con ${simulatedContactTarget}`}
        description="En este prototipo frontend no se realizan llamadas ni mensajes reales"
        maxWidth="sm"
      >
        <div className="p-4 text-center space-y-3">
          <Phone className="w-10 h-10 text-primary mx-auto" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Número ficticio en Tingo María: <strong>962 444 555</strong>
          </p>
          <Button variant="primary" size="md" onClick={() => setSimulatedContactTarget(null)}>
            Entendido
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
