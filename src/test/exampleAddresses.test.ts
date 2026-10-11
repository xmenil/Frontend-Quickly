import { afterEach, describe, expect, it } from 'vitest';
import { addExampleAddresses } from '../mocks/exampleAddresses';
import { INITIAL_ADDRESSES } from '../mocks/initialData';
import { useDataStore } from '../store/dataStore';

const original = useDataStore.getState();
const user = { id: 'u_google_cliente', name: 'Nilver Valdivia', phone: '962 123 456' };
afterEach(() => {
  useDataStore.setState(original);
  localStorage.clear();
});

describe('Preloaded example addresses', () => {
  it('loads Casa and Trabajo / UNAS for the current account with one primary address', () => {
    const result = addExampleAddresses([], user);
    expect(result.map((address) => address.label)).toEqual(['Casa', 'Trabajo / UNAS']);
    expect(result.every((address) => address.userId === user.id)).toBe(true);
    expect(result.filter((address) => address.isDefault)).toHaveLength(1);
    expect(result[0]).toMatchObject({ street: 'Av. Alameda Perú', number: '315', zoneId: 'z_centro' });
    expect(result[1]).toMatchObject({ street: 'Av. Universitaria s/n', number: 'Pabellón Central', zoneId: 'z_rupa_norte' });
    expect(addExampleAddresses(result, user)).toEqual(result);
  });

  it('preserves edited addresses and an existing primary address', () => {
    const existing = { ...INITIAL_ADDRESSES[0], street: 'Jr. Amazonas', number: '100' };
    const owner = { ...user, id: existing.userId };
    const result = addExampleAddresses([existing], owner);
    expect(result[0]).toBe(existing);
    expect(result.filter((address) => address.isDefault)).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it('loads once per account and preserves subsequent deletion', () => {
    useDataStore.setState({ addresses: [], addressExampleUserIds: [] });
    useDataStore.getState().ensureExampleAddresses(user);
    expect(useDataStore.getState().addresses).toHaveLength(2);
    const id = useDataStore.getState().addresses[0].id;
    useDataStore.getState().deleteAddress(id);
    useDataStore.getState().ensureExampleAddresses(user);
    expect(useDataStore.getState().addresses).toHaveLength(1);
    const persisted = JSON.parse(localStorage.getItem('quickly_datastore_v4')!);
    expect(persisted.addressExampleUserIds).toContain(user.id);
    expect(persisted.addresses.some((address: { id: string }) => address.id === id)).toBe(false);
  });
});
