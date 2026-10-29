import { z } from 'zod';
import { intent as cartIntent, type CartIntent } from '../../store/realCartStore';
import type { PurchaseInput } from '../../services/api/orderingApi';

export interface PendingCheckout { key: string; body: PurchaseInput; snapshot: CartIntent[]; group?: boolean }
export const checkoutJournalKey = (userId: string) => `quickly_checkout_intent_v1:${userId}`;
const schema = z.object({ key: z.string().uuid(), group: z.boolean().optional(),
  body: z.object({ addressId: z.string().uuid(), paymentMethod: z.literal('cash'),
    items: z.array(z.object({ skuId: z.string().uuid(), quantity: z.number().int().min(1).max(10000), note: z.string().max(500).optional() })).min(1).max(100),
    cashTenderCents: z.number().int().positive().max(100000000000000).nullable().optional(), expectedTotalCents: z.number().int().positive().max(100000000000000).optional() }),
  snapshot: z.array(cartIntent).min(1).max(100),
});
export function pendingFor(userId: string): PendingCheckout | null | 'invalid' {
  try { const raw = sessionStorage.getItem(checkoutJournalKey(userId)); if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw)); return parsed.success ? parsed.data : 'invalid';
  } catch { return 'invalid'; }
}
export function saveCheckoutIntent(userId: string, pending: PendingCheckout) {
  const verified = schema.parse(pending);
  sessionStorage.setItem(checkoutJournalKey(userId), JSON.stringify(verified));
  return verified;
}
