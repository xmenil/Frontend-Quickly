import { create } from 'zustand';
import { User, UserRole, UserStatus } from '../domain/types';
import { INITIAL_USERS } from '../mocks/initialData';
import { safeJsonParse } from '../lib/utils';

interface AuthState {
  currentUser: User | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  loginDemo: (role: UserRole) => void;
  login: (identifier: string, roleHint?: UserRole) => { success: boolean; message?: string; user?: User };
  loginWithApi: (credentialsOrEmail: { email: string; password?: string } | string, password?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  loginGoogle: () => { success: boolean; user: User };
  loginGoogleWithToken: (idToken: string, phone?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  sendVerificationCode: (email: string) => Promise<{ success: boolean; message: string; devCode?: string }>;
  registerCustomer: (data: { name: string; email: string; phone: string }) => { success: boolean; user: User };
  registerCustomerWithApi: (data: { name: string; email: string; phone: string; password?: string; verificationCode?: string }) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchMerchant: (merchantId: string) => void;
  updateProfile: (updates: Partial<User>) => void;
}

const STORAGE_KEY = 'quickly_auth_v1';

export function mapBackendUserToFrontend(dto: any): User {
  const roleMap: Record<string, UserRole> = {
    customer: 'cliente',
    merchant: 'comercio',
    courier: 'repartidor',
    admin: 'admin',
    cliente: 'cliente',
    comercio: 'comercio',
    repartidor: 'repartidor',
  };
  const statusMap: Record<string, UserStatus> = {
    active: 'activo',
    pending: 'pendiente_aprobacion',
    suspended: 'suspendido',
    activo: 'activo',
  };

  // Priorizar roles operativos con mayores privilegios sobre el rol base cliente
  let primaryRole: UserRole = 'cliente';
  if (dto.roles && Array.isArray(dto.roles)) {
    if (dto.roles.includes('admin')) {
      primaryRole = 'admin';
    } else if (dto.roles.includes('merchant') || dto.roles.includes('comercio')) {
      primaryRole = 'comercio';
    } else if (dto.roles.includes('courier') || dto.roles.includes('repartidor')) {
      primaryRole = 'repartidor';
    } else if (dto.roles.includes('customer') || dto.roles.includes('cliente')) {
      primaryRole = 'cliente';
    } else if (dto.roles[0]) {
      primaryRole = roleMap[dto.roles[0]] || 'cliente';
    }
  } else if (dto.role) {
    primaryRole = roleMap[dto.role] || 'cliente';
  }

  const status = statusMap[dto.status] || 'activo';
  const merchantId = (dto.memberships && dto.memberships.length > 0) ? dto.memberships[0].storeId : undefined;

  return {
    id: dto.id,
    name: dto.fullName || dto.name || 'Usuario Quickly',
    email: dto.email,
    phone: dto.phone || '962 123 456',
    role: primaryRole,
    status,
    avatarUrl: dto.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    merchantId,
    courierId: dto.courierId || undefined,
    createdAt: dto.createdAt || new Date().toISOString(),
  };
}

function getStoredUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null; // Guest mode when no session is stored
  return safeJsonParse<User | null>(raw, null);
}

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialUser,
  activeRole: initialUser?.role || 'cliente',
  isAuthenticated: Boolean(initialUser),

