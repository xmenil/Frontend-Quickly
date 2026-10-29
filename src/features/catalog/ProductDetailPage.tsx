import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStorefrontProduct, loadCatalogProducts } from './useStorefront';
import { storefrontMerchant, storefrontProduct, type StorefrontProduct as Product, type StorefrontMerchant } from './storefrontModel';
import { useCatalogFavorite } from './useCatalogFavorite';
import { catalogApi } from '../../services/api/catalogApi';
import { engagementApi } from '../../services/api/engagementApi';
import { addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { RemoteState, useRemote } from '../operations/shared';
import { useAuthStore } from '../../store/authStore';
import { catalogPlaceholder } from '../../lib/catalogImage';
import { formatCents } from '../../lib/currency';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Sparkles,
  Store,
  Plus,
  Minus,
  CheckCircle2,
  ThumbsUp,
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowRight,
  Play,
  Award,
  Zap,
  Clock,
  ShoppingCart,
  Palette,
  BadgeCheck,
  Building2,
} from 'lucide-react';

// Algoritmo para encontrar productos similares del mismo tipo exacto (smartphones, shampoos, zapatillas, etc.)
function findSimilarProducts(targetProduct: Product, allProducts: Product[]): Product[] {
  if (!targetProduct || !allProducts || allProducts.length === 0) return [];

  const candidates = allProducts.filter((p) => p.id !== targetProduct.id);

  const cleanWords = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['con', 'del', 'los', 'las', 'para', 'por', 'una', 'uno', 'sin', 'pack'].includes(w));

  const targetTokens = cleanWords(targetProduct.name);
  const targetNameNorm = targetProduct.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const isPhone = /smartphone|celular|telefono|xiaomi|redmi|poco|iphone|galaxy/i.test(targetNameNorm);
  const isShampoo = /shampoo|champu|medicasp|sedal|pantene|head & shoulders|capilar|acondicionador/i.test(targetNameNorm);
  const isShoes = /zapatilla|calzado|vans|nike|tenis|zapato|bota/i.test(targetNameNorm);
  const isSmartwatch = /smartwatch|reloj|pulsera|band|fit\d/i.test(targetNameNorm);
  const isLaptop = /laptop|notebook|computadora/i.test(targetNameNorm);
  const isTV = /smart tv|televisor|\btv\b/i.test(targetNameNorm);
  const isTuna = /atun|caballa|grated|pescado|conserva/i.test(targetNameNorm);
  const isOil = /aceite/i.test(targetNameNorm);
  const isMilk = /leche/i.test(targetNameNorm);
  const isFood = /cecina|tacacho|juane|patarashca|chaufa|arroz|chicharron/i.test(targetNameNorm);

  const scored = candidates.map((cand) => {
    let score = 0;
    const candNameNorm = cand.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const candTokens = cleanWords(cand.name);

    if (isPhone) {
      if (/smartphone|celular|redmi|poco|iphone|galaxy|dimensity|snapdragon|leica/i.test(candNameNorm)) {
        score += 500;
        if (cand.brand && targetProduct.brand && cand.brand.toLowerCase() !== targetProduct.brand.toLowerCase()) {
          score += 40; // Diferentes marcas (Xiaomi vs iPhone vs Samsung)
        }
      } else {
        score -= 1000;
      }
    } else if (isShampoo) {
      if (/shampoo|champu|anticaspa|medicasp|sedal|pantene|head & shoulders/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isShoes) {
      if (/zapatilla|calzado|vans|nike|tenis|zapato/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isSmartwatch) {
      if (/smartwatch|reloj|band|fit\d/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isLaptop) {
      if (/laptop|notebook|computadora/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isTV) {
      if (/smart tv|televisor|\btv\b/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isTuna) {
      if (/atun|caballa|grated|pescado|conserva/i.test(candNameNorm)) {
        score += 500;
      } else if (cand.category === 'supermercados' || cand.category === 'bodegas') {
        score += 30;
      } else {
        score -= 1000;
      }
    } else if (isOil) {
      if (/aceite/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isMilk) {
      if (/leche/i.test(candNameNorm)) {
        score += 500;
      } else {
        score -= 1000;
      }
    } else if (isFood) {
      if (/cecina|tacacho|juane|patarashca|chaufa|arroz|chicharron/i.test(candNameNorm)) {
        score += 500;
      } else if (cand.category === 'restaurantes') {
        score += 100;
      } else {
        score -= 1000;
      }
    } else {
      const matches = targetTokens.filter((tok) => candTokens.includes(tok));
      score += matches.length * 40;
      if (cand.category === targetProduct.category) score += 30;
    }

    if (cand.brand && targetProduct.brand && cand.brand.toLowerCase() !== targetProduct.brand.toLowerCase()) {
      score += 25;
    }
    if (candNameNorm !== targetNameNorm) {
      score += 20;
    }

    return { cand, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const filtered = scored.filter((s) => s.score > 0).map((s) => s.cand);
  if (filtered.length >= 4) {
    return filtered.slice(0, 6);
  }

  const fallback = candidates.filter(
    (c) => c.category === targetProduct.category && !filtered.some((f) => f.id === c.id)
  );

  return [...filtered, ...fallback].slice(0, 6);
}

export const ProductDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const resource = useStorefrontProduct(id);
  if (resource.loading || resource.error) return <div className="max-w-4xl mx-auto py-16 px-4"><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/><Link to="/negocios" className="text-primary font-bold">Volver al catálogo</Link></div>;
  if (!resource.data) return null;
  return <ProductDetailContent key={id} initialProduct={resource.data.product} merchant={resource.data.merchant}/>;
};

function ProductDetailContent({ initialProduct, merchant }: { initialProduct: Product; merchant: StorefrontMerchant }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const favorite = useCatalogFavorite('product', initialProduct.id);
  const isFavorite = favorite.isFavorite;
  const [actionError, setActionError] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(preferredSku(initialProduct.source!)?.id || '');
  const selectedSku = initialProduct.source?.skus.find(sku => sku.id === selectedVariantId);
  const product = { ...initialProduct, priceCents: selectedSku?.priceCents ?? initialProduct.priceCents,
    stock: selectedSku?.availableStock ?? 0, isAvailable: !!initialProduct.source?.isActive && !!selectedSku?.isActive && (selectedSku?.availableStock ?? 0) > 0 };
  const related = useRemote(`related:${initialProduct.id}`, async signal => {
    const [sources, stores] = await Promise.all([loadCatalogProducts({ category: initialProduct.categoryId }, signal), catalogApi.stores(signal)]);
    const merchants = stores.map(storefrontMerchant);
    return { merchants, products: sources.map(source => storefrontProduct(source, merchants.find(store => store.id === source.storeId))) };
  });
  const products = related.data?.products || [];
  const merchants = related.data?.merchants || [];
  const reviews = useRemote(`product-store-reviews:${merchant.id}`, async signal => {
    const first = await engagementApi.reviews(merchant.id, undefined, signal);
    const items = [...first.items];
    const cursors = new Set<string>();
    let cursor = first.nextCursor;
    while (cursor) {
      if (cursors.has(cursor)) throw new Error('No se pudieron cargar todas las opiniones.');
      cursors.add(cursor);
      const page = await engagementApi.reviews(merchant.id, cursor, signal);
      items.push(...page.items); cursor = page.nextCursor;
    }
    return { ...first, items };
  });

  // Galería de fotos del mismo modelo con diferentes colores
  const galleryItems = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.map((url, idx) => {
        const variant = product.variants && product.variants[idx];
        return {
          url,
          label: `Imagen ${idx + 1}`,
          variantId: undefined,
        };
      });
    }

    // Si no tiene múltiples imágenes, usar su imagen única (nunca ensaladas ni fotos ajenas)
    return [{ url: product.imageUrl, label: 'Imagen principal', variantId: undefined }];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [addedSimilarId, setAddedSimilarId] = useState<string | null>(null);

  // Reiniciar estado y desplazarse al inicio al cambiar de producto
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setActiveImageIndex(0);
    setSelectedVariantId(
      product?.variants && product.variants.length > 0 ? product.variants[0]?.id || '' : ''
    );
    setSelectedQuantity(1);
  }, [id, product?.id]);

  const originalPriceCents = product.originalPriceCents;
  const discountPercent = originalPriceCents && originalPriceCents > product.priceCents
    ? Math.round((originalPriceCents - product.priceCents) / originalPriceCents * 100) : 0;
  const similarProducts = useMemo(() => findSimilarProducts(initialProduct, products), [initialProduct, products]);
  const reviewPhotos: { url: string; alt: string; rating: number }[] = [];
  const aiSummary = reviews.data ? (reviews.data.count > 0
    ? `El comercio tiene ${reviews.data.count} opiniones registradas y una calificación media de ${reviews.data.average?.toFixed(1) ?? 'sin calcular'}.`
    : 'Todavía no hay opiniones registradas sobre este comercio.') : 'Las opiniones se mostrarán cuando termine la consulta.';
  const storeReviews = (reviews.data?.items || []).map(review => ({ id: review.id, rating: review.rating,
    date: new Date(review.createdAt).toLocaleDateString('es-PE'), variantText: 'Opinión sobre el comercio',
    comment: review.comment || '', imageUrl: '', location: '' }));
  const canBuy = product.isAvailable && Number.isInteger(selectedQuantity) && selectedQuantity >= 1 && selectedQuantity <= Math.min(product.stock, 10000);

  const selectedVariantObj = product.variants?.find((v) => v.id === selectedVariantId);

  const handleAddToCart = () => {
    if (!initialProduct.source || !selectedSku || !canBuy) return false;
    try { addCatalogProduct(initialProduct.source, selectedSku.id, selectedQuantity); setActionError(''); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo agregar al carrito.'); return false; }
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 3500);
    return true;
  };
  const handleBuyNow = () => { if (handleAddToCart()) navigate('/carrito'); };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };


  return (
    <div className="w-full pb-28 sm:pb-8">
      {(actionError || favorite.error) && <p role="alert" className="mx-auto max-w-7xl px-4 py-3 text-destructive">{actionError || favorite.error}</p>}
      {/* Toast Notification */}
      {showAddedToast && (
        <div className="fixed top-20 right-4 z-50 bg-white border border-primary/20 shadow-floating rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-ink">¡Agregado a tu carrito!</p>
            <p className="text-gray-500">{product.name} ({selectedQuantity} {selectedQuantity === 1 ? 'unidad' : 'unidades'})</p>
          </div>
          <Link
            to="/carrito"
            className="ml-2 px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-sm"
          >
            Ver carrito
          </Link>
        </div>
      )}

      {/* Barra de navegación estática/fija de esquina a esquina (Full-width, Slim & Sticky) */}
      <nav
        aria-label="Barra de navegación de producto"
        className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-[125px] md:top-[106px] z-20 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
          {/* Lado izquierdo: Volver solo en letras (sin botones bordeados) + Breadcrumbs limpios */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer text-xs group py-0.5"
              title="Volver a la página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Volver</span>
            </button>

            <span className="text-gray-300 font-light">|</span>

            <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs flex-wrap">
              <Link
                to={`/negocios?categoria=${merchant.category}`}
                className="hover:text-primary hover:underline transition-colors uppercase text-[11px] font-bold tracking-wider text-gray-500"
              >
                {merchant.category}
              </Link>
              <span className="text-gray-300 text-[10px]">&gt;</span>
              <Link
                to={`/negocios/${merchant.id}`}
                className="hover:text-primary hover:underline transition-colors font-medium text-gray-600 truncate max-w-[120px] sm:max-w-[200px]"
                title={merchant.name}
              >
                {merchant.name}
              </Link>
              <span className="text-gray-300 text-[10px]">&gt;</span>
              <span
                className="text-ink font-semibold truncate max-w-[150px] sm:max-w-[280px] lg:max-w-[380px]"
                title={product.name}
              >
                {product.name}
              </span>
            </div>
          </div>

          {/* Lado derecho: Compartir & Ver más de esta tienda (solo letras, sin bordes) */}
          <div className="flex items-center gap-4 text-xs font-semibold ml-auto">
            <button
              type="button"
              onClick={handleShare}
              className="text-primary hover:text-primary-hover hover:underline flex items-center gap-1 transition-colors cursor-pointer py-0.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? '¡Enlace copiado!' : 'Compartir'}</span>
            </button>
            <Link
              to={`/negocios/${merchant.id}`}
              className="text-gray-600 hover:text-primary hover:underline transition-colors hidden sm:inline-flex items-center gap-1 py-0.5"
            >
              <span>Ver más de esta tienda</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenedor principal de producto (Dentro de max-w-7xl) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Main Product Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Gallery & Product Info */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-subtle p-4 sm:p-6 space-y-8">
          {/* Gallery Row: Vertical Thumbnails + Big Preview */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-6 items-start">
            {/* Vertical Thumbnails List: Mismo modelo en diferentes colores */}
            <div className="flex flex-col gap-1.5 w-full sm:w-20 flex-shrink-0">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider hidden sm:block">
                Colores:
              </span>
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible w-full pb-1 sm:pb-0 scrollbar-none">
                {galleryItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => {
                      setActiveImageIndex(idx);
                      if (item.variantId) setSelectedVariantId(item.variantId);
                    }}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      if (item.variantId) setSelectedVariantId(item.variantId);
                    }}
                    className={`group/thumb relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-gray-50 flex-shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-primary ring-2 ring-primary/25 shadow-md scale-102'
                        : 'border-gray-200 hover:border-primary/50 opacity-80 hover:opacity-100'
                    }`}
                    title={item.label}
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-xs text-[9px] font-bold text-white text-center py-0.5 truncate px-0.5 leading-none">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Image Display */}
            <div className="relative flex-1 aspect-square w-full rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-gray-100 group">
              <img
                src={galleryItems[activeImageIndex]?.url || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              />

              {/* Active Color Tag on Preview */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-300" />
                <span>Imagen: {galleryItems[activeImageIndex]?.label || 'Estándar'}</span>
              </div>

              {/* Free Shipping Badge */}
              <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>Envío según destino</span>
              </div>

              {/* Mobile Favorite button inside preview */}
              <button
                type="button"
                onClick={() => void favorite.toggle()}
                disabled={favorite.busy}
                aria-pressed={isFavorite}
                className="sm:hidden absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-md text-gray-500 hover:text-primary"
              >
                <Heart
                  className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <h2 className="text-lg font-extrabold text-ink">Descripción del producto</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {/* Specifications Grid */}
            <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Características principales
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Marca</span>
                  <span className="font-bold text-ink">{product.brand || 'No especificada'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Condición</span>
                  <span className="font-bold text-ink">{product.condition || 'No especificada'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Disponibilidad</span>
                  <span className="font-bold text-emerald-600">{product.isAvailable ? `En stock (${product.stock} disp.)` : 'Agotado'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Ubicación del comercio</span>
                  <span className="font-bold text-ink">{merchant.address}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Garantía</span>
                  <span className="font-bold text-ink">Consultar al comercio</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Envío rápido</span>
                  <span className="font-bold text-primary">Según dirección de entrega</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews & IA Summary (Exact match to Capture 3) */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Opiniones del comercio</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl font-black text-ink">{reviews.data?.average == null ? 'Sin valoraciones' : reviews.data.average.toFixed(1)}</span>
                  <div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(reviews.data?.average || 0) ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {reviews.data?.count ?? '—'} opiniones del comercio
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution Bars */}
              <div className="w-full sm:w-60 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">5</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.data?.items.length ? `${reviews.data.items.filter(review => review.rating === 5).length / reviews.data.items.length * 100}%` : '0%' }}/>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">4</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.data?.items.length ? `${reviews.data.items.filter(review => review.rating === 4).length / reviews.data.items.length * 100}%` : '0%' }}/>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">3</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.data?.items.length ? `${reviews.data.items.filter(review => review.rating === 3).length / reviews.data.items.length * 100}%` : '0%' }}/>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">2</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.data?.items.length ? `${reviews.data.items.filter(review => review.rating === 2).length / reviews.data.items.length * 100}%` : '0%' }}/>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">1</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.data?.items.length ? `${reviews.data.items.filter(review => review.rating === 1).length / reviews.data.items.length * 100}%` : '0%' }}/>
                  </div>
                </div>
                <p className="text-[11px] text-primary font-semibold text-right pt-0.5">
                  Opiniones registradas de compradores
                </p>
              </div>
            </div>

<RemoteState loading={reviews.loading} error={reviews.error} retry={reviews.reload}/>
            {/* Opiniones con fotos strip matching Capture 3 */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-ink">Opiniones con fotos</h3>
              {!reviewPhotos.length && <p className="text-xs text-gray-500">No hay fotos de opiniones disponibles.</p>}
              <div className="grid grid-cols-4 gap-2.5">
                {reviewPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-100 group cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                      <span>{photo.rating}</span>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Review Summary Card (Capture 3: Resumen de opiniones del comercio) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50/90 to-emerald-50/70 border border-primary-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>Resumen de opiniones del comercio</span>
              </div>
              <p className="text-xs text-ink/80 leading-relaxed font-medium">
                {aiSummary}
              </p>
            </div>

            {/* Review Cards List */}
            <div className="space-y-4 pt-2">
              {storeReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-gray-400 text-[11px]">{rev.date}</span>
                  </div>
                  <p className="text-gray-400 font-medium text-[11px]">
                    {rev.variantText}
                  </p>
                  <p className="text-ink leading-relaxed font-medium">
                    {rev.comment}
                  </p>
                  {rev.imageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 mt-1">
                      <img
                        src={rev.imageUrl}
                        alt="Foto cliente"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled
                      title="Esta función no está disponible"
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        false
                          ? 'bg-primary-50 text-primary border-primary-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Valorar utilidad no disponible</span>
                    </button>
                    <span className="text-[10px] text-gray-400">{rev.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Box matching Captures 2 & 3 */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Main Purchase Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-5 sm:p-6 space-y-5">
            {/* Condition & Sales badge */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{product.isAvailable ? 'Disponible en el catálogo' : 'Agotado'}</span>
              <button
                type="button"
                onClick={() => void favorite.toggle()}
                disabled={favorite.busy}
                aria-pressed={isFavorite}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                aria-label="Favorito"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`}
                />
              </button>
            </div>

            {/* Title & Rating */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(reviews.data?.average || 0) ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="font-bold text-ink">{reviews.data?.average == null ? 'Sin valoraciones' : reviews.data.average.toFixed(1)}</span>
                <span className="text-gray-400">({reviews.data?.count ?? '—'})</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-gray-500 line-through tabular-nums">
                {originalPriceCents ? formatCents(originalPriceCents) : ''}
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-ink tracking-tight tabular-nums">
                  {product.hasPrice === false ? 'Sin presentaciones' : formatCents(product.priceCents)}
                </span>
                {discountPercent > 0 && <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">{discountPercent > 0 ? `${discountPercent}% OFF` : ''}</span>}
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-ink-light">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Preparación y despacho: <strong className="text-ink tabular-nums">{merchant.prepTimeMinutes === undefined ? 'Consultar al comercio' : `${merchant.prepTimeMinutes} min de preparación`}</strong></span>
              </div>
            </div>

            {/* Coupon Callout */}
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-primary-200 flex items-center gap-2 text-xs text-primary font-semibold">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Los importes se revisan antes de confirmar la compra</span>
            </div>

            {/* Shipping Info */}
            <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-700">Envío según dirección de entrega</p>
                  <p className="text-[11px] text-gray-400">La tarifa se calcula antes de confirmar</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink">Entrega a tu dirección registrada</p>
                  <p className="text-[11px] text-gray-400">Consulta las zonas de cobertura al elegir el destino</p>
                </div>
              </div>
            </div>

            {/* Variants Picker (Color / Modelo disponible con selector visual) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-ink flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    <span>Presentación disponible:</span>
                  </label>
                  <span className="font-extrabold text-primary">
                    {selectedVariantObj?.name.replace(/^Color:\s*/i, '') || 'Seleccionar'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, vIdx) => {
                    const isSelected = selectedVariantId === v.id;
                    const colorName = v.name.replace(/^Color:\s*/i, '');

                    const getSwatchDot = (name: string) => {
                      const n = name.toLowerCase();
                      if (n.includes('blanco')) return 'bg-white border border-gray-300';
                      if (n.includes('negro') || n.includes('obsidiana') || n.includes('militar')) return 'bg-gray-900';
                      if (n.includes('rosa')) return 'bg-pink-400';
                      if (n.includes('plata') || n.includes('gris') || n.includes('grafito')) return 'bg-slate-400';
                      if (n.includes('azul')) return 'bg-blue-600';
                      if (n.includes('verde')) return 'bg-emerald-600';
                      return 'bg-primary';
                    };

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={!v.isAvailable}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setSelectedQuantity(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30 scale-102'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 shadow-xs ${getSwatchDot(colorName)}`} />
                        <span>{colorName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <span className="font-bold text-ink">Cantidad:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
                    aria-label="Disminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-bold text-ink">{selectedQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuantity(Math.min(product.stock, selectedQuantity + 1))}
                    className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] text-gray-400">(+{product.stock} disponibles)</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canBuy}
                className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Comprar ahora</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canBuy}
                className="w-full py-3 px-4 rounded-2xl bg-primary-50 hover:bg-primary-100 text-primary border border-primary-200 text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar al carrito</span>
              </button>
            </div>

            {/* Official Store Badge & Reputation */}
            <div className="pt-4 border-t border-gray-100 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={merchant.logoUrl || catalogPlaceholder}
                  alt={merchant.name}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-ink truncate">{merchant.name}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-400">Comercio afiliado a Quickly</p>
                </div>
              </div>

              {/* Reputation Gauge */}
              <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-ink">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Valoraciones del comercio
                  </span>
                  <span>{merchant.rating == null ? 'Sin valoraciones' : `${merchant.rating.toFixed(1)} ★`}</span>
                </div>
                <div className="grid grid-cols-5 gap-1 h-1.5">
                  <div className="bg-red-400 rounded-full" />
                  <div className="bg-orange-400 rounded-full" />
                  <div className="bg-yellow-400 rounded-full" />
                  <div className="bg-lime-400 rounded-full" />
                  <div className={`bg-emerald-500 rounded-full ${merchant.rating != null && merchant.rating >= 4.5 ? 'ring-2 ring-emerald-300' : ''}`} />
                </div>
                <div className="grid grid-cols-3 text-[10px] text-gray-500 text-center pt-1">
                  <div>
                    <span className="font-bold text-ink block">{merchant.ratingCount}</span>
                    <span>Valoraciones</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-600 block">{merchant.isOpen ? 'Abierto' : 'Cerrado'}</span>
                    <span>Atención</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-600 block">En checkout</span>
                    <span>Entrega</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/negocios/${merchant.id}`}
                className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-ink font-bold text-center block border border-gray-200 transition-colors"
              >
                Ir a la tienda oficial
              </Link>
            </div>

            {/* Compra Protegida */}
            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-ink">Compra Protegida Quickly:</span> Consulta el detalle de tu pedido y contacta a soporte si necesitas ayuda.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-400">
                  Las consultas de devolución se gestionan con soporte.
                </p>
              </div>
            </div>

            {/* Payment Methods Box */}
            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
              <h4 className="font-bold text-ink">Medios de pago disponibles</h4>
              <p className="text-[11px] text-gray-500">Pago contra entrega</p>
              <div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-1 rounded-md bg-emerald-100 font-extrabold text-[11px] text-emerald-800">Efectivo</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Productos relacionados matching Mercado Libre in Captura 4 */}
      <div className="pt-8 space-y-4 relative">
        <div className="flex items-center justify-between pb-1 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink tracking-tight">
              Productos relacionados
            </h2>
            <span className="text-[10px] text-gray-400 font-bold border border-gray-200 px-1.5 py-0.2 rounded">
              Ad
            </span>
          </div>
          <Link
            to="/negocios"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver más opciones <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <RemoteState loading={related.loading} error={related.error} retry={related.reload}/>
        {/* Mercado Libre Style Cards Grid with Next Arrow */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {similarProducts.map((simProd) => {
              const simStore = merchants.find((m) => m.id === simProd.merchantId);
              const discountPercent =
                simProd.originalPriceCents && simProd.originalPriceCents > simProd.priceCents
                  ? Math.round(
                      ((simProd.originalPriceCents - simProd.priceCents) /
                        simProd.originalPriceCents) *
                        100
                    )
                  : 0;
              const originalPrice =
                simProd.originalPriceCents;
              const cuotaPrice = Math.round(simProd.priceCents / 6);

              return (
                <Link
                  key={simProd.id}
                  to={`/producto/${simProd.id}`}
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  }}
                  className="group bg-white rounded-2xl border border-gray-200/90 hover:border-gray-300 shadow-subtle hover:shadow-card p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 text-left relative cursor-pointer"
                >
                  <div>
                    {/* Centered Product Image */}
                    <div className="aspect-square w-full rounded-xl bg-white overflow-hidden flex items-center justify-center p-2 mb-2 relative">
                      <img
                        src={simProd.imageUrl}
                        alt={simProd.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {simStore && (
                        <span className="absolute top-1 left-1 text-[9px] font-bold text-gray-500 bg-gray-100/90 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">
                          {simStore.name.replace(/Supermercado\s+/i, 'Super ').replace(/\s+Tingo María$/i, '')}
                        </span>
                      )}
                    </div>

                    {/* Product Title (2-3 lines clean text) */}
                    <h4 className="text-xs sm:text-[13px] text-gray-800 font-normal leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-primary transition-colors">
                      {simProd.name}
                    </h4>

                    {/* Pricing matching Captura 4 */}
                    <div className="mt-2 space-y-0.5">
                      <span className="text-[11px] text-gray-400 line-through tabular-nums block">
                        {originalPrice ? formatCents(originalPrice) : ''}
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-ink tabular-nums">
                          {simProd.hasPrice === false ? 'Sin presentaciones' : formatCents(simProd.priceCents)}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                          {discountPercent}% OFF
                        </span>
                      </div>

                      {/* Cuotas sin interés */}
                      <p className="text-[11px] text-emerald-700 font-medium leading-tight pt-0.5">
                        Pago en efectivo contra entrega
                      </p>

                      {/* Envío según destino */}
                      <p className="text-[11px] text-emerald-700 font-bold pt-0.5">
                        Envío según dirección
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Floating Right Next Chevron Button matching Captura 4 */}
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('.grid-cols-2');
              if (el) el.scrollBy({ left: 240, behavior: 'smooth' });
            }}
            aria-label="Ver más productos relacionados"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-floating border border-gray-200 items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-10 hover:scale-108 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
      </div>

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 shadow-floating flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-gray-500 font-medium block">Total</span>
          <span className="text-base font-black text-ink tabular-nums">
            {product.hasPrice === false ? 'Por verificar' : formatCents(product.priceCents * selectedQuantity)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
            <button
              type="button"
              onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
              className="p-2 text-gray-600 hover:text-ink touch-target flex items-center justify-center"
              aria-label="Disminuir"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-bold text-ink tabular-nums">{selectedQuantity}</span>
            <button
              type="button"
              onClick={() => setSelectedQuantity(Math.min(product.stock, selectedQuantity + 1))}
              className="p-2 text-gray-600 hover:text-ink touch-target flex items-center justify-center"
              aria-label="Aumentar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
                disabled={!canBuy}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 touch-target active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
