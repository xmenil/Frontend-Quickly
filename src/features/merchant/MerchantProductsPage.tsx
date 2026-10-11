import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Product, ProductVariant, MerchantCategory } from '../../domain/types';
import { formatCents, solesToCents } from '../../lib/currency';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Plus,
  Edit2,
  Power,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Upload,
  Maximize2,
  X,
  Camera,
  Layers,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
} from 'lucide-react';

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

type FilterTab = 'all' | 'active' | 'inactive' | 'out_of_stock' | 'low_stock';

export const MerchantProductsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const {
    merchants,
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
  } = useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      (currentUser?.merchantId ? merchants.find((m) => m.id === currentUser.merchantId) : null) ||
      merchants.find((m) => m.ownerUserId === currentUser?.id) ||
      merchants[0]
    );
  }, [merchants, currentUser]);

  // Al cambiar de tienda activa, reiniciar paginación a pág 1 y limpiar filtros
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCategory('all');
    setSearchQuery('');
  }, [currentMerchant.id]);

  const merchantProducts = useMemo(
    () => products.filter((p) => p.merchantId === currentMerchant.id),
    [products, currentMerchant.id]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal create/edit product state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Modal delete product state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Lightbox / Visor de Foto Ampliada
  const [viewerPhoto, setViewerPhoto] = useState<{ url: string; title: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MerchantCategory>(currentMerchant.category);
  const [subCategory, setSubCategory] = useState('');
  const [priceSoles, setPriceSoles] = useState('22.00');
  const [stock, setStock] = useState('15');
  const [imageUrl, setImageUrl] = useState(DEFAULT_PRODUCT_IMAGE);
  // Galería de perfiles/ángulos (máximo 4 fotos del mismo producto)
  const [galleryImages, setGalleryImages] = useState<string[]>([DEFAULT_PRODUCT_IMAGE]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string>(DEFAULT_PRODUCT_IMAGE);
  const [isAvailable, setIsAvailable] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  // Feedback banner
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Refs para subir foto desde dispositivo
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const anglePhotoInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Extraer todas las categorías y subcategorías únicas presentes en los productos de la tienda
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    merchantProducts.forEach((p) => {
      if (p.subCategory) cats.add(p.subCategory);
      else if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [merchantProducts]);

  // Pre-calculate counts for each tab
  const counts = useMemo(() => {
    const baseList =
      selectedCategory === 'all'
        ? merchantProducts
        : merchantProducts.filter(
            (p) => p.category === selectedCategory || p.subCategory === selectedCategory
          );
    const total = baseList.length;
    const active = baseList.filter((p) => p.isAvailable && p.stock > 0).length;
    const inactive = baseList.filter((p) => !p.isAvailable).length;
    const outOfStock = baseList.filter((p) => p.isAvailable && p.stock <= 0).length;
    const lowStock = baseList.filter((p) => p.isAvailable && p.stock > 0 && p.stock <= 3).length;
    return { total, active, inactive, outOfStock, lowStock };
  }, [merchantProducts, selectedCategory]);

  const handleOpenNew = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setCategory(currentMerchant.category);
    setSubCategory('');
    setPriceSoles('15.00');
    setStock('20');
    setImageUrl(DEFAULT_PRODUCT_IMAGE);
    setGalleryImages([DEFAULT_PRODUCT_IMAGE]);
    setSelectedPreviewImage(DEFAULT_PRODUCT_IMAGE);
    setIsAvailable(true);
    setHasVariants(false);
    setVariantsList([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProductId(p.id);
    setName(p.name);
    setDescription(p.description);
    setCategory(p.category || currentMerchant.category);
    setSubCategory(p.subCategory || '');
    setPriceSoles((p.priceCents / 100).toFixed(2));
    setStock(p.stock.toString());
    setImageUrl(p.imageUrl);
    const existingGallery = p.images && p.images.length > 0 ? p.images.slice(0, 4) : [p.imageUrl];
    setGalleryImages(existingGallery);
    setSelectedPreviewImage(p.imageUrl);
    setIsAvailable(Boolean(p.isAvailable));
    setHasVariants(Boolean(p.hasVariants));
    setVariantsList(p.variants || []);
    setIsModalOpen(true);
  };

  // Carga de archivo desde dispositivo para foto principal
  const handleMainPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newUrl = reader.result;
        setImageUrl(newUrl);
        setSelectedPreviewImage(newUrl);
        setGalleryImages((prev) => {
          const updated = [...prev];
          updated[0] = newUrl;
          return updated;
        });
        showFeedback('Foto principal cargada correctamente.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Carga de archivo desde dispositivo para un nuevo ángulo/perfil
  const handleAnglePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (galleryImages.length >= 4) {
      showFeedback('Límite alcanzado: máximo 4 fotos por producto.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newUrl = reader.result;
        setGalleryImages((prev) => [...prev, newUrl]);
        setSelectedPreviewImage(newUrl);
        showFeedback('Nuevo ángulo/perfil agregado a la galería.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Eliminar un perfil de la galería
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    if (galleryImages.length <= 1) {
      showFeedback('El producto debe tener al menos una foto principal.');
      return;
    }
    const updated = galleryImages.filter((_, idx) => idx !== indexToRemove);
    setGalleryImages(updated);
    if (indexToRemove === 0 && updated.length > 0) {
      setImageUrl(updated[0]);
    }
    setSelectedPreviewImage(updated[0]);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = solesToCents(parseFloat(priceSoles) || 0);
    const stockNum = parseInt(stock, 10) || 0;
    const finalMainImage = galleryImages[0] || imageUrl.trim() || DEFAULT_PRODUCT_IMAGE;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: name.trim(),
        description: description.trim(),
        category: category || currentMerchant.category,
        subCategory: subCategory.trim() || undefined,
        priceCents,
        stock: stockNum,
        imageUrl: finalMainImage,
        images: galleryImages,
        isAvailable,
        hasVariants,
        variants: hasVariants ? variantsList : undefined,
      });
      showFeedback(`Producto "${name.trim()}" actualizado correctamente.`);
    } else {
      createProduct({
        merchantId: currentMerchant.id,
        name: name.trim(),
        description: description.trim(),
        category: category || currentMerchant.category,
        subCategory: subCategory.trim() || undefined,
        priceCents,
        stock: stockNum,
        imageUrl: finalMainImage,
        images: galleryImages,
        isAvailable,
        hasVariants,
        variants: hasVariants ? variantsList : undefined,
      });
      showFeedback(`Producto "${name.trim()}" creado y agregado al catálogo.`);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    showFeedback(`Producto "${deletingProduct.name}" eliminado del catálogo.`);
    setDeletingProduct(null);
  };

  const handleToggleAvailability = (productId: string, currentAvailable: boolean, productName: string) => {
    toggleProductAvailability(productId);
    showFeedback(
      currentAvailable
        ? `"${productName}" fue desactivado temporalmente.`
        : `"${productName}" está ahora activo y visible.`
    );
  };

  const filteredProducts = useMemo(() => {
    return merchantProducts.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesSubCat = (p.subCategory || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesSubCat) return false;
      }
      if (selectedCategory !== 'all') {
        const matchesCat = p.category === selectedCategory || p.subCategory === selectedCategory;
        if (!matchesCat) return false;
      }
      if (filterState === 'active') return p.isAvailable && p.stock > 0;
      if (filterState === 'inactive') return !p.isAvailable;
      if (filterState === 'out_of_stock') return p.stock <= 0;
      if (filterState === 'low_stock') return p.isAvailable && p.stock > 0 && p.stock <= 3;
      return true;
    });
  }, [merchantProducts, searchQuery, selectedCategory, filterState]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const previewPriceCents = useMemo(() => {
    return solesToCents(parseFloat(priceSoles) || 0);
  }, [priceSoles]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Inputs ocultos para subida de fotos desde dispositivo */}
      <input
        ref={mainPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleMainPhotoUpload}
      />
      <input
        ref={anglePhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAnglePhotoUpload}
      />

      {/* Cabecera Compacta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Productos</h1>
            <span className="text-[11px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs text-ink-light mt-0.5">
            Gestiona precios, inventario y fotos de tus productos en Tingo María
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenNew}
          className="min-h-[38px] px-4 font-bold shadow-subtle self-start sm:self-auto flex items-center gap-1.5 text-xs rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </Button>
      </div>

      {/* Alerta de feedback */}
      {feedbackMessage && (
        <div className="p-3 bg-selva-soft border border-selva-border rounded-xl text-xs text-selva-strong font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Barra de Búsqueda y Filtro de Categorías */}
      <div className="bg-surface p-2.5 sm:p-3 rounded-2xl border border-border shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, ingrediente o categoría..."
              className="w-full bg-surface border border-field rounded-xl py-2 pl-8 pr-8 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[38px] transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* BOTONCITO DE CATEGORÍAS */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border transition-all flex items-center justify-between sm:justify-center gap-2 text-xs font-bold cursor-pointer select-none ${
                selectedCategory !== 'all'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface hover:bg-surface-subtle text-ink border-border'
              }`}
              title="Filtrar productos por categoría"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Categorías</span>
                {selectedCategory !== 'all' && (
                  <span className="bg-white/20 text-white text-[11px] px-1.5 py-0.2 rounded-md font-extrabold max-w-[120px] truncate capitalize">
                    {selectedCategory}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Menú Desplegable de Categorías */}
            {isCategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-surface rounded-2xl border border-border shadow-2xl p-1.5 z-40 animate-fadeIn text-xs space-y-0.5">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider border-b border-border mb-1 flex items-center justify-between">
                    <span>Categorías ({availableCategories.length})</span>
                    {selectedCategory !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setIsCategoryDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className="text-primary hover:underline text-[10px] lowercase font-semibold"
                      >
                        limpiar
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsCategoryDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-primary-50 text-primary font-bold'
                        : 'hover:bg-surface-subtle text-ink'
                    }`}
                  >
                    <span>Todas las categorías</span>
                    <span className="text-[10px] text-ink-muted tabular-nums">
                      {merchantProducts.length}
                    </span>
                  </button>

                  {availableCategories.map((cat) => {
                    const count = merchantProducts.filter(
                      (p) => p.category === cat || p.subCategory === cat
                    ).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors capitalize ${
                          selectedCategory === cat
                            ? 'bg-primary-50 text-primary font-bold'
                            : 'hover:bg-surface-subtle text-ink'
                        }`}
                      >
                        <span className="truncate pr-2">{cat}</span>
                        <span className="text-[10px] text-ink-muted tabular-nums px-1.5 py-0.2 rounded-full bg-surface-subtle">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chip Informativo cuando hay filtro de Categoría activo */}
        {selectedCategory !== 'all' && (
          <div className="flex items-center gap-2 pt-0.5 text-xs">
            <span className="text-[11px] text-ink-muted">Filtrando por:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary-50 text-primary border border-primary-200 text-xs font-bold capitalize">
              <span>{selectedCategory}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                className="hover:text-primary-800 ml-0.5"
                title="Quitar filtro de categoría"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {/* Pestañas de Vista / Plantillas */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setFilterState('all');
              setCurrentPage(1);
            }}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
              filterState === 'all'
                ? 'bg-ink text-white font-bold shadow-xs'
                : 'text-ink-light hover:bg-surface-subtle hover:text-ink'
            }`}
          >
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${filterState === 'all' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-ink-muted'}`}>
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterState('active');
              setCurrentPage(1);
            }}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
              filterState === 'active'
                ? 'bg-selva text-white font-bold shadow-xs'
                : 'text-ink-light hover:bg-selva-soft hover:text-selva-strong'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-selva inline-block" />
            <span>Disponibles</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${filterState === 'active' ? 'bg-white/25 text-white' : 'bg-surface-subtle text-ink-muted'}`}>
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterState('inactive');
              setCurrentPage(1);
            }}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
              filterState === 'inactive'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'text-ink-light hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>Desactivados</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${filterState === 'inactive' ? 'bg-white/25 text-white' : 'bg-surface-subtle text-ink-muted'}`}>
              {counts.inactive}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterState('out_of_stock');
              setCurrentPage(1);
            }}
            className={`min-h-[32px] px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
              filterState === 'out_of_stock'
                ? 'bg-destructive text-white font-bold shadow-xs'
                : 'text-ink-light hover:bg-destructive-soft hover:text-destructive-strong'
            }`}
          >
            <span>Agotados</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${filterState === 'out_of_stock' ? 'bg-white/25 text-white' : 'bg-surface-subtle text-ink-muted'}`}>
              {counts.outOfStock}
            </span>
          </button>

          {counts.lowStock > 0 && (
            <button
              type="button"
              onClick={() => {
                setFilterState('low_stock');
                setCurrentPage(1);
              }}
              className={`min-h-[32px] px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                filterState === 'low_stock'
                  ? 'bg-warning-strong text-white font-bold shadow-xs'
                  : 'text-ink-light hover:bg-warning-soft hover:text-warning-strong'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Poco Stock</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${filterState === 'low_stock' ? 'bg-white/25 text-white' : 'bg-surface-subtle text-ink-muted'}`}>
                {counts.lowStock}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Lista Compacta de Productos con Botones de Tamaño Fijo y Simétrico */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-surface-subtle text-ink-muted flex items-center justify-center mx-auto">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-ink text-sm">
              {filterState === 'inactive'
                ? 'No tienes productos desactivados'
                : filterState === 'out_of_stock'
                ? 'No hay productos agotados'
                : 'No se encontraron productos'}
            </h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              {filterState === 'inactive'
                ? 'Todos tus productos están activos actualmente para los clientes.'
                : 'Prueba cambiando los filtros o agrega un nuevo producto.'}
            </p>
            {filterState !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterState('all')}
                className="text-xs font-bold text-primary hover:underline pt-1 inline-block"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedProducts.map((p) => {
              const isInactive = !p.isAvailable;
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.isAvailable && p.stock > 0 && p.stock <= 3;

              return (
                <div
                  key={p.id}
                  className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-colors ${
                    isInactive
                      ? 'bg-amber-50/20 hover:bg-amber-50/40 opacity-80'
                      : 'hover:bg-surface-subtle/50'
                  }`}
                >
                  {/* Info Producto: Thumbnail + Textos */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Thumbnail con click para ver foto ampliada */}
                    <div
                      onClick={() => setViewerPhoto({ url: p.imageUrl, title: p.name })}
                      className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-surface-subtle flex-shrink-0 border border-border cursor-pointer group"
                      title="Click para ver foto ampliada"
                    >
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isInactive || isOutOfStock ? 'grayscale opacity-60' : ''}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="%23F3F4F6"><rect width="60" height="60" fill="%23F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="10">Foto</text></svg>';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                    </div>

                    {/* Textos y Badges */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm text-ink truncate max-w-[200px] sm:max-w-none">
                          {p.name}
                        </h3>

                        {/* Badges de estado */}
                        {isInactive ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-extrabold px-1.5 py-0.2 rounded-md">
                            Desactivado
                          </span>
                        ) : isOutOfStock ? (
                          <span className="text-[10px] bg-destructive-soft text-destructive-strong border border-destructive-border font-bold px-1.5 py-0.2 rounded-md">
                            Sin Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] bg-warning-soft text-warning-strong border border-warning-border font-bold px-1.5 py-0.2 rounded-md">
                            Quedan {p.stock}
                          </span>
                        ) : null}

                        {p.images && p.images.length > 1 && (
                          <span className="text-[9px] bg-surface-subtle text-ink-muted border border-border font-medium px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5 text-primary" />
                            <span>{p.images.length} fotos</span>
                          </span>
                        )}

                        {p.hasVariants && (
                          <span className="text-[9px] bg-primary-50 text-primary border border-primary-100 font-semibold px-1.5 py-0.2 rounded">
                            Variantes
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-ink-muted line-clamp-1">
                        {p.description || 'Sin descripción'}
                      </p>

                      <div className="flex items-center gap-2 text-xs pt-0.5">
                        <span className="font-extrabold text-ink tabular-nums">
                          {formatCents(p.priceCents)}
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-[11px] text-ink-light">
                          Stock: <strong className={p.stock <= 0 ? 'text-destructive' : 'text-ink'}>{p.stock}</strong>
                        </span>
                        {(p.subCategory || p.category) && (
                          <>
                            <span className="text-border">•</span>
                            <span className="text-[10px] text-ink-muted capitalize truncate max-w-[120px]">
                              {p.subCategory || p.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones con DIMENSIONES FIJAS Y SIMÉTRICAS (Principio de Simetría Gestalt) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0 pt-1 sm:pt-0">
                    {/* Botón Activar/Desactivar con ancho fijo exacto w-[84px] */}
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(p.id, p.isAvailable, p.name)}
                      className={`h-8 w-[84px] justify-center px-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 select-none flex-shrink-0 ${
                        p.isAvailable
                          ? 'bg-selva-soft text-selva-strong border-selva-border hover:bg-selva-soft/80'
                          : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      }`}
                      title={p.isAvailable ? 'Click para pausar producto' : 'Click para activar producto'}
                    >
                      <Power className="w-3 h-3 stroke-[2.5] flex-shrink-0" />
                      <span className="text-[11px] truncate">{p.isAvailable ? 'Activo' : 'Pausado'}</span>
                    </button>

                    {/* Botón Editar con ancho fijo exacto w-[74px] */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(p)}
                      className="h-8 w-[74px] justify-center px-2 text-xs font-semibold border-border text-ink hover:text-primary hover:border-primary rounded-lg flex-shrink-0"
                      title="Editar datos del producto"
                    >
                      <Edit2 className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="text-[11px]">Editar</span>
                    </Button>

                    {/* Botón Eliminar con tamaño fijo exacto w-8 h-8 */}
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(p)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-destructive hover:bg-destructive-soft transition-colors flex-shrink-0"
                      title="Eliminar producto del catálogo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación (10 productos por página) */}
        {filteredProducts.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface text-xs">
            <div className="text-ink-muted text-xs">
              Mostrando{' '}
              <strong className="text-ink font-bold">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </strong>{' '}
              -{' '}
              <strong className="text-ink font-bold">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
              </strong>{' '}
              de <strong className="text-ink font-bold">{filteredProducts.length}</strong> productos
              {selectedCategory !== 'all' && (
                <span className="text-primary font-semibold capitalize"> ({selectedCategory})</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed font-medium text-ink transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-primary text-white shadow-xs'
                        : 'border border-border bg-surface text-ink hover:bg-surface-subtle'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed font-medium text-ink transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal CRUD: Crear o Editar Producto con Edición Interactiva de Foto */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProductId ? 'Editar Producto' : 'Nuevo Producto'}
        description="Actualiza datos, fotos, precio, stock y disponibilidad de tu producto"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="flex flex-col space-y-4 pt-1 max-h-[84vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Formulario (7 columnas en md) */}
            <div className="md:col-span-7 space-y-3.5">
              {/* Nombre */}
              <Input
                label="Nombre del Producto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Tacacho con Cecina y Chorizo Amazónico"
              />

              {/* Precio y Stock */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Precio en Soles (PEN)"
                  type="number"
                  step="0.50"
                  min="0.10"
                  value={priceSoles}
                  onChange={(e) => setPriceSoles(e.target.value)}
                  required
                  inputMode="decimal"
                  placeholder="0.00"
                />

                <Input
                  label="Cantidad / Stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>

              {/* Rubro General y Sección Interna */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Rubro General"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MerchantCategory)}
                >
                  <option value="restaurantes">Restaurantes</option>
                  <option value="bodegas">Bodegas y Abarrotes</option>
                  <option value="farmacias">Farmacias y Boticas</option>
                  <option value="ropa">Ropa y Calzado</option>
                  <option value="supermercados">Supermercados</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="electrohogar">Electrohogar</option>
                  <option value="hogar">Hogar</option>
                  <option value="emprendedores">Emprendedores Locales</option>
                </Select>

                <Input
                  label="Categoría en Tienda"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="Ej. Termos, Postres, etc."
                />
              </div>

              {/* Switch de disponibilidad suave y limpio */}
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  Disponibilidad en Tienda
                </label>
                <div
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isAvailable
                      ? 'bg-selva-soft/50 border-selva-border'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isAvailable ? 'bg-selva-strong animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <p className={`text-xs font-bold leading-tight ${isAvailable ? 'text-selva-strong' : 'text-amber-900'}`}>
                        {isAvailable ? 'Producto Activo y Visible' : 'Producto Pausado (Oculto)'}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {isAvailable ? 'Los clientes pueden pedirlo en la app' : 'No aparecerá en el catálogo a la venta'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all select-none shadow-xs ${
                      isAvailable
                        ? 'bg-white hover:bg-selva-soft text-selva-strong border-selva-border'
                        : 'bg-white hover:bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isAvailable ? 'Pausar' : 'Activar'}
                  </button>
                </div>
              </div>

              {/* Descripción corta */}
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  Descripción corta
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  required
                  placeholder="Ingredientes, porción, presentación o detalles del producto..."
                  className="w-full text-xs p-2.5 rounded-xl border border-field bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* FOTO PRINCIPAL Y SUBIDA DESDE DISPOSITIVO */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    <span>Foto Principal del Producto</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => mainPhotoInputRef.current?.click()}
                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir desde dispositivo</span>
                  </button>
                </div>

                {/* Si la foto es un archivo local base64, mostramos un badge limpio en lugar del texto crudo */}
                {imageUrl.startsWith('data:') ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-selva-soft/70 border border-selva-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-selva-strong flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-selva-strong truncate">
                          Foto cargada desde tu dispositivo
                        </p>
                        <p className="text-[10px] text-selva-strong/80 truncate">
                          Imagen lista para el catálogo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => mainPhotoInputRef.current?.click()}
                        className="text-[11px] font-bold text-selva-strong hover:underline bg-white/80 px-2 py-0.5 rounded-md border border-selva-border transition-colors cursor-pointer"
                      >
                        Cambiar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl(DEFAULT_PRODUCT_IMAGE);
                          setSelectedPreviewImage(DEFAULT_PRODUCT_IMAGE);
                          setGalleryImages((prev) => [DEFAULT_PRODUCT_IMAGE, ...prev.slice(1)]);
                        }}
                        className="text-[11px] font-semibold text-destructive hover:underline px-1 py-0.5 transition-colors cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={imageUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImageUrl(val);
                      setSelectedPreviewImage(val || DEFAULT_PRODUCT_IMAGE);
                      setGalleryImages((prev) => {
                        const updated = [...prev];
                        updated[0] = val || DEFAULT_PRODUCT_IMAGE;
                        return updated;
                      });
                    }}
                    placeholder="https://... o usa el botón para subir desde tu dispositivo"
                  />
                )}

                {/* GALERÍA DE PERFILES / ÁNGULOS DEL PRODUCTO (HASTA 4 FOTOS) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-ink flex items-center gap-1">
                      <Layers className="w-3 h-3 text-primary" />
                      <span>Perfiles y ángulos ({galleryImages.length}/4 fotos):</span>
                    </span>

                    {galleryImages.length < 4 && (
                      <button
                        type="button"
                        onClick={() => anglePhotoInputRef.current?.click()}
                        className="text-[10px] font-bold text-selva-strong hover:underline flex items-center gap-1 bg-selva-soft px-2 py-0.5 rounded-md border border-selva-border cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar perfil (dispositivo)</span>
                      </button>
                    )}
                  </div>

                  {/* Grid de 4 ranuras de perfiles */}
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const photoUrl = galleryImages[slotIdx];
                      const isSelected = selectedPreviewImage === photoUrl;

                      if (photoUrl) {
                        return (
                          <div
                            key={slotIdx}
                            className={`relative h-14 rounded-xl overflow-hidden border group transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-primary border-primary shadow-xs'
                                : 'border-border opacity-80 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedPreviewImage(photoUrl)}
                            title={`Click para previsualizar ángulo ${slotIdx + 1}`}
                          >
                            <img
                              src={photoUrl}
                              alt={`Ángulo ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Badge de número */}
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                              {slotIdx === 0 ? 'Frente' : `P${slotIdx + 1}`}
                            </span>
                            {/* Botón borrar ranura si hay más de 1 */}
                            {galleryImages.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveGalleryImage(slotIdx);
                                }}
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar este ángulo"
                              >
                                <X className="w-2.5 h-2.5 stroke-[3]" />
                              </button>
                            )}
                          </div>
                        );
                      }

                      // Ranura vacía (permite subir foto del dispositivo)
                      return (
                        <button
                          key={slotIdx}
                          type="button"
                          onClick={() => anglePhotoInputRef.current?.click()}
                          className="h-14 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-surface-subtle hover:bg-primary-50/20 flex flex-col items-center justify-center text-ink-muted hover:text-primary transition-all p-1 cursor-pointer"
                          title="Subir foto para este perfil"
                        >
                          <Upload className="w-3.5 h-3.5 mb-0.5" />
                          <span className="text-[9px] font-bold">+ Perfil {slotIdx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Vista previa en vivo con FOTO EDITABLE DIRECTAMENTE AL HACER CLIC (5 columnas en md) */}
            <div className="md:col-span-5 bg-surface-subtle/80 p-3.5 rounded-2xl border border-border flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>Foto y Vista Previa del Producto</span>
                </div>
                <p className="text-[10px] text-ink-muted mb-2.5">
                  Toca la imagen para cambiarla desde tu dispositivo:
                </p>

                {/* Tarjeta de previsualización simulada */}
                <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden max-w-[240px] mx-auto text-left transition-all">
                  {/* Contenedor de Imagen Clickeable para Cambiar Foto */}
                  <div
                    onClick={() => mainPhotoInputRef.current?.click()}
                    className="aspect-[4/3] w-full bg-surface-subtle overflow-hidden relative cursor-pointer group/preview"
                    title="Click para cambiar o subir foto del producto"
                  >
                    <img
                      src={selectedPreviewImage || imageUrl || DEFAULT_PRODUCT_IMAGE}
                      alt={name || 'Producto'}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover/preview:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="%23F3F4F6"><rect width="200" height="150" fill="%23F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="12">Foto</text></svg>';
                      }}
                    />

                    {/* Overlay interactivo para cambiar foto */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 text-xs font-bold">
                      <Camera className="w-5 h-5 drop-shadow" />
                      <span>Cambiar Foto</span>
                      <span className="text-[9px] font-normal text-white/80">(Toca para subir)</span>
                    </div>

                    {!isAvailable && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Desactivado
                      </span>
                    )}

                    {/* Indicador de galería en la miniatura */}
                    {galleryImages.length > 1 && (
                      <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center gap-1 z-10">
                        {galleryImages.map((img, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              selectedPreviewImage === img ? 'bg-white scale-125' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selector rápido de ángulo en la tarjeta simulada */}
                  {galleryImages.length > 1 && (
                    <div className="p-1.5 bg-surface-subtle border-b border-border flex items-center justify-center gap-1">
                      {galleryImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedPreviewImage(img)}
                          className={`w-5 h-5 rounded overflow-hidden border cursor-pointer ${
                            selectedPreviewImage === img ? 'border-primary ring-1 ring-primary' : 'border-border opacity-70'
                          }`}
                        >
                          <img src={img} alt={`Ángulo ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Botón explícito abajo de la imagen para cambiarla */}
                  <div className="p-2 border-b border-border bg-surface-subtle">
                    <button
                      type="button"
                      onClick={() => mainPhotoInputRef.current?.click()}
                      className="w-full py-1 px-2 rounded-lg bg-surface hover:bg-surface-subtle border border-border text-[11px] font-bold text-primary flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Cambiar foto del producto</span>
                    </button>
                  </div>

                  <div className="p-2.5 space-y-1">
                    <h4 className="font-bold text-xs text-ink truncate">
                      {name || 'Nombre del producto'}
                    </h4>
                    <p className="text-[10px] text-ink-light line-clamp-1">
                      {description || 'Descripción breve...'}
                    </p>
                    <div className="pt-1.5 border-t border-border flex items-center justify-between">
                      <span className="font-extrabold text-xs text-ink tabular-nums">
                        {formatCents(previewPriceCents)}
                      </span>
                      <span className="text-[9px] text-selva-strong font-bold bg-selva-soft px-1.5 py-0.2 rounded">
                        Stock: {stock || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-ink-muted text-center pt-1">
                Toca la tarjeta para seleccionar foto desde tu celular o PC
              </div>
            </div>
          </div>

          {/* Botones de acción del Modal */}
          <div className="sticky bottom-0 bg-surface pt-3 border-t border-border flex items-center justify-end gap-2.5 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="min-h-[38px] px-4 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="min-h-[38px] px-5 font-bold shadow-subtle text-xs rounded-xl"
            >
              {editingProductId ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de Confirmación para Eliminar */}
      <Dialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        title="Eliminar Producto"
        description="Esta acción eliminará el producto del catálogo de tu tienda"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-ink">
            ¿Confirmas que deseas eliminar{' '}
            <strong className="text-ink font-bold">"{deletingProduct?.name}"</strong>?
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingProduct(null)}
              className="min-h-[38px] px-3.5 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              className="min-h-[38px] px-4 font-bold text-xs rounded-xl"
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Lightbox: Visor de Foto Ampliada del Producto */}
      <Dialog
        isOpen={Boolean(viewerPhoto)}
        onClose={() => setViewerPhoto(null)}
        title={viewerPhoto?.title || 'Foto del Producto'}
        maxWidth="lg"
      >
        {viewerPhoto && (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl overflow-hidden bg-black/5 border border-border max-h-[70vh] flex items-center justify-center">
              <img
                src={viewerPhoto.url}
                alt={viewerPhoto.title}
                className="w-full h-auto max-h-[65vh] object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewerPhoto(null)}
                className="min-h-[34px] px-4 text-xs font-semibold rounded-xl"
              >
                Cerrar Visor
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
