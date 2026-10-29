import React, { useState, useMemo } from 'react';
import { allPages } from './customerAccountModel';
import { engagementApi } from '../../services/api/engagementApi';
import { orderingApi } from '../../services/api/orderingApi';
import { useRemote, RemoteState } from '../operations/shared';
import { TicketConversation } from './TicketConversation';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/date';
import {
  HelpCircle,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Clock,
  Search,
  ShieldCheck,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  q: string;
  a: string;
}

const FAQ_DATA: FaqItem[] = [
 { id: 'f1', category: 'Pedidos', q: '¿Cómo funciona una compra en varias tiendas?', a: 'Cada tienda genera su propio pedido, envío y cobro. Revisa el desglose de la cotización antes de confirmar.' },
 { id: 'f2', category: 'Cancelación', q: '¿Cuándo puedo cancelar?', a: 'Puedes solicitar la cancelación de un pedido pendiente o confirmado. La API valida su estado actual antes de confirmarla.' },
 { id: 'f3', category: 'Cobertura', q: '¿Qué zonas tienen cobertura?', a: 'Consulta las zonas disponibles al guardar tu dirección. El importe final se muestra en la cotización del checkout.' },
 { id: 'f4', category: 'Pagos', q: '¿Qué medios de pago están disponibles?', a: 'Actualmente se permite efectivo contra entrega cuando el checkout lo habilita. Yape, Plin y tarjeta todavía no están disponibles.' },
 { id: 'f5', category: 'Seguimiento', q: '¿Cómo consulto mi entrega?', a: 'Abre Mis Pedidos para consultar los estados registrados. El mapa es referencial y no muestra una ubicación GPS en vivo.' },
 { id: 'f6', category: 'Soporte', q: '¿Cómo consulto un problema de pago?', a: 'Crea un ticket asociado a tu pedido y consulta sus mensajes aquí. No se prometen reembolsos digitales automáticos.' },
];

