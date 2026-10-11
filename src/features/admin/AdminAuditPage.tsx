import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDateTime } from '../../lib/date';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileText, Search } from 'lucide-react';
import { UserRole } from '../../domain/types';

export const AdminAuditPage: React.FC = () => {
  const { auditLogs } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const hasFilters = Boolean(searchQuery || roleFilter !== 'all');
  const roleLabels = { cliente: 'Cliente', comercio: 'Comercio', repartidor: 'Repartidor', admin: 'Administrador' };
  const filteredLogs = auditLogs.filter((log) => {
    const query = searchQuery.trim().toLowerCase();
    return (roleFilter === 'all' || log.actorRole === roleFilter) &&
      (!query || [log.action, log.actor, log.entity, log.details || ''].some((value) => value.toLowerCase().includes(query)));
  });
  const clearFilters = () => { setSearchQuery(''); setRoleFilter('all'); };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Historial de actividad</h1>
        <p className="text-sm text-ink-light">Consulta las acciones y los cambios registrados en la plataforma.</p>
      </header>

      <section aria-label="Filtros de actividad" className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Input id="admin-audit-search" label="Buscar actividad" type="search" className="md:text-sm"
            placeholder="Acción, responsable o registro afectado" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
            leftIcon={<Search className="h-5 w-5" aria-hidden="true" />} />
          <Select id="admin-audit-role" label="Tipo de responsable" className="md:text-sm" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'all')}>
            <option value="all">Todos los tipos</option>
            <option value="cliente">Clientes</option>
            <option value="comercio">Comercios</option>
            <option value="repartidor">Repartidores</option>
            <option value="admin">Administradores</option>
          </Select>
        </div>
        {hasFilters && <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
      </section>

      <section aria-labelledby="admin-audit-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-audit-heading" className="text-base font-semibold text-ink">Movimientos registrados</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">{filteredLogs.length} {filteredLogs.length === 1 ? 'movimiento' : 'movimientos'}</p>
        </div>
        {filteredLogs.length === 0 ? (
          <EmptyState icon={<FileText className="h-8 w-8" aria-hidden="true" />}
            title={auditLogs.length === 0 ? 'Aún no hay movimientos registrados' : 'No encontramos movimientos con estos filtros'}
            description={auditLogs.length === 0 ? 'Las acciones registradas por la plataforma aparecerán aquí.' : 'Prueba con otra acción, responsable o tipo de cuenta, o limpia los filtros.'}
            actionText={hasFilters ? 'Limpiar filtros' : undefined} onAction={hasFilters ? clearFilters : undefined} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Historial de actividad: fecha, acción, responsable, registro afectado y detalle.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="rounded-tl-2xl px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Acción</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Responsable</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Registro afectado</th>
                  <th scope="col" className="w-1/4 rounded-tr-2xl px-4 py-3 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="block p-4 xl:table-row xl:p-0">
                    <td className="flex items-start justify-between gap-3 pb-3 text-xs text-ink-muted xl:table-cell xl:px-4 xl:py-3 xl:align-top">
                      <span className="xl:hidden">Fecha</span>
                      <time dateTime={log.timestamp} className="text-right tabular-nums xl:text-left">{formatDateTime(log.timestamp)}</time>
                    </td>
                    <th scope="row" className="block pb-3 text-left font-normal xl:table-cell xl:px-3 xl:py-3 xl:align-top">
                      <h3 className="break-words text-sm font-semibold text-ink">{log.action}</h3>
                    </th>
                    <td className="block py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-top">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Responsable</p>
                      <p className="mb-2 break-words text-sm text-ink-light">{log.actor}</p>
                      <Badge>{roleLabels[log.actorRole]}</Badge>
                    </td>
                    <td className="block py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-top">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Registro afectado</p>
                      <p className="break-words text-xs text-ink-light">{log.entity}</p>
                    </td>
                    <td className="block py-2 xl:table-cell xl:px-4 xl:py-3 xl:align-top">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Detalle</p>
                      <p className="break-words whitespace-pre-wrap text-xs text-ink-muted">{log.details || 'Sin detalle adicional.'}</p>
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
