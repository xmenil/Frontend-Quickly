import { create } from 'zustand';
import { User, UserRole } from '../domain/types';
import { INITIAL_USERS } from '../mocks/initialData';
import { safeJsonParse } from '../lib/utils';

interface AuthState {
  currentUser: User | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  loginDemo: (role: UserRole) => void;
  login: (email: string) => { success: boolean; message?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<User>) => void;
}

const STORAGE_KEY = 'quickly_auth_v1';

function getStoredUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeJsonParse<User | null>(raw, INITIAL_USERS[0]); // Default to demo customer
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getStoredUser(),
  activeRole: getStoredUser()?.role || 'cliente',
  isAuthenticated: true,

  loginDemo: (role: UserRole) => {
    const user = INITIAL_USERS.find(u => u.role === role && u.status === 'activo') || INITIAL_USERS[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({
      currentUser: user,
      activeRole: user.role,
      isAuthenticated: true,
    });
  },

  login: (email: string) => {
    const user = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'Usuario no encontrado. Prueba con los accesos demo rápidos.' };
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
    return { success: true };
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
