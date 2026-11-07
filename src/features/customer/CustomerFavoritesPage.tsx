import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerFavorites, accountChanged } from './customerAccountModel';
import { RemoteState } from '../operations/shared';
import { engagementApi } from '../../services/api/engagementApi';
import type { StorefrontProduct } from '../catalog/storefrontModel';
import { ProductCard } from '../../components/shared/ProductCard';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { Product } from '../../domain/types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Heart, Store, Package, Search, UtensilsCrossed, ArrowRight, Sparkles } from 'lucide-react';

export const CustomerFavoritesPage: React.FC = () => {
  const resource = useCustomerFavorites();
  const merchants = resource.data?.merchants || [];
  const favoriteMerchants = resource.data?.favoriteMerchants || [];
  const favoriteProducts = resource.data?.products || [];
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);
  const removeRef = React.useRef(false);
  async function remove(kind: "product" | "store", id: string) { if (removeRef.current) return; removeRef.current = true; setRemoving(true); setError(""); try { await engagementApi.favorite(kind, id, false); accountChanged("favorites"); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo quitar el favorito."); } finally { removeRef.current = false; setRemoving(false); } }
  const [tab, setTab] = useState<'products' | 'merchants'>('products');
  const [searchTerm, setSearchTerm] = useState('');

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
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">Mis Favoritos</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              <Heart className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
              <span>{resource.records.length} guardados</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Tus productos y tiendas preferidas de Tingo María para pedir en un solo toque
          </p>
        </div>

        {/* Search input for favorites */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              tab === 'products'
                ? 'Buscar en tus favoritos...'
                : 'Buscar en tus comercios...'
            }
            className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 placeholder-gray-400 min-h-[44px]"
          />
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('products');
              setSearchTerm('');
            }}
            className={`min-h-[38px] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer select-none ${
              tab === 'products'
                ? 'bg-gray-950 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-200/60 font-bold'
            }`}
          >
            <Package className="w-4 h-4 stroke-[2.2]" />
            <span>Productos ({resource.records.filter(item => item.kind === "product").length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('merchants');
              setSearchTerm('');
            }}
            className={`min-h-[38px] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer select-none ${
              tab === 'merchants'
                ? 'bg-gray-950 text-white shadow-xs font-black'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-200/60 font-bold'
            }`}
          >
            <Store className="w-4 h-4 stroke-[2.2]" />
            <span>Comercios ({resource.records.filter(item => item.kind === "store").length})</span>
          </button>
        </div>

        <Link
          to="/negocios"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:text-primary transition-colors"
        >
          <span>Descubrir más en Tingo María</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
        </Link>
      </div>

      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {resource.data?.unavailable.filter(item => item.kind === (tab === "products" ? "product" : "store")).map(item => <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3"><div><p className="font-bold text-gray-900">{item.name}</p><span className="text-xs text-gray-500">No disponible en el catálogo actual</span></div><button type="button" disabled={removing} onClick={() => void remove(item.kind, item.id)} className="min-h-11 text-sm font-bold text-primary">Quitar favorito</button></div>)}
      {/* Products Tab Content */}
      {!resource.loading && !resource.error && tab === 'products' && (
        <section aria-label="Platos y productos favoritos">
          {favoriteProducts.length === 0 ? (
            <div className="bg-[#eaeff2] p-8 sm:p-12 rounded-3xl border-0 text-center space-y-4 max-w-xl mx-auto my-6 select-none">
              <div className="w-14 h-14 rounded-2xl bg-gray-950 text-white flex items-center justify-center mx-auto shadow-xs">
                <Heart className="w-7 h-7 text-white stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                  {resource.records.some(item => item.kind === "product") ? "No hay productos favoritos disponibles" : "Aún no tienes productos favoritos"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed max-w-md mx-auto">
                  Guarda zapatillas, tecnología, ropa o platos tradicionales tocando el corazón de cualquier producto para encontrarlo de inmediato.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full bg-gray-950 hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  <UtensilsCrossed className="w-4 h-4 mr-2 stroke-[2.2]" />
                  Explorar catálogo de Tingo María
                </Link>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#eaeff2] p-8 sm:p-10 rounded-3xl border-0 text-center space-y-3 select-none">
              <p className="font-black text-base text-gray-950">
                No se encontraron productos que coincidan con "{searchTerm}"
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center justify-center min-h-[38px] px-5 py-2 rounded-full bg-gray-950 text-white font-black text-xs hover:bg-black transition-colors"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => {
                const merchant = merchants.find((m) => m.id === product.merchantId);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    merchant={merchant}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Merchants Tab Content */}
      {!resource.loading && !resource.error && tab === 'merchants' && (
        <section aria-label="Comercios favoritos">
          {favoriteMerchants.length === 0 ? (
            <div className="bg-[#eaeff2] p-8 sm:p-12 rounded-3xl border-0 text-center space-y-4 max-w-xl mx-auto my-6 select-none">
              <div className="w-14 h-14 rounded-2xl bg-gray-950 text-white flex items-center justify-center mx-auto shadow-xs">
                <Store className="w-7 h-7 text-white stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                  {resource.records.some(item => item.kind === "store") ? "No hay comercios favoritos disponibles" : "Aún no tienes comercios favoritos"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed max-w-md mx-auto">
                  Guarda tus tiendas oficiales, boticas y negocios locales preferidos de Tingo María para acceder rápidamente a su catálogo.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/negocios"
                  className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full bg-gray-950 hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  <Store className="w-4 h-4 mr-2 stroke-[2.2]" />
                  Ver todas las tiendas oficiales
                </Link>
              </div>
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="bg-[#eaeff2] p-8 sm:p-10 rounded-3xl border-0 text-center space-y-3 select-none">
              <p className="font-black text-base text-gray-950">
                No se encontraron comercios que coincidan con "{searchTerm}"
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center justify-center min-h-[38px] px-5 py-2 rounded-full bg-gray-950 text-white font-black text-xs hover:bg-black transition-colors"
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
    </div>
  );
};