  sendVerificationCode: async (email: string) => {
    try {
      const res = await fetch('/api/v1/auth/verification-code/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Modo demo Vercel sin backend remoto
        const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        return {
          success: true,
          message: 'Código de verificación generado para pruebas en Vercel',
          devCode: simulatedCode,
        };
      }
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Error al enviar código' };
      }
      return { success: true, message: data.message, devCode: data.devCode };
    } catch {
      const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        success: true,
        message: 'Código de verificación generado para pruebas en Vercel',
        devCode: simulatedCode,
      };
    }
  },

  registerCustomerWithApi: async (data: { name: string; email: string; phone: string; password?: string; verificationCode?: string }) => {
    try {
      const cleanPhone = data.phone.replace(/\D/g, '');
      const e164Phone = cleanPhone.startsWith('51') ? `+${cleanPhone}` : `+51${cleanPhone}`;
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: e164Phone,
          password: data.password || 'Password123!',
          verificationCode: data.verificationCode?.trim(),
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.message || 'Error al registrar la cuenta' };
      }
      const frontendUser = mapBackendUserToFrontend(resData.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frontendUser));
      if (resData.csrfToken) {
        sessionStorage.setItem('quickly_csrf', resData.csrfToken);
      }
      set({
        currentUser: frontendUser,
        activeRole: frontendUser.role,
        isAuthenticated: true,
      });
      return { success: true, user: frontendUser };
    } catch {
      // Fallback to local store if backend unreachable
      return { success: true, user: get().registerCustomer(data).user };
    }
  },

  loginGoogleWithToken: async (idToken: string, phone?: string) => {
    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, phone }),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.message || 'Error al autenticar con Google' };
      }
      const frontendUser = mapBackendUserToFrontend(resData.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frontendUser));
      if (resData.csrfToken) {
        sessionStorage.setItem('quickly_csrf', resData.csrfToken);
      }
      set({
        currentUser: frontendUser,
        activeRole: frontendUser.role,
        isAuthenticated: true,
      });
      return { success: true, user: frontendUser };
    } catch {
      return get().loginGoogle();
    }
  },

  loginWithApi: async (
    credentialsOrEmail: { email: string; password?: string } | string,
    passwordParam?: string
  ) => {
    const email =
      typeof credentialsOrEmail === 'string'
        ? credentialsOrEmail
        : credentialsOrEmail.email;
    const password =
      typeof credentialsOrEmail === 'string'
        ? passwordParam || 'Password123!'
        : credentialsOrEmail.password || 'Password123!';

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.message || 'Correo o contraseña incorrectos' };
      }
      const frontendUser = mapBackendUserToFrontend(resData.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frontendUser));
      if (resData.csrfToken) {
        sessionStorage.setItem('quickly_csrf', resData.csrfToken);
      }
      set({
        currentUser: frontendUser,
        activeRole: frontendUser.role,
        isAuthenticated: true,
      });
      return { success: true, user: frontendUser };
    } catch {
      // Fallback to local demo login
      return get().login(email);
    }
  },

  loginDemo: (role: UserRole) => {
    const user = INITIAL_USERS.find(u => u.role === role && u.status === 'activo') || INITIAL_USERS[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({
      currentUser: user,
      activeRole: user.role,
      isAuthenticated: true,
    });
  },

  loginGoogle: () => {
    const googleUser: User = {
      id: 'u_google_cliente',
      name: 'Nilver Valdivia',
      email: 'nilver.valdivia@gmail.com',
      phone: '962 123 456',
      role: 'cliente',
      status: 'activo',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
    set({
      currentUser: googleUser,
      activeRole: 'cliente',
      isAuthenticated: true,
    });
    return { success: true, user: googleUser };
  },

  registerCustomer: (data: { name: string; email: string; phone: string }) => {
    const newUser: User = {
      id: `u_cust_${Date.now()}`,
      name: data.name.trim() || 'Nuevo Cliente',
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: 'cliente',
      status: 'activo',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    set({
      currentUser: newUser,
      activeRole: 'cliente',
      isAuthenticated: true,
    });
    return { success: true, user: newUser };
  },

  login: (identifier: string, roleHint?: UserRole) => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = clean.replace(/\D/g, '');

    // 1. Search for user matching identifier and matching roleHint
    let user = INITIAL_USERS.find(
      u => (u.email.toLowerCase() === clean || (cleanDigits && u.phone.replace(/\D/g, '').includes(cleanDigits))) &&
           (!roleHint || u.role === roleHint)
    );

    // 2. If not found with specific role, look for general match
    if (!user) {
      user = INITIAL_USERS.find(
        u => u.email.toLowerCase() === clean || (cleanDigits && u.phone.replace(/\D/g, '').includes(cleanDigits))
      );
    }

    // 3. Fallback: Create instant session respecting the roleHint or 'cliente'
    if (!user) {
      const assignedRole = roleHint || 'cliente';
      const fallbackUser: User = {
        id: `u_${assignedRole}_${Date.now()}`,
        name: clean.includes('@') ? clean.split('@')[0] : `Usuario ${assignedRole}`,
        email: clean.includes('@') ? clean : `${cleanDigits || 'usuario'}@quickly.pe`,
        phone: cleanDigits ? `+51 ${cleanDigits}` : '962 123 456',
        role: assignedRole,
        status: 'activo',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
      set({
        currentUser: fallbackUser,
        activeRole: assignedRole,
        isAuthenticated: true,
      });
      return { success: true, user: fallbackUser };
    }

    if (user.status === 'suspendido') {
      return { success: false, message: 'Esta cuenta está suspendida por administración.' };
    }
    if (user.status === 'pendiente_aprobacion') {
      return { success: false, message: 'Tu registro aún está pendiente de aprobación por el Administrador.' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({
      currentUser: user,
      activeRole: user.role,
      isAuthenticated: true,
    });
    return { success: true, user };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      currentUser: null,
      activeRole: 'cliente',
      isAuthenticated: false,
    });
  },

  switchRole: (role: UserRole) => {
    // Finds demo user for this role or creates virtual role context
    const user = INITIAL_USERS.find(u => u.role === role && u.status === 'activo');
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      set({
        currentUser: user,
        activeRole: role,
        isAuthenticated: true,
      });
    } else {
      set({ activeRole: role });
    }
  },

  switchMerchant: (merchantId: string) => {
    const current = get().currentUser;
    const ownerUser = INITIAL_USERS.find(
      (u) => u.merchantId === merchantId || u.id === `u_${merchantId.replace('m_', '')}`
    );
    let updated: User;
    if (ownerUser) {
      updated = {
        ...ownerUser,
        merchantId,
      };
    } else {
      updated = {
        id: current?.id || `u_merchant_${merchantId}`,
        name: current?.name || 'Administrador de Tienda',
        email: current?.email || `${merchantId}@quickly.pe`,
        phone: current?.phone || '962 123 456',
        role: 'comercio',
        status: 'activo',
        merchantId,
        createdAt: current?.createdAt || new Date().toISOString(),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({
      currentUser: updated,
      activeRole: 'comercio',
      isAuthenticated: true,
    });
  },

  updateProfile: (updates: Partial<User>) => {
    const current = get().currentUser;
    if (!current) return;
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ currentUser: updated });
  },
}));

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const user = safeJsonParse<User | null>(e.newValue, null);
      if (user) {
        useAuthStore.setState({
          currentUser: user,
          activeRole: user.role,
          isAuthenticated: true,
        });
      } else {
        useAuthStore.setState({
          currentUser: null,
          activeRole: 'cliente',
          isAuthenticated: false,
        });
      }
    }
  });
}
