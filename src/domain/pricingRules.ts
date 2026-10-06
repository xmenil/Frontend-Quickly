import { CartItem, CoverageZone, Merchant } from './types';

export interface MerchantCartGroup {
  merchant: Merchant;
  items: CartItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

export interface CartCalculationResult {
  groups: MerchantCartGroup[];
  itemsSubtotalCents: number;
  totalDeliveryFeeCents: number;
  grandTotalCents: number;
  totalItemsCount: number;
}

/**
 * Calculates cart groups, subtotals, delivery fees, and grand total in integer cents.
 */
export function calculateCart(
  items: CartItem[],
  merchants: Merchant[],
  zone?: CoverageZone
): CartCalculationResult {
  const groupsMap = new Map<string, { merchant: Merchant; items: CartItem[] }>();

  // Group items by merchant
  for (const item of items) {
    if (!groupsMap.has(item.merchantId)) {
      const merchant = merchants.find(m => m.id === item.merchantId);
      if (merchant) {
        groupsMap.set(item.merchantId, { merchant, items: [] });
      }
    }
    const group = groupsMap.get(item.merchantId);
    if (group) {
      group.items.push(item);
    }
  }

  const groups: MerchantCartGroup[] = [];
  let itemsSubtotalCents = 0;
  let totalDeliveryFeeCents = 0;

  for (const [, group] of groupsMap.entries()) {
    const merchantSubtotalCents = group.items.reduce((acc, it) => {
      const unitPrice = it.unitPriceCents + (it.variantPriceDifferenceCents || 0);
      return acc + unitPrice * it.quantity;
    }, 0);

    // Delivery fee is determined by zone base fee or merchant's delivery fee
    const deliveryFeeCents = zone
      ? zone.baseFeeCents
      : group.merchant.deliveryFeeCents || 500; // default S/ 5.00

    const totalCents = merchantSubtotalCents + deliveryFeeCents;

    groups.push({
      merchant: group.merchant,
      items: group.items,
      subtotalCents: merchantSubtotalCents,
      deliveryFeeCents,
      totalCents,
    });

    itemsSubtotalCents += merchantSubtotalCents;
    totalDeliveryFeeCents += deliveryFeeCents;
  }

  const grandTotalCents = itemsSubtotalCents + totalDeliveryFeeCents;
  const totalItemsCount = items.reduce((acc, it) => acc + it.quantity, 0);

  return {
    groups,
    itemsSubtotalCents,
    totalDeliveryFeeCents,
    grandTotalCents,
    totalItemsCount,
  };
}

/**
 * Validates whether cash given is sufficient to cover the total
 */
export function validateCashPayment(
  cashAmountGivenCents: number,
  totalCents: number
): { isValid: boolean; changeDueCents: number; errorMessage?: string } {
  if (cashAmountGivenCents < totalCents) {
    return {
      isValid: false,
      changeDueCents: 0,
      errorMessage: `El monto en efectivo ingresado es menor al total a pagar.`,
    };
  }

  return {
    isValid: true,
    changeDueCents: cashAmountGivenCents - totalCents,
  };
}
