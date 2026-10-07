import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('Auth Roles & Multi-Portal Login System', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('allows customer login and sets customer role', () => {
    const res = useAuthStore.getState().login('cliente@quickly.pe', 'cliente');
    expect(res.success).toBe(true);
    expect(useAuthStore.getState().activeRole).toBe('cliente');
    expect(useAuthStore.getState().currentUser?.name).toBe('Nilver Valdivia');
  });

  it('allows merchant login and sets merchant role and merchantId', () => {
    const res = useAuthStore.getState().login('comercio@quickly.pe', 'comercio');
    expect(res.success).toBe(true);
    expect(useAuthStore.getState().activeRole).toBe('comercio');
    expect(useAuthStore.getState().currentUser?.name).toContain('Marco Antonio');
    expect(useAuthStore.getState().currentUser?.merchantId).toBe('m_selva_gourmet');
  });

  it('allows courier login and sets courier role and courierId', () => {
    const res = useAuthStore.getState().login('repartidor@quickly.pe', 'repartidor');
    expect(res.success).toBe(true);
    expect(useAuthStore.getState().activeRole).toBe('repartidor');
    expect(useAuthStore.getState().currentUser?.name).toBe('Carlos Ramos');
    expect(useAuthStore.getState().currentUser?.courierId).toBe('c_carlos');
  });

  it('allows administrator login and sets admin role', () => {
    const res = useAuthStore.getState().login('admin@quickly.pe', 'admin');
    expect(res.success).toBe(true);
    expect(useAuthStore.getState().activeRole).toBe('admin');
    expect(useAuthStore.getState().currentUser?.role).toBe('admin');
  });

  it('correctly blocks pending approval accounts with friendly alert', () => {
    const res = useAuthStore.getState().login('panaderia.amazonia@gmail.com');
    expect(res.success).toBe(false);
    expect(res.message).toContain('pendiente de aprobación');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('correctly blocks suspended accounts with administrative alert', () => {
    const res = useAuthStore.getState().login('suspendido@quickly.pe');
    expect(res.success).toBe(false);
    expect(res.message).toContain('suspendida');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('supports 1-click demo login for all 4 roles', () => {
    // 1. Cliente Demo
    useAuthStore.getState().loginDemo('cliente');
    expect(useAuthStore.getState().activeRole).toBe('cliente');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // 2. Comercio Demo
    useAuthStore.getState().loginDemo('comercio');
    expect(useAuthStore.getState().activeRole).toBe('comercio');

    // 3. Repartidor Demo
    useAuthStore.getState().loginDemo('repartidor');
    expect(useAuthStore.getState().activeRole).toBe('repartidor');

    // 4. Admin Demo
    useAuthStore.getState().loginDemo('admin');
    expect(useAuthStore.getState().activeRole).toBe('admin');
  });

  it('creates role-hinted sessions when entering custom unseeded credentials', () => {
    const res = useAuthStore.getState().login('nuevo.repartidor@gmail.com', 'repartidor');
    expect(res.success).toBe(true);
    expect(useAuthStore.getState().activeRole).toBe('repartidor');
    expect(useAuthStore.getState().currentUser?.email).toBe('nuevo.repartidor@gmail.com');
  });
});
