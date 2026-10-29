import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { operationsApi } from '../services/api/operationsApi';
import { resetApiSession } from '../services/api/apiClient';

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { resetApiSession(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); });
const respond = (body: unknown, status = 200) => fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));

it('distingue una solicitud de repartidor inexistente de un fallo del servicio', async () => {
  respond({ code: 'NOT_FOUND' }, 404);
  expect(await operationsApi.courier()).toBeNull();
  respond({ code: 'DATABASE_UNAVAILABLE' }, 503);
  await expect(operationsApi.courier()).rejects.toMatchObject({ status: 503 });
});

it('rechaza una dirección cuyo contrato pierde el estado de cobertura', async () => {
  respond([{ id: 'd119f52c-0be3-41da-919f-e18488764432', label: 'Casa', isDefault: true }]);
  await expect(operationsApi.addresses()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});

it('propaga permisos denegados en consultas privadas sin devolver datos demo', async () => {
  respond({ code: 'FORBIDDEN', message: 'Sin acceso a la tienda' }, 403);
  await expect(operationsApi.store('d119f52c-0be3-41da-919f-e18488764432')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
});

it('preserva importes en céntimos y detecta importes de zona mal tipados', async () => {
  const zone = { id: 'd119f52c-0be3-41da-919f-e18488764432', code: 'CENTRO', name: 'Centro', description: '', baseFeeCents: 350, estimatedMinutes: 20, isActive: true };
  respond([zone]);
  expect((await operationsApi.zones())[0].baseFeeCents).toBe(350);
  respond([{ ...zone, baseFeeCents: '350' }]);
  await expect(operationsApi.zones()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
