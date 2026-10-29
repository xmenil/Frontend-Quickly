import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRemote } from '../operations/shared';
import { engagementApi } from '../../services/api/engagementApi';
import { catalogApi } from '../../services/api/catalogApi';
import { storefrontMerchant, storefrontProduct } from '../catalog/storefrontModel';
import { ApiError } from '../../services/api/apiClient';
export async function allPages<T>(load: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>) {
 const items: T[] = []; const seen = new Set<string>(); let cursor: string | undefined;
 do { const page = await load(cursor); items.push(...page.items); cursor = page.nextCursor || undefined;
  if (cursor && seen.has(cursor)) throw new Error('La paginación no pudo completarse. Reintenta la consulta.');
  if (cursor) seen.add(cursor);
 } while (cursor); return items;
}
export const accountChanged = (kind: 'favorites' | 'notifications') => window.dispatchEvent(new Event('quickly:' + kind + '-changed'));
function useUpdates(kind: string, reload: () => void) { useEffect(() => { window.addEventListener('quickly:' + kind + '-changed', reload); return () => window.removeEventListener('quickly:' + kind + '-changed', reload); }, [kind, reload]); }
export function useFavoriteRecords() {
 const auth = useAuthStore();
 const resource = useRemote('customer-favorites:' + auth.sessionStatus + auth.isAuthenticated, signal => auth.sessionStatus === 'ready' && auth.isAuthenticated ? allPages(cursor => engagementApi.favorites(cursor, signal)) : Promise.resolve([]));
 useUpdates('favorites', resource.reload); return resource;
}
export function useCustomerFavorites() {
 const records = useFavoriteRecords();
 const resource = useRemote('customer-favorite-catalog:' + JSON.stringify(records.data), async signal => {
  const entries = records.data || [];
  const stores = new Map<string, ReturnType<typeof storefrontMerchant>>();
  async function store(id: string) { if (!stores.has(id)) stores.set(id, storefrontMerchant(await catalogApi.store(id, signal))); return stores.get(id)!; }
  const rows = await Promise.all(entries.map(async entry => {
   if (!entry.available) return { entry };
   try { if (entry.kind === 'store') return { entry, merchant: await store(entry.id) };
    const product = await catalogApi.product(entry.id, signal); const merchant = await store(product.storeId);
    return { entry, merchant, product: storefrontProduct(product, merchant) };
   } catch (error) { if (error instanceof ApiError && error.status === 404) return { entry }; throw error; }
  }));
  return { products: rows.flatMap(row => row.product ? [row.product] : []), merchants: [...stores.values()],
   favoriteMerchants: rows.flatMap(row => row.entry.kind === 'store' && row.merchant ? [row.merchant] : []),
   unavailable: rows.filter(row => row.entry.kind === 'product' ? !row.product : !row.merchant).map(row => row.entry) };
 });
 return { ...resource, loading: records.loading || resource.loading, error: records.error || resource.error, records: records.data || [], reload: () => { records.reload(); resource.reload(); } };
}
export function useCustomerNotifications() {
 const auth = useAuthStore();
 const resource = useRemote('customer-notifications:' + auth.sessionStatus + auth.isAuthenticated, async signal => (auth.sessionStatus === 'ready' && auth.isAuthenticated ? await allPages(cursor => engagementApi.notifications(cursor, signal)) : []).map(n => ({
  ...n, type: n.kind, isRead: !!n.readAt, linkUrl: n.relativeUrl && /^\/(?!\/)/.test(n.relativeUrl) && !n.relativeUrl.includes('\\') ? n.relativeUrl : undefined,
 })).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
 useUpdates('notifications', resource.reload); return resource;
}
