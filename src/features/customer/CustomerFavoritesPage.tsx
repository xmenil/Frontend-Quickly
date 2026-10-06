import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { ProductDetailModal } from '../catalog/ProductDetailModal';
import { Product } from '../../domain/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Heart, Store, Package } from 'lucide-react';

export const CustomerFavoritesPage: React.FC = () => {
  const { merchants, products, favoriteMerchantIds, favoriteProductIds } = useDataStore();
  const [tab, setTab] = useState<'merchants' | 'products'>('merchants');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const favoriteMerchants = merchants.filter((m) => favoriteMerchantIds.includes(m.id));
  const favoriteProducts = products.filter((p) => favoriteProductIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Mis Favoritos</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Comercios y platos que marcaste con corazón para pedir rápido
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setTab('merchants')}
          className={`touch-target px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            tab === 'merchants' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Comercios ({favoriteMerchants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('products')}
          className={`touch-target px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            tab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Platos y Productos ({favoriteProducts.length})</span>
        </button>
      </div>

      {/* Merchants Tab Content */}
      {tab === 'merchants' && (
        <>
          {favoriteMerchants.length === 0 ? (
            <EmptyState
              icon={<Heart className="w-10 h-10 text-primary" />}
              title="Aún no tienes comercios favoritos"
              description="Haz clic en el corazón de cualquier negocio para guardarlo aquí y encontrarlo siempre."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {favoriteMerchants.map((merchant) => (
                <MerchantCard key={merchant.id} merchant={merchant} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Products Tab Content */}
      {tab === 'products' && (
        <>
          {favoriteProducts.length === 0 ? (
            <EmptyState
              icon={<Heart className="w-10 h-10 text-primary" />}
              title="Aún no tienes productos favoritos"
              description="Guarda tus platos preferidos de Tingo María para añadirlos con un solo clic a tu carrito."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {favoriteProducts.map((product) => {
                const merchant = merchants.find((m) => m.id === product.merchantId);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    merchant={merchant}
                    onOpenDetail={(prod) => setSelectedProduct(prod)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        merchant={merchants.find((m) => m.id === selectedProduct?.merchantId)}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
