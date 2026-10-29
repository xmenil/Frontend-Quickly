import React from 'react';
import { useCourierProfile } from './courierModel';
import { RemoteState, statusLabels, vehicleLabels } from '../operations/shared';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bike, MapPin, ShieldCheck, User } from 'lucide-react';

export const CourierProfilePage: React.FC = () => {
  const resource = useCourierProfile();
  const currentCourier = resource.data;
  if (resource.loading || resource.error) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;
  if (!currentCourier) return <EmptyState icon={<User className="h-8 w-8" aria-hidden="true" />} title="No hay un perfil de repartidor disponible" description="Revisa que exista una cuenta de repartidor registrada para continuar." />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Mi perfil</h1>
        <p className="text-sm text-ink-light">Consulta tus datos personales, vehículo y estado operativo.</p>
      </header>

      <section aria-labelledby="courier-profile-identity" className="rounded-2xl border border-border bg-surface p-4 shadow-subtle sm:p-6">
        <h2 id="courier-profile-identity" className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><User className="h-5 w-5 text-ink-muted" aria-hidden="true" />Identidad</h2>
        <div className="flex min-w-0 items-start gap-4">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-base font-semibold text-ink-light">{currentCourier.fullName.substring(0, 2).toUpperCase()}</span>
          <div className="min-w-0 space-y-2">
            <h3 className="break-words text-base font-semibold text-ink">{currentCourier.fullName}</h3>
            <p className="text-sm tabular-nums text-ink-light">Celular: {currentCourier.phone || 'Sin celular registrado'}</p>
            <p className="text-xs text-ink-muted">Calificaciones no disponibles en esta consulta.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-labelledby="courier-profile-vehicle" className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <h2 id="courier-profile-vehicle" className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><Bike className="h-5 w-5 text-ink-muted" aria-hidden="true" />Vehículo</h2>
          <dl className="divide-y divide-border text-sm">
            <div className="flex flex-wrap justify-between gap-3 py-3"><dt className="text-ink-light">Tipo de vehículo</dt><dd className="font-medium capitalize text-ink">{vehicleLabels[currentCourier.vehicleType]}</dd></div>
            <div className="flex flex-wrap justify-between gap-3 py-3"><dt className="text-ink-light">Placa de rodaje</dt><dd className="break-words font-medium text-ink">{currentCourier.plate || 'Sin placa registrada'}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="courier-profile-operation" className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <h2 id="courier-profile-operation" className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><ShieldCheck className="h-5 w-5 text-ink-muted" aria-hidden="true" />Operación</h2>
          <dl className="divide-y divide-border text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 py-3"><dt className="text-ink-light">Estado de la cuenta</dt><dd><Badge variant={currentCourier.status === 'active' ? 'success' : currentCourier.status === 'pending' ? 'warning' : 'danger'}>{statusLabels[currentCourier.status]}</Badge></dd></div>
            <div className="flex flex-wrap items-start justify-between gap-3 py-3"><dt className="text-ink-light">Disponibilidad</dt><dd><Badge variant={currentCourier.isOnline ? 'success' : 'default'}>{currentCourier.isOnline ? 'Disponible' : 'En pausa'}</Badge></dd></div>
            <div className="flex flex-col gap-2 py-3"><dt className="text-ink-light">Zona de reparto</dt><dd className="flex items-start gap-2 break-words font-medium text-ink"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{currentCourier.zoneName || 'Sin zona registrada'}</span></dd></div>
          </dl>
          {currentCourier.statusReason && <p className="mt-3 text-sm text-ink-light">{currentCourier.statusReason}</p>}
          <p className="mt-3 text-xs text-ink-muted">La disponibilidad se cambia desde la cabecera. El estado de la cuenta lo gestiona administración.</p>
        </section>
      </div>
    </div>
  );
};
