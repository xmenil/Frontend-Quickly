import { z } from 'zod';
import type { components } from './contracts/schema';
import { apiRequest, ApiError } from './apiClient';
type Schemas = components['schemas'];
export type Store = Schemas['StoreDetailDto'];
export type StoreSummary = Schemas['StoreDto'];
export type Zone = Schemas['ZoneDto'];
export type Address = Schemas['AddressDto'];
export type CourierProfile = Schemas['CourierProfileDto'];
export type StoreMember = Schemas['StoreMemberDto'];
export type AdminUser = Schemas['AdminUserDto'];
export type Decision = Schemas['OperationalDecisionDto'];
export type StoreInput = Schemas['CreateStoreDto'];
export type AddressInput = Schemas['CreateAddressDto'];
export type CourierInput = Schemas['ApplyCourierDto'];
export type ZoneInput = Schemas['CreateZoneDto'];
const status = z.enum(['pending','active','rejected','suspended']);
const uuid = z.string().uuid();
const zoneSchema: z.ZodType<Zone> = z.object({ id: uuid, code: z.string(), name: z.string(), description: z.string(), baseFeeCents: z.number().int(), estimatedMinutes: z.number().int(), isActive: z.boolean() });
const storeShape = { id: uuid, name: z.string(), categoryCode: z.string(), zoneId: uuid, zoneName: z.string(), description: z.string(),
  addressText: z.string(), phone: z.string(), legalBusinessName: z.string().nullable(), taxId: z.string().nullable(), status,
  statusReason: z.string().nullable(), acceptingOrders: z.boolean(), isOpen: z.boolean(), minimumOrderCents: z.number().int(),
  preparationMinutes: z.number().int(), createdAt: z.string().datetime(), membershipRole: z.enum(['owner','manager','operator','admin']) };
const storeSchema: z.ZodType<StoreSummary> = z.object(storeShape);
const detailSchema: z.ZodType<Store> = z.object({ ...storeShape, openingIntervals: z.array(z.object({ weekday: z.number().int(), opensAt: z.string(), closesAt: z.string() })) });
const courierSchema: z.ZodType<CourierProfile> = z.object({ id: uuid, userId: uuid, fullName: z.string(), email: z.string(), phone: z.string(),
  vehicleType: z.enum(['motorcycle','bicycle','mototaxi']), plate: z.string().nullable(), zoneId: uuid.nullable(), zoneName: z.string().nullable(),
  status, statusReason: z.string().nullable(), isOnline: z.boolean(), createdAt: z.string().datetime() });
const addressSchema: z.ZodType<Address> = z.object({ id: uuid, zoneId: uuid, zoneName: z.string(), zoneActive: z.boolean(), label: z.string(),
  recipientName: z.string(), phone: z.string(), street: z.string(), streetNumber: z.string(), reference: z.string(), isDefault: z.boolean(),
  latitude: z.number().nullable(), longitude: z.number().nullable() });
const memberSchema: z.ZodType<StoreMember> = z.object({ userId: uuid, fullName: z.string(), email: z.string(), membershipRole: z.enum(['owner','manager','operator']), isActive: z.boolean() });
const adminUserSchema: z.ZodType<AdminUser> = z.object({ id: uuid, fullName: z.string(), email: z.string(), phone: z.string(), status: z.enum(['active','pending','suspended']),
  roles: z.array(z.string()), createdAt: z.string().datetime(), statusReason: z.string().nullable() });
