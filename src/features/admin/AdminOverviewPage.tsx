import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Users, Store, Bike, ShoppingBag, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const { users, merchants, couriers, purchases, tickets } = useDataStore();
  const navigate = useNavigate();

  const pendingApprovalsCount = users.filter((u) => u.status === 'pendiente_aprobacion').length;
  const activeOrdersCount = purchases.filter((p) =>
    ['pendiente', 'en_proceso', 'entrega_parcial'].includes(p.status)
  ).length;
  const totalGMVCents = purchases.reduce((acc, p) => acc + p.grandTotalCents, 0);
  const openTicketsCount = tickets.filter((t) => t.status === 'abierto' || t.status === 'en_revision').length;

  const attentionItems = [
    {
      label: 'Pedidos en curso', count: activeOrdersCount, icon: ShoppingBag,
      to: '/admin/pedidos', action: 'Ver pedidos',
      description: activeOrdersCount > 0 ? 'Compras pendientes, en proceso o con entrega parcial.' : 'No hay compras en curso.',
      tone: 'bg-info-soft text-info-strong',
    },
    {
      label: 'Solicitudes pendientes', count: pendingApprovalsCount, icon: Users,
      to: '/admin/usuarios', action: 'Ver solicitudes',
      description: pendingApprovalsCount > 0 ? 'Cuentas que esperan aprobación.' : 'No hay cuentas pendientes de aprobación.',
      tone: 'bg-warning-soft text-warning-strong',
    },
    {
      label: 'Incidencias por atender', count: openTicketsCount, icon: AlertTriangle,
      to: '/admin/incidencias', action: 'Ver incidencias',
      description: openTicketsCount > 0 ? 'Casos abiertos o en revisión.' : 'No hay incidencias abiertas ni en revisión.',
      tone: 'bg-warning-soft text-warning-strong',
    },
  ];

  const operationItems = [
    {
      label: 'Comercios abiertos', count: merchants.filter((merchant) => merchant.isOpen).length,
      total: merchants.length, icon: Store, to: '/admin/comercios', action: 'Ver comercios',
      empty: 'Aún no hay comercios registrados.', description: 'Disponibilidad registrada en la plataforma.',
    },
    {
      label: 'Repartidores disponibles', count: couriers.filter((courier) => courier.isAvailable).length,
      total: couriers.length, icon: Bike, to: '/admin/repartidores', action: 'Ver repartidores',
      empty: 'Aún no hay repartidores registrados.', description: 'Disponibilidad registrada por la flota.',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Resumen de la operación</h1>
          <p className="max-w-2xl text-xs text-ink-light">
            Revisa los pendientes y el estado de Quickly en Tingo María.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" className="w-full shrink-0 gap-2 xl:w-auto" onClick={() => navigate('/admin/pedidos')}>
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          {activeOrdersCount > 0 ? 'Revisar pedidos en curso' : 'Ver pedidos'}
        </Button>
      </header>

      <section aria-labelledby="admin-attention-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="admin-attention-heading" className="text-base font-semibold text-ink">Atención pendiente</h2>
          <p className="text-xs text-ink-light">Accede a los pedidos, solicitudes y casos que debes revisar.</p>
        </div>
        {activeOrdersCount === 0 && pendingApprovalsCount === 0 && openTicketsCount === 0 && (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p>No hay pedidos en curso, solicitudes pendientes ni incidencias por atender.</p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {attentionItems.map((item) => (
            <Link key={item.to} to={item.to} className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-subtle transition-colors hover:border-field ">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.count > 0 ? item.tone : 'bg-surface-subtle text-ink-muted'}`}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xl font-bold tabular-nums text-ink">{item.count}</p>
                <p className="text-xs text-ink-light">{item.description}</p>
              </div>
              <span className="flex items-center justify-between gap-3 text-xs font-medium text-primary group-hover:text-primary-hover">
                {item.action}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="admin-operation-heading" className="space-y-4">
        <h2 id="admin-operation-heading" className="text-base font-semibold text-ink">Estado de la operación</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {operationItems.map((item) => (
            <Link key={item.to} to={item.to} className="group flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-field ">
              <item.icon className="mt-1 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
                <p className="text-xl font-bold tabular-nums text-ink">
                  {item.count} <span className="text-sm font-medium text-ink-muted">de {item.total}</span>
                </p>
                <p className="text-xs text-ink-light">{item.total === 0 ? item.empty : item.description}</p>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-primary group-hover:text-primary-hover">
                  {item.action}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="admin-totals-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="admin-totals-heading" className="text-base font-semibold text-ink">Cifras generales</h2>
          <p className="text-xs text-ink-light">Totales de los registros disponibles, sin filtro de fecha.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Cifras generales de Quickly, sin filtro de fecha.</caption>
            <thead className="bg-surface-subtle text-xs text-ink-light">
              <tr>
                <th scope="col" className="rounded-tl-2xl px-4 py-3 font-semibold">Indicador</th>
                <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold lg:rounded-none">Total</th>
                <th scope="col" className="hidden w-1/2 rounded-tr-2xl px-4 py-3 font-semibold lg:table-cell">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <th scope="row" className="px-4 py-3 font-medium text-ink">Monto total registrado
                  <p className="mt-1 text-xs font-normal text-ink-muted lg:hidden">Todas las compras, incluidas las canceladas.</p>
                </th>
                <td className="break-words px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatCents(totalGMVCents)}</td>
                <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">Suma de todas las compras registradas, incluidas las canceladas.</td>
              </tr>
              <tr>
                <th scope="row" className="px-4 py-3 font-medium text-ink">Compras registradas
                  <p className="mt-1 text-xs font-normal text-ink-muted lg:hidden">Una compra puede incluir varios comercios.</p>
                </th>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{purchases.length}</td>
                <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">Una compra puede incluir pedidos de varios comercios.</td>
              </tr>
              <tr>
                <th scope="row" className="px-4 py-3 font-medium text-ink">Cuentas registradas</th>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{users.length}</td>
                <td className="hidden px-4 py-1 lg:table-cell">
                  <Link to="/admin/usuarios" className="inline-flex min-h-11 items-center gap-2 rounded-xl text-xs font-medium text-primary hover:text-primary-hover">Ver usuarios<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </td>
              </tr>
            </tbody>
          </table>
          <Link to="/admin/usuarios" className="mx-4 mb-2 inline-flex min-h-11 items-center gap-2 rounded-xl text-xs font-medium text-primary hover:text-primary-hover lg:hidden">Ver usuarios<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
};
