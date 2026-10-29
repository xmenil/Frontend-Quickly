import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { catalogApi, priceCents } from '../services/api/catalogApi';
import { resetApiSession } from '../services/api/apiClient';
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { resetApiSession(); fetchMock.mockReset(); vi.stubGlobal('fetch',fetchMock); });
afterEach(() => vi.unstubAllGlobals());
it('no transforma un error HTTP de catálogo en productos demo', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Servicio temporalmente indisponible', code: 'UNAVAILABLE' }),{ status: 503 }));
  await expect(catalogApi.search()).rejects.toMatchObject({ status: 503, code: 'UNAVAILABLE' });
});
it('rechaza contratos que confunden existencia física con disponibilidad por SKU', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ items: [{ id: '8e91d13f-7930-4b30-8528-fac612d4671a', name: 'Producto', stock: 10 }], nextCursor: null })));
  await expect(catalogApi.search()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('consulta filtros y cursor escapados sin modificar el importe en céntimos', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ items: [], nextCursor: null })));
  await catalogApi.search({ q: 'Café & pan', maxPriceCents: 1950, available: 'true' });
  const url = new URL(String(fetchMock.mock.calls[0][0]),'http://localhost');
  expect(url.searchParams.get('q')).toBe('Café & pan');expect(url.searchParams.get('maxPriceCents')).toBe('1950');expect(url.searchParams.get('available')).toBe('true');
});
it('conserva ajustes negativos y el motivo y propaga permisos denegados', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Sin acceso', code: 'STORE_ACCESS_DENIED' }),{ status: 403 }));
  await expect(catalogApi.adjust('sku-real',{ quantity: -2, reason: 'Merma verificada' })).rejects.toMatchObject({ status: 403 });
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ quantity: -2, reason: 'Merma verificada' });
});
it('convierte precios decimales exactamente y rechaza precisión o rangos inválidos', () => {
  expect(priceCents('19.90')).toBe(1990);expect(priceCents('0.01')).toBe(1);expect(priceCents('1000000')).toBe(100000000);
  for (const value of ['0','-1','1.001','NaN','1,50','1000000.01']) expect(() => priceCents(value)).toThrow();
});
