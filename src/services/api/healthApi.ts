import { z } from 'zod';
import { apiRequest, ApiError } from './apiClient';
const live = z.object({ status: z.literal('ok'), service: z.string() });
const ready = live.extend({ timestamp: z.string().datetime({ offset: true }), database: z.literal('connected'), version: z.string() });
async function checked<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
 const response = schema.safeParse(await apiRequest(path, { signal, publicRequest: true }));
 if (!response.success) throw new ApiError('No se pudo validar la respuesta de salud.', 502, 'INVALID_RESPONSE');
 return response.data;
}
export const healthApi = { live: (signal?: AbortSignal) => checked('/health/live', live, signal), ready: (signal?: AbortSignal) => checked('/health/ready', ready, signal) };
