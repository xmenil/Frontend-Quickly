import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mediaApi, mediaUrl } from '../services/api/mediaApi';
import { resetApiSession } from '../services/api/apiClient';
const fetchMock=vi.fn<typeof fetch>();
beforeEach(()=>{resetApiSession();fetchMock.mockReset();vi.stubGlobal('fetch',fetchMock);});afterEach(()=>vi.unstubAllGlobals());
it('distingue avatar ausente de un fallo y exige respuesta válida',async()=>{
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({url:null})));expect(await mediaApi.avatar()).toEqual({url:null});
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({code:'UNAVAILABLE',message:'Servicio indisponible'}),{status:503}));await expect(mediaApi.avatar()).rejects.toMatchObject({status:503});
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({objectKey:'no-url'})));await expect(mediaApi.avatar()).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('una denegación de permisos al publicar branding conserva el error del servidor',async()=>{
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({code:'FORBIDDEN',message:'Sin permisos'}),{status:403}));
  await expect(mediaApi.saveBranding('store-id','logo','image-content')).rejects.toMatchObject({status:403});
  expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/merchant/stores/store-id/branding/logo');expect(fetchMock.mock.calls[0][1]?.method).toBe('PUT');
});
it('solo resuelve URLs de imágenes servidas por la API configurada',()=>{
  const key='03af8cc1-b5b4-4a23-94cc-887826733a10.png';expect(mediaUrl(`/api/v1/me/avatar/${key}`)).toBe(`/api/v1/me/avatar/${key}`);
  expect(mediaUrl(`https://other.example/${key}`)).toBe('');expect(mediaUrl('javascript:alert(1)')).toBe('');expect(mediaUrl('/api/v1/me/avatar/../../private')).toBe('');
});
