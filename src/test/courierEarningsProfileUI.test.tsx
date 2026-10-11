import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CourierEarningsPage } from '../features/courier/CourierEarningsPage';
import { CourierProfilePage } from '../features/courier/CourierProfilePage';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { formatCents } from '../lib/currency';
import { Purchase } from '../domain/types';

const originalData = useDataStore.getState();
const originalAuth = useAuthStore.getState();
const courier = originalData.couriers[0];

beforeEach(() => {
  useDataStore.setState({ purchases: [], couriers: [courier] });
  useAuthStore.setState({ currentUser: null });
});
afterEach(() => {
  cleanup();
  useDataStore.setState(originalData);
  useAuthStore.setState(originalAuth);
});

describe('Courier earnings and profile interface', () => {
  it('shows zero totals and an empty breakdown when no deliveries exist', () => {
    render(<CourierEarningsPage />);
    expect(screen.getByText('Tarifas acumuladas').parentElement).toHaveTextContent(formatCents(0).replace(/\s/g, ' '));
    expect(screen.getByText('Entregas completadas').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Promedio por entrega').parentElement).toHaveTextContent(formatCents(0).replace(/\s/g, ' '));
    expect(screen.getByText('Aún no hay tarifas de entregas completadas')).toBeInTheDocument();
    expect(screen.queryByText(formatCents(8450))).not.toBeInTheDocument();
  });

  it('includes only delivered orders assigned to this courier in the totals', () => {
    const seed = originalData.purchases[0];
    const order = seed.merchantOrders[0];
    const purchase: Purchase = {
      ...seed,
      merchantOrders: [
        { ...order, id: 'ui_delivered', courierId: courier.id, status: 'entregado', deliveryFeeCents: 1200 },
        { ...order, id: 'ui_other', courierId: 'other_courier', status: 'entregado', deliveryFeeCents: 500 },
        { ...order, id: 'ui_pending', courierId: courier.id, status: 'en_camino', deliveryFeeCents: 900 },
      ],
    };
    useDataStore.setState({ purchases: [purchase] });
    render(<CourierEarningsPage />);
    expect(screen.getByText('Tarifas acumuladas').parentElement).toHaveTextContent(formatCents(1200).replace(/\s/g, ' '));
    expect(screen.getByText('Promedio por entrega').parentElement).toHaveTextContent(formatCents(1200).replace(/\s/g, ' '));
    expect(screen.getByText('Entregas completadas').parentElement).toHaveTextContent('1');
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('distinguishes account status from availability and explains missing profile data', () => {
    useDataStore.setState({ couriers: [{ ...courier, status: 'suspendido', isAvailable: true, ratingCount: 0, plate: undefined, currentZone: '' }] });
    render(<CourierProfilePage />);
    expect(screen.getByText('Suspendido')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Sin placa registrada')).toBeInTheDocument();
    expect(screen.getByText('Sin zona registrada')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay calificaciones registradas.')).toBeInTheDocument();
  });
});
