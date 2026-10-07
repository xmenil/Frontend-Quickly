import { create } from 'zustand';
import { User, UserRole } from '../domain/types';
import { INITIAL_USERS } from '../mocks/initialData';
import { safeJsonParse } from '../lib/utils';

interface AuthState {
  currentUser: User | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  loginDemo: (role: UserRole) => void;
  login: (identifier: string, roleHint?: UserRole) => { success: boolean; message?: string; user?: User };
  loginGoogle: () => { success: boolean; user: User };
  registerCustomer: (data: { name: string; email: string; phone: string }) => { success: boolean; user: User };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<User>) => void;
}

const STORAGE_KEY = 'quickly_auth_v1';

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
