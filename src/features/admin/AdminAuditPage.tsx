import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDateTime } from '../../lib/date';
import { RoleBadge } from '../../components/ui/Badge';
import { FileText, ShieldCheck } from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const { auditLogs } = useDataStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Historial de Auditoría</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Registro inmutable de transiciones, compras y acciones operativas en el prototipo
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-ink">{log.action}</span>
                  <RoleBadge role={log.actorRole} />
                </div>
                <p className="text-gray-600 font-medium">
                  Actor: <strong>{log.actor}</strong> • Entidad:{' '}
                  <span className="text-primary font-semibold">{log.entity}</span>
                </p>
                {log.details && (
                  <p className="text-gray-500 text-[11px] bg-gray-50 p-2 rounded-xl border border-gray-100">
                    {log.details}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
