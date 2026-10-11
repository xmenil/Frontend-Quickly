import { Address, CartItem, CoverageZone, Merchant, Product } from '../../domain/types';
import { calculateCart } from '../../domain/pricingRules';
import { solesToCents } from '../../lib/currency';

export interface CheckoutContext {
  userId: string;
  addressId: string;
  items: CartItem[];
  addresses: Address[];
  zones: CoverageZone[];
  merchants: Merchant[];
  products: Product[];
}

export function checkoutSnapshot(context: CheckoutContext) {
  const selectedItems = context.items.filter((item) => item.selected !== false);
  const selectedAddress = context.addresses.find((address) => address.id === context.addressId && address.userId === context.userId);
  const selectedZone = context.zones.find((zone) => zone.id === selectedAddress?.zoneId);
  const calculations = calculateCart(selectedItems, context.merchants, selectedZone);
  const key = JSON.stringify({
    userId: context.userId, address: selectedAddress, zone: selectedZone,
    items: selectedItems,
    merchants: calculations.groups.map(({ merchant }) => ({ id: merchant.id, status: merchant.status, open: merchant.isOpen, minimum: merchant.minOrderCents, fee: merchant.deliveryFeeCents })),
    products: selectedItems.map((item) => {
      const product = context.products.find((entry) => entry.id === item.productId);
      return product && { id: product.id, price: product.priceCents, stock: product.stock, available: product.isAvailable, variants: product.variants };
    }),
    total: calculations.grandTotalCents,
  });
  return { selectedItems, selectedAddress, selectedZone, calculations, key };
}

export function validateCartSelection(context: Pick<CheckoutContext, 'items' | 'merchants' | 'products'>): string | null {
  const selectedItems = context.items.filter((item) => item.selected !== false);
  if (!selectedItems.length) return 'Selecciona productos en el carrito antes de continuar.';
  if (new Set(selectedItems.map((item) => item.merchantId)).size !== 1) return 'Selecciona productos de un solo comercio para esta compra.';
  const requestedQuantities = new Map<string, number>();
  for (const item of selectedItems) requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) || 0) + item.quantity);
  for (const item of selectedItems) {
    const merchant = context.merchants.find((entry) => entry.id === item.merchantId);
    if (!merchant || merchant.status !== 'activo' || !merchant.isOpen) return 'El comercio seleccionado no está disponible. Revisa tu carrito.';
    const product = context.products.find((entry) => entry.id === item.productId && entry.merchantId === item.merchantId);
    if (!product || !product.isAvailable) return 'Un producto ya no está disponible. Revisa tu carrito.';
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || (requestedQuantities.get(item.productId) || 0) > product.stock) return 'La cantidad seleccionada supera el stock disponible o no es válida. Revisa tu carrito.';
    const variant = product.variants?.find((entry) => entry.id === item.selectedVariantId);
    if (item.selectedVariantId && (!variant || !variant.isAvailable)) return 'Una variante seleccionada ya no está disponible. Revisa tu carrito.';
    if (item.unitPriceCents !== product.priceCents || (item.variantPriceDifferenceCents || 0) !== (variant?.priceDifferenceCents || 0)) return 'El precio de un producto cambió. Retíralo del carrito y vuelve a agregarlo.';
  }
  if (calculateCart(selectedItems, context.merchants).groups.some((group) => group.subtotalCents < group.merchant.minOrderCents)) return 'No alcanzas el pedido mínimo del comercio. Revisa tu carrito.';
  return null;
}

export function validateCheckoutContext(context: CheckoutContext): string | null {
  const cartError = validateCartSelection(context);
  if (cartError) return cartError;
  const snapshot = checkoutSnapshot(context);
  if (!snapshot.selectedAddress) return 'Selecciona una dirección de entrega de tu cuenta.';
  if (!snapshot.selectedZone || !snapshot.selectedZone.isAvailable) return 'Esta dirección está fuera de cobertura. Selecciona otra dirección.';
  return null;
}

export function parseCashCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = solesToCents(Number(normalized));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
