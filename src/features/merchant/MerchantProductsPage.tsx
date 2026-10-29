import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  catalogApi,
  CatalogProduct,
  CatalogSku,
  InventoryItem,
  imageUrl,
} from '../../services/api/catalogApi';
import { operationsApi, Store, StoreSummary } from '../../services/api/operationsApi';
import { prepareImage } from '../../services/media/prepareImage';
import { formatCents, solesToCents } from '../../lib/currency';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  DEFAULT_PRODUCT_IMAGE,
  getProductStock,
  getProductMainImage,
  getProductGalleryImages,
  canManageStore,
} from './merchantModel';
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
  AlertCircle,
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
  Loader2,
  Sliders,
  History,
} from 'lucide-react';

type FilterTab = 'all' | 'active' | 'inactive' | 'out_of_stock' | 'low_stock';

export const MerchantProductsPage: React.FC = () => {
  const { currentUser, switchMerchant } = useAuthStore();

  // Estados de datos API
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<{ id: string; code: string; name: string }[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Filtros y Paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterTab>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de acciones y feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal create/edit product state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  // Modal delete product state
  const [deletingProduct, setDeletingProduct] = useState<CatalogProduct | null>(null);

  // Modal Ajuste de Inventario Justificado
  const [adjustingSku, setAdjustingSku] = useState<{
    sku: CatalogSku;
    productName: string;
    onHand: number;
    available: number;
  } | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('1');
  const [adjustReason, setAdjustReason] = useState('Reposición de mercadería');

  // Modal Movimientos de inventario (Kardex)
  const [movementsSku, setMovementsSku] = useState<{
    skuId: string;
    variantName: string;
    productName: string;
  } | null>(null);
  const [movementsList, setMovementsList] = useState<
    { id: string; quantity: number; onHandAfter: number; reason: string; createdAt: string }[]
  >([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Lightbox / Visor de Foto Ampliada
  const [viewerPhoto, setViewerPhoto] = useState<{ url: string; title: string } | null>(null);

  // Form states del modal de producto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [priceSoles, setPriceSoles] = useState('22.00');
  const [stockInput, setStockInput] = useState('15');
  const [imageUrlInput, setImageUrlInput] = useState(DEFAULT_PRODUCT_IMAGE);
  const [galleryImages, setGalleryImages] = useState<string[]>([DEFAULT_PRODUCT_IMAGE]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string>(DEFAULT_PRODUCT_IMAGE);
  const [isActive, setIsActive] = useState(true);

  // SKUs / Variantes adicionales
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newSkuVariantName, setNewSkuVariantName] = useState('');
  const [newSkuPriceSoles, setNewSkuPriceSoles] = useState('20.00');
  const [newSkuStock, setNewSkuStock] = useState('10');
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  // Archivos de fotos en cola para subir
  const [pendingUploadFiles, setPendingUploadFiles] = useState<{ position: number; file: File }[]>([]);

  // Refs para subida desde dispositivo
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const anglePhotoInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setFeedbackMessage(null);
  };

  // Cargar productos e inventario de la tienda
  const loadCatalogData = useCallback(async (preferredStoreId?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ownStoresResult, categoriesList] = await Promise.all([
        operationsApi.ownStores(),
        catalogApi.categories().catch(() => []),
      ]);

      const items = ownStoresResult.items || [];
      setStores(items);
      setCategories(categoriesList);

      if (items.length === 0) {
        setCurrentStore(null);
        setProducts([]);
        setInventory([]);
        setLoading(false);
        return;
      }

      const targetId =
        preferredStoreId ||
        currentUser?.merchantId ||
        items[0].id;
      const selectedItem = items.find((s) => s.id === targetId) || items[0];

      const [storeDetail, productsResult, inventoryResult] = await Promise.all([
        operationsApi.store(selectedItem.id),
        catalogApi.products(selectedItem.id),
        catalogApi.inventory(selectedItem.id).catch(() => []),
      ]);

      setCurrentStore(storeDetail);
      setProducts(productsResult.items || []);
      setInventory(inventoryResult || []);

      if (categoriesList.length > 0 && !categoryId) {
        setCategoryId(categoriesList[0].id);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo de la tienda.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.merchantId, categoryId]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  // Al cambiar tienda reiniciar paginación y filtros
  const handleSwitchStore = (newStoreId: string) => {
    switchMerchant(newStoreId);
    setCurrentPage(1);
    setSelectedCategoryId('all');
    setSearchQuery('');
    loadCatalogData(newStoreId);
  };

  const canEdit = canManageStore(currentStore?.membershipRole);

  // Conteo de pestañas con datos reales
  const counts = useMemo(() => {
    const baseList =
      selectedCategoryId === 'all'
        ? products
        : products.filter((p) => p.categoryId === selectedCategoryId);

    let total = baseList.length;
    let active = 0;
    let inactive = 0;
    let outOfStock = 0;
    let lowStock = 0;

    baseList.forEach((p) => {
      const stock = getProductStock(p, inventory);
      const isLow = inventory.some((item) => item.productId === p.id && item.lowStock);
      if (!p.isActive) {
        inactive++;
      } else if (stock <= 0) {
        outOfStock++;
      } else {
        active++;
        if (isLow || stock <= 3) {
          lowStock++;
        }
      }
    });

    return { total, active, inactive, outOfStock, lowStock };
  }, [products, inventory, selectedCategoryId]);

  // Manejo de modal Nuevo Producto
  const handleOpenNew = () => {
    if (!canEdit) {
      showError('Tu membresía no permite crear productos en esta tienda.');
      return;
    }
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setBrand('');
    setPriceSoles('15.00');
    setStockInput('20');
    setImageUrlInput(DEFAULT_PRODUCT_IMAGE);
    setGalleryImages([DEFAULT_PRODUCT_IMAGE]);
    setSelectedPreviewImage(DEFAULT_PRODUCT_IMAGE);
    setIsActive(true);
    setPendingUploadFiles([]);
    setIsAddingVariant(false);
    setIsModalOpen(true);
  };

  // Manejo de modal Editar Producto
  const handleOpenEdit = (p: CatalogProduct) => {
    if (!canEdit) {
      showError('Tu membresía no permite editar productos.');
      return;
    }
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setCategoryId(p.categoryId || categories[0]?.id || '');
    setBrand(p.brand || '');

    const primarySku = p.skus[0];
    setPriceSoles(primarySku ? (primarySku.priceCents / 100).toFixed(2) : '15.00');

    const curStock = getProductStock(p, inventory);
    setStockInput(String(curStock));

    const mainImg = getProductMainImage(p);
    const gallery = getProductGalleryImages(p);
    setImageUrlInput(mainImg);
    setGalleryImages(gallery);
    setSelectedPreviewImage(mainImg);
    setIsActive(p.isActive);
    setPendingUploadFiles([]);
    setIsAddingVariant(false);
    setIsModalOpen(true);
  };

  // Carga de archivo desde dispositivo para foto principal
  const handleMainPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImageUrlInput(previewUrl);
    setSelectedPreviewImage(previewUrl);
    setGalleryImages((prev) => {
      const updated = [...prev];
      updated[0] = previewUrl;
      return updated;
    });

    setPendingUploadFiles((prev) => [
      ...prev.filter((p) => p.position !== 0),
      { position: 0, file },
    ]);
    showFeedback('Foto principal seleccionada para subir.');
    e.target.value = '';
  };

  // Carga de archivo para ángulo/perfil
  const handleAnglePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (galleryImages.length >= 4) {
      showError('Límite alcanzado: máximo 4 fotos por producto.');
      return;
    }

    const nextPosition = galleryImages.length;
    const previewUrl = URL.createObjectURL(file);
    setGalleryImages((prev) => [...prev, previewUrl]);
    setSelectedPreviewImage(previewUrl);
    setPendingUploadFiles((prev) => [...prev, { position: nextPosition, file }]);
    showFeedback('Nuevo ángulo seleccionado para subir.');
    e.target.value = '';
  };

  // Eliminar un perfil de la galería
  const handleRemoveGalleryImage = async (indexToRemove: number) => {
    if (galleryImages.length <= 1) {
      showError('El producto debe tener al menos una foto principal.');
      return;
    }

    // Si estamos editando un producto persistido y la imagen está guardada en backend
    if (editingProduct && editingProduct.images) {
      const imgToDelete = editingProduct.images.find((img) => img.position === indexToRemove);
      if (imgToDelete) {
        try {
          await catalogApi.removeImage(editingProduct.id, imgToDelete.id);
          showFeedback('Imagen eliminada del producto.');
        } catch (err) {
          showError(err instanceof Error ? err.message : 'No se pudo eliminar la imagen.');
          return;
        }
      }
    }

    const updated = galleryImages.filter((_, idx) => idx !== indexToRemove);
    setGalleryImages(updated);
    setPendingUploadFiles((prev) => prev.filter((p) => p.position !== indexToRemove));

    if (indexToRemove === 0 && updated.length > 0) {
      setImageUrlInput(updated[0]);
    }
    setSelectedPreviewImage(updated[0]);
  };

  // Guardar Producto (Crear o Editar)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      showError('El nombre del producto debe tener al menos 2 caracteres.');
      return;
    }

    const parsedPrice = parseFloat(priceSoles.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showError('Ingresa un precio válido mayor a 0 soles.');
      return;
    }
    const priceCentsVal = solesToCents(parsedPrice);

    const parsedStock = parseInt(stockInput, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      showError('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    const targetCategoryId = categoryId || categories[0]?.id;
    if (!targetCategoryId) {
      showError('Selecciona una categoría válida.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingProduct) {
        // 1. Actualizar metadatos del producto
        const updated = await catalogApi.update(editingProduct.id, {
          name: cleanName,
          description: description.trim(),
          brand: brand.trim() || undefined,
          categoryId: targetCategoryId,
          isActive,
        });

        // 2. Actualizar SKU principal si existe
        const primarySku = editingProduct.skus[0];
        if (primarySku) {
          await catalogApi.updateSku(primarySku.id, {
            priceCents: priceCentsVal,
            isActive,
          });

          // 3. Si el stock fue modificado en el campo de texto, registrar ajuste justificado
          const currentOnHand = inventory.find((i) => i.skuId === primarySku.id)?.onHand ?? primarySku.availableStock;
          const delta = parsedStock - currentOnHand;
          if (delta !== 0) {
            await catalogApi.adjust(primarySku.id, {
              quantity: delta,
              reason: 'Ajuste de inventario desde edición de producto',
            });
          }
        }

        // 4. Subir fotos pendientes si hay archivos
        for (const pending of pendingUploadFiles) {
          const content = await prepareImage(pending.file);
          await catalogApi.image(editingProduct.id, {
            content,
            altText: cleanName,
            position: pending.position,
          });
        }

        showFeedback(`Producto "${cleanName}" actualizado correctamente.`);
      } else {
        // CREAR NUEVO PRODUCTO
        const skuCode = `SKU-${cleanName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'PROD'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

        const created = await catalogApi.create(currentStore.id, {
          name: cleanName,
          description: description.trim(),
          brand: brand.trim() || undefined,
          categoryId: targetCategoryId,
          skuCode,
          variantName: 'Estándar',
          priceCents: priceCentsVal,
          initialStock: parsedStock,
          lowStockThreshold: 5,
        });

        // Subir fotos para el nuevo producto
        for (const pending of pendingUploadFiles) {
          const content = await prepareImage(pending.file);
          await catalogApi.image(created.productId, {
            content,
            altText: cleanName,
            position: pending.position,
          });
        }

        showFeedback(`Producto "${cleanName}" publicado exitosamente en tu catálogo.`);
      }

      setIsModalOpen(false);
      await loadCatalogData(currentStore.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo guardar el producto en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agregar presentación/SKU variante a un producto existente
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const variantName = newSkuVariantName.trim();
    if (!variantName) {
      showError('Ingresa un nombre para la presentación.');
      return;
    }

    const price = parseFloat(newSkuPriceSoles.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      showError('Ingresa un precio válido para la presentación.');
      return;
    }

    const initialStock = parseInt(newSkuStock, 10);
    if (isNaN(initialStock) || initialStock < 0) {
      showError('Ingresa una cantidad de stock inicial.');
      return;
    }

    const skuCode =
      newSkuCode.trim() ||
      `SKU-${editingProduct.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await catalogApi.addSku(editingProduct.id, {
        skuCode,
        variantName,
        priceCents: solesToCents(price),
        initialStock,
        lowStockThreshold: 5,
      });

      showFeedback(`Presentación "${variantName}" agregada exitosamente.`);
      setNewSkuVariantName('');
      setNewSkuCode('');
      setIsAddingVariant(false);

      // Recargar producto y catálogo
      await loadCatalogData(currentStore?.id);
      const refreshed = await catalogApi.ownProduct(editingProduct.id);
      setEditingProduct(refreshed);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo crear la presentación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar disponibilidad (Activar / Pausar)
  const handleToggleAvailability = async (p: CatalogProduct) => {
    if (!canEdit) {
      showError('Tu membresía no permite modificar el estado de productos.');
      return;
    }

    setTogglingProductId(p.id);
    setErrorMessage(null);

    try {
      const updated = await catalogApi.update(p.id, {
        isActive: !p.isActive,
      });

      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      showFeedback(
        updated.isActive
          ? `"${p.name}" está ahora activo y visible para los clientes.`
          : `"${p.name}" fue pausado temporalmente.`
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del producto.');
    } finally {
      setTogglingProductId(null);
    }
  };

  // Confirmar eliminación definitiva (soft-delete seguro en servidor)
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    if (!canEdit) {
      showError('Tu membresía no permite eliminar productos.');
      setDeletingProduct(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await catalogApi.deleteProduct(deletingProduct.id);
      showFeedback(`Producto "${deletingProduct.name}" eliminado del catálogo.`);
      setDeletingProduct(null);
      await loadCatalogData(currentStore?.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo eliminar el producto del servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir diálogo de ajuste de inventario
  const handleOpenAdjustStock = (p: CatalogProduct, sku: CatalogSku) => {
    const invItem = inventory.find((i) => i.skuId === sku.id);
    setAdjustingSku({
      sku,
      productName: p.name,
      onHand: invItem?.onHand ?? sku.availableStock,
      available: invItem?.available ?? sku.availableStock,
    });
    setAdjustQuantity('5');
    setAdjustReason('Reposición de mercadería');
  };

  // Registrar ajuste justificado en backend
  const handleConfirmAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingSku) return;

    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty) || qty === 0) {
      showError('Ingresa una cantidad de ajuste diferente de 0.');
      return;
    }

    const reason = adjustReason.trim();
    if (!reason) {
      showError('Indica un motivo justificado para el movimiento de inventario.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await catalogApi.adjust(adjustingSku.sku.id, {
        quantity: qty,
        reason,
      });

      showFeedback(
        `Ajuste de inventario (${qty > 0 ? '+' : ''}${qty}) registrado para "${adjustingSku.sku.variantName}".`
      );
      setAdjustingSku(null);
      await loadCatalogData(currentStore?.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo registrar el ajuste de stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ver historial de movimientos (Kardex)
  const handleOpenMovements = async (p: CatalogProduct, sku: CatalogSku) => {
    setMovementsSku({
      skuId: sku.id,
      variantName: sku.variantName,
      productName: p.name,
    });
    setLoadingMovements(true);
    try {
      const movements = await catalogApi.movements(sku.id);
      setMovementsList(movements || []);
    } catch (err) {
      showError('No se pudieron consultar los movimientos de este SKU.');
    } finally {
      setLoadingMovements(false);
    }
  };

  // Filtrado de productos en memoria
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const categoryName = categories.find((c) => c.id === p.categoryId)?.name.toLowerCase() || '';
        const matchesCat = categoryName.includes(q);
        if (!matchesName && !matchesDesc && !matchesBrand && !matchesCat) return false;
      }

      if (selectedCategoryId !== 'all') {
        if (p.categoryId !== selectedCategoryId) return false;
      }

      const stock = getProductStock(p, inventory);
      const isLow = inventory.some((item) => item.productId === p.id && item.lowStock);

      if (filterState === 'active') return p.isActive && stock > 0;
      if (filterState === 'inactive') return !p.isActive;
      if (filterState === 'out_of_stock') return p.isActive && stock <= 0;
      if (filterState === 'low_stock') return p.isActive && (isLow || (stock > 0 && stock <= 3));
      return true;
    });
  }, [products, inventory, searchQuery, selectedCategoryId, filterState, categories]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const previewPriceCents = useMemo(() => {
    const cleanPrice = String(priceSoles).replace(',', '.').trim();
    const parsedPrice = parseFloat(cleanPrice);
    return solesToCents(!isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0);
  }, [priceSoles]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-xs text-ink-muted">Cargando catálogo e inventario de la tienda...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-3">
        <div className="p-4 bg-destructive-soft border border-destructive-border rounded-2xl flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Error al consultar el catálogo</p>
            <p>{loadError}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadCatalogData()}>
          Reintentar consulta
        </Button>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center space-y-4 bg-surface rounded-2xl border border-border shadow-xs">
        <Package className="w-12 h-12 text-ink-muted mx-auto" />
        <h2 className="text-base font-bold text-ink">No tienes tiendas autorizadas</h2>
        <p className="text-xs text-ink-light max-w-md mx-auto">
          Para gestionar productos e inventario necesitas tener una tienda activa en la plataforma.
        </p>
      </div>
    );
  }

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Inputs ocultos para subida de fotos */}
      <input
        ref={mainPhotoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleMainPhotoUpload}
      />
      <input
        ref={anglePhotoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleAnglePhotoUpload}
      />

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Productos</h1>
            <span className="text-[11px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
              {currentStore.name}
            </span>

            {/* Selector de tienda autorizada si tiene más de 1 */}
            {stores.length > 1 && (
              <div className="relative inline-block">
                <select
                  value={currentStore.id}
                  onChange={(e) => handleSwitchStore(e.target.value)}
                  className="text-xs font-semibold bg-surface border border-border rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs text-ink-light mt-0.5">
            Gestiona precios, inventario y fotos de tus productos en Tingo María
          </p>
        </div>

        {canEdit && (
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
        )}
      </div>

      {/* Alerta de feedback exitoso */}
      {feedbackMessage && (
        <div className="p-3 bg-selva-soft border border-selva-border rounded-xl text-xs text-selva-strong font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Alerta de error */}
      {errorMessage && (
        <div className="p-3 bg-destructive-soft border border-destructive-border rounded-xl text-xs text-destructive-strong font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-xs p-1">
            ✕
          </button>
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
              placeholder="Buscar por nombre, marca o ingrediente..."
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

          {/* Menú Desplegable de Categorías */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border transition-all flex items-center justify-between sm:justify-center gap-2 text-xs font-bold cursor-pointer select-none ${
                selectedCategoryId !== 'all'
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface hover:bg-surface-subtle text-ink border-border'
              }`}
              title="Filtrar productos por categoría"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Categorías</span>
                {selectedCategoryObj && (
                  <span className="bg-white/20 text-white text-[11px] px-1.5 py-0.2 rounded-md font-extrabold max-w-[120px] truncate capitalize">
                    {selectedCategoryObj.name}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-surface rounded-2xl border border-border shadow-2xl p-1.5 z-40 animate-fadeIn text-xs space-y-0.5">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-ink-muted uppercase tracking-wider border-b border-border mb-1 flex items-center justify-between">
                    <span>Categorías ({categories.length})</span>
                    {selectedCategoryId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId('all');
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
                      setSelectedCategoryId('all');
                      setIsCategoryDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      selectedCategoryId === 'all'
                        ? 'bg-primary-50 text-primary font-bold'
                        : 'hover:bg-surface-subtle text-ink'
                    }`}
                  >
                    <span>Todas las categorías</span>
                    <span className="text-[10px] text-ink-muted tabular-nums">
                      {products.length}
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setIsCategoryDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors capitalize ${
                          selectedCategoryId === cat.id
                            ? 'bg-primary-50 text-primary font-bold'
                            : 'hover:bg-surface-subtle text-ink'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
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
        {selectedCategoryObj && (
          <div className="flex items-center gap-2 pt-0.5 text-xs">
            <span className="text-[11px] text-ink-muted">Filtrando por:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-primary-50 text-primary border border-primary-200 text-xs font-bold capitalize">
              <span>{selectedCategoryObj.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId('all');
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

      {/* Lista de Productos */}
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
                ? 'Todos tus productos están activos actualmente para los clientes en Tingo María.'
                : 'Prueba cambiando los filtros o publica un nuevo producto en tu tienda.'}
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
              const primarySku = p.skus[0];
              const stock = getProductStock(p, inventory);
              const isInactive = !p.isActive;
              const isOutOfStock = p.isActive && stock <= 0;
              const isLowStock = p.isActive && inventory.some((item) => item.productId === p.id && item.lowStock);
              const mainPhoto = getProductMainImage(p);
              const catName = categories.find((c) => c.id === p.categoryId)?.name;

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
                    {/* Thumbnail con lightbox */}
                    <div
                      onClick={() => setViewerPhoto({ url: mainPhoto, title: p.name })}
                      className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-surface-subtle flex-shrink-0 border border-border cursor-pointer group"
                      title="Click para ver foto ampliada"
                    >
                      <img
                        src={mainPhoto}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isInactive || isOutOfStock ? 'grayscale opacity-60' : ''}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
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
                            Quedan {stock}
                          </span>
                        ) : null}

                        {p.images && p.images.length > 1 && (
                          <span className="text-[9px] bg-surface-subtle text-ink-muted border border-border font-medium px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5 text-primary" />
                            <span>{p.images.length} fotos</span>
                          </span>
                        )}

                        {p.skus && p.skus.length > 1 && (
                          <span className="text-[9px] bg-primary-50 text-primary border border-primary-100 font-semibold px-1.5 py-0.2 rounded">
                            {p.skus.length} variantes
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-ink-muted line-clamp-1">
                        {p.description || 'Sin descripción'}
                      </p>

                      <div className="flex items-center gap-2 text-xs pt-0.5">
                        <span className="font-extrabold text-ink tabular-nums">
                          {primarySku ? formatCents(primarySku.priceCents) : 'S/ 0.00'}
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-[11px] text-ink-light">
                          Stock: <strong className={stock <= 0 ? 'text-destructive' : 'text-ink'}>{stock}</strong>
                        </span>
                        {catName && (
                          <>
                            <span className="text-border">•</span>
                            <span className="text-[10px] text-ink-muted capitalize truncate max-w-[120px]">
                              {catName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones con dimensiones simétricas fijas */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0 pt-1 sm:pt-0">
                    {/* Botón Ajustar Stock */}
                    {canEdit && primarySku && (
                      <button
                        type="button"
                        onClick={() => handleOpenAdjustStock(p, primarySku)}
                        className="h-8 px-2 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-surface-subtle text-ink-light hover:text-ink transition-colors flex items-center gap-1"
                        title="Registrar movimiento o ajuste de inventario"
                      >
                        <Sliders className="w-3 h-3 text-primary" />
                        <span className="text-[11px] hidden sm:inline">Stock</span>
                      </button>
                    )}

                    {/* Botón Activar / Pausar */}
                    {canEdit && (
                      <button
                        type="button"
                        disabled={togglingProductId === p.id}
                        onClick={() => handleToggleAvailability(p)}
                        className={`h-8 w-[84px] justify-center px-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 select-none flex-shrink-0 ${
                          p.isActive
                            ? 'bg-selva-soft text-selva-strong border-selva-border hover:bg-selva-soft/80'
                            : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        }`}
                        title={p.isActive ? 'Click para pausar producto' : 'Click para activar producto'}
                      >
                        {togglingProductId === p.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Power className="w-3 h-3 stroke-[2.5] flex-shrink-0" />
                        )}
                        <span className="text-[11px] truncate">{p.isActive ? 'Activo' : 'Pausado'}</span>
                      </button>
                    )}

                    {/* Botón Editar */}
                    {canEdit && (
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
                    )}

                    {/* Botón Eliminar */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setDeletingProduct(p)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-destructive hover:bg-destructive-soft transition-colors flex-shrink-0"
                        title="Eliminar producto del catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
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
              {selectedCategoryObj && (
                <span className="text-primary font-semibold capitalize"> ({selectedCategoryObj.name})</span>
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

      {/* Modal CRUD: Crear o Editar Producto */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        description="Actualiza datos, fotos, precio, stock y disponibilidad de tu producto"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="flex flex-col space-y-4 pt-1 max-h-[84vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Formulario (7 columnas en md) */}
            <div className="md:col-span-7 space-y-3.5">
              <Input
                label="Nombre del Producto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={160}
                placeholder="Ej. Tacacho con Cecina y Chorizo Amazónico"
              />

              {/* Precio y Stock */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Precio en Soles (PEN)"
                  type="number"
                  step="any"
                  min="0.01"
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
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  required
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>

              {/* Categoría Oficial y Marca */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Categoría de Catálogo"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Marca o Sección"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  maxLength={100}
                  placeholder="Ej. Tradición Selvática"
                />
              </div>

              {/* Switch de disponibilidad */}
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  Disponibilidad en Tienda
                </label>
                <div
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-selva-soft/50 border-selva-border'
                      : 'bg-amber-50/70 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isActive ? 'bg-selva-strong animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <p className={`text-xs font-bold leading-tight ${isActive ? 'text-selva-strong' : 'text-amber-900'}`}>
                        {isActive ? 'Producto Activo y Visible' : 'Producto Pausado (Oculto)'}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {isActive ? 'Los clientes pueden pedirlo en la app' : 'No aparecerá en el catálogo a la venta'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all select-none shadow-xs ${
                      isActive
                        ? 'bg-white hover:bg-selva-soft text-selva-strong border-selva-border'
                        : 'bg-white hover:bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isActive ? 'Pausar' : 'Activar'}
                  </button>
                </div>
              </div>

              {/* Descripción corta */}
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  Descripción del producto
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={4000}
                  placeholder="Ingredientes, porción, presentación o detalles del producto..."
                  className="w-full text-xs p-2.5 rounded-xl border border-field bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* FOTOS Y GALERÍA DE PERFILES */}
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

                {/* Grid de 4 ranuras de galería */}
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
                        <span>Agregar ángulo</span>
                      </button>
                    )}
                  </div>

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
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                              {slotIdx === 0 ? 'Frente' : `P${slotIdx + 1}`}
                            </span>
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

              {/* SECCIÓN VARIANTES / PRESENTACIONES (Si estamos editando) */}
              {editingProduct && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>Presentaciones y SKU ({editingProduct.skus.length})</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsAddingVariant(!isAddingVariant)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingVariant ? 'Cancelar' : 'Agregar Presentación'}</span>
                    </button>
                  </div>

                  {/* Listado de SKUs existentes */}
                  <div className="space-y-1.5">
                    {editingProduct.skus.map((sku) => {
                      const skuInv = inventory.find((i) => i.skuId === sku.id);
                      return (
                        <div
                          key={sku.id}
                          className="p-2 rounded-xl bg-surface-subtle border border-border flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-ink">
                              {sku.variantName} <span className="text-[10px] text-ink-muted font-normal">({sku.skuCode})</span>
                            </p>
                            <p className="text-[11px] text-ink-light">
                              {formatCents(sku.priceCents)} • Stock: {skuInv?.available ?? sku.availableStock}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenMovements(editingProduct, sku)}
                              className="px-2 py-1 rounded text-[11px] font-semibold text-primary hover:bg-primary-50"
                              title="Ver historial de movimientos"
                            >
                              <History className="w-3.5 h-3.5 inline mr-0.5" />
                              Kardex
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formulario para agregar nueva presentación */}
                  {isAddingVariant && (
                    <div className="p-3 bg-primary-50/30 rounded-xl border border-primary-200 space-y-2.5">
                      <p className="text-xs font-bold text-primary">Nueva Presentación o Tamaño</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Input
                          label="Nombre de presentación"
                          value={newSkuVariantName}
                          onChange={(e) => setNewSkuVariantName(e.target.value)}
                          placeholder="Ej. Familiar, Mediano, 500g"
                        />
                        <Input
                          label="Precio en Soles"
                          type="number"
                          step="any"
                          min="0.01"
                          value={newSkuPriceSoles}
                          onChange={(e) => setNewSkuPriceSoles(e.target.value)}
                        />
                        <Input
                          label="Existencia inicial"
                          type="number"
                          min="0"
                          value={newSkuStock}
                          onChange={(e) => setNewSkuStock(e.target.value)}
                        />
                        <Input
                          label="Código SKU (opcional)"
                          value={newSkuCode}
                          onChange={(e) => setNewSkuCode(e.target.value)}
                          placeholder="Autogenerado si está vacío"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingVariant(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={handleAddVariant}
                        >
                          Crear Presentación
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vista previa en vivo con FOTO EDITABLE DIRECTAMENTE (5 columnas en md) */}
            <div className="md:col-span-5 bg-surface-subtle/80 p-3.5 rounded-2xl border border-border flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>Foto y Vista Previa del Producto</span>
                </div>
                <p className="text-[10px] text-ink-muted mb-2.5">
                  Toca la imagen para cambiarla desde tu dispositivo:
                </p>

                <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden max-w-[240px] mx-auto text-left transition-all">
                  <div
                    onClick={() => mainPhotoInputRef.current?.click()}
                    className="aspect-[4/3] w-full bg-surface-subtle overflow-hidden relative cursor-pointer group/preview"
                    title="Click para cambiar o subir foto del producto"
                  >
                    <img
                      src={selectedPreviewImage || imageUrlInput || DEFAULT_PRODUCT_IMAGE}
                      alt={name || 'Producto'}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover/preview:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 text-xs font-bold">
                      <Camera className="w-5 h-5 drop-shadow" />
                      <span>Cambiar Foto</span>
                      <span className="text-[9px] font-normal text-white/80">(Toca para subir)</span>
                    </div>

                    {!isActive && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Desactivado
                      </span>
                    )}

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
                        Stock: {stockInput || 0}
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
              disabled={isSubmitting}
              className="min-h-[38px] px-4 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="min-h-[38px] px-5 font-bold shadow-subtle text-xs rounded-xl"
            >
              {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de Confirmación para Eliminar */}
      <Dialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        title="Eliminar Producto"
        description="Esta acción despublicará el producto del catálogo preservando el historial de ventas"
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
              disabled={isSubmitting}
              className="min-h-[38px] px-3.5 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmDelete}
              className="min-h-[38px] px-4 font-bold text-xs rounded-xl"
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal de Ajuste Justificado de Inventario */}
      <Dialog
        isOpen={Boolean(adjustingSku)}
        onClose={() => setAdjustingSku(null)}
        title="Ajuste de Existencia Física"
        description={`Registra un movimiento justificado de inventario para "${adjustingSku?.productName}" (${adjustingSku?.sku.variantName})`}
        maxWidth="md"
      >
        {adjustingSku && (
          <form onSubmit={handleConfirmAdjustStock} className="space-y-4 pt-1">
            <div className="p-3 bg-surface-subtle rounded-xl border border-border text-xs space-y-1">
              <p>
                Existencia física actual: <strong>{adjustingSku.onHand} unidades</strong>
              </p>
              <p>
                Stock disponible para compras: <strong>{adjustingSku.available} unidades</strong>
              </p>
              <p className="text-[11px] text-ink-muted">
                Usa una cantidad positiva para ingreso/reposición y negativa para merma, rotura o consumo interno.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Cantidad de ajuste"
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                required
                placeholder="Ej. 10 o -2"
              />

              <Input
                label="Motivo o Justificación del ajuste"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
                maxLength={500}
                placeholder="Ej. Ingreso de lote semanal, merma de cocina..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustingSku(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                Registrar Ajuste
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Modal de Historial de Movimientos de Inventario (Kardex) */}
      <Dialog
        isOpen={Boolean(movementsSku)}
        onClose={() => setMovementsSku(null)}
        title={`Movimientos de Inventario: ${movementsSku?.variantName}`}
        description={`Historial de entradas, salidas y ajustes para "${movementsSku?.productName}"`}
        maxWidth="lg"
      >
        <div className="space-y-3 pt-1">
          {loadingMovements ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
              <p className="text-xs text-ink-muted mt-2">Consultando movimientos...</p>
            </div>
          ) : movementsList.length === 0 ? (
            <p className="text-xs text-ink-muted text-center p-6">No hay movimientos registrados para este SKU.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {movementsList.map((m) => (
                <div key={m.id} className="p-2.5 rounded-xl border border-border bg-surface text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className={m.quantity >= 0 ? 'text-selva-strong' : 'text-destructive'}>
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity} unidades
                    </span>
                    <span className="text-[11px] text-ink-muted font-normal">
                      {new Date(m.createdAt).toLocaleString('es-PE')}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink">{m.reason}</p>
                  <p className="text-[10px] text-ink-muted">Existencia posterior: {m.onHandAfter} unidades</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMovementsSku(null)}
            >
              Cerrar Historial
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Lightbox: Visor de Foto Ampliada */}
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
