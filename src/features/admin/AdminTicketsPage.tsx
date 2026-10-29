import React, { useState } from 'react';
import { adminTicket, decideAdminTicket, loadAdminTickets, useAdminAction, useAdminResource } from './adminModel';
import { engagementApi } from '../../services/api/engagementApi';
import { useAuthStore } from '../../store/authStore';
import { RemoteState } from '../operations/shared';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { AlertCircle, CheckCircle2, MessageSquare, Search } from 'lucide-react';

export const AdminTicketsPage: React.FC = () => {
  const owner = useAuthStore(state => state.currentUser?.id || '');
  const resource = useAdminResource('tickets', async signal => (await loadAdminTickets(signal)).map(adminTicket));
  const tickets = resource.data || [];
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [responseError, setResponseError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const detail = useAdminResource('ticket:' + (selectedTicketId || ''), signal => selectedTicketId ? engagementApi.ticket(true, selectedTicketId, signal) : Promise.resolve(null));
  const selectedTicket = detail.data ? adminTicket(detail.data) : undefined;
  const actions = useAdminAction(() => { resource.reload(); detail.reload(); }, resource.loading || !!resource.error || detail.loading || !!detail.error);
  const [nextStatus, setNextStatus] = useState<'open' | 'in_review' | 'resolved'>('resolved');
  const [nextPriority, setNextPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [reopen, setReopen] = useState(false);
  const hasFilters = Boolean(searchQuery || statusFilter !== 'all');
  const statusLabels: Record<string, string> = { abierto: 'Abierto', en_revision: 'En revisión', resuelto: 'Resuelto' };
  const roleLabels: Record<string, string> = { cliente: 'Cliente', comercio: 'Comercio', repartidor: 'Repartidor', admin: 'Administrador' };
  const priorityLabels: Record<string, string> = { baja: 'Baja', media: 'Media', alta: 'Alta' };
  const filteredTickets = tickets.filter((ticket) => {
    const query = searchQuery.trim().toLowerCase();
    return (statusFilter === 'all' || ticket.status === statusFilter) &&
      (!query || [ticket.subject, ticket.userName, ticket.orderId || ''].some((value) => value.toLowerCase().includes(query)));
  });

  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); };
  const openTicket = (id: string) => {
    setResponseMsg('');
    setResponseError('');


    actions.clear(); setReopen(false); setNextStatus('resolved'); setNextPriority(tickets.find(ticket => ticket.id === id)?.source.priority || 'normal');
    setSelectedTicketId(id);
  };

  const handleResolve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!detail.data || !owner) return;
    if (!responseMsg.trim()) { setResponseError('Escribe una respuesta antes de continuar.'); return; }
    setResponseError('');
    if (await actions.execute(() => decideAdminTicket(detail.data!, { status: nextStatus, priority: nextPriority, body: responseMsg.trim() }, owner), 'Respuesta y estado del caso confirmados.')) setSelectedTicketId(null);
  };
  if ((resource.loading || resource.error) && !resource.data) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;

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

      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {actions.notice && <p role="status" className="rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">{actions.notice}</p>}


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
                      <p className="mt-1 text-xs text-ink-muted">{roleLabels[ticket.userRole] || 'Rol no informado'}</p>
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

      <Dialog isOpen={Boolean(selectedTicketId)} onClose={() => { if (!actions.busy) setSelectedTicketId(null); }} title={selectedTicket?.status === 'resuelto' ? 'Detalle de la incidencia' : 'Resolver incidencia'} description={selectedTicket?.subject} maxWidth="md">
        <RemoteState loading={detail.loading} error={detail.error} retry={detail.reload} />
        {selectedTicket && (
          <div className="space-y-6">
            <div className="space-y-2 text-sm">
              <p className="break-words font-semibold text-ink">{selectedTicket.userName} · {roleLabels[selectedTicket.userRole] || 'Rol no informado'}</p>
              <p className="break-words whitespace-pre-wrap text-ink-light">{selectedTicket.description}</p>
              {selectedTicket.orderId && <p className="break-all text-xs text-ink-muted">Referencia de pedido: {selectedTicket.orderId}</p>}
            </div>
            <div className="space-y-3">{detail.data?.messages.map(message => <div key={message.id} className="rounded-xl border border-border bg-surface-subtle p-3 text-sm"><p className="break-all text-xs text-ink-muted">{message.authorUserId === owner ? 'Tú' : message.authorUserId} · {formatDateTime(message.createdAt)}</p><p className="whitespace-pre-wrap break-words text-ink-light">{message.body}</p></div>)}</div>
            {selectedTicket.status === 'resuelto' && !reopen ? (
              <>
                <div className="space-y-2 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">
                  <h3 className="font-semibold">Respuesta de resolución</h3>
                  <p className="break-words whitespace-pre-wrap">{selectedTicket.response || 'No hay una respuesta registrada.'}</p>
                  {selectedTicket.resolvedAt && <p className="text-xs tabular-nums">Resuelta: {formatDateTime(selectedTicket.resolvedAt)}</p>}
                </div>
                <Button type="button" variant="outline" disabled={actions.busy || detail.loading || !!detail.error} onClick={() => { setReopen(true); setNextStatus('open'); }}>Reabrir caso</Button>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedTicketId(null)}>Cerrar</Button>
              </>
            ) : (
              <form noValidate onSubmit={handleResolve} className="space-y-6">
                <Select id="admin-ticket-next-status" label="Nuevo estado" value={nextStatus} onChange={event => setNextStatus(event.target.value as typeof nextStatus)}><option value="open">Abierto</option><option value="in_review">En revisión</option><option value="resolved">Resuelto</option></Select>
                <Select id="admin-ticket-priority" label="Prioridad del caso" value={nextPriority} onChange={event => setNextPriority(event.target.value as typeof nextPriority)}><option value="low">Baja</option><option value="normal">Media</option><option value="high">Alta</option></Select>
                <div className="space-y-2">
                  <label htmlFor="admin-ticket-response" className="block text-sm font-semibold text-ink">Respuesta del caso <span className="text-primary">*</span></label>
                  <textarea id="admin-ticket-response" value={responseMsg} onChange={(event) => { setResponseMsg(event.target.value); setResponseError(''); }}
                    rows={4} maxLength={3000} required aria-invalid={Boolean(responseError)} aria-describedby={responseError ? 'admin-ticket-response-error' : 'admin-ticket-response-help'}
                    placeholder="Explica cómo se resolvió la incidencia"
                    className={`w-full min-h-11 rounded-xl border bg-surface p-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary md:text-sm ${responseError ? 'border-destructive' : 'border-field'}`} />
                  {responseError ? <p id="admin-ticket-response-error" role="alert" className="text-xs text-destructive">{responseError}</p> : <p id="admin-ticket-response-help" className="text-xs text-ink-muted">La respuesta quedará registrada en el caso.</p>}
                </div>
                {actions.error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{actions.error}</p></div>}
                <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" size="sm" disabled={actions.busy} onClick={() => setSelectedTicketId(null)}>Cancelar</Button>
                  <Button type="submit" variant="primary" size="sm" disabled={actions.busy || resource.loading || !!resource.error || detail.loading || !!detail.error || !responseMsg.trim()}>Guardar respuesta y estado</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
