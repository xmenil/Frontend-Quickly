import { describe, it, expect } from 'vitest';
import { formatCents, solesToCents, centsToSoles } from '../lib/currency';
import { calculateCart, validateCashPayment } from '../domain/pricingRules';
import { CartItem, Merchant, CoverageZone } from '../domain/types';

describe('Currency and Integer Cents Rules', () => {
  it('converts soles to cents and vice-versa without float inaccuracies', () => {
    expect(solesToCents(15.5)).toBe(1550);
    expect(solesToCents(28.0)).toBe(2800);
    expect(centsToSoles(1550)).toBe(15.5);
  });

  it('formats cents properly to Peruvian Soles string', () => {
    const formatted = formatCents(1550);
    expect(formatted).toContain('15');
    expect(formatted).toContain('50');
  });
});

describe('Cart Calculation Rules', () => {
  const mockMerchants: Merchant[] = [
    {
      id: 'm1',
      name: 'La Selva Gourmet',
      category: 'restaurantes',
      description: 'Comida',
      address: 'Alameda Perú',
      phone: '962111222',
      isOpen: true,
      logoUrl: '',
      bannerUrl: '',
      rating: 4.8,
      ratingCount: 10,
      prepTimeMinutes: 20,
      deliveryFeeCents: 450, // S/ 4.50
      minOrderCents: 1500,
      schedule: '10am-10pm',
      status: 'activo',
      ownerUserId: 'u1',
      zoneId: 'z1',
    },
    {
      id: 'm2',
      name: 'Farmacia Vida',
      category: 'farmacias',
      description: 'Salud',
      address: 'Jr. Ucayali',
      phone: '962333444',
      isOpen: true,
      logoUrl: '',
      bannerUrl: '',
      rating: 4.9,
      ratingCount: 20,
      prepTimeMinutes: 10,
      deliveryFeeCents: 400, // S/ 4.00
      minOrderCents: 1000,
      schedule: '8am-11pm',
      status: 'activo',
      ownerUserId: 'u2',
      zoneId: 'z1',
    },
  ];

  const mockItems: CartItem[] = [
    {
      id: 'item1',
      productId: 'p1',
      merchantId: 'm1',
      quantity: 2,
      unitPriceCents: 2800, // 2800 * 2 = 5600
    },
    {
      id: 'item2',
      productId: 'p2',
      merchantId: 'm2',
      quantity: 1,
      unitPriceCents: 1850, // 1850
    },
  ];

  it('groups items by merchant and computes independent delivery fees', () => {
    const result = calculateCart(mockItems, mockMerchants);

    expect(result.groups.length).toBe(2);

    const group1 = result.groups.find((g) => g.merchant.id === 'm1');
    expect(group1).toBeDefined();
    expect(group1?.subtotalCents).toBe(5600);
    expect(group1?.deliveryFeeCents).toBe(450);
    expect(group1?.totalCents).toBe(6050);

    const group2 = result.groups.find((g) => g.merchant.id === 'm2');
    expect(group2).toBeDefined();
    expect(group2?.subtotalCents).toBe(1850);
    expect(group2?.deliveryFeeCents).toBe(400);
    expect(group2?.totalCents).toBe(2250);

    // Grand total = (5600 + 1850) + (450 + 400) = 7450 + 850 = 8300
    expect(result.itemsSubtotalCents).toBe(7450);
    expect(result.totalDeliveryFeeCents).toBe(850);
    expect(result.grandTotalCents).toBe(8300);
  });

  it('validates cash payment correctly and calculates exact change', () => {
    const totalCents = 8300; // S/ 83.00
    const exactCashCents = 8300;
    const moreCashCents = 10000; // S/ 100.00
    const insufficientCashCents = 5000; // S/ 50.00

    expect(validateCashPayment(exactCashCents, totalCents)).toEqual({
      isValid: true,
      changeDueCents: 0,
    });

    expect(validateCashPayment(moreCashCents, totalCents)).toEqual({
      isValid: true,
      changeDueCents: 1700, // S/ 17.00
    });

    const invalidResult = validateCashPayment(insufficientCashCents, totalCents);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.changeDueCents).toBe(0);
    expect(invalidResult.errorMessage).toBeDefined();
  });
});
