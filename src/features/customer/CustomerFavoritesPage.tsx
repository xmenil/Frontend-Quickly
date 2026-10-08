import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { ProductDetailModal } from '../catalog/ProductDetailModal';
import { Product } from '../../domain/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Heart, Store, Package, Search, UtensilsCrossed, ArrowRight, Sparkles } from 'lucide-react';

export const CustomerFavoritesPage: React.FC = () => {
  const { merchants, products, favoriteMerchantIds, favoriteProductIds } = useDataStore();
  const [tab, setTab] = useState<'products' | 'merchants'>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const favoriteMerchants = useMemo(
    () => merchants.filter((m) => favoriteMerchantIds.includes(m.id)),
    [merchants, favoriteMerchantIds]
  );

  const favoriteProducts = useMemo(
    () => products.filter((p) => favoriteProductIds.includes(p.id)),
    [products, favoriteProductIds]
  );

  // Search filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return favoriteProducts;
    const term = searchTerm.toLowerCase();
    return favoriteProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [favoriteProducts, searchTerm]);

  // Search filtered merchants
  const filteredMerchants = useMemo(() => {
    if (!searchTerm.trim()) return favoriteMerchants;
    const term = searchTerm.toLowerCase();
    return favoriteMerchants.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term)
    );
  }, [favoriteMerchants, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Header with Title and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Mis Favoritos</h1>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
              <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
              <span>{favoriteProducts.length + favoriteMerchants.length} guardados</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Tus platos típicos y negocios tingaleses preferidos listos para pedir en un solo toque
          </p>
        </div>

        {/* Search input for favorites */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              tab === 'products'
                ? 'Buscar en tus platos...'
                : 'Buscar en tus comercios...'
            }
            className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 shadow-subtle min-h-[44px]"
          />
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('products');
              setSearchTerm('');
            }}
            className={`min-h-[40px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all touch-target select-none ${
              tab === 'products'
                ? 'bg-white text-primary shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Platos y Productos ({favoriteProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('merchants');
              setSearchTerm('');
            }}
            className={`min-h-[40px] px-4 py-2 rounded-xl flex items-center gap-2 transition-all touch-target select-none ${
              tab === 'merchants'
                ? 'bg-white text-primary shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Comercios ({favoriteMerchants.length})</span>
          </button>
        </div>

        <Link
          to="/negocios"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <span>Descubrir más en Tingo María</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Products Tab Content */}
      {tab === 'products' && (
        <section aria-label="Platos y productos favoritos">
          {favoriteProducts.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 text-center space-y-4 max-w-xl mx-auto my-6 shadow-subtle">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 text-primary flex items-center justify-center mx-auto shadow-sm">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-ink">
                  Aún no tienes productos favoritos
                </h2>
                <p className="text-xs sm:text-sm text-ink-light leading-relaxed max-w-md mx-auto">
                  ¿Se te antoja un tacacho con cecina, juane tradicional o café de Leoncio Prado?
                  Toca el corazón en cualquier producto para pedirlo más rápido la próxima vez.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-subtle hover:bg-primary-hover transition-colors"
                >
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Explorar catálogo de Tingo María
                </Link>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-2">
              <p className="font-bold text-sm text-ink">
                No se encontraron platos que coincidan con "{searchTerm}"
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {filteredProducts.map((product) => {
                const merchant = merchants.find((m) => m.id === product.merchantId);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    merchant={merchant}
                    showFullButton={true}
                    onOpenDetail={(prod) => setSelectedProduct(prod)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Merchants Tab Content */}
      {tab === 'merchants' && (
        <section aria-label="Comercios favoritos">
          {favoriteMerchants.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 text-center space-y-4 max-w-xl mx-auto my-6 shadow-subtle">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                <Store className="w-8 h-8 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-ink">
                  Aún no tienes comercios favoritos
                </h2>
                <p className="text-xs sm:text-sm text-ink-light leading-relaxed max-w-md mx-auto">
                  Guarda tus restaurantes, boticas y bodegas preferidas de Tingo María para revisar
                  sus horarios y cartas directamente.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/negocios"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-subtle hover:bg-primary-hover transition-colors"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Ver todos los comercios
                </Link>
              </div>
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-2">
              <p className="font-bold text-sm text-ink">
                No se encontraron comercios que coincidan con "{searchTerm}"
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredMerchants.map((merchant) => (
                <MerchantCard key={merchant.id} merchant={merchant} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Product Detail Modal for variants or customized notes */}
      <ProductDetailModal
        product={selectedProduct}
        merchant={merchants.find((m) => m.id === selectedProduct?.merchantId)}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
