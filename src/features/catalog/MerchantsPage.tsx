import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { MerchantCategory } from '../../domain/types';
import { Search, Filter, RotateCcw, Store } from 'lucide-react';

export const MerchantsPage: React.FC = () => {
  const { merchants, products } = useDataStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('categoria') as MerchantCategory | null;
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<MerchantCategory | 'all'>(
    categoryParam || 'all'
  );
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'prepTime' | 'deliveryFee'>('rating');

  // Filter and sort merchants
  const filteredMerchants = useMemo(() => {
    return merchants
      .filter((m) => m.status === 'activo')
      .filter((m) => {
        // Category filter
        if (selectedCategory !== 'all' && m.category !== selectedCategory) {
          return false;
        }
        // Only open filter
        if (onlyOpen && !m.isOpen) {
          return false;
        }
        // Search query filter (matches merchant name or products sold by this merchant!)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = m.name.toLowerCase().includes(q);
          const matchesDesc = m.description.toLowerCase().includes(q);
          const matchesCategory = m.category.toLowerCase().includes(q);

          // Check if any product belongs to this merchant matches
          const matchesProduct = products.some(
            (p) => p.merchantId === m.id && p.name.toLowerCase().includes(q)
          );

          if (!matchesName && !matchesDesc && !matchesCategory && !matchesProduct) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'prepTime') return a.prepTimeMinutes - b.prepTimeMinutes;
        if (sortBy === 'deliveryFee') return a.deliveryFeeCents - b.deliveryFeeCents;
        return 0;
      });
  }, [merchants, products, selectedCategory, onlyOpen, searchQuery, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setOnlyOpen(false);
    setSortBy('rating');
    setSearchParams({});
  };

  const categories: { id: MerchantCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Todos los Comercios' },
    { id: 'supermercados', label: 'Supermercados' },
    { id: 'electrohogar', label: 'Electrohogar' },
    { id: 'tecnologia', label: 'Tecnología' },
    { id: 'restaurantes', label: 'Restaurantes' },
    { id: 'farmacias', label: 'Farmacias' },
    { id: 'bodegas', label: 'Bodegas' },
    { id: 'ropa', label: 'Ropa y Calzado' },
    { id: 'hogar', label: 'Hogar y Variedades' },
    { id: 'emprendedores', label: 'Emprendedores' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Comercios en Tingo María</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Explora {merchants.filter((m) => m.status === 'activo').length} tiendas y negocios locales en Rupa Rupa
          </p>
        </div>

        {/* Clear Filters Button if any active */}
        {(selectedCategory !== 'all' || onlyOpen || searchQuery) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="self-start sm:self-auto touch-target text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 bg-primary-light px-3 py-1.5 rounded-full transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por negocio o nombre de plato/producto (ej: cecina, panadol, café)..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Category Chips Scrollable */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (cat.id !== 'all') setSearchParams({ categoria: cat.id });
                  else setSearchParams({});
                }}
                className={`touch-target whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-ink'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Controls: Only Open & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
          <label className="flex items-center gap-2 font-medium text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
            />
            <span>Solo comercios abiertos ahora</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="rating">Mejor Calificación</option>
              <option value="prepTime">Tiempo más rápido</option>
              <option value="deliveryFee">Menor costo de envío</option>
            </select>
          </div>
        </div>
      </div>

      {/* Merchants Grid or Empty State */}
      {filteredMerchants.length === 0 ? (
        <EmptyState
          icon={<Store className="w-8 h-8" />}
          title="No encontramos comercios con esos filtros"
          description="Intenta buscar con otros términos o restablece los filtros para ver todos los negocios disponibles."
          actionText="Limpiar todos los filtros"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredMerchants.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      )}
    </div>
  );
};
