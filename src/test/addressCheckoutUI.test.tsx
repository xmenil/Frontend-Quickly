import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CustomerAddressesPage } from '../features/customer/CustomerAddressesPage';
import { AddressForm } from '../components/shared/AddressForm';
import { operationsApi } from '../services/api/operationsApi';
import { addressForView } from '../features/customer/customerAddressModel';
import { useAuthStore } from '../store/authStore';
import { useRealCartStore } from '../store/realCartStore';
import { setupCheckout, customer, address, zone } from './checkoutFixtures';
const originalAuth = useAuthStore.getState(); const originalCart = useRealCartStore.getState();
beforeEach(setupCheckout);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(originalAuth); useRealCartStore.setState(originalCart); localStorage.clear(); sessionStorage.clear(); });
async function fill() {
 await waitFor(() => expect(screen.getByRole('button', { name: /Guardar dirección|Actualizar dirección/ })).toBeEnabled());
 fireEvent.change(screen.getByLabelText(/Nombre del destinatario/), { target: { value: ' Ana María ' } });
 fireEvent.change(screen.getByLabelText(/Celular de contacto/), { target: { value: '962 123 456' } });
 fireEvent.change(screen.getByRole('combobox', { name: /Zona de cobertura/ }), { target: { value: zone.id } });
 fireEvent.change(screen.getByLabelText(/Calle, jirón o avenida/), { target: { value: ' Jr. Amazonas ' } });
 fireEvent.change(screen.getByLabelText(/Número, manzana o lote/), { target: { value: ' 123 ' } });
 fireEvent.change(screen.getByLabelText(/Referencia para el repartidor/), { target: { value: ' Frente al parque ' } });
 fireEvent.change(screen.getByLabelText(/Nombre de la dirección/), { target: { value: ' Trabajo ' } });
}
describe('Formulario original de dirección con API', () => {
 it('solo marca la dirección principal después de confirmación del servidor', async () => {
  vi.mocked(operationsApi.addresses).mockResolvedValue([{ ...address, isDefault: false }]);
  const change = vi.spyOn(operationsApi, 'defaultAddress').mockRejectedValue(new Error('No se pudo cambiar la principal'));
  render(<MemoryRouter><CustomerAddressesPage /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Usar como principal' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cambiar la principal'));
  expect(change).toHaveBeenCalledWith(address.id); expect(screen.getByRole('button', { name: 'Usar como principal' })).toBeInTheDocument();
 });
 it('mantiene diálogo y dirección si falla el archivado, y permite reintentar', async () => {
  const archive = vi.spyOn(operationsApi, 'archiveAddress').mockRejectedValueOnce(new Error('Eliminación no confirmada')).mockResolvedValue(undefined);
  render(<MemoryRouter><CustomerAddressesPage /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar dirección Casa API' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, Eliminar' }));
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('Eliminación no confirmada'));
  vi.mocked(operationsApi.addresses).mockResolvedValue([]);
  fireEvent.click(screen.getByRole('button', { name: 'Sí, Eliminar' }));
  await screen.findByRole('heading', { name: 'No tienes direcciones guardadas' });
  expect(archive).toHaveBeenCalledTimes(2); expect(archive).toHaveBeenCalledWith(address.id); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 });
 it('mantiene campos vacíos y enfoca el primer error', async () => {
  render(<AddressForm userId={customer.id} onSuccess={vi.fn()} onCancel={vi.fn()} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar dirección' })).toBeEnabled());
  expect(screen.getByLabelText(/Celular de contacto/)).toHaveValue(''); expect(screen.getByRole('combobox')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
  await waitFor(() => expect(screen.getByLabelText(/Nombre del destinatario/)).toHaveFocus());
 });
 it('guarda E.164 y campos normalizados sin enviar identidad ni coordenadas inventadas', async () => {
  const save = vi.spyOn(operationsApi, 'saveAddress').mockResolvedValue(address); const success = vi.fn();
  render(<AddressForm userId={customer.id} onSuccess={success} onCancel={vi.fn()} />); await fill();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
  await waitFor(() => expect(success).toHaveBeenCalledOnce());
  expect(save).toHaveBeenCalledWith({ label: 'Trabajo', recipientName: 'Ana María', phone: '+51962123456', zoneId: zone.id,
   street: 'Jr. Amazonas', streetNumber: '123', reference: 'Frente al parque', isDefault: false }, undefined);
  expect(success).toHaveBeenCalledWith(addressForView(address, customer.id));
 });
 it('edita el ID real y conserva los datos ante error del servidor', async () => {
  const save = vi.spyOn(operationsApi, 'saveAddress').mockRejectedValue(new Error('Servicio no disponible')); const success = vi.fn();
  render(<AddressForm initialData={addressForView(address, customer.id)} userId={customer.id} onSuccess={success} onCancel={vi.fn()} />);
  await fill(); fireEvent.click(screen.getByRole('button', { name: 'Actualizar dirección' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Servicio no disponible'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ phone: '+51962123456' }), address.id);
  expect(screen.getByLabelText(/Calle, jirón o avenida/)).toHaveValue(' Jr. Amazonas '); expect(success).not.toHaveBeenCalled();
 });
 it('rechaza una dirección cuya zona fue desactivada', async () => {
  vi.mocked(operationsApi.zones).mockResolvedValue([{ ...zone, isActive: false }]);
  const save = vi.spyOn(operationsApi, 'saveAddress');
  render(<AddressForm initialData={addressForView(address, customer.id)} userId={customer.id} onSuccess={vi.fn()} onCancel={vi.fn()} />);
  await screen.findByText('No hay zonas disponibles para entrega por ahora.');
  expect(screen.getByRole('button', { name: 'Actualizar dirección' })).toBeDisabled(); expect(save).not.toHaveBeenCalled();
 });
 it('no informa éxito de una petición si el usuario cambia de cuenta', async () => {
  let resolve!: (result: typeof address) => void;
  vi.spyOn(operationsApi, 'saveAddress').mockImplementation(() => new Promise(done => { resolve = done; })); const success = vi.fn();
  render(<AddressForm userId={customer.id} onSuccess={success} onCancel={vi.fn()} />); await fill();
  fireEvent.click(screen.getByRole('button', { name: 'Guardar dirección' }));
  await waitFor(() => expect(operationsApi.saveAddress).toHaveBeenCalled());
  await act(async () => { useAuthStore.setState({ currentUser: null, isAuthenticated: false }); resolve(address); });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar dirección' })).not.toHaveAttribute('aria-busy', 'true')); expect(success).not.toHaveBeenCalled();
 });
});
