import { User, UserRole } from '../../domain/types';
import type { Profile } from './identityApi';

export const roleMap: Record<string, UserRole> = { customer: 'cliente', merchant: 'comercio', courier: 'repartidor', admin: 'admin' };
export function profileToUser(profile: Profile, selectedRole?: UserRole): User {
  const roles = profile.roles.map((role) => roleMap[role]).filter(Boolean);
  const role = selectedRole && roles.includes(selectedRole) ? selectedRole : roles.find((r) => r !== 'cliente') || roles[0] || 'cliente';
  return {
    id: profile.id, name: profile.fullName, email: profile.email, phone: profile.phone,
    role, status: profile.status === 'active' ? 'activo' : profile.status === 'suspended' ? 'suspendido' : 'pendiente_aprobacion',
    createdAt: profile.createdAt,
    merchantId: profile.memberships.find((membership) => membership.storeStatus === 'active')?.storeId,
    courierId: profile.courierId || undefined,
  };
}
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 9 ? `+51${digits}` : `+${digits}`;
}
export function destinationForRole(role?: UserRole) {
  return role === 'admin' ? '/admin/resumen' : role === 'comercio' ? '/comercio/tienda' : role === 'repartidor' ? '/repartidor/perfil' : '/cliente/perfil';
}
export function safeReturnPath(path: unknown, fallback: string): string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
    && !path.startsWith('/login') && !path.startsWith('/registro') ? path : fallback;
}
