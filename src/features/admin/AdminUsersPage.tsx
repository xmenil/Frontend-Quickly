import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { formatDateTime } from '../../lib/date';
import { UserRole, UserStatus } from '../../domain/types';
import { Check, X, ShieldAlert, CheckCircle2, User, Search } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { users, adminApproveUser, adminRejectUser, adminSuspendUser, adminActivateUser } =
    useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

  // Reason Modal State
  const [actionModal, setActionModal] = useState<{
    type: 'reject' | 'suspend';
    userId: string;
    userName: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState('Incumplimiento de términos o documentación incompleta');

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const handleConfirmAction = () => {
    if (!actionModal) return;
    if (actionModal.type === 'reject') {
      adminRejectUser(actionModal.userId, actionReason);
    } else {
      adminSuspendUser(actionModal.userId, actionReason);
    }
    setActionModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
          Usuarios y Solicitudes de Registro
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Revisa y aprueba solicitudes de comercios y repartidores para Tingo María
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <option value="all">Todos los Roles</option>
            <option value="cliente">Clientes</option>
            <option value="comercio">Comercios</option>
            <option value="repartidor">Repartidores</option>
            <option value="admin">Administradores</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
          >
            <option value="all">Todos los Estados</option>
            <option value="pendiente_aprobacion">Pendientes de Aprobación</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredUsers.map((u) => {
            const isPending = u.status === 'pendiente_aprobacion';
            const isSuspended = u.status === 'suspendido';

            return (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-ink uppercase flex-shrink-0">
                    {u.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-ink truncate">{u.name}</h3>
                      <RoleBadge role={u.role} />
                      {isPending && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                          Pendiente
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                          Suspendido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {u.email} • Tel: {u.phone}
                    </p>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      Registrado: {formatDateTime(u.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isPending ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => adminApproveUser(u.id)}
                        className="text-xs"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setActionModal({
                            type: 'reject',
                            userId: u.id,
                            userName: u.name,
                          })
                        }
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  ) : isSuspended ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adminActivateUser(u.id)}
                      className="text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Reactivar
                    </Button>
                  ) : u.role !== 'admin' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setActionModal({
                          type: 'suspend',
                          userId: u.id,
                          userName: u.name,
                        })
                      }
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <ShieldAlert className="w-4 h-4 mr-1" />
                      Suspender
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reason Dialog for Reject or Suspend */}
      <Dialog
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'reject' ? 'Rechazar Solicitud' : 'Suspender Cuenta'}
        description={`Acción administrativa sobre el usuario ${actionModal?.userName}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Motivo registrado en la auditoría"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmAction}>
              Confirmar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
