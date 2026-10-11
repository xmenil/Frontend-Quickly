import { Address, User } from '../domain/types';
import { INITIAL_ADDRESSES } from './initialData';

export function addExampleAddresses(addresses: Address[], user: Pick<User, 'id' | 'name' | 'phone'>): Address[] {
  const existing = addresses.filter((address) => address.userId === user.id);
  const hasDefault = existing.some((address) => address.isDefault);
  const examples = INITIAL_ADDRESSES.map((address) => ({
    ...address,
    id: user.id === address.userId ? address.id : `${address.id}_${user.id}`,
    userId: user.id,
    recipientName: user.name,
    phone: user.phone,
    isDefault: address.isDefault && !hasDefault,
  })).filter((example) => !existing.some((address) => address.id === example.id ||
    address.zoneId === example.zoneId && address.street.trim().toLowerCase() === example.street.trim().toLowerCase() &&
    address.number.trim().toLowerCase() === example.number.trim().toLowerCase()));
  return [...addresses, ...examples];
}
