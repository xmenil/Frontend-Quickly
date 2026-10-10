import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Product, ProductVariant } from '../../domain/types';
import { formatCents, solesToCents } from '../../lib/currency';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Plus,
  Edit2,
  Power,
  Search,
  Package,
  AlertCircle,
  Sparkles,
  Check,
  AlertTriangle,
  Eye,
  ShoppingCart,
  Store,
  BadgeCheck,
  Building2,
} from 'lucide-react';

export const MerchantProductsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, products, createProduct, updateProduct, toggleProductAvailability } =
    useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      merchants.find(
        (m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId
      ) || merchants[0]
    );
  }, [merchants, currentUser]);

  const merchantProducts = useMemo(
    () => products.filter((p) => p.merchantId === currentMerchant.id),
    [products, currentMerchant.id]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all');

  // Modal create/edit product state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceSoles, setPriceSoles] = useState('25.00');
  const [stock, setStock] = useState('20');
  const [imageUrl, setImageUrl] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  const handleOpenNew = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setPriceSoles('22.00');
    setStock('15');
    setImageUrl(
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
    );
    setHasVariants(false);
    setVariantsList([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProductId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPriceSoles((p.priceCents / 100).toFixed(2));
    setStock(p.stock.toString());
    setImageUrl(p.imageUrl);
    setHasVariants(Boolean(p.hasVariants));
    setVariantsList(p.variants || []);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = solesToCents(parseFloat(priceSoles) || 0);
    const stockNum = parseInt(stock) || 0;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: name.trim(),
        description: description.trim(),
        priceCents,
        stock: stockNum,
        imageUrl: imageUrl.trim(),
        hasVariants,
        variants: hasVariants ? variantsList : undefined,
      });
    } else {
      createProduct({
        merchantId: currentMerchant.id,
        name: name.trim(),
        description: description.trim(),
        category: currentMerchant.category,
        priceCents,
        stock: stockNum,
        imageUrl: imageUrl.trim(),
        isAvailable: stockNum > 0,
        hasVariants,
        variants: hasVariants ? variantsList : undefined,
      });
    }

    setIsModalOpen(false);
  };

  const filteredProducts = useMemo(() => {
    return merchantProducts.filter((p) => {
      if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterState === 'active') return p.isAvailable && p.stock > 0;
      if (filterState === 'low_stock') return p.stock > 0 && p.stock <= 3;
      if (filterState === 'out_of_stock') return !p.isAvailable || p.stock <= 0;
      return true;
    });
  }, [merchantProducts, searchQuery, filterState]);

  // Preview price calculation in cents for live mockup
  const previewPriceCents = useMemo(() => {
    return solesToCents(parseFloat(priceSoles) || 0);
  }, [priceSoles]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Catálogo de Productos</h1>
            <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Gestiona disponibilidad, stock y precios de tus platos o artículos en Tingo María
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleOpenNew}
          className="min-h-[44px] px-5 font-bold shadow-subtle self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Agregar Producto</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de plato o artículo..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-xs sm:text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary min-h-[42px]"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all touch-target select-none ${
              filterState === 'all' ? 'bg-white text-ink shadow-sm font-extrabold' : 'text-ink-light hover:text-ink'
            }`}
          >
            Todos ({merchantProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('active')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all touch-target select-none ${
              filterState === 'active'
                ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Disponibles
          </button>
          <button
            type="button"
            onClick={() => setFilterState('low_stock')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all touch-target select-none ${
              filterState === 'low_stock'
                ? 'bg-white text-amber-800 shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Últimas unidades
          </button>
          <button
            type="button"
            onClick={() => setFilterState('out_of_stock')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all touch-target select-none ${
              filterState === 'out_of_stock'
                ? 'bg-white text-rose-800 shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Agotados
          </button>
        </div>
      </div>

      {/* Products List (F-4) */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-subtle overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Package className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-bold text-ink text-base">No se encontraron productos</h3>
            <p className="text-xs text-ink-light">Prueba cambiando los filtros o agrega una nueva especialidad.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0 || !p.isAvailable;
              const isLowStock = p.isAvailable && p.stock > 0 && p.stock <= 3;

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                >
                  {/* Left Product Data */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className={`w-full h-full object-cover ${
                          isOutOfStock ? 'grayscale opacity-60' : ''
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23F3F4F6"><rect width="100" height="100" fill="%23F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="12">Plato</text></svg>';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-ink truncate">
                          {p.name}
                        </h3>

                        {/* Stock Badges (F-4) */}
                        {isOutOfStock ? (
                          <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Agotado
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            ¡Últimas {p.stock} unidades!
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                            Stock: {p.stock}
                          </span>
                        )}

                        {p.hasVariants && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2 py-0.5 rounded-full">
                            Con variantes
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-ink-light line-clamp-1">{p.description}</p>

                      <div className="flex items-center gap-3 text-xs pt-0.5">
                        <span className="font-extrabold text-ink tabular-nums">
                          {formatCents(p.priceCents)}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500 capitalize">{p.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: F-4 Inline Availability Switch & Edit */}
                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 w-full md:w-auto justify-between md:justify-end">
                    {/* Inline Toggle Button (F-4) */}
                    <button
                      type="button"
                      onClick={() => toggleProductAvailability(p.id)}
                      className={`touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        p.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Alternar disponible / agotado"
                    >
                      <Power className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{p.isAvailable ? 'Disponible' : 'Agotado'}</span>
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(p)}
                      className="min-h-[44px] px-4 font-bold text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      <span>Editar</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Form Modal with Real-Time Customer Card Preview (F-4) */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProductId ? 'Editar Especialidad' : 'Nueva Especialidad o Producto'}
        description="Configura los detalles y previsualiza cómo lo verán tus clientes en Tingo María"
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Form Inputs (7 cols on lg) */}
          <form onSubmit={handleSaveProduct} className="lg:col-span-7 space-y-4">
            <Input
              label="Nombre del Plato o Artículo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Tacacho con Cecina y Chorizo Ahumado"
            />

            <div>
              <label className="text-xs font-bold text-ink block mb-1">Descripción detallada</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                placeholder="Ingredientes amazónicos, guarnición o preparación..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Precio en Soles (PEN)"
                type="number"
                step="0.50"
                min="1"
                value={priceSoles}
                onChange={(e) => setPriceSoles(e.target.value)}
                required
                helperText="Monto final al cliente"
              />
              <Input
                label="Stock Disponible"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                helperText="0 = Agotado automático"
              />
            </div>

            <Input
              label="Enlace de Fotografía (URL)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              placeholder="https://images.unsplash.com/..."
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="min-h-[44px] px-5 font-bold shadow-subtle"
              >
                {editingProductId ? 'Actualizar Producto' : 'Guardar Especialidad'}
              </Button>
            </div>
          </form>

          {/* F-4: Live Real-Time Customer Card Preview (5 cols on lg) */}
          <div className="lg:col-span-5 bg-gray-50/80 p-4 rounded-3xl border border-gray-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>Vista Previa en App del Cliente</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">
                Así aparecerá en el catálogo para los comensales tingaleses:
              </p>

              {/* Exact Simulated ProductCard Mockup con diseño unificado */}
              <div className="bg-white rounded-2xl border border-pink-100/80 shadow-[0_2px_8px_rgba(190,24,93,0.04)] overflow-hidden flex flex-col max-w-xs mx-auto text-left">
                <div className="aspect-square w-full bg-gray-100 overflow-hidden relative border-b border-gray-100/70">
                  <img
                    src={
                      imageUrl ||
                      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
                    }
                    alt={name || 'Plato demo'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" fill="%23F3F4F6"><rect width="300" height="200" fill="%23F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="14">Vista previa</text></svg>';
                    }}
                  />
                  <span className="absolute top-2.5 left-2.5 bg-primary/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Envío rápido
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-ink line-clamp-1 leading-snug">
                      {name || 'Nombre de la especialidad'}
                    </h4>
                    <p className="text-[11px] text-ink-light line-clamp-1 mt-0.5 leading-relaxed">
                      {description || 'Descripción apetitosa de los ingredientes tingaleses...'}
                    </p>

                    {/* Row: Perfil de tienda verificada (nombre en negro) a lado de Stock disponible */}
                    <div className="flex items-center justify-between gap-1.5 mt-2">
                      <div className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 border border-gray-200/80 px-1.5 py-0.5 rounded-full min-w-0 max-w-[58%]">
                        <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                          {currentMerchant.name.replace(/\s+Tingo María$/i, '')}
                        </span>
                        <BadgeCheck className="w-3 h-3 text-sky-500 fill-sky-100 flex-shrink-0" />
                      </div>

                      <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-100/80 px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span>Stock {stock ? `${stock} unid.` : 'disponible'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-ink tabular-nums">
                      {formatCents(previewPriceCents)}
                    </span>
                    <span className="text-[10px] font-bold text-white bg-primary px-2.5 py-1 rounded-lg shadow-xs">
                      + Agregar al pedido
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              Actualizado dinámicamente según escribes.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