export const CustomerHelpPage: React.FC = () => {
  const resource = useRemote('customer-tickets', signal => allPages(cursor => engagementApi.tickets(false, cursor, signal)));
  const orderResource = useRemote('support-order-options', signal => allPages(cursor => orderingApi.list('/me/orders', { cursor, limit: '50' }, signal)));
  const userPurchases = orderResource.data || [];
  const userTickets = (resource.data || []).map(ticket => ({ ...ticket, status: ({ open: 'abierto', in_review: 'en_revision', resolved: 'resuelto' } as const)[ticket.status], description: '', response: '' }));
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = React.useRef(false);
  const { currentUser } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [category, setCategory] = useState<'pedido' | 'demora' | 'pago' | 'cuenta' | 'otro'>('pedido');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('f1');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.filter(
      (f) =>
        f.q.toLowerCase().includes(q) ||
        f.a.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (lock.current || !subject.trim() || !description.trim() || !currentUser) return;
    const selected = userPurchases.find(order => order.id === orderCode.trim() || order.code === orderCode.trim());
    if (orderCode.trim() && !selected) { setError('Selecciona un pedido de tu cuenta o deja el código vacío.'); return; }
    lock.current = true; setBusy(true); setError(''); setIsSuccess(false); const owner = currentUser.id;
    try { const ticket = await engagementApi.createTicket({ subject: '[' + category.toUpperCase() + '] ' + subject.trim(), body: description.trim(), ...(selected ? { orderId: selected.id } : {}) });
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      setCreatedTicketId(ticket.id); setIsSuccess(true); setSubject(''); setDescription(''); setOrderCode(''); resource.reload();
    } catch(e) { setError(e instanceof Error ? e.message : 'No se pudo enviar el ticket.'); } finally { lock.current = false; setBusy(false); }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 sm:pb-8">
      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      <RemoteState loading={orderResource.loading} error={orderResource.error} retry={orderResource.reload} />
      {/* Title & Headline */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Centro de Ayuda y Soporte</h1>
        <p className="text-xs sm:text-sm text-ink-light mt-1">
          Estamos aquí para ayudarte con tus compras, entregas y consultas en Tingo María
        </p>
      </div>

      {/* Response Time & Direct Channels Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimated Response Time */}
        <div className="bg-gradient-to-br from-primary-50 to-white p-5 rounded-3xl border border-primary-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center gap-2.5 text-primary">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Tiempo de Respuesta</span>
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold text-ink">Por confirmar</div>
            <p className="text-xs text-ink-light mt-0.5">
              Horario de atención no informado
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Seguimiento mediante tickets</span>
          </div>
        </div>

        {/* WhatsApp Direct Help */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-subtle flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">WhatsApp Directo</span>
          </div>
          <div className="my-3">
            <div className="text-lg font-bold text-ink">Atención por WhatsApp</div>
            <p className="text-xs text-ink-light mt-0.5">
              Canal pendiente de configuración. Usa el formulario de soporte.
            </p>
          </div>
          <a
            aria-disabled="true" tabIndex={-1}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-subtle min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Abrir chat de WhatsApp</span>
          </a>
        </div>

        {/* Local Telephone Call */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center gap-2.5 text-sky-800">
            <Phone className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Central Telefónica</span>
          </div>
          <div className="my-3">
            <div className="text-lg font-bold text-ink">No configurada</div>
            <p className="text-xs text-ink-light mt-0.5">
              Canal pendiente de configuración. Usa el formulario de soporte.
            </p>
          </div>
          <a
            aria-disabled="true" tabIndex={-1}
            className="touch-target inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-ink font-bold text-xs px-4 py-2.5 rounded-xl transition-all min-h-[44px]"
          >
            <Phone className="w-4 h-4 text-gray-500" />
            <span>Llamar a soporte</span>
          </a>
        </div>
      </div>

      {/* Frequently Asked Questions with Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">Preguntas Frecuentes</h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en preguntas frecuentes..."
              className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 min-h-[40px]"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center space-y-1">
              <p className="font-bold text-sm text-ink">
                No encontramos preguntas sobre "{searchQuery}"
              </p>
              <p className="text-xs text-ink-light">
                Puedes enviarnos tu consulta directamente en el formulario inferior.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="touch-target w-full p-4 sm:p-4.5 text-left font-bold text-sm text-ink flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2.5 pr-2">
                      <span className="text-[10px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 hidden sm:inline">
                        {faq.category}
                      </span>
                      <span>{faq.q}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-gray-700 leading-relaxed border-t border-gray-50 bg-gray-50/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Support Ticket Submission Form */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-100 shadow-subtle space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-ink">Enviar un Ticket de Soporte</h2>
            <span className="text-[11px] bg-primary-50 text-primary font-bold px-2 py-0.5 rounded-full">
              Oficial
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-0.5">
            Describe tu consulta o inconveniente. Nuestro equipo administrativo revisará tu caso de
            mediante este ticket.
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {isSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p>¡Ticket de soporte creado con éxito!</p>
              <p className="font-normal text-xs text-emerald-700 mt-0.5">
                Número de seguimiento: <strong>{createdTicketId}</strong>. Podrás ver la respuesta
                de la administración en esta misma sección.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink block">Tipo de Consulta</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs sm:text-sm p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                <option value="pedido">Inconveniente con mi pedido</option>
                <option value="demora">Demora en el tiempo de entrega</option>
                <option value="pago">Consulta sobre pago</option>
                <option value="cuenta">Dirección o datos de cuenta</option>
                <option value="otro">Otro motivo general</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink block">Código de Pedido (Opcional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Ej: QK-914238"
                  className="w-full text-xs sm:text-sm p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
                {userPurchases.length > 0 && (
                  <select
                    onChange={(e) => setOrderCode(e.target.value)}
                    value=""
                    className="text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 min-h-[44px]"
                    title="Seleccionar pedido reciente"
                  >
                    <option value="" disabled>
                      Recientes
                    </option>
                    {userPurchases.slice(0, 3).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Asunto o Título breve"
            placeholder="Ej: El repartidor aún no llega con mi pedido de La Selva Gourmet"
            maxLength={130}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            helperText="Indica brevemente el motivo del reclamo o consulta."
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink block">Detalle de la Incidencia</label>
            <textarea
              maxLength={3000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explícanos con detalle qué ocurrió, dirección afectada o referencia para ayudarte rápidamente..."
              rows={4}
              required
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tu consulta quedará registrada para su seguimiento.</span>
            </span>

            <Button
              type="submit"
              isLoading={busy}
              disabled={busy}
              variant="primary"
              size="md"
              className="w-full sm:w-auto min-h-[44px] px-6 font-bold shadow-subtle"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Enviar Ticket de Soporte</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Previous Support Tickets History */}
      {userTickets.length > 0 && (
        <div className="space-y-3.5">
          <h2 className="text-base sm:text-lg font-bold text-ink">Historial de Tus Tickets</h2>

          <div className="space-y-3">
            {userTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-subtle space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{ticket.subject}</span>
                    {ticket.orderId && (
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {ticket.orderId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        ticket.status === 'resuelto'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ticket.status === 'en_revision'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}
                    >
                      {ticket.status === 'resuelto'
                        ? 'Resuelto'
                        : ticket.status === 'en_revision'
                        ? 'En revisión'
                        : 'Abierto'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatDateTime(ticket.createdAt)}
                    </span>
                  </div>
                </div>

                <TicketConversation id={ticket.id} />

                {ticket.response && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-ink space-y-1">
                    <span className="font-bold text-primary block">
                      Respuesta de la Administración de Quickly:
                    </span>
                    <p className="text-gray-700 leading-relaxed">{ticket.response}</p>
                    {ticket.resolvedAt && (
                      <span className="text-[10px] text-gray-400 block pt-1">
                        Respondido el {formatDateTime(ticket.resolvedAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
