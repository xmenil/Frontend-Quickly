/**
 * Quickly API Client
 * Manages connection to backend (local http://localhost:3000, tunnel HTTPS, or custom URL)
 */

const STORAGE_API_KEY = 'quickly_backend_url';
const STORAGE_TOKEN_KEY = 'quickly_session_token';
const STORAGE_CSRF_KEY = 'quickly_csrf';

export function getBackendUrl(): string {
  // 1. Explicit override from localStorage (can be set by user or dev)
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(STORAGE_API_KEY);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  // 2. Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '');
  }

  // 3. Default: http://localhost:3000
  return 'http://localhost:3000';
}

export function setBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_API_KEY);
    } else {
      localStorage.setItem(STORAGE_API_KEY, url.trim().replace(/\/+$/, ''));
    }
  }
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function setSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  }
}

export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_CSRF_KEY);
}

export function setCsrfToken(csrf: string | null): void {
  if (typeof window === 'undefined') return;
  if (csrf) {
    sessionStorage.setItem(STORAGE_CSRF_KEY, csrf);
  } else {
    sessionStorage.removeItem(STORAGE_CSRF_KEY);
  }
}

/**
 * Standard fetch wrapper that automatically routes to the backend URL,
 * injects Bearer credentials and CSRF tokens, and includes cookies.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getBackendUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getSessionToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const csrf = getCsrfToken();
  if (csrf && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrf);
  }

  return fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include',
  });
}

