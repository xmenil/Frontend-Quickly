import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { HelpCircle, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export const CustomerHelpPage: React.FC = () => {
  const { createSupportTicket } = useDataStore();
  const { currentUser } = useAuthStore();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: '¿Cómo funciona la compra en múltiples comercios a la vez?',
      a: 'Quickly te permite armar tu carrito con platos o productos de diferentes tiendas de Tingo María. Al confirmar, se genera una orden global pero cada negocio recibe su subpedido con un repartidor independiente para garantizar rapidez y calidez en los alimentos.',
    },
    {
      q: '¿Hasta qué momento puedo cancelar un pedido?',
      a: 'Puedes cancelar tu pedido de forma inmediata y sin penalidad mientras el comercio lo mantenga en estado "Pendiente" o "Confirmado". Una vez que la cocina entra "En preparación", ya no es posible cancelarlo directamente para proteger el costo de los alimentos.',
    },
    {
      q: '¿Cuáles son las zonas de cobertura en Tingo María?',
      a: 'Llegamos a Centro de Tingo María (Plaza de Armas, Alameda Perú), Rupa Rupa Norte (Campus UNAS), Rupa Rupa Sur (Afilador) y Castillo Grande (cruzando el puente Corpac). Cada zona cuenta con una tarifa transparente establecida.',
    },
    {
      q: '¿Cómo se procesan los reembolsos si cancelo?',
      a: 'Si pagaste con Yape/Plin o Tarjeta, la simulación registra el reembolso íntegro de los productos y la tarifa de envío del subpedido cancelado inmediatamente.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupportTicket({
      userId: currentUser?.id || 'u_cliente_demo',
      userName: currentUser?.name || 'Cliente Demo',
      userRole: 'cliente',
      orderId: orderCode.trim() || undefined,
      subject,
      description,
      priority: 'media',
    });
    setIsSuccess(true);
    setSubject('');
    setDescription('');
    setOrderCode('');
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Centro de Ayuda y Soporte</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Preguntas frecuentes y contacto directo con la administración de Quickly
        </p>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span>Preguntas Frecuentes</span>
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="touch-target w-full p-4 text-left font-bold text-sm text-ink flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-50 bg-gray-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Ticket Submission Form */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Enviar una Consulta o Reclamo</h2>
          <p className="text-xs text-gray-500">
            Tu solicitud aparecerá en el panel del Administrador para su revisión y respuesta
          </p>
        </div>

        {isSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              ¡Ticket de soporte creado con éxito! Puedes visualizarlo en el panel de Administración.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Asunto o tema"
            placeholder="Ej: Problema con la entrega de mi pedido"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <Input
            label="Código de pedido (opcional)"
            placeholder="Ej: QK-782410"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
          />
          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              Detalle de tu consulta o incidencia
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica qué sucedió para que el equipo de soporte te atienda..."
              rows={4}
              required
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              <Send className="w-4 h-4 mr-1.5" />
              <span>Enviar Ticket de Ayuda</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
