import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { MapPin } from 'lucide-react';

export const AdminZonesPage: React.FC = () => {
  const { zones } = useDataStore();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Zonas y tarifas</h1>
        <p className="text-sm text-ink-light">
          Consulta la cobertura, la tarifa base y el tiempo estimado de reparto en Tingo María.
        </p>
      </header>

      <section aria-labelledby="admin-zones-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-zones-heading" className="text-base font-semibold text-ink">Zonas de cobertura</h2>
          <p className="text-sm tabular-nums text-ink-muted">
            {zones.length} {zones.length === 1 ? 'zona registrada' : 'zonas registradas'}
          </p>
        </div>
        {zones.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-8 w-8" aria-hidden="true" />}
            title="Aún no hay zonas de cobertura registradas"
            description="Las zonas aparecerán aquí cuando estén disponibles en la plataforma."
          />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Zonas de cobertura: referencias, disponibilidad, tarifa base de envío y tiempo estimado.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/4 rounded-tl-2xl px-4 py-3 font-semibold">Zona</th>
                  <th scope="col" className="w-1/3 px-3 py-3 font-semibold">Cobertura y referencias</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Disponibilidad</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Tarifa base</th>
                  <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold">Tiempo estimado</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {zones.map((zone) => (
                  <tr key={zone.id} className="block p-4 xl:table-row xl:p-0">
                    <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-4 xl:align-middle">
                      <div className="flex min-w-0 items-start gap-3">
                        <MapPin className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                        <h3 className="break-words text-sm font-semibold text-ink">{zone.name}</h3>
                      </div>
                    </th>
                    <td className="block pb-3 xl:table-cell xl:px-3 xl:py-4 xl:align-middle">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Cobertura y referencias</p>
                      <p className="break-words text-xs leading-relaxed text-ink-light">{zone.description}</p>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-4 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Disponibilidad</span>
                      <Badge variant={zone.isAvailable ? 'success' : 'danger'}>{zone.isAvailable ? 'Habilitada' : 'Fuera de cobertura'}</Badge>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-4 xl:text-right xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Tarifa base de envío</span>
                      <span className="font-semibold tabular-nums text-ink">{formatCents(zone.baseFeeCents)}</span>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-4 xl:py-4 xl:text-right xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Tiempo estimado</span>
                      <span className="tabular-nums text-ink-light">{zone.estimatedMinutes} min</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
