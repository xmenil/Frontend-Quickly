import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { healthApi } from '../services/api/healthApi';
import { resetApiSession } from '../services/api/apiClient';
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { resetApiSession(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());
it('liveness confirma solo el servicio, sin afirmar conexión SQL', async () => {
 fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'ok', service: 'quickly-backend' })));
 expect(await healthApi.live()).toEqual({ status: 'ok', service: 'quickly-backend' });
});
it('readiness valida versión, marca temporal y conexión declarada', async () => {
 const payload = { status: 'ok', service: 'quickly-backend', timestamp: '2026-10-29T12:00:00Z', database: 'connected', version: '1.0.0' };
 fetchMock.mockResolvedValue(new Response(JSON.stringify(payload)));
 expect(await healthApi.ready()).toEqual(payload);
});
it('readiness no acepta una respuesta parcial como DB conectada', async () => {
 fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'ok', service: 'quickly-backend' })));
 await expect(healthApi.ready()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('propaga indisponibilidad sin fallback de salud', async () => {
 fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Base de datos no disponible', code: 'DATABASE_UNAVAILABLE' }), { status: 503 }));
 await expect(healthApi.ready()).rejects.toMatchObject({ status: 503, code: 'DATABASE_UNAVAILABLE' }); expect(fetchMock).toHaveBeenCalledTimes(1);
});
