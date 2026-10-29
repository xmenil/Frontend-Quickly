import { vi } from 'vitest';
import { customer, order, uid } from './checkoutFixtures';
import { operationsApi, type CourierProfile } from '../services/api/operationsApi';
import { orderingApi, type Order } from '../services/api/orderingApi';
import { catalogApi } from '../services/api/catalogApi';
import { engagementApi } from '../services/api/engagementApi';
import { useAuthStore } from '../store/authStore';
export const courier: CourierProfile = { id: uid(60), userId: customer.id, fullName: 'Repartidor API', phone: customer.phone, email: customer.email, vehicleType: 'bicycle', plate: null, zoneId: uid(3), zoneName: 'Zona API', status: 'active', statusReason: null, isOnline: true, createdAt: customer.createdAt };
export const ready: Order = { ...order, status: 'ready', version: 8 };
export const accepted: Order = { ...ready, assignment: { id: uid(61), courierUserId: customer.id, status: 'accepted', version: 4, agreedFeeCents: 350 } };
export const picked: Order = { ...accepted, status: 'in_transit', assignment: { ...accepted.assignment!, status: 'picked_up', version: 5 } };
export const delivered: Order = { ...picked, status: 'delivered', paymentStatus: 'succeeded', cashReceivedCents: 5000, collectedByUserId: customer.id, destination: null, assignment: { ...picked.assignment!, status: 'delivered', version: 6 } };
export function setupCourier() {
 useAuthStore.setState({ currentUser: { ...customer, role: 'repartidor' }, roles: ['repartidor'], isAuthenticated: true, sessionStatus: 'ready' });
 vi.spyOn(operationsApi, 'courier').mockResolvedValue(courier);
 vi.spyOn(catalogApi, 'store').mockResolvedValue({ id: order.storeId, name: order.storeName, zone_id: uid(3), zone_name: 'Zona API', category_code: 'test', isOpen: true, accepting_orders: true, logoUrl: null, bannerUrl: null, address_text: 'Dirección API del comercio', phone: '+51911111111' });
 vi.spyOn(orderingApi, 'list').mockResolvedValue({ items: [], nextCursor: null });
 vi.spyOn(orderingApi, 'detail').mockResolvedValue(accepted);
 vi.spyOn(orderingApi, 'action').mockResolvedValue({});
 vi.spyOn(engagementApi, 'report').mockResolvedValue({ from: '2026-10-01T00:00:00Z', to: '2026-10-30T00:00:00Z', currency: 'PEN', definition: 'Cohorte por creación', orders: 0, delivered: 0, cancelled: 0, deliveredSalesCents: 0, cashCollectedCents: 0, courierFeesCents: 0 });
}
