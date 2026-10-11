import { describe, expect, it } from 'vitest';
import { COURIER_ACTIVITY_PURCHASES, mergeCourierActivity } from '../mocks/courierActivityData';
import { INITIAL_COURIERS, INITIAL_PURCHASES } from '../mocks/initialData';

describe('Courier example activity', () => {
  it('populates requests, one active delivery and completed deliveries with consistent totals', () => {
    const orders = COURIER_ACTIVITY_PURCHASES.flatMap((purchase) => purchase.merchantOrders);
    expect(orders.filter((order) => order.status === 'listo_recoger' && !order.courierId)).toHaveLength(3);
    expect(orders.filter((order) => order.status === 'en_camino')).toHaveLength(1);
    expect(orders.filter((order) => order.status === 'entregado')).toHaveLength(4);
    for (const purchase of COURIER_ACTIVITY_PURCHASES) {
      expect(purchase.grandTotalCents).toBe(purchase.subtotalCents + purchase.totalDeliveryFeeCents);
      expect(purchase.merchantOrders[0].totalCents).toBe(purchase.grandTotalCents);
      const timeline = purchase.merchantOrders[0].timeline;
      expect(timeline[timeline.length - 1]?.status).toBe(purchase.merchantOrders[0].status);
      if (purchase.paymentMethod === 'efectivo') {
        expect(purchase.changeDueCents).toBe(purchase.cashAmountPaidCents! - purchase.grandTotalCents);
      }
    }
  });

  it('preserves existing purchases and does not duplicate activity after reload', () => {
    const first = mergeCourierActivity(INITIAL_PURCHASES, INITIAL_COURIERS);
    expect(first.purchases.slice(0, INITIAL_PURCHASES.length)).toEqual(INITIAL_PURCHASES);
    const active = first.purchases.flatMap((purchase) => purchase.merchantOrders).find((order) => order.status === 'en_camino')!;
    expect(first.couriers.find((courier) => courier.id === active.courierId)?.activeDeliveryId).toBe(active.id);
    const second = mergeCourierActivity(first.purchases, first.couriers);
    expect(second.purchases).toEqual(first.purchases);
    expect(second.couriers).toEqual(first.couriers);
  });

  it('keeps a user-owned active delivery instead of adding another one for that courier', () => {
    const sample = COURIER_ACTIVITY_PURCHASES.find((purchase) => purchase.merchantOrders[0].status === 'en_camino')!;
    const existing = { ...sample, id: 'user_owned_purchase' };
    const result = mergeCourierActivity([existing], INITIAL_COURIERS);
    const active = result.purchases.flatMap((purchase) => purchase.merchantOrders).filter((order) => order.status === 'en_camino');
    expect(active).toHaveLength(1);
    expect(result.purchases[0]).toBe(existing);
  });
});
