import React, { useState } from 'react';
import { accountRoles, adminUser, changeAdminUser, loadAdminUsers, useAdminAction, useAdminResource } from './adminModel';
import { RemoteState } from '../operations/shared';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/date';
import { UserRole, UserStatus } from '../../domain/types';
import { Check, X, ShieldAlert, CheckCircle2, Users, Search, AlertCircle } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const resource = useAdminResource('users', async signal => (await loadAdminUsers(signal)).map(adminUser));
  const actions = useAdminAction(resource.reload, resource.loading || !!resource.error);
  const users = resource.data || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [actionModal, setActionModal] = useState<{
    type: 'reject' | 'suspend' | 'activate';
    userId: string;
    userName: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const pendingCount = users.filter((user) => user.status === 'pendiente_aprobacion').length;
  const hasFilters = Boolean(searchQuery || roleFilter !== 'all' || statusFilter !== 'all');
  const roleLabels: Record<string, string> = { cliente: 'Cliente', comercio: 'Comercio', repartidor: 'Repartidor', admin: 'Administrador' };

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const openAction = (type: 'reject' | 'suspend', userId: string, userName: string) => {
    setActionReason('');
    setReasonError('');


    actions.clear(); setActionModal({ type, userId, userName });
  };

  const handleConfirmAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!actionModal) return;
    if (actionReason.trim().length < 3) { setReasonError('Escribe un motivo de al menos 3 caracteres.'); return; }
    const status = actionModal.type === 'activate' ? 'active' : 'suspended';
    if (await actions.execute(() => changeAdminUser(actionModal.userId, status, actionReason), 'Estado de cuenta confirmado.')) setActionModal(null);
  };
  const handleActivation = (userId: string, userName: string, _approve: boolean) => {
    actions.clear(); setActionReason(''); setReasonError(''); setActionModal({ type: 'activate', userId, userName });
  };
  if ((resource.loading || resource.error) && !resource.data) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Usuarios y solicitudes</h1>
          <p className="max-w-2xl text-sm text-ink-light">Revisa registros pendientes y administra el acceso de las cuentas.</p>
        </div>
        {pendingCount > 0 && (
          <Button type="button" size="sm" className="w-full shrink-0 gap-2 xl:w-auto" onClick={() => {
            setSearchQuery('');
            setRoleFilter('all');
            setStatusFilter('pendiente_aprobacion');
          }}>
            <Users className="h-5 w-5" aria-hidden="true" />
            Revisar solicitudes <span className="tabular-nums">({pendingCount})</span>
          </Button>
        )}
      </header>

      <section aria-label="Filtros de usuarios" className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Input id="admin-user-search" className="md:text-sm" type="search" label="Buscar usuarios" placeholder="Nombre o correo" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} leftIcon={<Search className="h-5 w-5" aria-hidden="true" />} />
          <Select id="admin-user-role" className="md:text-sm" label="Tipo de cuenta" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'all')}>
            <option value="all">Todos los tipos</option>
            <option value="cliente">Clientes</option>
            <option value="comercio">Comercios</option>
            <option value="repartidor">Repartidores</option>
            <option value="admin">Administradores</option>
          </Select>
          <Select id="admin-user-status" className="md:text-sm" label="Estado de la cuenta" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatus | 'all')}>
            <option value="all">Todos los estados</option>
            <option value="pendiente_aprobacion">Pendientes de aprobación</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
          </Select>
        </div>
        {hasFilters && <Button type="button" variant="outline" onClick={clearFilters}>Limpiar filtros</Button>}
      </section>

      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {actions.notice && <p role="status" className="rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">{actions.notice}</p>}
      {actions.error && !actionModal && <p role="alert" className="text-sm text-destructive-strong">{actions.error}</p>}



      <section aria-labelledby="admin-users-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-users-heading" className="text-base font-semibold text-ink">{statusFilter === 'pendiente_aprobacion' ? 'Solicitudes pendientes' : 'Cuentas registradas'}</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">{filteredUsers.length} {filteredUsers.length === 1 ? 'cuenta' : 'cuentas'}</p>
        </div>
        {filteredUsers.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" aria-hidden="true" />}
            title={users.length === 0 ? 'Aún no hay usuarios registrados' : 'No encontramos usuarios con estos filtros'}
            description={users.length === 0 ? 'Las cuentas aparecerán aquí cuando se registren en Quickly.' : 'Prueba con otro nombre, correo o estado, o limpia los filtros para ver todas las cuentas.'}
            actionText={hasFilters ? 'Limpiar filtros' : undefined} onAction={hasFilters ? clearFilters : undefined} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Cuentas registradas: contacto, tipo, estado, fecha de registro y acciones.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/3 rounded-tl-2xl px-4 py-3 font-semibold">Cuenta y contacto</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Tipo</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Registro</th>
                  <th scope="col" className="w-1/5 rounded-tr-2xl px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {filteredUsers.map((user) => {
                  const pending = user.status === 'pendiente_aprobacion';
                  const suspended = user.status === 'suspendido';
                  return (
                    <tr key={user.id} className="block p-4 xl:table-row xl:p-0">
                      <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                        <div className="flex min-w-0 items-start gap-3">
                          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-xs font-semibold text-ink-light">{user.name.substring(0, 2).toUpperCase()}</span>
                          <div className="min-w-0 space-y-1">
                            <h3 className="break-words text-sm font-semibold text-ink">{user.name}</h3>
                            <p className="break-all text-xs text-ink-light">{user.email}</p>
                            <p className="text-xs tabular-nums text-ink-muted">Celular: {user.phone}</p>
                          </div>
                        </div>
                      </th>
                      <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                        <span className="text-xs text-ink-muted xl:hidden">Tipo de cuenta</span>
                        <span className="flex flex-wrap gap-1">{user.source.roles.map(role => <Badge key={role}>{roleLabels[accountRoles[role] || role] || role}</Badge>)}</span>
                      </td>
                      <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                        <span className="text-xs text-ink-muted xl:hidden">Estado</span>
                        <Badge className="text-right xl:text-left" variant={pending ? 'warning' : suspended ? 'danger' : 'success'}>{pending ? 'Pendiente de aprobación' : suspended ? 'Suspendido' : 'Activo'}</Badge>
                      </td>
                      <td className="flex items-start justify-between gap-3 py-2 text-xs text-ink-muted xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                        <span className="xl:hidden">Registro</span>
                        <time dateTime={user.createdAt} className="text-right tabular-nums xl:text-left">{formatDateTime(user.createdAt)}</time>
                      </td>
                      <td className="block pt-3 xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                        <div className="flex flex-wrap gap-2 xl:justify-end" role="group" aria-label={`Acciones para ${user.name}`}>
                          {pending ? (
                            <>
                              <Button type="button" variant="outline" size="sm" className="flex-1 gap-2 xl:w-full" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => handleActivation(user.id, user.name, true)}><Check className="h-4 w-4" aria-hidden="true" />Activar cuenta</Button>
                              <Button type="button" variant="ghost" size="sm" className="flex-1 gap-2 text-destructive hover:bg-destructive-soft xl:w-full" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => openAction('suspend', user.id, user.name)}><X className="h-4 w-4" aria-hidden="true" />Suspender cuenta</Button>
                            </>
                          ) : suspended ? (
                            <Button type="button" variant="outline" size="sm" className="w-full gap-2" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => handleActivation(user.id, user.name, false)}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Reactivar</Button>
                          ) : !user.roles.includes('admin') ? (
                            <Button type="button" variant="ghost" size="sm" className="w-full gap-2 text-destructive hover:bg-destructive-soft" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => openAction('suspend', user.id, user.name)}><ShieldAlert className="h-4 w-4" aria-hidden="true" />Suspender</Button>
                          ) : <span className="text-xs text-ink-muted">Sin acciones</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog isOpen={Boolean(actionModal)} onClose={() => { if (!actions.busy) setActionModal(null); }}
        title={actionModal?.type === 'activate' ? 'Activar cuenta' : 'Suspender cuenta'}
        description={`Registra el motivo para cambiar el acceso de ${actionModal?.userName || 'esta cuenta'}. Las afiliaciones se revisan en Comercios y Repartidores.`} maxWidth="md">
        <form noValidate onSubmit={handleConfirmAction} className="space-y-6">
          <Input id="admin-user-action-reason" label="Motivo de la decisión" placeholder="Explica el motivo antes de continuar" value={actionReason} onChange={(event) => { setActionReason(event.target.value); setReasonError(''); }} required minLength={3} maxLength={500} error={reasonError} helperText="Este motivo quedará registrado en el historial de actividad." />
          {actions.error && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong">{actions.error}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={actions.busy} onClick={() => setActionModal(null)}>Cancelar</Button>
            <Button type="submit" variant={actionModal?.type === 'activate' ? 'primary' : 'danger'} disabled={actions.busy || resource.loading || !!resource.error}>Confirmar cambio</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
