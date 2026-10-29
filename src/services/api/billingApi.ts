import { z } from 'zod';
import { apiRequest, ApiError } from './apiClient';
const methods = z.array(z.object({ code: z.string(), label: z.string(), available: z.boolean(), unavailableReason: z.string().nullable() }));
const refund = z.object({ id: z.string().uuid(), orderId: z.string().uuid(), amountCents: z.number().int().nonnegative(), status: z.enum(['pending','processing','succeeded','failed']), createdAt: z.string(), succeededAt: z.string().nullable() });
const paymentPage = z.object({ items: z.array(z.object({ id: z.string().uuid(), methodCode: z.string(), status: z.enum(['pending','processing','succeeded','failed','cancelled']), amountCents: z.number().int().nonnegative(), createdAt: z.string(), succeededAt: z.string().nullable(), refunds: z.array(refund) })), nextCursor: z.string().nullable() });
export const billingApi = {
  history: async (id: string, cursor?: string, signal?: AbortSignal) => {
    const result = paymentPage.safeParse(await apiRequest('/me/purchases/' + id + '/payments' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''), { signal }));
    if (!result.success) throw new ApiError('No se pudo validar el historial de pagos.', 0, 'INVALID_RESPONSE'); return result.data;
  },

  methods: async (signal?: AbortSignal) => {
    const result = methods.safeParse(await apiRequest('/payment-methods', { signal, publicRequest: true, sessionIndependent: true }));
    if (!result.success) throw new ApiError('No se pudieron validar los medios de pago.', 502, 'INVALID_RESPONSE');
    return result.data;
  },
};
