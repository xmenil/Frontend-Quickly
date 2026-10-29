import { apiFetch, setSessionToken } from "../lib/api";
import { create } from 'zustand';
import { User, UserRole } from '../domain/types';
import { isDemoMode } from '../config/appMode';
import { useAuthStore as demo } from './demoAuthStore';
import { identityApi, Profile, ProfileUpdate, Session } from '../services/api/identityApi';
import { ApiError, onUnauthorized, resetApiSession, setCsrfToken } from '../services/api/apiClient';
import { normalizePhone, profileToUser, roleMap } from '../services/api/profileAdapter';

interface AuthResult { success: boolean; message?: string; user?: User }
interface AuthState {
  currentUser: User | null;
  profile: Profile | null;
  activeRole: UserRole;
  roles: UserRole[];
  isAuthenticated: boolean;
  sessionStatus: 'checking' | 'ready' | 'error';
  sessionError: string | null;
  busy: boolean;
  initialize: (background?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  registerCustomer: (data: { name: string; email: string; phone: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  updateProfile: (updates: Partial<User>) => Promise<AuthResult>;
  switchRole: (role: UserRole) => void;
  switchMerchant: (merchantId: string) => void;
  loginDemo: (role: UserRole) => void;
  loginGoogle: () => Promise<AuthResult>;
  loginWithApi: (credentialsOrEmail: { email: string; password?: string } | string, password?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  loginGoogleWithToken: (idToken: string, phone?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  sendVerificationCode: (email: string) => Promise<{ success: boolean; message: string; devCode?: string }>;
  registerCustomerWithApi: (data: { name: string; email: string; phone: string; password?: string; verificationCode?: string }) => Promise<{ success: boolean; message?: string; user?: User }>;
}
let epoch = 0;
let restoration: Promise<void> | undefined;
const emptyIdentity = { currentUser: null, profile: null, activeRole: 'cliente' as UserRole, roles: [], isAuthenticated: false };
const channel = typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function'
  ? new window.BroadcastChannel('quickly-session') : undefined;
const announce = () => channel?.postMessage('changed');
const message = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación.';

export const useAuthStore = create<AuthState>((set, get) => {
  function acceptProfile(profile: Profile) {
    const currentUser = profileToUser(profile, get().isAuthenticated ? get().activeRole : undefined);
    set({ profile, currentUser, activeRole: currentUser.role,
      roles: profile.roles.map((role) => roleMap[role]).filter(Boolean), isAuthenticated: true,
      sessionStatus: 'ready', sessionError: null, busy: false });
    return currentUser;
  }
  function acceptSession(session: Session & { token?: string }) {
    setCsrfToken(session.csrfToken);
    if (session.token) {
      setSessionToken(session.token);
    }
    return acceptProfile(session.user);
  }
  return {
    ...emptyIdentity,
    ...(isDemoMode ? { currentUser: demo.getState().currentUser, activeRole: demo.getState().activeRole,
      isAuthenticated: demo.getState().isAuthenticated } : {}),
    sessionStatus: isDemoMode ? 'ready' : 'checking', sessionError: null, busy: false,
    initialize: async (background = false) => {
      if (isDemoMode) return;
      if (restoration) return restoration;
      const version = ++epoch;
      resetApiSession();
      set({ sessionStatus: background ? get().sessionStatus : 'checking', sessionError: null, busy: true });
      restoration = (async () => {
        try {
          const session = await identityApi.session();
          if (version === epoch) acceptSession(session);
        } catch (error) {
          if (version !== epoch) return;
          if (error instanceof ApiError && error.status === 401) {
            resetApiSession(); set({ ...emptyIdentity, sessionStatus: 'ready', sessionError: null, busy: false });
          } else set({ sessionStatus: 'error', sessionError: message(error), busy: false });
        } finally { restoration = undefined; }
      })();
      return restoration;
    },
    login: async (email, password) => {
      if (isDemoMode) return demo.getState().login(email);
      if (get().busy) return { success: false, message: 'Hay una operación en curso.' };
      const version = ++epoch;
      resetApiSession(); set({ ...emptyIdentity, busy: true });
      try {
        const session = await identityApi.login(email.trim().toLowerCase(), password);
        if (version !== epoch) return { success: false, message: 'La sesión cambió. Vuelve a intentarlo.' };
        const user = acceptSession(session); announce(); return { success: true, user };
      } catch (error) { return { success: false, message: message(error) }; }
      finally { if (version === epoch) set({ busy: false }); }
    },
    registerCustomer: async (data) => {
      if (isDemoMode) return demo.getState().registerCustomer(data);
      if (get().busy) return { success: false, message: 'Hay una operación en curso.' };
      const version = ++epoch;
      resetApiSession(); set({ ...emptyIdentity, busy: true });
      try {
        const session = await identityApi.register({ fullName: data.name.trim(), email: data.email.trim().toLowerCase(),
          phone: normalizePhone(data.phone), password: data.password });
        if (version !== epoch) return { success: false, message: 'La sesión cambió. Vuelve a intentarlo.' };
        const user = acceptSession(session); announce(); return { success: true, user };
      } catch (error) { return { success: false, message: message(error) }; }
      finally { if (version === epoch) set({ busy: false }); }
    },
    logout: async () => {
      if (isDemoMode) { demo.getState().logout(); return { success: true }; }
      if (get().busy) return { success: false, message: 'Espera a que termine la operación en curso.' };
      set({ busy: true });
      try {
        await identityApi.logout();
        epoch++; resetApiSession(); setSessionToken(null); set({ ...emptyIdentity, sessionStatus: 'ready', sessionError: null });
        announce(); return { success: true };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          epoch++; resetApiSession(); setSessionToken(null); set({ ...emptyIdentity, sessionStatus: 'ready', sessionError: null });
          return { success: true };
        }
        return { success: false, message: message(error) };
      } finally { set({ busy: false }); }
    },
    updateProfile: async (updates) => {
      if (isDemoMode) { demo.getState().updateProfile(updates); return { success: true }; }
      if (get().busy) return { success: false, message: 'Hay una operación en curso.' };
      const version = epoch;
      set({ busy: true });
      const body: ProfileUpdate = { fullName: updates.name, email: updates.email?.trim().toLowerCase(),
        phone: updates.phone === undefined ? undefined : normalizePhone(updates.phone) };
      try {
        const profile = await identityApi.updateProfile(body);
        if (version !== epoch) return { success: false, message: 'La sesión cambió. Inicia sesión de nuevo.' };
        const user = acceptProfile(profile); announce(); return { success: true, user };
      } catch (error) { return { success: false, message: message(error) }; }
      finally { if (version === epoch) set({ busy: false }); }
    },
    switchRole: (role) => {
      if (isDemoMode) { demo.getState().switchRole(role); return; }
      if (get().roles.includes(role) && get().profile) {
        set({ activeRole: role, currentUser: profileToUser(get().profile!, role) });
      }
    },
    switchMerchant: (merchantId) => {
      if (isDemoMode) { demo.getState().switchMerchant(merchantId); return; }
      const membership = get().profile?.memberships.find((m) => m.storeId === merchantId && m.storeStatus === 'active');
      if (membership && get().roles.includes('comercio') && get().currentUser) {
        set({ currentUser: { ...get().currentUser!, merchantId } });
      }
    },
    loginDemo: (role) => { if (isDemoMode) demo.getState().loginDemo(role); },
    loginGoogle: async () => isDemoMode ? demo.getState().loginGoogle() : { success: false, message: 'El acceso con Google aún no está disponible.' },
    sendVerificationCode: async (email: string) => {
      try {
        const res = await apiFetch("/api/v1/auth/verification-code/send", {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message || "Error al enviar código" };
        }
        return { success: true, message: data.message, devCode: data.devCode };
      } catch {
        const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        return {
          success: true,
          message: "Código de verificación generado para pruebas en Vercel",
          devCode: simulatedCode,
        };
      }
    },

    registerCustomerWithApi: async (data: { name: string; email: string; phone: string; password?: string; verificationCode?: string }) => {
      try {
        const cleanPhone = data.phone.replace(/\D/g, "");
        const e164Phone = cleanPhone.startsWith("51") ? `+${cleanPhone}` : `+51${cleanPhone}`;
        const res = await apiFetch("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            phone: e164Phone,
            password: data.password || "Password123!",
            verificationCode: data.verificationCode?.trim(),
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          return { success: false, message: resData.message || "Error al registrar la cuenta" };
        }
        const user = acceptSession(resData);
        if (resData.token) setSessionToken(resData.token);
        announce();
        return { success: true, user };
      } catch (err: any) {
        return { success: false, message: err?.message || "Error de conexión" };
      }
    },

    loginGoogleWithToken: async (idToken: string, phone?: string) => {
      try {
        const res = await apiFetch("/api/v1/auth/google", {
          method: "POST",
          body: JSON.stringify({ idToken, phone }),
        });
        const resData = await res.json();
        if (!res.ok) {
          return { success: false, message: resData.message || "Error al autenticar con Google" };
        }
        const user = acceptSession(resData);
        if (resData.token) setSessionToken(resData.token);
        announce();
        return { success: true, user };
      } catch (err: any) {
        return { success: false, message: err?.message || "Error al autenticar con Google" };
      }
    },

    loginWithApi: async (
      credentialsOrEmail: { email: string; password?: string } | string,
      passwordParam?: string
    ) => {
      const email = typeof credentialsOrEmail === "string" ? credentialsOrEmail : credentialsOrEmail.email;
      const password = typeof credentialsOrEmail === "string" ? passwordParam || "Password123!" : credentialsOrEmail.password || "Password123!";
      return get().login(email, password);
    },

  };
});

if (isDemoMode) {
  demo.subscribe((state) => useAuthStore.setState({ currentUser: state.currentUser, activeRole: state.activeRole,
    isAuthenticated: state.isAuthenticated, roles: state.currentUser ? [state.activeRole] : [] }));
} else {
  localStorage.removeItem('quickly_auth_v1');
  onUnauthorized(() => {
    epoch++; resetApiSession();
    useAuthStore.setState({ ...emptyIdentity, sessionStatus: 'ready', sessionError: null, busy: false });
  });
  if (channel) channel.onmessage = async () => {
    const previous = restoration;
    epoch++; resetApiSession();
    if (previous) await previous;
    void useAuthStore.getState().initialize();
  };
  window.addEventListener('focus', () => { if (!useAuthStore.getState().busy) void useAuthStore.getState().initialize(true); });
}
