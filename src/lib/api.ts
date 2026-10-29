let csrfToken: string | null = null;
/** JSON and media share the same configured API; local prototype overrides are ignored. */
export function getApiBaseUrl(): string {
 const base = import.meta.env.VITE_API_BASE_URL?.trim();
 if (base) return base.replace(/\/+$/, '');
 const server = import.meta.env.VITE_API_URL?.trim();
 return server ? server.replace(/\/+$/, '') + '/api/v1' : '/api/v1';
}
export function resolveApiUrl(path: string): string {
 const resource = path.replace(/^\/?api\/v1(?=\/|$)/, '').replace(/^\/+/, '');
 return getApiBaseUrl() + '/' + resource;
}
export const getCsrfToken = () => csrfToken;
export const setCsrfToken = (value: string | null) => { csrfToken = value; };
