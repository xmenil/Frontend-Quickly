import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Product, ProductVariant } from '../../domain/types';
import { formatCents, solesToCents } from '../../lib/currency';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Plus,
  Edit2,
  Power,
  Search,
  Package,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';

export const MerchantProductsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, products, createProduct, updateProduct, toggleProductAvailability } =
    useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  const merchantProducts = products.filter((p) => p.merchantId === currentMerchant.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'out_of_stock'>('all');

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
    setPriceSoles('20.00');
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
        name,
        description,
        priceCents,
        stock: stockNum,
        imageUrl,
        hasVariants,
        variants: hasVariants ? variantsList : undefined,
      });
    } else {
      createProduct({
        merchantId: currentMerchant.id,
        name,
        description,
        category: currentMerchant.category,
        priceCents,
        stock: stockNum,
        imageUrl,
        isAvailable: stockNum > 0,
        hasVariants,
        variants: hasVariants ? variantsList : undefined,
      });
    }

    setIsModalOpen(false);
  };

  const filteredProducts = merchantProducts.filter((p) => {
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterState === 'active' && (!p.isAvailable || p.stock <= 0)) return false;
    if (filterState === 'out_of_stock' && p.stock > 0 && p.isAvailable) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Catálogo de Productos</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Administra los platos, medicamentos o artículos que ofreces en Quickly Tingo María
          </p>
        </div>

        <Button type="button" variant="primary" size="md" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Agregar Producto</span>
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar producto por nombre..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`touch-target flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              filterState === 'all' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'
            }`}
          >
            Todos ({merchantProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('active')}
            className={`touch-target flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              filterState === 'active'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-ink'
            }`}
          >
            Disponibles
          </button>
          <button
            type="button"
            onClick={() => setFilterState('out_of_stock')}
            className={`touch-target flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all ${
              filterState === 'out_of_stock'
                ? 'bg-white text-red-700 shadow-sm'
                : 'text-gray-500 hover:text-ink'
            }`}
          >
            Agotados
          </button>
        </div>
      </div>

      {/* Products Table or Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0 || !p.isAvailable;

            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className={`w-14 h-14 rounded-2xl object-cover bg-gray-100 flex-shrink-0 ${
                      isOutOfStock ? 'grayscale opacity-60' : ''
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-ink truncate">
                        {p.name}
                      </h3>
                      {p.hasVariants && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                          Variantes
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-bold text-ink">{formatCents(p.priceCents)}</span>
                      <span className="text-gray-400">•</span>
                      <span
                        className={`font-semibold ${
                          isOutOfStock ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        Stock: {p.stock} unid.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant={p.isAvailable ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => toggleProductAvailability(p.id)}
                    className="text-xs"
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    <span>{p.isAvailable ? 'Desactivar' : 'Reactivar'}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Editar</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Form Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProductId ? 'Editar Producto' : 'Nuevo Producto'}
        description="Los pedidos existentes conservan el precio de compra del momento de la orden"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nombre del Producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: Cecina con Tacacho Especial"
          />

          <div>
            <label className="text-xs font-bold text-ink block mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
              placeholder="Ingredientes, porciones o detalles relevantes..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio (Soles PEN)"
              type="number"
              step="0.5"
              value={priceSoles}
              onChange={(e) => setPriceSoles(e.target.value)}
              required
            />
            <Input
              label="Stock disponible"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <Input
            label="URL de la imagen del producto"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />

          {/* Image Preview */}
          {imageUrl && (
            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingProductId ? 'Actualizar Producto' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
