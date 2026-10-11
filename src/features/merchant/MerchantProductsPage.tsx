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
  AlertTriangle,
  Eye,
  BadgeCheck,
  Building2,
  Image as ImageIcon,
} from 'lucide-react';

// Regional food photography presets for Tingo María
const REGIONAL_PRODUCT_PRESETS = [
  {
    name: 'Tacacho con Cecina',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Juane Tradicional',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Chaufa Regional',
    url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Patarashca de Doncella',
    url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bebida de Camu Camu',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Café & Cacao Artesanal',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
  },
];

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
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceSoles, setPriceSoles] = useState('22.00');
  const [stock, setStock] = useState('15');
  const [imageUrl, setImageUrl] = useState(REGIONAL_PRODUCT_PRESETS[0].url);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  const handleOpenNew = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setPriceSoles('22.00');
    setStock('15');
    setImageUrl(REGIONAL_PRODUCT_PRESETS[0].url);
    setShowCustomUrlInput(false);
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
    setShowCustomUrlInput(false);
    setHasVariants(Boolean(p.hasVariants));
    setVariantsList(p.variants || []);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = solesToCents(parseFloat(priceSoles) || 0);
    const stockNum = parseInt(stock, 10) || 0;

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
      {/* BLOQUE 1: Cabecera, Buscador y Filtros Semánticos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Catálogo de Productos</h1>
            <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Gestiona disponibilidad en cocina, stock y precios de tus especialidades en Tingo María
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleOpenNew}
          className="min-h-[44px] touch-target px-5 font-bold shadow-subtle self-start sm:self-auto flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Producto</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de plato o producto..."
            className="w-full bg-surface border border-field rounded-xl py-2.5 pl-9 pr-4 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] transition-colors"
          />
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Chips with system tokens */}
        <div className="flex gap-1.5 p-1 bg-surface-subtle border border-border rounded-xl text-xs font-bold w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all touch-target select-none ${
              filterState === 'all'
                ? 'bg-surface text-ink shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Todos ({merchantProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('active')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all touch-target select-none ${
              filterState === 'active'
                ? 'bg-surface text-selva-strong border border-selva-border shadow-sm font-extrabold'
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
                ? 'bg-surface text-warning-strong border border-warning-border shadow-sm font-extrabold'
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
                ? 'bg-surface text-destructive-strong border border-destructive-border shadow-sm font-extrabold'
                : 'text-ink-light hover:text-ink'
            }`}
          >
            Agotados
          </button>
        </div>
      </div>

      {/* BLOQUE 2: Lista Operativa de Productos con Botones Táctiles de 44px */}
      <div className="bg-surface rounded-3xl border border-border shadow-subtle overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-subtle text-ink-muted flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-ink text-base">No se encontraron productos</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Prueba cambiando los filtros de búsqueda o agrega una nueva especialidad para tus clientes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0 || !p.isAvailable;
              const isLowStock = p.isAvailable && p.stock > 0 && p.stock <= 3;

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-subtle/60 transition-colors"
                >
                  {/* Left Product Data */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-surface-subtle flex-shrink-0 border border-border">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isOutOfStock ? 'grayscale opacity-60' : 'hover:scale-105'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23FDF2F8"><rect width="100" height="100" fill="%23FDF2F8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-size="12">Plato</text></svg>';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-ink truncate">
                          {p.name}
                        </h3>

                        {/* Stock Badges with system tokens */}
                        {isOutOfStock ? (
                          <span className="text-[10px] bg-destructive-soft text-destructive-strong border border-destructive-border font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-destructive" />
                            Agotado hoy
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] bg-warning-soft text-warning-strong border border-warning-border font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-warning" />
                            ¡Últimas {p.stock} unidades!
                          </span>
                        ) : (
                          <span className="text-[10px] bg-selva-soft text-selva-strong border border-selva-border font-bold px-2.5 py-0.5 rounded-full">
                            Stock: {p.stock}
                          </span>
                        )}

                        {p.hasVariants && (
                          <span className="text-[10px] bg-primary-50 text-primary border border-primary-100 font-bold px-2 py-0.5 rounded-full">
                            Con variantes
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-ink-light line-clamp-1">{p.description}</p>

                      <div className="flex items-center gap-2.5 text-xs pt-0.5">
                        <span className="font-extrabold text-ink tabular-nums">
                          {formatCents(p.priceCents)}
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-ink-muted capitalize">{p.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Inline Availability Switch & Edit */}
                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border w-full md:w-auto justify-between md:justify-end">
                    {/* Inline Toggle Button (44px touch target) */}
                    <button
                      type="button"
                      onClick={() => toggleProductAvailability(p.id)}
                      className={`touch-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        p.isAvailable
                          ? 'bg-selva-soft text-selva-strong border-selva-border hover:bg-selva-soft/80'
                          : 'bg-destructive-soft text-destructive-strong border-destructive-border hover:bg-destructive-soft/80'
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
                      className="min-h-[44px] touch-target px-4 font-bold text-xs border-border text-ink-light hover:text-primary hover:border-primary"
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

      {/* BLOQUE 3: Modal de Creación/Edición con Presets y Previsualización en Vivo */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProductId ? 'Editar Especialidad' : 'Nueva Especialidad o Producto'}
        description="Configura los detalles y previsualiza en tiempo real cómo lo verán tus clientes en Tingo María"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1 pb-3">
            {/* Form Inputs (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <Input
                label="Nombre del Plato o Artículo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Tacacho con Cecina y Chorizo Amazónico"
              />

              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">Descripción detallada</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Ingredientes selváticos, guarnición o preparación artesanal..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-field bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-y min-h-[72px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Precio en Soles (PEN)"
                  type="number"
                  step="0.50"
                  min="0.50"
                  value={priceSoles}
                  onChange={(e) => setPriceSoles(e.target.value)}
                  required
                  inputMode="decimal"
                  helperText="Monto final al comensal"
                />
                <Input
                  label="Stock Disponible"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  inputMode="numeric"
                  helperText="0 = Agotado automático"
                />
              </div>

              {/* Regional Photo Presets Selector */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Fotografía del plato:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className="font-semibold text-primary hover:underline text-[11px] touch-target"
                  >
                    {showCustomUrlInput ? 'Ver fotos sugeridas' : 'Ingresar URL manual'}
                  </button>
                </div>

                {/* Photo Preset Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REGIONAL_PRODUCT_PRESETS.map((preset) => {
                    const isSelected = imageUrl === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        title={preset.name}
                        className={`min-h-[44px] p-2 rounded-xl border text-left transition-all flex items-center gap-2 group ${
                          isSelected
                            ? 'border-primary bg-primary-soft/60 font-bold text-primary ring-1 ring-primary shadow-xs'
                            : 'border-border bg-surface text-ink-light hover:bg-surface-subtle hover:border-ink-muted/30'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-border"
                        />
                        <span className="text-[11px] sm:text-xs truncate font-medium flex-1">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {showCustomUrlInput && (
                  <div className="pt-2 animate-fadeIn">
                    <Input
                      label="URL Personalizada de Imagen"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      required
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Real-Time Customer Card Preview (5 cols on lg) */}
            <div className="lg:col-span-5 bg-surface-subtle p-4 sm:p-5 rounded-2xl border border-border flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>Vista Previa en App del Cliente</span>
                </div>
                <p className="text-[11px] text-ink-muted mb-3">
                  Así aparecerá en el catálogo para los vecinos de Tingo María:
                </p>

                {/* Exact Simulated ProductCard Mockup */}
                <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden flex flex-col max-w-[280px] sm:max-w-xs mx-auto text-left">
                  <div className="aspect-[4/3] w-full bg-surface-subtle overflow-hidden relative border-b border-border">
                    <img
                      src={imageUrl || REGIONAL_PRODUCT_PRESETS[0].url}
                      alt={name || 'Plato demo'}
                      className="w-full h-full object-cover transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" fill="%23FDF2F8"><rect width="300" height="200" fill="%23FDF2F8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-size="14">Vista previa</text></svg>';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs">
                      Envío rápido
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2.5">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-ink line-clamp-1 leading-snug">
                        {name || 'Nombre de la especialidad'}
                      </h4>
                      <p className="text-[11px] text-ink-light line-clamp-2 mt-0.5 leading-relaxed">
                        {description || 'Descripción apetitosa de los ingredientes tingaleses...'}
                      </p>

                      <div className="flex items-center justify-between gap-1.5 mt-2.5">
                        <div className="inline-flex items-center gap-1 text-[9px] text-ink-light bg-surface border border-border px-1.5 py-0.5 rounded-full min-w-0 max-w-[58%]">
                          <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="font-extrabold text-[9.5px] text-ink truncate leading-none">
                            {currentMerchant.name.replace(/\s+Tingo María$/i, '')}
                          </span>
                          <BadgeCheck className="w-3 h-3 text-primary flex-shrink-0" />
                        </div>

                        <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-selva-strong bg-selva-soft border border-selva-border px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-selva inline-block animate-pulse" />
                          <span>Stock {stock ? `${stock} unid.` : 'disponible'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <span className="font-extrabold text-sm text-ink tabular-nums">
                        {formatCents(previewPriceCents)}
                      </span>
                      <span className="text-[10px] font-bold text-white bg-primary px-2.5 py-1.5 rounded-lg shadow-xs whitespace-nowrap flex-shrink-0">
                        + Agregar
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-ink-muted text-center pt-1">
                Actualizado dinámicamente mientras editas.
              </p>
            </div>
          </div>

          {/* Dedicated Modal Footer spanning full width */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-border flex items-center justify-end gap-3 z-10 mt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
              className="min-h-[44px] touch-target px-4 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="min-h-[44px] touch-target px-5 font-bold shadow-subtle text-xs"
            >
              {editingProductId ? 'Actualizar Producto' : 'Guardar Especialidad'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
