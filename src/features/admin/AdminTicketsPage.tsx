import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDateTime } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { AlertTriangle, CheckCircle2, MessageSquare, Send } from 'lucide-react';

export const AdminTicketsPage: React.FC = () => {
  const { tickets, resolveSupportTicket } = useDataStore();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [responseMsg, setResponseMsg] = useState('Caso revisado y resuelto por el equipo de administración.');

  const handleResolve = () => {
    if (!selectedTicketId) return;
    resolveSupportTicket(selectedTicketId, responseMsg);
    setSelectedTicketId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Incidencias y Soporte</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Atención de reclamos de clientes, tiendas y repartidores en Tingo María
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-ink">{t.subject}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'resuelto'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{t.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span>
                    Por: <strong>{t.userName}</strong> ({t.userRole})
                  </span>
                  <span>•</span>
                  <span>{formatDateTime(t.createdAt)}</span>
                  {t.orderId && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-primary">Pedido: {t.orderId}</span>
                    </>
                  )}
                </div>

                {t.response && (
                  <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900">
                    <strong>Respuesta de Admin:</strong> {t.response}
                  </div>
                )}
              </div>

              {t.status !== 'resuelto' && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedTicketId(t.id)}
                  className="self-end sm:self-auto"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Resolver
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        isOpen={Boolean(selectedTicketId)}
        onClose={() => setSelectedTicketId(null)}
        title="Responder y Resolver Ticket"
        description="Ingresa la solución o respuesta que verá el usuario"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink block mb-1">Respuesta</label>
            <textarea
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              rows={3}
              required
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedTicketId(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleResolve}>
              Guardar Resolución
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
