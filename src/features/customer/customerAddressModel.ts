import type { Address, CoverageZone } from '../../domain/types';
import { operationsApi, type Address as ApiAddress, type Zone } from '../../services/api/operationsApi';
import { useAuthStore } from '../../store/authStore';
import { useRemote } from '../operations/shared';

export type CustomerAddress = Address & { zoneActive: boolean };
export const addressForView = (address: ApiAddress, userId: string): CustomerAddress => ({
  id: address.id, userId, zoneId: address.zoneId, label: address.label, recipientName: address.recipientName,
  phone: address.phone, street: address.street, number: address.streetNumber, reference: address.reference,
  isDefault: address.isDefault, zoneActive: address.zoneActive,
});
export const zoneForView = (zone: Zone): CoverageZone => ({ ...zone, isAvailable: zone.isActive });
export function useCustomerAddresses() {
  const userId = useAuthStore(state => state.currentUser?.id);
  return useRemote(`customer-addresses:${userId || ''}`, async signal => {
    if (!userId) return null;
    const [addresses, zones] = await Promise.all([operationsApi.addresses(signal), operationsApi.zones(signal)]);
    return { addresses: addresses.map(address => addressForView(address, userId)), zones: zones.map(zoneForView) };
  });
}
