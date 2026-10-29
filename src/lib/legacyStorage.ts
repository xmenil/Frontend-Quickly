export const legacyKeys = ['quickly_auth_v1', 'quickly_session_token', 'quickly_datastore_v2', 'quickly_datastore_v3', 'quickly_datastore_v4', 'quickly_cart_v1', 'quickly_backend_url', 'quickly_search_history'] as const;
export const legacyNoticeKey = 'quickly_legacy_retired_notice_v1';
/** Retires only known prototype data. Current cart, checkout attempts and preferences survive. */
export function migrateLegacyStorage(storage?: Storage) {
 const removed: string[] = [];
 try {
  const target = storage || window.localStorage;
  for (const key of legacyKeys) if (target.getItem(key) !== null) { target.removeItem(key); removed.push(key); }
  if (!storage) { try {
   if (window.sessionStorage.getItem('quickly_csrf') !== null) { window.sessionStorage.removeItem('quickly_csrf'); removed.push('session:quickly_csrf'); }
  } catch { /* A restricted tab store must not hide the local-data migration notice. */ } }
  if (removed.length) { target.setItem(legacyNoticeKey, '1'); if (typeof window !== 'undefined') window.dispatchEvent(new Event('quickly:legacy-retired')); }
 } catch { /* Storage restrictions must not prevent a server session. */ }
 return removed;
}