function checked<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) throw new ApiError('La respuesta del servicio no es válida. Actualiza la sección.', 0, 'INVALID_RESPONSE');
  return result.data;
}
const page = <T>(schema: z.ZodType<T>) => z.object({ items: z.array(schema), nextCursor: z.string().nullable() });
const query = (params: { cursor?: string; status?: string; limit?: number } = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  return search.size ? `?${search}` : '';
};
export const operationsApi = {
  zones: async (signal?: AbortSignal) => checked(z.array(zoneSchema), await apiRequest('/geography/zones', { signal, publicRequest: true, sessionIndependent: true })),
  categories: async (signal?: AbortSignal) => checked(z.array(z.object({ code: z.string(), label: z.string() })), await apiRequest('/merchant/categories', { signal })),
  addresses: async (signal?: AbortSignal) => checked(z.array(addressSchema), await apiRequest('/me/addresses', { signal })),
  saveAddress: async (body: AddressInput, id?: string) => checked(addressSchema, await apiRequest(id ? `/me/addresses/${id}` : '/me/addresses', { method: id ? 'PATCH' : 'POST', body })),
  defaultAddress: async (id: string) => checked(addressSchema, await apiRequest(`/me/addresses/${id}/default`, { method: 'PUT' })),
  archiveAddress: (id: string) => apiRequest<void>(`/me/addresses/${id}`, { method: 'DELETE' }),
  ownStores: async (params: { cursor?: string } = {}, signal?: AbortSignal) => checked(page(storeSchema), await apiRequest(`/merchant/stores${query(params)}`, { signal })),
  store: async (id: string, signal?: AbortSignal) => checked(detailSchema, await apiRequest(`/merchant/stores/${id}`, { signal })),
  applyStore: async (body: StoreInput) => checked(detailSchema, await apiRequest('/merchant/stores', { method: 'POST', body })),
  updateStore: async (id: string, body: Schemas['UpdateStoreDto']) => checked(detailSchema, await apiRequest(`/merchant/stores/${id}`, { method: 'PATCH', body })),
  hours: async (id: string, intervals: Schemas['OpeningIntervalDto'][]) => checked(detailSchema, await apiRequest(`/merchant/stores/${id}/hours`, { method: 'PUT', body: { intervals } })),
  members: async (id: string, signal?: AbortSignal) => checked(z.array(memberSchema), await apiRequest(`/merchant/stores/${id}/members`, { signal })),
  setMember: (id: string, body: Schemas['SetStoreMemberDto']) => apiRequest<void>(`/merchant/stores/${id}/members`, { method: 'PUT', body }),
  revokeMember: (id: string, userId: string) => apiRequest<void>(`/merchant/stores/${id}/members/${userId}`, { method: 'DELETE' }),
  courier: async (signal?: AbortSignal): Promise<CourierProfile | null> => {
    try { return checked(courierSchema, await apiRequest('/courier/profile', { signal })); }
    catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
  },
  applyCourier: async (body: CourierInput) => checked(courierSchema, await apiRequest('/courier/profile', { method: 'PUT', body })),
  availability: async (isOnline: boolean) => checked(courierSchema, await apiRequest('/courier/profile/availability', { method: 'PATCH', body: { isOnline } })),
  adminStores: async (params: { cursor?: string; status?: string }, signal?: AbortSignal) => checked(page(storeSchema), await apiRequest(`/admin/stores${query(params)}`, { signal })),
  adminCouriers: async (params: { cursor?: string; status?: string }, signal?: AbortSignal) => checked(page(courierSchema), await apiRequest(`/admin/couriers${query(params)}`, { signal })),
  decideStore: async (id: string, body: Decision) => checked(detailSchema, await apiRequest(`/admin/stores/${id}/decisions`, { method: 'POST', body })),
  decideCourier: async (id: string, body: Decision) => checked(courierSchema, await apiRequest(`/admin/couriers/${id}/decisions`, { method: 'POST', body })),
  adminUsers: async (params: { cursor?: string; status?: string }, signal?: AbortSignal) => checked(page(adminUserSchema), await apiRequest(`/admin/users${query(params)}`, { signal })),
  userStatus: (id: string, body: Schemas['UserStatusDto']) => apiRequest<void>(`/admin/users/${id}/status`, { method: 'PATCH', body }),
  adminZones: async (params: { cursor?: string }, signal?: AbortSignal) => checked(page(zoneSchema), await apiRequest(`/admin/zones${query(params)}`, { signal })),
  saveZone: async (body: ZoneInput | Schemas['UpdateZoneDto'], id?: string) => checked(zoneSchema, await apiRequest(id ? `/admin/zones/${id}` : '/admin/zones', { method: id ? 'PATCH' : 'POST', body })),
  overview: async (signal?: AbortSignal) => checked(z.object({ pendingStores: z.number(), pendingCouriers: z.number(), activeStores: z.number(), activeCouriers: z.number(), activeUsers: z.number(), suspendedUsers: z.number() }), await apiRequest('/admin/overview', { signal })),
};
