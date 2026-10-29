/**
 * Quickly - Supabase & Backend Cloud Synchronization Layer
 * Conecta las operaciones de la aplicación (Comercio, Cliente, Repartidor, Admin)
 * con los endpoints del backend NestJS que persisten en PostgreSQL (Supabase 3FN).
 */

import { apiFetch } from './api';
import { Product, OrderStatus } from '../domain/types';

// Mapeo determinista de tiendas del catálogo a UUIDs en Supabase
export const STORE_ID_TO_UUID: Record<string, string> = {
  m_selva_gourmet: '07ed9ef6-7bae-4a9f-ad39-57759c54e6ed',
  m_restaurante_ruben: '87afa386-6fa0-468a-afd8-8ef892db835d',
  m_encanto_amazonico: '5bcc2d58-afb2-4c5b-aac7-ba9a5b896b1a',
  m_recreo_mirador: '4d42ac31-fc45-4f8c-ad4c-10a7b1d8ddfc',
  m_farmacia_vida: '95f993e2-9819-4a0f-afc6-de67ba04b687',
  m_botica_san_martin: 'd9330cea-7a90-4710-af8d-4c83debb1078',
  m_bodega_tingo: '052d0fe9-7844-4f4b-abeb-e83fd7a2b13f',
  m_rupa_mini: '475327df-357f-4c1d-ad07-01900a23435c',
  m_moda_selva: 'cd1634ee-7a0b-4a46-a559-d659aa0af75a',
  m_cacao_cafe: '1ed03d15-a84a-4253-a4ce-2f06e1a5811c',
  m_panaderia_amazonia: '51c5e441-0969-4aa9-aaf9-298e66f4a862',
  m_super_lukita: 'ad24b1ae-4ac8-4ca3-ae94-6356c0594485',
  m_tiendas_efe: '499bd12f-1949-4e04-a4d0-ad9b94ec9ab2',
  m_la_curacao: '7025e160-27e5-413f-ac42-4459061efd62',
  m_super_baraton: '8023f87a-d144-4454-a2e8-b6fd62f86afb',
  m_carsa: '8401d40e-df11-49c1-a308-9756ba7aeba8',
  m_el_balcon: '3a4b1911-f2cc-4528-a806-70cfa228c601',
  m_minisol: '185b6753-7e50-464b-a06e-ce387bf1fb7e',
  m_galeria_san_benito: '94f454b6-aea9-4bc3-a1a2-cc2a21653ab5',
  m_feria_continental: 'be65b968-c2d5-41d5-a9a7-9db05bed8fc8',
};

// Mapeo de taxonomía a categorías de Supabase (catalog.categories)
export const CATEGORY_TO_UUID: Record<string, string> = {
  restaurantes: 'c85594f9-080c-4b27-9e59-b93d8abcfdc8', // prepared_food
  beverages: 'a8cf799d-2f9e-4a86-a630-58d700821dc3',
  bodegas: '036b6b04-12cc-4fea-b139-ce8589522b3b', // groceries
  supermercados: '036b6b04-12cc-4fea-b139-ce8589522b3b',
  emprendedores: '036b6b04-12cc-4fea-b139-ce8589522b3b',
  farmacias: '6d518ccb-0db6-4b2a-8988-424441e1d673', // health
  ropa: 'c32c6acd-cfbe-415c-81ec-fa41e1e8ecce', // clothing
  tecnologia: '9d74e64d-7594-4774-9fca-b4f68068279c', // technology
  electrohogar: '45c9285f-1788-44ee-b762-62ae9aef09b3', // home
  hogar: '45c9285f-1788-44ee-b762-62ae9aef09b3', // home
  other: 'f57dbef2-0089-4ee0-a083-13298476286d',
};

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function resolveStoreUuid(storeId: string): string {
  if (isUuid(storeId)) return storeId;
  return STORE_ID_TO_UUID[storeId] || '07ed9ef6-7bae-4a9f-ad39-57759c54e6ed';
}

