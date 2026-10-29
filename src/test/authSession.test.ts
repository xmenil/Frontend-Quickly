import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../config/appMode', () => ({ isDemoMode: false }));
vi.mock('../services/api/identityApi', () => ({ identityApi: {
  session: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateProfile: vi.fn(),
} }));
import { identityApi, Profile, Session } from '../services/api/identityApi';
import { apiRequest, ApiError, resetApiSession } from '../services/api/apiClient';
import { useAuthStore } from '../store/authStore';

const profile: Profile = {
  id: '11111111-1111-4111-8111-111111111111', fullName: 'Persona de prueba', email: 'persona@example.test',
  phone: '+51912345678', roles: ['customer'], status: 'active', createdAt: '2026-10-26T12:00:00.000Z', memberships: [], courierId: null,
};
const session: Session = { user: profile, csrfToken: 'a'.repeat(64), expiresAt: '2026-10-29T12:00:00.000Z' };
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); resetApiSession();
  useAuthStore.setState({ currentUser: null, profile: null, roles: [], activeRole: 'cliente',
    isAuthenticated: false, sessionStatus: 'ready', sessionError: null, busy: false });
});
afterEach(() => vi.unstubAllGlobals());

describe('Sesión real del frontend', () => {
  it('ignora identidades locales y accesos demo; un 401 mantiene estado invitado', async () => {
    localStorage.setItem('quickly_auth_v1', JSON.stringify({ id: 'forged', role: 'admin' }));
    useAuthStore.getState().loginDemo('admin');
    useAuthStore.getState().switchRole('admin');
    vi.mocked(identityApi.session).mockRejectedValue(new ApiError('Sin sesión', 401, 'UNAUTHORIZED'));
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().sessionStatus).toBe('ready');
  });
  it('restaura identidad del servidor sin persistir credenciales o perfil', async () => {
    vi.mocked(identityApi.session).mockResolvedValue(session);
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().currentUser?.name).toBe(profile.fullName);
    expect(useAuthStore.getState().roles).toEqual(['cliente']);
    expect(localStorage.getItem('quickly_auth_v1')).toBeNull();
    expect(localStorage.length).toBe(0);
  });
  it('muestra fallo de conexión sin recurrir a mocks', async () => {
    vi.mocked(identityApi.session).mockRejectedValue(new ApiError('Sin conexión', 0, 'NETWORK_ERROR'));
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().sessionStatus).toBe('error');
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
  it('login usa contraseña y un rechazo no concede identidad', async () => {
    vi.mocked(identityApi.login).mockRejectedValue(new ApiError('Credenciales incorrectas', 401, 'INVALID_CREDENTIALS'));
    const result = await useAuthStore.getState().login('Persona@Example.test', 'incorrecta');
    expect(identityApi.login).toHaveBeenCalledWith('persona@example.test', 'incorrecta');
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().busy).toBe(false);
  });
  it('registro normaliza celular y transmite contraseña; no guarda sesión en storage', async () => {
    vi.mocked(identityApi.register).mockResolvedValue(session);
    const result = await useAuthStore.getState().registerCustomer({ name: ' Persona de prueba ', email: 'Persona@Example.test', phone: '912 345 678', password: 'Real-1234' });
    expect(identityApi.register).toHaveBeenCalledWith({ fullName: profile.fullName, email: profile.email, phone: profile.phone, password: 'Real-1234' });
    expect(result.success).toBe(true);
    expect(localStorage.length).toBe(0);
  });
  it('perfil solo cambia después de confirmar persistencia y un 403 conserva sesión', async () => {
    vi.mocked(identityApi.session).mockResolvedValue(session);
    await useAuthStore.getState().initialize();
    vi.mocked(identityApi.updateProfile).mockRejectedValue(new ApiError('Sin permiso', 403, 'FORBIDDEN'));
    const result = await useAuthStore.getState().updateProfile({ name: 'Nombre no guardado' });
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().currentUser?.name).toBe(profile.fullName);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    vi.mocked(identityApi.updateProfile).mockResolvedValue({ ...profile, fullName: 'Nombre guardado' });
    expect((await useAuthStore.getState().updateProfile({ name: 'Nombre guardado' })).success).toBe(true);
    expect(useAuthStore.getState().currentUser?.name).toBe('Nombre guardado');
  });
  it('impide cambio de rol o comercio que el servidor no autorizó', async () => {
    vi.mocked(identityApi.session).mockResolvedValue(session);
    await useAuthStore.getState().initialize();
    useAuthStore.getState().switchRole('admin');
    useAuthStore.getState().switchMerchant('otro-comercio');
    expect(useAuthStore.getState().activeRole).toBe('cliente');
    expect(useAuthStore.getState().currentUser?.merchantId).toBeUndefined();
  });
  it('logout fallido no anuncia éxito; confirmación limpia identidad privada', async () => {
    vi.mocked(identityApi.session).mockResolvedValue(session);
    await useAuthStore.getState().initialize();
    vi.mocked(identityApi.logout).mockRejectedValue(new Error('Sin conexión'));
    expect((await useAuthStore.getState().logout()).success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    vi.mocked(identityApi.logout).mockResolvedValue(undefined);
    expect((await useAuthStore.getState().logout()).success).toBe(true);
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().roles).toEqual([]);
  });
  it('una restauración tardía no recupera una sesión invalidada por 401', async () => {
    let finish!: (value: Session) => void;
    vi.mocked(identityApi.session).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const restoring = useAuthStore.getState().initialize();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'INVALID_SESSION', message: 'Sesión vencida' }), { status: 401 })));
    await expect(apiRequest('/me')).rejects.toMatchObject({ status: 401 });
    finish(session);
    await restoring;
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
