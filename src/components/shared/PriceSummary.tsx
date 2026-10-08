import React from 'react';
import { formatCents } from '../../lib/currency';
import { MerchantCartGroup } from '../../domain/pricingRules';
import { Store, ShieldCheck, Bike, Info, ShoppingBag } from 'lucide-react';

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
  const isMultiMerchant = groups.length > 1;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-ink text-base">
          Resumen de Compra
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            isMultiMerchant
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {groups.length} {groups.length === 1 ? 'comercio' : 'comercios'}
        </span>
      </div>

      {/* Breakdown per store if more than 1 merchant */}
      {showBreakdown && isMultiMerchant && (
        <div className="space-y-3 py-1 border-b border-gray-100">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 leading-snug">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Pedido multitienda:</strong> Cada local despacha de forma independiente con su propio repartidor para garantizar frescura y rapidez.
            </p>
          </div>

          <div className="space-y-2">
            {groups.map((group) => {
              const totalItems = group.items.reduce((a, b) => a + b.quantity, 0);
              return (
                <div
                  key={group.merchant.id}
                  className="text-xs bg-gray-50/80 p-3 rounded-2xl border border-gray-100 space-y-2 hover:border-gray-200 transition-colors"
                >
                  {/* Store Name and Subtotal Total */}
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <Store className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="truncate">{group.merchant.name}</span>
                    </span>
                    <span className="tabular-nums font-black text-ink">
                      {formatCents(group.totalCents)}
                    </span>
                  </div>

                  {/* Products line */}
                  <div className="flex items-center justify-between text-gray-600 text-xs pl-5">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-gray-400" />
                      <span>Productos ({totalItems}):</span>
                    </span>
                    <span className="tabular-nums font-semibold text-gray-800">
                      {formatCents(group.subtotalCents)}
                    </span>
                  </div>

                  {/* Delivery line */}
                  <div className="flex items-center justify-between text-gray-600 text-xs pl-5">
                    <span className="flex items-center gap-1">
                      <Bike className="w-3 h-3 text-primary flex-shrink-0" />
                      <span>Envío independiente:</span>
                    </span>
                    <span className="tabular-nums font-semibold text-gray-800">
                      {formatCents(group.deliveryFeeCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single merchant direct badge */}
      {showBreakdown && !isMultiMerchant && groups.length === 1 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-xs text-gray-700">
          <Store className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="font-semibold text-ink truncate">
            {groups[0]?.merchant.name}
          </span>
          <span className="text-gray-400 ml-auto">Local seleccionado</span>
        </div>
      )}

      {/* Global Line Items */}
      <div className="space-y-2.5 text-sm text-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal de productos:</span>
          <span className="font-bold text-ink tabular-nums">{formatCents(itemsSubtotalCents)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span>Costo total de envíos:</span>
            {isMultiMerchant && (
              <span className="text-[10px] bg-primary-soft text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                {groups.length} envíos
              </span>
            )}
          </span>
          <span className="font-bold text-ink tabular-nums">{formatCents(totalDeliveryFeeCents)}</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="pt-3.5 border-t border-gray-100 flex items-baseline justify-between">
        <div>
          <span className="text-base font-extrabold text-ink block">Total a pagar:</span>
          <span className="text-xs text-gray-500">Incluye IGV y tarifa operativa</span>
        </div>
        <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tight">
          {formatCents(grandTotalCents)}
        </span>
      </div>

      {/* Trust Seal */}
      <div className="pt-1 flex items-center justify-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 py-2.5 px-3 rounded-2xl">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="font-semibold text-center">Precios de tienda sin sobrecargos ocultos</span>
      </div>
    </div>
  );
};
