import type { components } from './contracts/schema';
import { z } from 'zod';
import { apiRequest, ApiError } from './apiClient';

export type Profile = components['schemas']['UserProfileDto'];
export type Session = components['schemas']['AuthResponseDto'];
export type ProfileUpdate = components['schemas']['UpdateProfileDto'];
const profileSchema: z.ZodType<Profile> = z.object({
  id: z.string().uuid(), fullName: z.string(), email: z.string().email(), phone: z.string(),
  roles: z.array(z.enum(['customer', 'merchant', 'courier', 'admin'])),
  status: z.enum(['active', 'pending', 'suspended']), createdAt: z.string().datetime(),
  memberships: z.array(z.object({ storeId: z.string().uuid(), storeName: z.string(),
    storeStatus: z.enum(['pending', 'active', 'rejected', 'suspended']), membershipRole: z.enum(['owner', 'manager', 'operator']) })),
  courierId: z.string().uuid().nullable(),
});
const sessionSchema: z.ZodType<Session> = z.object({ user: profileSchema, csrfToken: z.string().regex(/^[a-f0-9]{64}$/), expiresAt: z.string().datetime() });
function checked<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) throw new ApiError('La respuesta del servicio de cuentas no es válida. Actualiza la página e inténtalo de nuevo.', 0, 'INVALID_RESPONSE');
  return result.data;
}
export const identityApi = {
  session: async () => checked(sessionSchema, await apiRequest('/auth/session', { publicRequest: true })),
  login: async (email: string, password: string) => checked(sessionSchema, await apiRequest('/auth/login', { method: 'POST', body: { email, password }, publicRequest: true })),
  register: async (body: components['schemas']['RegisterDto']) => checked(sessionSchema, await apiRequest('/auth/register', { method: 'POST', body, publicRequest: true })),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  updateProfile: async (body: ProfileUpdate) => checked(profileSchema, await apiRequest('/me', { method: 'PATCH', body })),
};
