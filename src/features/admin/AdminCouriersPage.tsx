import React, { useState } from 'react';
import { adminCourier, decisionsFor, decisionLabels, loadAdminCouriers, useAdminResource } from './adminModel';
import { AdminDecisionDialog } from './AdminDecisionDialog';
import { RemoteState, statusLabels } from '../operations/shared';
import type { Decision } from '../../services/api/operationsApi';
import { Bike, Power, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdminCouriersPage: React.FC = () => {
  const resource = useAdminResource('couriers', async signal => (await loadAdminCouriers(signal)).map(adminCourier));
  const couriers = resource.data || [];
  const [decision, setDecision] = useState<{ id: string; name: string; decision: Decision['decision'] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const hasFilters = Boolean(searchQuery || availabilityFilter !== 'all');
  const filteredCouriers = couriers.filter((courier) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [courier.name, courier.phone, courier.plate || '', courier.currentZone]
      .some((value) => value.toLowerCase().includes(query));
    const matchesAvailability = availabilityFilter === 'all' ||
      (availabilityFilter === 'available' ? courier.isAvailable : !courier.isAvailable);
    return matchesSearch && matchesAvailability;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setAvailabilityFilter('all');
  };

  if ((resource.loading || resource.error) && !resource.data) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Repartidores</h1>
        <p className="text-sm text-ink-light">Consulta su zona, vehículo y disponibilidad en Tingo María.</p>
      </header>

      <section aria-label="Filtros de repartidores" className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Input id="admin-courier-search" label="Buscar repartidores" type="search" className="md:text-sm"
            placeholder="Nombre, celular, placa o zona" value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            leftIcon={<Search className="h-5 w-5" aria-hidden="true" />} />
          <Select id="admin-courier-availability" label="Disponibilidad" className="md:text-sm"
            value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
            <option value="all">Toda la flota</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </Select>
        </div>
        {hasFilters && <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
      </section>

      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />



      <section aria-labelledby="admin-couriers-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-couriers-heading" className="text-base font-semibold text-ink">Flota registrada</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">{filteredCouriers.length} {filteredCouriers.length === 1 ? 'repartidor' : 'repartidores'}</p>
        </div>
        {filteredCouriers.length === 0 ? (
          <EmptyState icon={<Bike className="h-8 w-8" aria-hidden="true" />}
            title={couriers.length === 0 ? 'Aún no hay repartidores registrados' : 'No encontramos repartidores con estos filtros'}
            description={couriers.length === 0 ? 'Los repartidores aparecerán aquí cuando se registren en Quickly.' : 'Prueba con otro nombre, celular, placa o zona, o limpia los filtros.'}
            actionText={hasFilters ? 'Limpiar filtros' : undefined} onAction={hasFilters ? clearFilters : undefined} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Flota registrada: contacto, vehículo, zona, disponibilidad y acciones.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/4 rounded-tl-2xl px-4 py-3 font-semibold">Repartidor</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Vehículo</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Zona</th>
                  <th scope="col" className="w-1/5 px-3 py-3 font-semibold">Disponibilidad</th>
                  <th scope="col" className="w-1/5 rounded-tr-2xl px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {filteredCouriers.map((courier) => (
                  <tr key={courier.id} className="block p-4 xl:table-row xl:p-0">
                    <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-ink-muted"><Bike className="h-4 w-4" aria-hidden="true" /></span>
                        <div className="min-w-0 space-y-1">
                          <h3 className="break-words text-sm font-semibold text-ink">{courier.name}</h3>
                          <p className="text-xs tabular-nums text-ink-light">{courier.phone}</p>
                          <p className="text-xs tabular-nums text-ink-muted">Calificaciones no disponibles en esta consulta.</p>
                        </div>
                      </div>
                    </th>
                    <td className="flex items-start justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Vehículo</span>
                      <div className="space-y-1 text-right xl:text-left">
                        <p className="capitalize text-ink">{courier.vehicleType}</p>
                        <p className="break-words text-xs text-ink-muted">Placa: {courier.plate || 'Sin placa'}</p>
                      </div>
                    </td>
                    <td className="flex items-start justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Zona</span>
                      <span className="min-w-0 break-words text-right text-ink-light xl:text-left">{courier.currentZone || 'Sin zona registrada'}</span>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Disponibilidad</span>
                      <Badge>{statusLabels[courier.status]}</Badge>
                      {courier.statusReason && <p className="mt-2 break-words text-xs text-ink-muted">{courier.statusReason}</p>}
                      <Badge variant={courier.isAvailable ? 'success' : 'default'}>{courier.isAvailable ? 'Disponible' : 'No disponible'}</Badge>
                    </td>
                    <td className="block pt-3 xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                      <Button type="button" variant="outline" size="sm" className="w-full gap-2"
                        aria-label={`${courier.isAvailable ? 'Pausar' : 'Activar'} disponibilidad: ${courier.name}`}
                        disabled title="La disponibilidad la cambia el repartidor desde su cuenta">
                        <Power className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {courier.isAvailable ? 'Pausar disponibilidad' : 'Activar disponibilidad'}
                      </Button>
                      <p className="mt-2 text-xs text-ink-muted">La disponibilidad la cambia el repartidor.</p>
                      <div className="mt-2 flex flex-wrap gap-2">{decisionsFor(courier.status).map(action => <Button key={action} type="button" variant="outline" size="sm" disabled={resource.loading || !!resource.error} onClick={() => setDecision({ id: courier.userId, name: courier.name, decision: action })}>{decisionLabels[action]}</Button>)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {decision && <AdminDecisionDialog key={decision.id + decision.decision} kind="couriers" item={decision} onClose={() => setDecision(null)} reload={resource.reload} blocked={resource.loading || !!resource.error} />}
    </div>
  );
};
