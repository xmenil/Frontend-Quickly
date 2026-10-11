import React from 'react';
import { formatCents } from '../../lib/currency';
import { MerchantCartGroup } from '../../domain/pricingRules';
import { Store } from 'lucide-react';

interface PriceSummaryProps {
  groups: MerchantCartGroup[];
  itemsSubtotalCents: number;
  totalDeliveryFeeCents: number;
  grandTotalCents: number;
  showBreakdown?: boolean;
  deliveryIsEstimate?: boolean;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  groups, itemsSubtotalCents, totalDeliveryFeeCents, grandTotalCents,
  showBreakdown = true, deliveryIsEstimate = false,
}) => (
  <section aria-label="Resumen del pedido" className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-subtle">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-ink">Resumen del pedido</h2>
      <span className="text-xs tabular-nums text-ink-muted">{groups.length} {groups.length === 1 ? 'comercio' : 'comercios'}</span>
    </div>
    {showBreakdown && groups.length > 0 && (
      <div className="space-y-3 border-t border-border pt-4">
        {groups.map((group) => (
          <div key={group.merchant.id} className="space-y-2">
            <p className="flex items-start gap-2 text-sm font-medium text-ink"><Store className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" /><span className="min-w-0 break-words">{group.merchant.name}</span></p>
            {groups.length > 1 && <dl className="space-y-1 text-xs text-ink-light"><div className="flex justify-between gap-3"><dt>Productos</dt><dd className="tabular-nums">{formatCents(group.subtotalCents)}</dd></div><div className="flex justify-between gap-3"><dt>{deliveryIsEstimate ? 'Envío estimado' : 'Envío'}</dt><dd className="tabular-nums">{formatCents(group.deliveryFeeCents)}</dd></div></dl>}
          </div>
        ))}
      </div>
    )}
    <dl className="space-y-3 border-t border-border pt-4 text-sm">
      <div className="flex justify-between gap-4"><dt className="text-ink-light">Productos seleccionados</dt><dd className="font-medium tabular-nums text-ink">{formatCents(itemsSubtotalCents)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-ink-light">{deliveryIsEstimate ? 'Envío estimado' : 'Envío'}</dt><dd className="font-medium tabular-nums text-ink">{formatCents(totalDeliveryFeeCents)}</dd></div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-4"><dt className="font-semibold text-ink">{deliveryIsEstimate ? 'Total estimado' : 'Total del pedido'}</dt><dd className="text-xl font-bold tabular-nums text-ink">{formatCents(grandTotalCents)}</dd></div>
    </dl>
    <p className="text-xs text-ink-muted">{groups.length === 0 ? 'Selecciona productos para calcular el resumen.' : deliveryIsEstimate ? 'El envío y el total se actualizarán al elegir tu dirección de entrega.' : 'El total corresponde a los productos seleccionados y al envío a tu dirección.'}</p>
  </section>
);
