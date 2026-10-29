import type { CatalogProduct } from '../services/api/catalogApi';

export function purchasableSku(product: CatalogProduct) {
  return product.isActive ? product.skus.filter(sku => sku.isActive && sku.availableStock > 0).sort((a, b) => a.priceCents - b.priceCents)[0] : undefined;
}

/** A sold-out presentation may show its price, but must never be bought. */
export function preferredSku(product: CatalogProduct) {
  return purchasableSku(product) || product.skus.filter(sku => sku.isActive).sort((a, b) => a.priceCents - b.priceCents)[0];
}
