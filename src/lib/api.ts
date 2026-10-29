let csrfToken: string | null = null;
let sessionToken: string | null = null;

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

export const getSessionToken = () => {
  if (sessionToken) return sessionToken;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const saved = window.sessionStorage.getItem('quickly_active_session');
      if (saved && /^[a-f0-9]{64}$/.test(saved)) {
        sessionToken = saved;
        return saved;
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }
  return null;
};

export const setSessionToken = (value: string | null) => {
  sessionToken = value;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (value) window.sessionStorage.setItem('quickly_active_session', value);
      else window.sessionStorage.removeItem('quickly_active_session');
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }
};
