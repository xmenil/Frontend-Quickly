import { vi } from 'vitest';
import type { User } from '../domain/types';
import type { CartIntent } from '../store/realCartStore';
import type { Address, Zone } from '../services/api/operationsApi';
import { operationsApi } from '../services/api/operationsApi';
import { orderingApi, type Order, type Quote } from '../services/api/orderingApi';
import { billingApi } from '../services/api/billingApi';
import { useAuthStore } from '../store/authStore';
import { useRealCartStore } from '../store/realCartStore';
export const uid = (n: number) => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
export const customer: User = { id: uid(1), name: 'Ana API', email: 'ana@example.test', phone: '+51912345678', role: 'cliente', status: 'activo', createdAt: '2026-10-29T12:00:00Z' };
export const address: Address = { id: uid(2), label: 'Casa API', recipientName: customer.name, phone: customer.phone, zoneId: uid(3), zoneName: 'Zona API', zoneActive: true,
 street: 'Jr. Amazonas', streetNumber: '123', reference: 'Portón verde', isDefault: true, latitude: null, longitude: null };
export const zone: Zone = { id: uid(3), code: 'API', name: 'Zona API', description: 'Cobertura API', baseFeeCents: 350, estimatedMinutes: 20, isActive: true };
export const item: CartIntent = { skuId: uid(4), productId: uid(5), storeId: uid(6), quantity: 2, note: 'Sin bolsa', selected: true, revision: uid(7) };
export const quote: Quote = { storeId: item.storeId, storeName: 'Tienda API', items: [{ skuId: item.skuId, productName: 'Producto API', variantName: 'Grande', quantity: 2, unitPriceCents: 1000, note: item.note }],
 subtotalCents: 2000, deliveryFeeCents: 350, totalCents: 2350, cashTenderCents: 2350, cashChangeCents: 0, paymentMethods: ['cash'] };
export const order: Order = { id: uid(8), purchaseId: uid(9), checkoutGroupId: null, code: 'PED-API', storeId: item.storeId, storeName: quote.storeName, status: 'pending', version: 1,
 subtotalCents: 2000, deliveryFeeCents: 350, totalCents: 2350, paymentStatus: 'pending', cashTenderCents: 5000, cashReceivedCents: null, collectedByUserId: null,
 createdAt: customer.createdAt, acceptanceExpiresAt: null, assignment: null, items: quote.items,
 destination: { recipientName: address.recipientName, phone: address.phone, street: address.street, streetNumber: address.streetNumber, reference: address.reference },
 events: [{ status: 'pending', reason: 'Pedido registrado', occurredAt: customer.createdAt }] };
export function setupCheckout() {
 localStorage.clear(); sessionStorage.clear();
 useAuthStore.setState({ currentUser: customer, profile: null, isAuthenticated: true, activeRole: 'cliente', sessionStatus: 'ready', sessionError: null });
 useRealCartStore.setState({ items: [{ ...item }], notice: '' });
 vi.spyOn(operationsApi, 'addresses').mockResolvedValue([{ ...address }]);
 vi.spyOn(operationsApi, 'zones').mockResolvedValue([{ ...zone }]);
 vi.spyOn(billingApi, 'methods').mockResolvedValue([{ code: 'cash', label: 'Efectivo', available: true, unavailableReason: null }]);
 vi.spyOn(orderingApi, 'quote').mockImplementation(async body => ({ ...quote, cashTenderCents: body.cashTenderCents ?? quote.totalCents, cashChangeCents: (body.cashTenderCents ?? quote.totalCents) - quote.totalCents }));
 vi.spyOn(orderingApi, 'create').mockResolvedValue({ orderId: order.id, purchaseId: order.purchaseId });
 vi.spyOn(orderingApi, 'attempt').mockResolvedValue(order);
}
