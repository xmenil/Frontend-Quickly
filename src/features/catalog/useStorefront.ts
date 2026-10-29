import { catalogApi, type CatalogProduct, type CatalogQuery } from '../../services/api/catalogApi';
import { ApiError } from '../../services/api/apiClient';
import { useRemote } from '../operations/shared';
import { storefrontMerchant, storefrontProduct } from './storefrontModel';

/** Existing tabs show totals and sort across the entire result, not just page one. */
export async function loadCatalogProducts(query: CatalogQuery = {}, signal?: AbortSignal): Promise<CatalogProduct[]> {
  const products = new Map<string, CatalogProduct>();
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await catalogApi.search({ ...query, limit: 50, cursor }, signal);
    page.items.forEach(product => products.set(product.id, product));
    cursor = page.nextCursor || undefined;
    if (cursor && cursors.has(cursor)) throw new ApiError('No se pudo completar la carga del catálogo. Reintenta la consulta.', 502, 'INVALID_CURSOR');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return [...products.values()];
}

export function useStorefrontCatalog() {
  return useRemote('storefront-catalog', async signal => {
    const [stores, products] = await Promise.all([catalogApi.stores(signal), loadCatalogProducts({}, signal)]);
    const merchants = stores.map(storefrontMerchant);
    const byId = new Map(merchants.map(store => [store.id, store]));
    return { merchants, products: products.map(product => storefrontProduct(product, byId.get(product.storeId))) };
  });
}

export function useStorefrontStore(id: string) {
  return useRemote(`storefront-store:${id}`, async signal => {
    // Verify the store before asking for its catalog; never substitute another identity on 404.
    const store = await catalogApi.store(id, signal);
    const [products, categories] = await Promise.all([loadCatalogProducts({ storeId: id }, signal), catalogApi.categories(signal)]);
    const merchant = storefrontMerchant(store);
    return { merchant, products: products.map(product => storefrontProduct(product, merchant, categories)) };
  });
}

export function useStorefrontProduct(id: string) {
  return useRemote(`storefront-product:${id}`, async signal => {
    const source = await catalogApi.product(id, signal);
    const store = await catalogApi.store(source.storeId, signal);
    const merchant = storefrontMerchant(store);
    return { merchant, product: storefrontProduct(source, merchant) };
  });
}
