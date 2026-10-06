import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '../store/dataStore';
import { Purchase, MerchantOrder } from '../domain/types';

describe('Stock Reservation and Restoration Lifecycle', () => {
  beforeEach(() => {
    // Reset data store to initial seed before each test
    useDataStore.getState().resetToSeed();
  });

  it('reserves stock when creating a purchase and restores it when suborder is cancelled', () => {
    const state = useDataStore.getState();
    const productBefore = state.products.find((p) => p.id === 'p_tacacho_cecina');
    expect(productBefore).toBeDefined();
    const initialStock = productBefore!.stock;

    const purchaseId = `test_pur_${Date.now()}`;
    const suborderId = `test_mo_${Date.now()}`;

    const testSuborder: MerchantOrder = {
      id: suborderId,
      purchaseId,
      merchantId: 'm_selva_gourmet',
      merchantName: 'La Selva Gourmet',
      merchantPhone: '962 789 101',
      merchantAddress: 'Av. Alameda Perú 450',
      status: 'pendiente',
      items: [
        {
          productId: 'p_tacacho_cecina',
          productName: 'Tacacho con Cecina',
          productImage: '',
          quantity: 2,
          unitPriceCents: 2800,
          subtotalCents: 5600,
        },
      ],
      subtotalCents: 5600,
      deliveryFeeCents: 450,
      totalCents: 6050,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [],
      paymentStatus: 'pagado',
    };

    const testPurchase: Purchase = {
      id: purchaseId,
      code: 'QK-TEST01',
      customerId: 'u_cliente_demo',
      customerName: 'Cliente Test',
      customerPhone: '962 123 456',
      addressSnapshot: state.addresses[0],
      paymentMethod: 'yape_plin',
      paymentStatus: 'pagado',
      subtotalCents: 5600,
      totalDeliveryFeeCents: 450,
      grandTotalCents: 6050,
      merchantOrders: [testSuborder],
      createdAt: new Date().toISOString(),
      status: 'pendiente',
    };

    // 1. Create Purchase -> should reserve 2 units of stock
    const createResult = state.createPurchase(testPurchase);
    expect(createResult.success).toBe(true);

    const productAfterPurchase = useDataStore
      .getState()
      .products.find((p) => p.id === 'p_tacacho_cecina');
    expect(productAfterPurchase!.stock).toBe(initialStock - 2);

    // 2. Customer cancels order -> stock should be restored by exactly 2 units once
    const cancelResult = useDataStore
      .getState()
      .cancelMerchantOrderAsCustomer(suborderId, 'Prueba de cancelación');
    expect(cancelResult.success).toBe(true);

    const productAfterCancel = useDataStore
      .getState()
      .products.find((p) => p.id === 'p_tacacho_cecina');
    expect(productAfterCancel!.stock).toBe(initialStock);

    // 3. Cancelling again or illegal state jump should fail
    const secondCancelResult = useDataStore
      .getState()
      .cancelMerchantOrderAsCustomer(suborderId, 'Intento duplicado');
    expect(secondCancelResult.success).toBe(false);

    // Stock must not be restored twice!
    const productAfterDuplicateAttempt = useDataStore
      .getState()
      .products.find((p) => p.id === 'p_tacacho_cecina');
    expect(productAfterDuplicateAttempt!.stock).toBe(initialStock);
  });
});
