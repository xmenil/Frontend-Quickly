import { migrateLegacyStorage } from '../lib/legacyStorage';
import { create } from 'zustand';
import { User, UserRole } from '../domain/types';
import { identityApi, Profile, ProfileUpdate, Session } from '../services/api/identityApi';
import { ApiError, onUnauthorized, resetApiSession, setCsrfToken, setSessionToken } from '../services/api/apiClient';
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
    const previousUser = get().currentUser;
    if (previousUser?.id === profile.id) { currentUser.avatarUrl = previousUser.avatarUrl; if (profile.memberships.some(m => m.storeId === previousUser.merchantId && m.storeStatus === 'active') || profile.roles.includes('admin')) currentUser.merchantId = previousUser.merchantId || currentUser.merchantId; }
    set({ profile, currentUser, activeRole: currentUser.role,
      roles: profile.roles.map((role) => roleMap[role]).filter(Boolean), isAuthenticated: true,
      sessionStatus: 'ready', sessionError: null, busy: false });
    return currentUser;
  }
  function acceptSession(session: Session) {
    setCsrfToken(session.csrfToken);
    if (session.token) setSessionToken(session.token);
    return acceptProfile(session.user);
  }
  async function externalSession(load: () => Promise<Session>) {
    if (get().busy) return { success: false, message: 'Hay una operación en curso.' };
    const version = ++epoch;
    resetApiSession(); set({ ...emptyIdentity, busy: true });
    try { const session = await load(); if (version !== epoch) return { success: false, message: 'La sesión cambió.' };
      const user = acceptSession(session); announce(); return { success: true, user };
    } catch (error) { return { success: false, message: message(error) }; }
    finally { if (version === epoch) set({ busy: false }); }
  }
  return {
    ...emptyIdentity,
    sessionStatus: 'checking', sessionError: null, busy: false,
    initialize: async (background = false) => {
      migrateLegacyStorage();
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
      if (get().busy) return { success: false, message: 'Espera a que termine la operación en curso.' };
      set({ busy: true });
      try {
        await identityApi.logout();
        epoch++; resetApiSession(); set({ ...emptyIdentity, sessionStatus: 'ready', sessionError: null });
        announce(); return { success: true };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          epoch++; resetApiSession(); set({ ...emptyIdentity, sessionStatus: 'ready', sessionError: null });
          return { success: true };
        }
        return { success: false, message: message(error) };
      } finally { set({ busy: false }); }
    },
    updateProfile: async (updates) => {
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
      if (get().roles.includes(role) && get().profile) {
        set({ activeRole: role, currentUser: profileToUser(get().profile!, role) });
      }
    },
    switchMerchant: (merchantId) => {
      const membership = get().profile?.memberships.find((m) => m.storeId === merchantId && m.storeStatus === 'active');
      if ((membership && get().roles.includes('comercio') || get().roles.includes('admin')) && get().currentUser) {
        set({ currentUser: { ...get().currentUser!, merchantId } });
      }
    },
    sendVerificationCode: async (email: string) => {
      try { const result = await identityApi.verification(email.trim().toLowerCase());
        return { ...result, devCode: import.meta.env.DEV ? result.devCode : undefined };
      } catch (error) { return { success: false, message: message(error) }; }
    },
    registerCustomerWithApi: async (data) => {
      if (!data.password) return { success: false, message: 'Ingresa una contraseña.' };
      return externalSession(() => identityApi.register({ fullName: data.name.trim(), email: data.email.trim().toLowerCase(),
        phone: normalizePhone(data.phone), password: data.password!, verificationCode: data.verificationCode?.trim() }));
    },
    loginGoogleWithToken: async (idToken, phone) => externalSession(() => identityApi.google(idToken, phone ? normalizePhone(phone) : undefined)),
    loginWithApi: async (
      credentialsOrEmail: { email: string; password?: string } | string,
      passwordParam?: string
    ) => {
      const email = typeof credentialsOrEmail === "string" ? credentialsOrEmail : credentialsOrEmail.email;
      const password = typeof credentialsOrEmail === "string" ? passwordParam || "" : credentialsOrEmail.password || "";
      return get().login(email, password);
    },

  };
});

migrateLegacyStorage();
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
