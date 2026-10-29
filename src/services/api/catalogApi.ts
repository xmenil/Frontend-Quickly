import { z } from 'zod';
import type { components, operations } from './contracts/schema';
import { apiRequest, ApiError } from './apiClient';
export { mediaUrl as imageUrl } from './mediaApi';
type Schemas = components['schemas'];
export type CatalogProduct = Schemas['CatalogProductDto'];
export type CatalogSku = Schemas['CatalogSkuDto'];
export type InventoryItem = Schemas['InventoryItemDto'];
export type CatalogQuery = NonNullable<operations['CatalogManagementController_search']['parameters']['query']>;
const uuid = z.string().uuid();
const skuSchema: z.ZodType<CatalogSku> = z.object({ id: uuid, skuCode: z.string(), variantName: z.string(), priceCents: z.number().int().positive(),
  barcode: z.string().nullable(), isActive: z.boolean(), availableStock: z.number().int().nonnegative() });
const productSchema: z.ZodType<CatalogProduct> = z.object({ id: uuid, storeId: uuid, storeName: z.string(), categoryId: uuid, name: z.string(),
  description: z.string(), brand: z.string().nullable(), isActive: z.boolean(), position: z.number().int(), skus: z.array(skuSchema),
  images: z.array(z.object({ id: uuid, url: z.string(), altText: z.string(), position: z.number().int() })) });
const pageSchema = z.object({ items: z.array(productSchema), nextCursor: uuid.nullable() });
const inventorySchema: z.ZodType<InventoryItem> = z.object({ skuId: uuid, productId: uuid, productName: z.string(), skuCode: z.string(), variantName: z.string(),
  onHand: z.number().int(), reserved: z.number().int(), available: z.number().int(), lowStockThreshold: z.number().int(), lowStock: z.boolean() });
const movementSchema: z.ZodType<Schemas['InventoryMovementDto']> = z.object({ id: uuid, kind: z.string(), quantity: z.number().int(), onHandAfter: z.number().int(),
  reason: z.string(), actorUserId: uuid.nullable(), createdAt: z.string().datetime() });
const storeSchema = z.object({ id: uuid, name: z.string(), zone_id: uuid, zone_name: z.string(), category_code: z.string(), isOpen: z.boolean(), accepting_orders: z.boolean(), logoUrl:z.string().nullable(),bannerUrl:z.string().nullable() });
export type PublicStore = z.infer<typeof storeSchema>;
function checked<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError('No se pudo validar la información del catálogo. Vuelve a intentarlo.', 0, 'INVALID_RESPONSE');
  return result.data;
}
function query(params: CatalogQuery = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key,value]) => { if (value !== undefined && value !== '') search.set(key,String(value)); });
  return search.size ? `?${search}` : '';
}
export const catalogApi = {
  categories: async (signal?: AbortSignal) => checked(z.array(z.object({ id: uuid, code: z.string(), name: z.string() })), await apiRequest('/catalog/categories', { signal, publicRequest: true })),
  stores: async (signal?: AbortSignal) => checked(z.array(storeSchema), await apiRequest('/stores', { signal, publicRequest: true })),
  store: async (id: string, signal?: AbortSignal) => checked(storeSchema, await apiRequest(`/stores/${id}`, { signal, publicRequest: true })),
  search: async (params: CatalogQuery = {}, signal?: AbortSignal) => checked(pageSchema, await apiRequest(`/catalog/search${query(params)}`, { signal, publicRequest: true })),
  products: async (storeId: string, params: CatalogQuery = {}, signal?: AbortSignal) => checked(pageSchema, await apiRequest(`/merchant/stores/${storeId}/products${query(params)}`, { signal })),
  product: async (id: string, signal?: AbortSignal) => checked(productSchema, await apiRequest(`/products/${id}`, { signal, publicRequest: true })),
  ownProduct: async (id: string, signal?: AbortSignal) => checked(productSchema, await apiRequest(`/merchant/products/${id}`, { signal })),
  create: async (id: string, body: Schemas['PublishProductDto']) => checked(z.object({ productId: uuid, skuId: uuid }), await apiRequest(`/merchant/stores/${id}/products`, { method: 'POST', body })),
  update: async (id: string, body: Schemas['UpdateProductDto']) => checked(productSchema, await apiRequest(`/merchant/products/${id}`, { method: 'PATCH', body })),
  addSku: async (id: string, body: Schemas['CreateSkuDto']) => checked(productSchema, await apiRequest(`/merchant/products/${id}/skus`, { method: 'POST', body })),
  updateSku: async (id: string, body: Schemas['UpdateSkuDto']) => checked(productSchema, await apiRequest(`/merchant/skus/${id}`, { method: 'PATCH', body })),
  inventory: async (id: string, signal?: AbortSignal) => checked(z.array(inventorySchema), await apiRequest(`/merchant/stores/${id}/inventory`, { signal })),
  adjust: async (id: string, body: Schemas['StockAdjustmentDto']) => checked(movementSchema, await apiRequest(`/merchant/skus/${id}/stock-adjustments`, { method: 'POST', body })),
  movements: async (id: string, cursor?: string, signal?: AbortSignal) => checked(z.array(movementSchema), await apiRequest(`/merchant/skus/${id}/movements${query({ cursor, limit: 50 })}`, { signal })),
  image: async (id: string, body: Schemas['ProductImageInputDto']) => checked(productSchema, await apiRequest(`/merchant/products/${id}/images`, { method: 'POST', body, timeoutMs: 30000 })),
  removeImage: (id: string, imageId: string) => apiRequest<void>(`/merchant/products/${id}/images/${imageId}`, { method: 'DELETE' }),
};
export const money = (cents: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(cents / 100);
export function priceCents(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Ingresa un precio con hasta dos decimales.');
  const [whole,fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
  if (!Number.isSafeInteger(result) || result < 1 || result > 100000000) throw new Error('El precio debe estar entre S/ 0.01 y S/ 1,000,000.');
  return result;
}
