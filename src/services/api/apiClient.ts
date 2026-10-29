import { getBackendUrl, getSessionToken } from '../../lib/api';

function getBaseApiUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  const backend = getBackendUrl();
  if (backend && (typeof window === 'undefined' || !backend.includes(window.location.host))) {
    return `${backend.replace(/\/$/, '')}/api/v1`;
  }
  return '/api/v1';
}

let csrfToken: string | undefined;
let generation = 0;
let unauthorizedHandler: (() => void) | undefined;
const pending = new Set<AbortController>();

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public requestId?: string) { super(message); }
}
export function setCsrfToken(token?: string) { csrfToken = token; }
export function onUnauthorized(handler: () => void) { unauthorizedHandler = handler; }
export function resetApiSession() {
  generation++;
  csrfToken = undefined;
  for (const controller of pending) controller.abort();
  pending.clear();
}

interface RequestOptions {
  headers?: Record<string,string>;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  publicRequest?: boolean;
}
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const requestGeneration = generation;
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, options.timeoutMs ?? 15000);
  pending.add(controller);
  try {
    const method = options.method || 'GET';
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;

    const token = getSessionToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = getBaseApiUrl();
    const response = await fetch(`${baseUrl}${cleanPath}`, {
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    if (requestGeneration !== generation) throw new ApiError('La solicitud pertenece a una sesión anterior.', 0, 'REQUEST_SUPERSEDED');
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => null);
    if (requestGeneration !== generation) throw new ApiError('La solicitud pertenece a una sesión anterior.', 0, 'REQUEST_SUPERSEDED');
    if (!response.ok) {
      const message = Array.isArray(payload?.message) ? payload.message.join('. ') : payload?.message;
      const error = new ApiError(message || 'No se pudo completar la solicitud.', response.status, payload?.code || 'HTTP_ERROR', payload?.requestId);
      if (response.status === 401 && !options.publicRequest) unauthorizedHandler?.();
      throw error;
    }
    if (!payload) throw new ApiError('La respuesta del servicio no es válida.', response.status, 'INVALID_RESPONSE');
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError('La solicitud fue cancelada o tardó demasiado. Inténtalo de nuevo.', 0, 'REQUEST_ABORTED');
    throw new ApiError('No se pudo conectar con Quickly. Revisa tu conexión e inténtalo de nuevo.', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
    pending.delete(controller);
    options.signal?.removeEventListener('abort', abort);
  }
}
