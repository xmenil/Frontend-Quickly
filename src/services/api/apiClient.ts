import { getCsrfToken, getSessionToken, resolveApiUrl, setCsrfToken as storeCsrfToken, setSessionToken as storeSessionToken } from '../../lib/api';
let generation = 0;
let unauthorizedHandler: (() => void) | undefined;
const pending = new Set<AbortController>();

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public requestId?: string) { super(message); }
}
export function setCsrfToken(token?: string) { storeCsrfToken(token ?? null); }
export function setSessionToken(token?: string) { storeSessionToken(token ?? null); }
export function onUnauthorized(handler: () => void) { unauthorizedHandler = handler; }
export function resetApiSession() {
  generation++;
  storeCsrfToken(null);
  storeSessionToken(null);
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
  // Public catalog data remains valid when a session is restored or closed.
  sessionIndependent?: boolean;
}
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const requestGeneration = generation;
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, options.timeoutMs ?? 15000);
  if (!options.sessionIndependent) pending.add(controller);
  try {
    const method = options.method || 'GET';
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    const csrfToken = getCsrfToken();
    if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
    const bearer = getSessionToken();
    if (bearer && !headers['Authorization']) headers['Authorization'] = `Bearer ${bearer}`;

    const response = await fetch(resolveApiUrl(path), {
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    if (!options.sessionIndependent && requestGeneration !== generation) throw new ApiError('La solicitud pertenece a una sesión anterior.', 0, 'REQUEST_SUPERSEDED');
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => null);
    if (!options.sessionIndependent && requestGeneration !== generation) throw new ApiError('La solicitud pertenece a una sesión anterior.', 0, 'REQUEST_SUPERSEDED');
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
