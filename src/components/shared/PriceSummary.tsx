import React from 'react';
import { formatCents } from '../../lib/currency';
import { MerchantCartGroup } from '../../domain/pricingRules';
import { Store, ShieldCheck, Bike } from 'lucide-react';

interface PriceSummaryProps {
  groups: MerchantCartGroup[];
  itemsSubtotalCents: number;
  totalDeliveryFeeCents: number;
  grandTotalCents: number;
  showBreakdown?: boolean;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  groups,
  itemsSubtotalCents,
  totalDeliveryFeeCents,
  grandTotalCents,
  showBreakdown = true,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-3.5">
      <h3 className="font-bold text-ink text-base border-b border-gray-100 pb-2.5 flex items-center justify-between">
        <span>Resumen de Compra</span>
        <span className="text-xs font-normal text-gray-500">
          {groups.length} {groups.length === 1 ? 'comercio' : 'comercios'}
        </span>
      </h3>

      {/* Breakdown per store if more than 1 merchant */}
      {showBreakdown && groups.length > 1 && (
        <div className="space-y-2 py-1 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Desglose por tienda
          </p>
          {groups.map((group) => (
            <div key={group.merchant.id} className="text-xs bg-gray-50 p-2.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  {group.merchant.name}
                </span>
                <span>{formatCents(group.totalCents)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500 text-[11px] pl-5">
                <span>Productos ({group.items.reduce((a, b) => a + b.quantity, 0)}):</span>
                <span>{formatCents(group.subtotalCents)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500 text-[11px] pl-5">
                <span className="flex items-center gap-1">
                  <Bike className="w-3 h-3 text-gray-400" /> Envío independiente:
                </span>
                <span>{formatCents(group.deliveryFeeCents)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Line Items */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal de productos:</span>
          <span className="font-semibold text-ink">{formatCents(itemsSubtotalCents)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span>Costo total de envíos:</span>
            {groups.length > 1 && (
              <span className="text-[10px] bg-primary-light text-primary font-bold px-1.5 py-0.5 rounded">
                {groups.length} envíos
              </span>
            )}
          </span>
          <span className="font-semibold text-ink">{formatCents(totalDeliveryFeeCents)}</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="pt-3 border-t border-gray-100 flex items-baseline justify-between">
        <div>
          <span className="text-base sm:text-lg font-extrabold text-ink block">Total a pagar:</span>
          <span className="text-[11px] text-gray-400">Incluye IGV y tarifas operativas</span>
        </div>
        <span className="text-2xl sm:text-3xl font-extrabold text-primary">
          {formatCents(grandTotalCents)}
        </span>
      </div>

      <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 py-2 rounded-xl">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span className="font-medium">Precios claros sin cargos ocultos</span>
      </div>
    </div>
  );
};
