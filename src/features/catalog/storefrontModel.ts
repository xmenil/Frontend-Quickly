import type { Merchant, Product } from '../../domain/types';
import type { CatalogProduct, PublicStoreDetail } from '../../services/api/catalogApi';
import { imageUrl } from '../../services/api/catalogApi';
import { catalogImage } from '../../lib/catalogImage';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';

// Presentation models for the existing views. Unknown commercial values stay unknown.
export type StorefrontMerchant = Omit<Merchant, 'category' | 'rating' | 'prepTimeMinutes' | 'deliveryFeeCents' | 'minOrderCents'> & {
  category: string;
  rating?: number | null;
  prepTimeMinutes?: number;
  deliveryFeeCents?: number;
  minOrderCents?: number;
};
export type StorefrontProduct = Omit<Product, 'category'> & {
  category: string;
  source?: CatalogProduct;
  hasPrice?: boolean;
  categoryId?: string;
  categoryName?: string;
};

export function storefrontMerchant(store: PublicStoreDetail): StorefrontMerchant {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return {
    id: store.id, name: store.name, category: store.category_code,
    description: store.description || '', address: store.address_text || store.zone_name,
    phone: store.phone || '', isOpen: store.isOpen && store.accepting_orders,
    logoUrl: store.logoUrl ? imageUrl(store.logoUrl) : '', bannerUrl: store.bannerUrl ? imageUrl(store.bannerUrl) : '',
    rating: store.rating_average, ratingCount: store.rating_count ?? 0,
    prepTimeMinutes: store.preparation_minutes, deliveryFeeCents: store.base_fee_cents,
    minOrderCents: store.minimum_order_cents,
    schedule: store.openingIntervals?.map(interval => `${days[interval.weekday - 1]} ${interval.opens_at.slice(0, 5)}–${interval.closes_at.slice(0, 5)}`).join(' · ') || 'Horario no disponible',
    status: 'activo', ownerUserId: '', zoneId: store.zone_id,
  };
}

export function storefrontProduct(product: CatalogProduct, store?: StorefrontMerchant, categories: { id: string; name: string }[] = []): StorefrontProduct {
  const sku = preferredSku(product);
  return {
    id: product.id, merchantId: product.storeId, name: product.name, description: product.description,
    category: store?.category || '', categoryId: product.categoryId,
    categoryName: categories.find(category => category.id === product.categoryId)?.name,
    // Zero is only an internal sorting value when no SKU exists; views show "Sin presentaciones".
    priceCents: sku?.priceCents ?? 0, hasPrice: !!sku, stock: sku?.availableStock ?? 0,
    isAvailable: !!purchasableSku(product), imageUrl: catalogImage(product.images[0]?.url),
    images: product.images.map(image => imageUrl(image.url)), brand: product.brand || undefined,
    hasVariants: product.skus.length > 1, sku: sku?.skuCode, barcode: sku?.barcode || undefined,
    variants: product.skus.map(row => ({ id: row.id, name: row.variantName,
      priceDifferenceCents: row.priceCents - (sku?.priceCents ?? row.priceCents), isAvailable: row.isActive && row.availableStock > 0 })),
    source: product,
  };
}
