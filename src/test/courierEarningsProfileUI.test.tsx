import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CourierEarningsPage } from '../features/courier/CourierEarningsPage';
import { CourierProfilePage } from '../features/courier/CourierProfilePage';
import { engagementApi } from '../services/api/engagementApi';
import { operationsApi } from '../services/api/operationsApi';
import { useAuthStore } from '../store/authStore';
import { setupCourier, courier } from './courierApiFixtures';
const original = useAuthStore.getState();
beforeEach(setupCourier);
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.setState(original); });
it('ingresos usa el agregado del servidor aunque el historial esté vacío', async () => {
 const report = await engagementApi.report('/courier/earnings', {});
 vi.mocked(engagementApi.report).mockResolvedValue({ ...report, delivered: 4, courierFeesCents: 9800, cashCollectedCents: 50000 });
 render(<CourierEarningsPage />);
 expect(await screen.findByText('Tarifas acumuladas')).toBeInTheDocument();
 expect(screen.getByText('Tarifas acumuladas').parentElement).toHaveTextContent('98.00');
 fireEvent.change(screen.getByLabelText('Período'), { target: { value: 'historico' } });
 await waitFor(() => { const args = vi.mocked(engagementApi.report).mock.calls.at(-1)!; expect(args[0]).toBe('/courier/earnings'); expect(Date.parse(args[1].to!) - Date.parse(args[1].from!)).toBe(366 * 86400000); });
});
it('perfil muestra aprobación, zona, vehículo y disponibilidad reales', async () => {
 vi.mocked(operationsApi.courier).mockResolvedValue({ ...courier, status: 'suspended', statusReason: 'Revisión administrativa', zoneName: null, isOnline: true });
 render(<CourierProfilePage />);
 expect(await screen.findByText('Suspendido')).toBeInTheDocument();
 expect(screen.getByText('Disponible')).toBeInTheDocument(); expect(screen.getByText('Bicicleta')).toBeInTheDocument();
 expect(screen.getByText('Sin zona registrada')).toBeInTheDocument(); expect(screen.getByText('Revisión administrativa')).toBeInTheDocument();
});
it('un fallo de ingresos muestra el error y no ceros simulados', async () => {
 vi.mocked(engagementApi.report).mockRejectedValue(new Error('Servicio no disponible'));
 render(<CourierEarningsPage />);
 expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');
 expect(screen.queryByText('Tarifas acumuladas')).not.toBeInTheDocument();
});
