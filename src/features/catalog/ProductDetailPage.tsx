import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Product } from '../../domain/types';
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

// Algoritmo para encontrar productos similares del mismo tipo pero con otros modelos o marcas
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

  const isSmartwatch = /smartwatch|reloj|pulsera|band|fit\d/i.test(targetNameNorm);
  const isLaptop = /laptop|notebook|computadora/i.test(targetNameNorm);
  const isTV = /smart tv|televisor|\btv\b/i.test(targetNameNorm);
  const isPhone = /smartphone|celular|telefono/i.test(targetNameNorm);
  const isTuna = /atun|caballa|grated/i.test(targetNameNorm);
  const isOil = /aceite/i.test(targetNameNorm);
  const isMilk = /leche/i.test(targetNameNorm);
  const isPeach = /durazno|fruta en almibar|conserva/i.test(targetNameNorm);

  const scored = candidates.map((cand) => {
    let score = 0;
    const candNameNorm = cand.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const candTokens = cleanWords(cand.name);

    if (isSmartwatch) {
      if (/smartwatch|reloj|band|fit\d/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'tecnologia') {
        score += 20;
      } else {
        score -= 500; // Nunca mezclar comida/abarrotes con tecnología
      }
    } else if (isLaptop) {
      if (/laptop|notebook|computadora/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'tecnologia') {
        score += 20;
      } else {
        score -= 500;
      }
    } else if (isTV) {
      if (/smart tv|televisor|\btv\b/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'electrohogar' || cand.category === 'tecnologia') {
        score += 20;
      } else {
        score -= 500;
      }
    } else if (isPhone) {
      if (/smartphone|celular/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'tecnologia') {
        score += 20;
      } else {
        score -= 500;
      }
    } else if (isTuna) {
      if (/atun|caballa|grated|pescado/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'supermercados') {
        score += 20;
      } else {
        score -= 500;
      }
    } else if (isOil) {
      if (/aceite/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'supermercados') {
        score += 20;
      } else {
        score -= 500;
      }
    } else if (isMilk) {
      if (/leche/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'supermercados') {
        score += 20;
      } else {
        score -= 500;
      }
    } else if (isPeach) {
      if (/durazno|fruta|almibar|conserva/i.test(candNameNorm)) {
        score += 250;
      } else if (cand.category === 'supermercados') {
        score += 20;
      } else {
        score -= 500;
      }
    } else {
      const matches = targetTokens.filter((tok) => candTokens.includes(tok));
      score += matches.length * 40;
      if (cand.category === targetProduct.category) score += 30;
    }

    // Requisito del usuario: otros modelos o marcas
    if (cand.brand && targetProduct.brand && cand.brand.toLowerCase() !== targetProduct.brand.toLowerCase()) {
      score += 35; // Bonificación de marca diferente
    }
    if (candNameNorm !== targetNameNorm) {
      score += 20; // Modelo diferente
    }

    return { cand, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const filtered = scored.filter((s) => s.score > 0).map((s) => s.cand);
  if (filtered.length >= 4) {
    return filtered.slice(0, 4);
  }

  const fallback = candidates.filter(
    (c) => c.category === targetProduct.category && !filtered.some((f) => f.id === c.id)
  );

  return [...filtered, ...fallback].slice(0, 4);
}

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { products, merchants, favoriteProductIds, toggleFavoriteProduct } = useDataStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Find product or fallback to authentic Amazonian dish
  const product =
    products.find((p) => p.id === id) ||
    products.find((p) => p.id === 'p_tacacho_cecina') ||
    products[0];

  const merchant = merchants.find((m) => m.id === product?.merchantId) || merchants[0];

  const isFavorite = product ? favoriteProductIds.includes(product.id) : false;

  // Galería de fotos del mismo modelo con diferentes colores
  const galleryItems = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.map((url, idx) => {
        const variant = product.variants && product.variants[idx];
        return {
          url,
          label: variant ? variant.name.replace(/^Color:\s*/i, '') : `Color ${idx + 1}`,
          variantId: variant?.id,
        };
      });
    }

    // Si no tiene múltiples imágenes, usar su imagen única (nunca ensaladas ni fotos ajenas)
    return [{ url: product.imageUrl, label: 'Color principal', variantId: undefined }];
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants && product.variants.length > 0 ? product.variants[0]?.id || '' : ''
  );
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [addedSimilarId, setAddedSimilarId] = useState<string | null>(null);

  // Reiniciar estado al cambiar de producto
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedVariantId(
      product?.variants && product.variants.length > 0 ? product.variants[0]?.id || '' : ''
    );
    setSelectedQuantity(1);
  }, [product?.id]);

  // Review useful counters state
  const [reviewHelpful, setReviewHelpful] = useState<Record<string, number>>({
    r1: 3,
    r2: 5,
    r3: 2,
  });
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Producto no encontrado</h1>
        <p className="text-ink-light text-sm mb-6">El producto que buscas ya no está disponible en Tingo María.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const originalPriceCents = product.originalPriceCents || Math.round(product.priceCents * 1.2);
  const discountPercent = Math.round(
    ((originalPriceCents - product.priceCents) / originalPriceCents) * 100
  );

  // Productos similares inteligentes (mismo tipo en otros modelos o marcas)
  const similarProducts = useMemo(() => {
    return findSimilarProducts(product, products);
  }, [product, products]);

  const selectedVariantObj = product.variants?.find((v) => v.id === selectedVariantId);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      quantity: selectedQuantity,
      unitPriceCents: product.priceCents,
      selectedVariantId: selectedVariantId || undefined,
      selectedVariantName: selectedVariantObj?.name || undefined,
    });
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 3500);
  };

  const handleAddSimilarProduct = (e: React.MouseEvent, simProd: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: simProd.id,
      merchantId: simProd.merchantId,
      quantity: 1,
      unitPriceCents: simProd.priceCents,
    });
    setAddedSimilarId(simProd.id);
    setTimeout(() => {
      setAddedSimilarId((curr) => (curr === simProd.id ? null : curr));
    }, 1500);
  };

  const handleBuyNow = () => {
    // High-level operation: if guest, redirect to login!
    addItem({
      productId: product.id,
      merchantId: product.merchantId,
      quantity: selectedQuantity,
      unitPriceCents: product.priceCents,
      selectedVariantId: selectedVariantId || undefined,
      selectedVariantName: selectedVariantObj?.name || undefined,
    });

    if (!isAuthenticated) {
      // Redirect to login preserving the checkout intent
      navigate('/login', {
        state: {
          from: '/checkout',
          message: 'Inicia sesión para completar tu compra de manera segura',
        },
      });
    } else {
      navigate('/checkout');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleVoteUseful = (reviewId: string) => {
    if (votedReviews[reviewId]) return;
    setReviewHelpful((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
  };

  return (
    <div className="w-full pb-28 sm:pb-8">
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
                <Palette className="w-3.5 h-3.5 text-pink-300" />
                <span>Color: {galleryItems[activeImageIndex]?.label || 'Estándar'}</span>
              </div>

              {/* Free Shipping Badge */}
              <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>Envío gratis</span>
              </div>

              {/* Mobile Favorite button inside preview */}
              <button
                type="button"
                onClick={() => toggleFavoriteProduct(product.id)}
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
                  <span className="font-bold text-ink">{product.brand || merchant.name}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Condición</span>
                  <span className="font-bold text-ink">{product.condition || 'Nuevo'}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Disponibilidad</span>
                  <span className="font-bold text-emerald-600">En stock ({product.stock} disp.)</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Origen</span>
                  <span className="font-bold text-ink">Tingo María, Huánuco</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Garantía</span>
                  <span className="font-bold text-ink">30 días de fábrica</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[11px]">Envío rápido</span>
                  <span className="font-bold text-primary">Mismo día (35 min)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews & IA Summary (Exact match to Capture 3) */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Opiniones del producto</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-4xl font-black text-ink">{product.rating || 4.8}</span>
                  <div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {product.ratingCount || 175} calificaciones
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Distribution Bars */}
              <div className="w-full sm:w-60 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">5</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[82%]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">4</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[12%]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">3</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[4%]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">2</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[1%]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-3">1</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[1%]" />
                  </div>
                </div>
                <p className="text-[11px] text-primary font-semibold text-right pt-0.5">
                  Al 92% le quedó como esperaba
                </p>
              </div>
            </div>

            {/* Opiniones con fotos strip matching Capture 3 */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-ink">Opiniones con fotos</h3>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&auto=format&fit=crop&q=80',
                ].map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-100 group cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={`Foto de comprador ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                      <span>5</span>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Review Summary Card (Capture 3: Resumen de opiniones generado por IA) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50/90 to-pink-50/70 border border-primary-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>Resumen de opiniones generado por IA</span>
              </div>
              <p className="text-xs text-ink/80 leading-relaxed font-medium">
                {product.category === 'ropa'
                  ? 'Las zapatillas destacan por su excelente comodidad y calidad. El diseño es atractivo y los materiales son de buena calidad, cumpliendo con las expectativas visuales y de uso. Además, las tallas son precisas, asegurando un ajuste perfecto si se conoce el tamaño del pie.'
                  : `Los clientes destacan la frescura, excelente sabor y rápida entrega en Tingo María. El empaque llega en óptimas condiciones térmicas y la porción cumple con las expectativas descritas.`}
              </p>
            </div>

            {/* Review Cards List */}
            <div className="space-y-4 pt-2">
              {/* Review 1 */}
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-gray-400 text-[11px]">Hace 2 semanas</span>
                </div>
                <p className="text-gray-400 font-medium text-[11px]">
                  Color: Negro · Talla: 42 EU · Compra verificada
                </p>
                <p className="text-ink leading-relaxed font-medium">
                  Soy talla 42 y me ajusta mucho, debí comprar 43. Igual me encantaron por el acabado y la suela vulcanizada que no resbala.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleVoteUseful('r1')}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      votedReviews.r1
                        ? 'bg-primary-50 text-primary border-primary-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Útil {reviewHelpful.r1}</span>
                  </button>
                  <span className="text-[10px] text-gray-400">Cliente en Tingo María</span>
                </div>
              </div>

              {/* Review 2 */}
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-gray-400 text-[11px]">Hace 1 mes</span>
                </div>
                <p className="text-gray-400 font-medium text-[11px]">
                  Color: Negro · Talla: 42 EU · Compra verificada
                </p>
                <p className="text-ink leading-relaxed font-medium">
                  Es encantadora estás zapatilla muy cómoda, la compré en mi talla habitual 9 (42.0) y quedó como un guante perfecto. Recomendado 100%.
                </p>
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 mt-1">
                  <img
                    src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=200&auto=format&fit=crop&q=80"
                    alt="Foto cliente"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleVoteUseful('r2')}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      votedReviews.r2
                        ? 'bg-primary-50 text-primary border-primary-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Útil {reviewHelpful.r2}</span>
                  </button>
                  <span className="text-[10px] text-gray-400">Cliente en Castillo Grande</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Box matching Captures 2 & 3 */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Main Purchase Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-5 sm:p-6 space-y-5">
            {/* Condition & Sales badge */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{product.condition || 'Nuevo'} | +{product.soldCount || 500} vendidos</span>
              <button
                type="button"
                onClick={() => toggleFavoriteProduct(product.id)}
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
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-ink">{product.rating || 4.8}</span>
                <span className="text-gray-400">({product.ratingCount || 175})</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-gray-500 line-through tabular-nums">
                {formatCents(originalPriceCents)}
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-ink tracking-tight tabular-nums">
                  {formatCents(product.priceCents)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {discountPercent}% OFF
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-ink-light">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Preparación y despacho: <strong className="text-ink tabular-nums">{merchant.prepTimeMinutes}-{merchant.prepTimeMinutes + 15} min</strong></span>
              </div>
            </div>

            {/* Coupon Callout */}
            <div className="p-2.5 rounded-xl bg-pink-50/80 border border-primary-200 flex items-center gap-2 text-xs text-primary font-semibold">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Cupón S/ 25 OFF en tu primera compra con Quickly</span>
            </div>

            {/* Shipping Info */}
            <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-700">Envío gratis en Tingo María</p>
                  <p className="text-[11px] text-gray-400">Llega hoy en 35 a 45 minutos a tu puerta</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink">Enviar a Tingo María (Rupa Rupa)</p>
                  <p className="text-[11px] text-gray-400">Cobertura en Centro, Castillo Grande y Rupa Sur</p>
                </div>
              </div>
            </div>

            {/* Variants Picker (Color / Modelo disponible con selector visual) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-ink flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    <span>Color del modelo:</span>
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
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          if (vIdx < galleryItems.length) {
                            setActiveImageIndex(vIdx);
                          }
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
                className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Comprar ahora</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
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
                  src={merchant.logoUrl}
                  alt={merchant.name}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-ink truncate">{merchant.name}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-400">Tienda oficial Quickly · +5 mil ventas</p>
                </div>
              </div>

              {/* Reputation Gauge */}
              <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-ink">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Comercio Destacado
                  </span>
                  <span>4.9 ★</span>
                </div>
                <div className="grid grid-cols-5 gap-1 h-1.5">
                  <div className="bg-red-400 rounded-full" />
                  <div className="bg-orange-400 rounded-full" />
                  <div className="bg-yellow-400 rounded-full" />
                  <div className="bg-lime-400 rounded-full" />
                  <div className="bg-emerald-500 rounded-full ring-2 ring-emerald-300" />
                </div>
                <div className="grid grid-cols-3 text-[10px] text-gray-500 text-center pt-1">
                  <div>
                    <span className="font-bold text-ink block">+500</span>
                    <span>Ventas</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-600 block">Buena</span>
                    <span>Atención</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-600 block">A tiempo</span>
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
                  <span className="font-bold text-ink">Compra Protegida Quickly:</span> Recibe el producto que esperabas o te devolvemos tu dinero.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-400">
                  Devolución gratis durante los primeros 30 días.
                </p>
              </div>
            </div>

            {/* Payment Methods Box */}
            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
              <h4 className="font-bold text-ink">Medios de pago disponibles</h4>
              <p className="text-[11px] text-gray-500">Tarjetas de crédito y débito</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-md bg-gray-100 font-extrabold text-[11px] text-blue-700">VISA</span>
                <span className="px-2 py-1 rounded-md bg-gray-100 font-extrabold text-[11px] text-red-600">Mastercard</span>
                <span className="px-2 py-1 rounded-md bg-gray-100 font-extrabold text-[11px] text-indigo-700">Amex</span>
                <span className="px-2 py-1 rounded-md bg-purple-100 font-extrabold text-[11px] text-purple-800">Yape</span>
                <span className="px-2 py-1 rounded-md bg-sky-100 font-extrabold text-[11px] text-sky-800">Plin</span>
                <span className="px-2 py-1 rounded-md bg-emerald-100 font-extrabold text-[11px] text-emerald-800">Efectivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products Section matching user requirement */}
      <div className="pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-ink">Productos similares</h2>
            <p className="text-xs text-gray-500">
              Mismo tipo de producto en otros modelos y marcas oficiales en Tingo María
            </p>
          </div>
          <Link
            to="/negocios"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver más del catálogo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid con diseño unificado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {similarProducts.map((simProd) => {
            const simStore = merchants.find((m) => m.id === simProd.merchantId);
            const isJustAdded = addedSimilarId === simProd.id;
            const discountPercent =
              simProd.originalPriceCents && simProd.originalPriceCents > simProd.priceCents
                ? Math.round(
                    ((simProd.originalPriceCents - simProd.priceCents) / simProd.originalPriceCents) *
                      100
                  )
                : null;

            return (
              <Link
                key={simProd.id}
                to={`/producto/${simProd.id}`}
                className="group bg-white rounded-2xl border border-pink-100/80 shadow-[0_2px_8px_rgba(190,24,93,0.04)] hover:border-primary-400 hover:shadow-card hover:-translate-y-1 overflow-hidden flex flex-col justify-between transition-all duration-200 text-left h-full"
              >
                {/* Product Image: De esquina a esquina */}
                <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100/70">
                  <img
                    src={simProd.imageUrl}
                    alt={simProd.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {discountPercent ? (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  ) : simProd.brand ? (
                    <span className="absolute top-2.5 right-2.5 bg-ink/85 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                      {simProd.brand}
                    </span>
                  ) : null}

                  <span className="absolute top-2.5 left-2.5 bg-primary/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Envío rápido
                  </span>
                </div>

                {/* Content Body */}
                <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                  <div>
                    {/* Product Name */}
                    <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2rem]">
                      {simProd.name}
                    </h4>

                    {/* Row: Perfil de tienda verificada (nombre en negro) a lado de Stock disponible */}
                    <div className="flex items-center justify-between gap-1.5 mt-2">
                      {/* Perfil de la tienda */}
                      <div
                        className="inline-flex items-center gap-1 text-[9px] text-gray-700 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 px-1.5 py-0.5 rounded-full transition-colors min-w-0 max-w-[58%]"
                        title={`${simStore?.name || 'Tienda Oficial'} • Tienda verificada`}
                      >
                        {simStore?.logoUrl ? (
                          <img
                            src={simStore.logoUrl}
                            alt={simStore.name}
                            className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                        <span className="font-extrabold text-[9.5px] text-black truncate leading-none">
                          {(simStore?.name || 'Tienda Oficial')
                            .replace(/Supermercado\s+/i, 'Super ')
                            .replace(/\s+Tingo María$/i, '')}
                        </span>
                        <BadgeCheck className="w-3 h-3 text-sky-500 fill-sky-100 flex-shrink-0" />
                      </div>

                      {/* Stock disponible */}
                      <div className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-100/80 px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0 animate-pulse" />
                        <span>Stock disponible</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-end justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100">
                    <div className="min-w-0">
                      <div className="h-3.5 flex items-center">
                        {discountPercent && simProd.originalPriceCents ? (
                          <span className="text-[10px] text-gray-400 line-through tabular-nums leading-none">
                            {formatCents(simProd.originalPriceCents)}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm sm:text-base font-black text-ink leading-tight block tabular-nums">
                        {formatCents(simProd.priceCents)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddSimilarProduct(e, simProd)}
                      title="Agregar al carrito"
                      aria-label={`Agregar ${simProd.name} al carrito`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-xs flex-shrink-0 ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                          : 'bg-primary hover:bg-primary-hover text-white hover:shadow-md'
                      }`}
                    >
                      {isJustAdded ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      </div>

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 shadow-floating flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-gray-500 font-medium block">Total</span>
          <span className="text-base font-black text-ink tabular-nums">
            {formatCents(product.priceCents * selectedQuantity)}
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
