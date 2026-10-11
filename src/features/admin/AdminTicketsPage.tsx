import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { AlertCircle, CheckCircle2, MessageSquare, Search } from 'lucide-react';

export const AdminTicketsPage: React.FC = () => {
  const { tickets, resolveSupportTicket } = useDataStore();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [responseError, setResponseError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId);
  const hasFilters = Boolean(searchQuery || statusFilter !== 'all');
  const statusLabels = { abierto: 'Abierto', en_revision: 'En revisión', resuelto: 'Resuelto' };
  const roleLabels = { cliente: 'Cliente', comercio: 'Comercio', repartidor: 'Repartidor', admin: 'Administrador' };
  const priorityLabels = { baja: 'Baja', media: 'Media', alta: 'Alta' };
  const filteredTickets = tickets.filter((ticket) => {
    const query = searchQuery.trim().toLowerCase();
    return (statusFilter === 'all' || ticket.status === statusFilter) &&
      (!query || [ticket.subject, ticket.userName, ticket.orderId || ''].some((value) => value.toLowerCase().includes(query)));
  });

  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); };
  const openTicket = (id: string) => {
    setResponseMsg('');
    setResponseError('');
    setActionError('');
    setNotice('');
    setSelectedTicketId(id);
  };

  const handleResolve = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicket || selectedTicket.status === 'resuelto') return;
    if (!responseMsg.trim()) {
      setResponseError('Escribe cómo se resolvió la incidencia antes de continuar.');
      return;
    }
    setResponseError('');
    setActionError('');
    try {
      resolveSupportTicket(selectedTicket.id, responseMsg);
      const updated = useDataStore.getState().tickets.find((ticket) => ticket.id === selectedTicket.id);
      if (updated?.status !== 'resuelto' || updated.response !== responseMsg) {
        setActionError('No se pudo guardar la resolución. Revisa el caso e inténtalo nuevamente.');
        return;
      }
      setNotice(`Incidencia resuelta: ${selectedTicket.subject}.`);
      setSelectedTicketId(null);
    } catch {
      setActionError('No se pudo completar la acción. Revisa el caso antes de volver a intentarlo.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Soporte e incidencias</h1>
        <p className="text-sm text-ink-light">Revisa los casos pendientes y registra su resolución.</p>
      </header>

      <section aria-label="Filtros de incidencias" className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Input id="admin-ticket-search" label="Buscar incidencias" type="search" className="md:text-sm" placeholder="Asunto, usuario o referencia de pedido"
            value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} leftIcon={<Search className="h-5 w-5" aria-hidden="true" />} />
          <Select id="admin-ticket-status" label="Estado del caso" className="md:text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="abierto">Abiertos</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelto">Resueltos</option>
          </Select>
        </div>
        {hasFilters && <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
      </section>

      {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{notice}</p></div>}

      <section aria-labelledby="admin-tickets-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-tickets-heading" className="text-base font-semibold text-ink">Casos registrados</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">{filteredTickets.length} {filteredTickets.length === 1 ? 'caso' : 'casos'}</p>
        </div>
        {filteredTickets.length === 0 ? (
          <EmptyState icon={<MessageSquare className="h-8 w-8" aria-hidden="true" />}
            title={tickets.length === 0 ? 'Aún no hay incidencias registradas' : 'No encontramos incidencias con estos filtros'}
            description={tickets.length === 0 ? 'Los casos de clientes, comercios y repartidores aparecerán aquí cuando se registren.' : 'Prueba con otro asunto, usuario o estado, o limpia los filtros.'}
            actionText={hasFilters ? 'Limpiar filtros' : undefined} onAction={hasFilters ? clearFilters : undefined} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Incidencias: asunto, usuario, estado, prioridad, fecha y acciones.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/3 rounded-tl-2xl px-4 py-3 font-semibold">Caso</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Usuario</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Estado y prioridad</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Registro</th>
                  <th scope="col" className="w-1/6 rounded-tr-2xl px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="block p-4 xl:table-row xl:p-0">
                    <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                      <h3 className="break-words text-sm font-semibold text-ink">{ticket.subject}</h3>
                      <p className="mt-1 break-words text-xs text-ink-light line-clamp-2">{ticket.description}</p>
                      {ticket.orderId && <p className="mt-1 break-all text-xs text-ink-muted">Referencia de pedido: {ticket.orderId}</p>}
                    </th>
                    <td className="block py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Usuario</p>
                      <p className="break-words text-sm text-ink">{ticket.userName}</p>
                      <p className="mt-1 text-xs text-ink-muted">{roleLabels[ticket.userRole]}</p>
                    </td>
                    <td className="flex items-start justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Estado y prioridad</span>
                      <div className="space-y-2 text-right xl:text-left">
                        <Badge variant={ticket.status === 'resuelto' ? 'success' : ticket.status === 'en_revision' ? 'info' : 'warning'}>{statusLabels[ticket.status]}</Badge>
                        <p className={`text-xs ${ticket.priority === 'alta' && ticket.status !== 'resuelto' ? 'font-semibold text-destructive' : 'text-ink-muted'}`}>Prioridad: {priorityLabels[ticket.priority]}</p>
                      </div>
                    </td>
                    <td className="flex items-start justify-between gap-3 py-2 text-xs text-ink-muted xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <span className="xl:hidden">Registro</span>
                      <time dateTime={ticket.createdAt} className="text-right tabular-nums xl:text-left">{formatDateTime(ticket.createdAt)}</time>
                    </td>
                    <td className="block pt-3 xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                      <Button type="button" variant="outline" size="sm" className="w-full gap-2" aria-label={`${ticket.status === 'resuelto' ? 'Ver caso' : 'Resolver incidencia'}: ${ticket.subject}`} onClick={() => openTicket(ticket.id)}>
                        <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {ticket.status === 'resuelto' ? 'Ver caso' : 'Resolver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog isOpen={Boolean(selectedTicketId)} onClose={() => setSelectedTicketId(null)} title={selectedTicket?.status === 'resuelto' ? 'Detalle de la incidencia' : 'Resolver incidencia'} description={selectedTicket?.subject} maxWidth="md">
        {selectedTicket && (
          <div className="space-y-6">
            <div className="space-y-2 text-sm">
              <p className="break-words font-semibold text-ink">{selectedTicket.userName} · {roleLabels[selectedTicket.userRole]}</p>
              <p className="break-words whitespace-pre-wrap text-ink-light">{selectedTicket.description}</p>
              {selectedTicket.orderId && <p className="break-all text-xs text-ink-muted">Referencia de pedido: {selectedTicket.orderId}</p>}
            </div>
            {selectedTicket.status === 'resuelto' ? (
              <>
                <div className="space-y-2 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">
                  <h3 className="font-semibold">Respuesta de resolución</h3>
                  <p className="break-words whitespace-pre-wrap">{selectedTicket.response || 'No hay una respuesta registrada.'}</p>
                  {selectedTicket.resolvedAt && <p className="text-xs tabular-nums">Resuelta: {formatDateTime(selectedTicket.resolvedAt)}</p>}
                </div>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedTicketId(null)}>Cerrar</Button>
              </>
            ) : (
              <form noValidate onSubmit={handleResolve} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="admin-ticket-response" className="block text-sm font-semibold text-ink">Respuesta de resolución <span className="text-primary">*</span></label>
                  <textarea id="admin-ticket-response" value={responseMsg} onChange={(event) => { setResponseMsg(event.target.value); setResponseError(''); }}
                    rows={4} required aria-invalid={Boolean(responseError)} aria-describedby={responseError ? 'admin-ticket-response-error' : 'admin-ticket-response-help'}
                    placeholder="Explica cómo se resolvió la incidencia"
                    className={`w-full min-h-11 rounded-xl border bg-surface p-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary md:text-sm ${responseError ? 'border-destructive' : 'border-field'}`} />
                  {responseError ? <p id="admin-ticket-response-error" role="alert" className="text-xs text-destructive">{responseError}</p> : <p id="admin-ticket-response-help" className="text-xs text-ink-muted">La respuesta quedará registrada en el caso.</p>}
                </div>
                {actionError && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{actionError}</p></div>}
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTicketId(null)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="sm">Resolver incidencia</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
