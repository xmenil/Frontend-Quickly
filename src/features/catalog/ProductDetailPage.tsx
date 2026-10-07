import React, { useState } from 'react';
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
} from 'lucide-react';

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

  // Gallery state
  const galleryImages = product?.images && product.images.length > 0
    ? product.images
    : [
        product?.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
      ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product?.variants && product.variants.length > 0 ? product.variants[0]?.id || '' : ''
  );
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

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

  // Similar products in same category or merchant
  const similarProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.merchantId === product.merchantId))
    .slice(0, 4);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-28 sm:pb-8">
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

      {/* Breadcrumbs matching Capture 2 */}
      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/"
            className="text-primary hover:underline font-bold flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Volver
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/negocios" className="hover:text-ink">
            {merchant.category.toUpperCase()}
          </Link>
          <span className="text-gray-300">&gt;</span>
          <Link to={`/negocios/${merchant.id}`} className="hover:text-ink">
            {merchant.name}
          </Link>
          <span className="text-gray-300">&gt;</span>
          <span className="text-ink font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={handleShare}
            className="text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? '¡Enlace copiado!' : 'Compartir'}</span>
          </button>
          <Link
            to={`/negocios/${merchant.id}`}
            className="text-gray-600 hover:text-primary transition-colors hidden sm:inline"
          >
            Ver más de esta tienda
          </Link>
        </div>
      </div>

      {/* Main Product Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Gallery & Product Info */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-subtle p-4 sm:p-6 space-y-8">
          {/* Gallery Row: Vertical Thumbnails + Big Preview */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
            {/* Vertical Thumbnails List */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible w-full sm:w-20 flex-shrink-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setActiveImageIndex(idx)}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-gray-50 flex-shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Vista ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {idx === 1 && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Main Image Display */}
            <div className="relative flex-1 aspect-square w-full max-w-[500px] mx-auto rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-gray-100 group">
              <img
                src={galleryImages[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />

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

            {/* Variants Picker (if applicable) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <label className="font-bold text-ink block">
                  Talla / Selección disponible:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        selectedVariantId === v.id
                          ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
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
              Quienes vieron este producto también compraron en Tingo María
            </p>
          </div>
          <Link
            to="/negocios"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver más del catálogo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {similarProducts.map((simProd) => (
            <Link
              key={simProd.id}
              to={`/producto/${simProd.id}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] w-full bg-gray-50 overflow-hidden relative">
                <img
                  src={simProd.imageUrl}
                  alt={simProd.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Envío rápido
                </span>
              </div>

              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-1">
                    {simProd.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium line-clamp-1">
                    {merchant.name}
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-ink mt-1">
                    {formatCents(simProd.priceCents)}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] text-emerald-600 font-bold block">
                    Llega hoy en Tingo María
                  </span>
                </div>
              </div>
            </Link>
          ))}
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
