import { z } from 'zod';
import type { components } from './contracts/schema';
import { apiRequest, ApiError } from './apiClient';
import { resolveApiUrl } from '../../lib/api';
const avatarSchema: z.ZodType<components['schemas']['AvatarDto']> = z.object({url:z.string().nullable()});
const brandingSchema: z.ZodType<components['schemas']['StoreBrandingDto']> = z.object({logoUrl:z.string().nullable(),bannerUrl:z.string().nullable()});
function checked<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError('No se pudo validar la información de las imágenes.',0,'INVALID_RESPONSE');
  return parsed.data;
}
export const mediaApi = {
  avatar: async (signal?: AbortSignal) => checked(avatarSchema,await apiRequest('/me/avatar',{signal})),
  saveAvatar: async (content: string) => checked(avatarSchema,await apiRequest('/me/avatar',{method:'PUT',body:{content},timeoutMs:30000})),
  removeAvatar: async () => checked(avatarSchema,await apiRequest('/me/avatar',{method:'DELETE'})),
  branding: async (id: string, signal?: AbortSignal) => checked(brandingSchema,await apiRequest(`/merchant/stores/${id}/branding`,{signal})),
  saveBranding: async (id: string, kind: 'logo'|'banner', content: string) => checked(brandingSchema,await apiRequest(`/merchant/stores/${id}/branding/${kind}`,{method:'PUT',body:{content},timeoutMs:30000})),
  removeBranding: async (id: string, kind: 'logo'|'banner') => checked(brandingSchema,await apiRequest(`/merchant/stores/${id}/branding/${kind}`,{method:'DELETE'})),
};
export function mediaUrl(url: string): string {
  return /^\/api\/v1\/(?:me\/avatar\/|(?:merchant\/)?stores\/[0-9a-f-]+\/branding\/(?:logo|banner)\/|media\/|merchant\/products\/[0-9a-f-]+\/media\/)[0-9a-f-]+\.png$/.test(url)
    ? resolveApiUrl(url) : '';
}