export function resolveCategoryUuid(category: string): string {
  if (isUuid(category)) return category;
  return CATEGORY_TO_UUID[category] || 'c85594f9-080c-4b27-9e59-b93d8abcfdc8';
}

// -------------------------------------------------------------
// 1. ROL COMERCIO: PRODUCTOS (catalog.products, skus, stock)
// -------------------------------------------------------------

export async function syncCreateProductToBackend(product: Product): Promise<{
  success: boolean;
  backendProductId?: string;
  skuId?: string;
}> {
  try {
    const storeUuid = resolveStoreUuid(product.merchantId);
    const categoryUuid = resolveCategoryUuid(product.category);
    const cleanName = product.name.trim();
    const cleanSkuCode = `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const res = await apiFetch(`/api/v1/merchant/stores/${storeUuid}/products`, {
      method: 'POST',
      body: JSON.stringify({
        categoryId: categoryUuid,
        name: cleanName,
        description: product.description?.trim() || '',
        brand: product.brand || 'Quickly',
        skuCode: cleanSkuCode,
        variantName: 'Estándar',
        priceCents: Math.max(1, product.priceCents),
        initialStock: Math.max(0, product.stock),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('No se pudo guardar producto en backend:', err);
      return { success: false };
    }

    const data = await res.json();
    return {
      success: true,
      backendProductId: data.productId,
      skuId: data.skuId,
    };
  } catch (error) {
    console.warn('Fallo de red al sincronizar creación de producto:', error);
    return { success: false };
  }
}

export async function syncUpdateProductToBackend(
  productId: string,
  updates: Partial<Product>
): Promise<boolean> {
  try {
    if (!isUuid(productId)) {
      // Si no tiene UUID aún, solo se guarda en local
      return false;
    }

    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name.trim();
    if (updates.description !== undefined) body.description = updates.description.trim();
    if (updates.brand !== undefined) body.brand = updates.brand.trim();
    if (updates.isAvailable !== undefined) body.isActive = updates.isAvailable;

    const res = await apiFetch(`/api/v1/merchant/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (error) {
    console.warn('Fallo de red al actualizar producto en backend:', error);
    return false;
  }
}

export async function syncDeleteProductToBackend(productId: string): Promise<boolean> {
  try {
    if (!isUuid(productId)) return false;

    const res = await apiFetch(`/api/v1/merchant/products/${productId}`, {
      method: 'DELETE',
    });

    return res.ok;
  } catch (error) {
    console.warn('Fallo de red al eliminar producto en backend:', error);
    return false;
  }
}

// -------------------------------------------------------------
// 2. ROL COMERCIO & REPARTIDOR: TRANSICIONES DE PEDIDOS
// -------------------------------------------------------------

export async function syncMerchantOrderStatusToBackend(
  orderId: string,
  targetStatus: OrderStatus,
  version = 0
): Promise<boolean> {
  try {
    if (!isUuid(orderId)) return false;

    let endpoint = '';
    if (targetStatus === 'confirmado') {
      endpoint = `/api/v1/merchant/orders/${orderId}/accept`;
    } else if (targetStatus === 'en_preparacion') {
      endpoint = `/api/v1/merchant/orders/${orderId}/start-preparation`;
    } else if (targetStatus === 'listo_recoger') {
      endpoint = `/api/v1/merchant/orders/${orderId}/mark-ready`;
    }

    if (!endpoint) return false;

    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion: version }),
    });

    return res.ok;
  } catch (error) {
    console.warn('Fallo de red al sincronizar estado del pedido:', error);
    return false;
  }
}

export async function syncAssignCourierToBackend(
  orderId: string,
  courierUserId: string,
  version = 0,
  reason = 'Asignación desde panel'
): Promise<boolean> {
  try {
    if (!isUuid(orderId) || !isUuid(courierUserId)) return false;

    const res = await apiFetch(`/api/v1/merchant/orders/${orderId}/assign-courier`, {
      method: 'POST',
      body: JSON.stringify({ courierUserId, expectedVersion: version, reason }),
    });

    return res.ok;
  } catch (error) {
    console.warn('Fallo de red al asignar repartidor:', error);
    return false;
  }
}
