import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
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
  {
    id: 'f1',
    category: 'Pedidos',
    q: '¿Cómo funciona la compra en múltiples comercios de Tingo María a la vez?',
    a: 'Quickly te permite armar un único carrito combinando platos de restaurantes amazónicos, productos de boticas o bodegas tingalesas. Al confirmar la compra se genera una orden global; el sistema despacha a cada comercio con su repartidor asignado para que tus alimentos lleguen calientes y a tiempo.',
  },
  {
    id: 'f2',
    category: 'Cancelación',
    q: '¿Hasta qué momento puedo cancelar un pedido sin recargo?',
    a: 'Puedes solicitar la cancelación de inmediato y sin ningún cobro mientras el restaurante mantenga el pedido en estado "Pendiente" o "Confirmado". En cuanto la cocina cambia a "En preparación", no es posible cancelarlo directamente para proteger el costo de los insumos del negocio local.',
  },
  {
    id: 'f3',
    category: 'Cobertura',
    q: '¿Qué zonas de Tingo María tienen cobertura y cómo varían las tarifas?',
    a: 'Llegamos a Centro de Tingo María (S/ 4.00, ~20 min), Rupa Rupa Norte / Campus UNAS (S/ 5.00, ~25 min), Rupa Rupa Sur / Afilador (S/ 5.50, ~30 min) y Castillo Grande cruzando el Puente Corpac (S/ 6.50, ~35 min). Puedes seleccionar tu zona en el menú superior para ver tarifas actualizadas.',
  },
  {
    id: 'f4',
    category: 'Pagos',
    q: '¿Cómo pago con Yape o Plin sin comisión?',
    a: 'Selecciona "Yape / Plin" en el checkout. Al confirmar tu compra verás el número de celular y código QR oficial del comercio para realizar tu transferencia desde tu aplicación bancaria. No cobramos comisiones adicionales por pagos digitales.',
  },
  {
    id: 'f5',
    category: 'Clima',
    q: '¿Qué pasa en días de lluvia tropical intensa o crecida del río Huallaga?',
    a: 'Nuestros repartidores en moto y mototaxi continúan operando con equipamiento impermeable. Por seguridad vial y tráfico en el Puente Corpac, el tiempo estimado de entrega puede incrementarse entre 10 y 15 minutos, lo cual se notifica en el seguimiento de tu pedido.',
  },
  {
    id: 'f6',
    category: 'Reembolsos',
    q: '¿Cómo se procesan los reembolsos si un comercio no tiene stock?',
    a: 'Si un producto se agota o cancelas a tiempo, la simulación de Quickly registra el reembolso íntegro de inmediato a tu método de pago registrado (Yape, Plin o saldo en plataforma).',
  },
];

export const CustomerHelpPage: React.FC = () => {
  const { tickets, createSupportTicket, purchases } = useDataStore();
  const { currentUser } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [category, setCategory] = useState<'pedido' | 'demora' | 'pago' | 'cuenta' | 'otro'>('pedido');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('f1');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  // User's recent orders for quick autocomplete
  const userPurchases = useMemo(
    () => purchases.filter((p) => p.customerId === currentUser?.id),
    [purchases, currentUser]
  );

  // User's previous support tickets
  const userTickets = useMemo(
    () =>
      tickets
        .filter((t) => t.userId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [tickets, currentUser]
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    createSupportTicket({
      userId: currentUser?.id || 'u_cliente_demo',
      userName: currentUser?.name || 'Cliente Quickly',
      userRole: 'cliente',
      orderId: orderCode.trim() || undefined,
      subject: `[${category.toUpperCase()}] ${subject.trim()}`,
      description: description.trim(),
      priority: category === 'demora' || category === 'pedido' ? 'alta' : 'media',
    });

    const fakeId = `tkt_${Date.now().toString().slice(-4)}`;
    setCreatedTicketId(fakeId);
    setIsSuccess(true);
    setSubject('');
    setDescription('');
    setOrderCode('');

    setTimeout(() => {
      setIsSuccess(false);
    }, 6000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 sm:pb-8">
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
            <div className="text-2xl font-extrabold text-ink">&lt; 2 horas</div>
            <p className="text-xs text-ink-light mt-0.5">
              Horario de atención: <strong>8:00 AM a 10:00 PM</strong> todos los días
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Equipo en línea en Tingo María</span>
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
              Atención ágil para cambios de dirección urgente o coordinaciones en ruta
            </p>
          </div>
          <a
            href="https://wa.me/51962123456?text=Hola%20Quickly%20Tingo%20Mar%C3%ADa%2C%20necesito%20ayuda%20con%20mi%20pedido"
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
            <div className="text-lg font-bold text-ink">(062) 562-111</div>
            <p className="text-xs text-ink-light mt-0.5">
              Línea fija local para comercios afiliados y emergencias en despachos
            </p>
          </div>
          <a
            href="tel:+5162562111"
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
            inmediato.
          </p>
        </div>

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
                <option value="pago">Consulta sobre pago (Yape / Plin / Efectivo)</option>
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
                      <option key={p.id} value={p.code}>
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
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            helperText="Indica brevemente el motivo del reclamo o consulta."
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink block">Detalle de la Incidencia</label>
            <textarea
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
              <span>Priorizamos casos con pedidos activos en ruta en Tingo María.</span>
            </span>

            <Button
              type="submit"
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

                <p className="text-xs text-ink-light leading-relaxed">{ticket.description}</p>

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
