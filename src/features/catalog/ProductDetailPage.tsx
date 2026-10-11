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

// Fotos de opiniones y compradores contextuales según el tipo de producto
function getCategoryReviewPhotos(product: Product): { url: string; alt: string; rating: number }[] {
  if (product.images && product.images.length >= 4) {
    return product.images.slice(0, 4).map((url, i) => ({
      url,
      alt: `Foto de cliente ${i + 1}`,
      rating: 5,
    }));
  }

  const name = product.name.toLowerCase();
  const cat = product.category;

  // 1. Smartphones / Celulares / Tecnología
  if (
    /smartphone|celular|telefono|xiaomi|redmi|poco|iphone|samsung|galaxy/i.test(name) ||
    (cat === 'emprendedores' && /celular|phone|pro/i.test(name))
  ) {
    return [
      {
        url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80',
        alt: 'Cliente probando celular en mano',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80',
        alt: 'Pantalla AMOLED del smartphone encendida',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&auto=format&fit=crop&q=80',
        alt: 'Módulo de cámaras traseras en alta definición',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&auto=format&fit=crop&q=80',
        alt: 'Equipo en su caja original con cargador y accesorios',
        rating: 5,
      },
    ];
  }

  // 2. Shampoos / Cuidado Personal / Farmacia
  if (/shampoo|champu|medicasp|sedal|pantene|head & shoulders|capilar/i.test(name) || cat === 'farmacias') {
    return [
      {
        url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=80',
        alt: 'Cliente mostrando frasco de shampoo recibido',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
        alt: 'Producto sellado en baño',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop&q=80',
        alt: 'Textura y consistencia del shampoo',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
        alt: 'Frasco sellado con tapa protegida',
        rating: 5,
      },
    ];
  }

  // 3. Abarrotes / Atún / Conservas / Supermercado
  if (/atun|filete|grated|conserva|aceite|leche|arroz|azucar/i.test(name) || cat === 'supermercados' || cat === 'bodegas') {
    return [
      {
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        alt: 'Plato preparado con el producto fresco',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
        alt: 'Ensalada servida con atún en mesa',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&auto=format&fit=crop&q=80',
        alt: 'Ingredientes y preparación en cocina',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
        alt: 'Presentación final servida en casa',
        rating: 5,
      },
    ];
  }

  // 4. Zapatillas / Moda / Ropa
  if (/zapatilla|calzado|vans|nike|polo|camisa|vestido|pantalon|ropa/i.test(name) || cat === 'ropa') {
    return [
      {
        url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&auto=format&fit=crop&q=80',
        alt: 'Calzado puesto probando talla',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80',
        alt: 'Detalle de costuras y suela',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&auto=format&fit=crop&q=80',
        alt: 'Calzado en suelo vista superior',
        rating: 5,
      },
      {
        url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&auto=format&fit=crop&q=80',
        alt: 'Combinación con outfit diario',
        rating: 5,
      },
    ];
  }

  // 5. Restaurantes / Gastronomía Amazónica
  return [
    {
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      alt: 'Plato caliente servido al llegar el delivery',
      rating: 5,
    },
    {
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      alt: 'Porción completa con guarnición y ají',
      rating: 5,
    },
    {
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80',
      alt: 'Carne ahumada y cecina en punto exacto',
      rating: 5,
    },
    {
      url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
      alt: 'Refresco natural helado',
      rating: 5,
    },
  ];
}

// Resumen inteligente generado por IA según el tipo de producto
function getCategoryAiSummary(product: Product): string {
  const name = product.name.toLowerCase();
  if (/smartphone|celular|xiaomi|redmi|poco|iphone|samsung|galaxy/i.test(name)) {
    return 'Los compradores destacan la fluidez del procesador, la alta nitidez de la pantalla y la duración de la batería para todo el día. Las cámaras toman fotos con excelente detalle y el equipo llega sellado en su caja con garantía oficial en Tingo María.';
  }
  if (/shampoo|champu|medicasp|sedal|pantene|head & shoulders/i.test(name)) {
    return 'Los clientes destacan el aroma agradable y duradero, la sensación de limpieza profunda desde la primera lavada y la suavidad en el cuero cabelludo. Excelente presentación sellada sin derrames.';
  }
  if (/atun|filete|grated|conserva/i.test(name)) {
    return 'Los compradores resaltan la frescura del pescado, la calidad del aceite vegetal y el tamaño de la porción. Muy práctico para preparar ensaladas y platos rápidos en familia en Leoncio Prado.';
  }
  if (product.category === 'ropa' || /zapatilla|calzado/i.test(name)) {
    return 'Las zapatillas destacan por su excelente comodidad y calidad. El diseño es atractivo y los materiales son de buena calidad, cumpliendo con las expectativas visuales y de uso. Además, las tallas son precisas, asegurando un ajuste perfecto.';
  }
  return 'Los clientes destacan la frescura de los ingredientes, excelente sazón y rápida entrega en Tingo María. El empaque llega en óptimas condiciones térmicas y la porción cumple con las expectativas descritas.';
}

interface SampleReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  variantText: string;
  comment: string;
  imageUrl?: string;
  location: string;
}

function getCategorySampleReviews(product: Product): SampleReview[] {
  const name = product.name.toLowerCase();
  const cat = product.category;

  if (/smartphone|celular|xiaomi|redmi|poco|iphone|samsung|galaxy/i.test(name)) {
    return [
      {
        id: 'r1',
        author: 'Carlos M.',
        date: 'Hace 2 semanas',
        rating: 5,
        variantText: 'Color: Negro Titanio · Capacidad: 256GB · Compra verificada',
        comment: 'Excelente rendimiento, la batería dura más de un día completo y la pantalla a 120Hz es súper fluida. En Tingo María me llegó en 30 minutos.',
        location: 'Cliente en Castillo Grande',
      },
      {
        id: 'r2',
        author: 'Valeria R.',
        date: 'Hace 1 mes',
        rating: 5,
        variantText: 'Color: Titanio Natural · Capacidad: 512GB · Compra verificada',
        comment: 'Las fotos de noche son espectaculares y carga en menos de 25 minutos con su cargador rápido. Viene completamente nuevo y sellado con garantía.',
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80',
        location: 'Cliente en Centro de Tingo María',
      },
    ];
  }

  if (/shampoo|champu|medicasp|sedal|pantene|head & shoulders/i.test(name) || cat === 'farmacias') {
    return [
      {
        id: 'r1',
        author: 'Marita G.',
        date: 'Hace 2 semanas',
        rating: 5,
        variantText: 'Presentación: 375ml · Compra verificada',
        comment: 'Deja el cabello súper limpio y con un aroma fresco que dura todo el día. Muy efectivo contra la resequedad.',
        location: 'Cliente en Rupa Rupa',
      },
      {
        id: 'r2',
        author: 'Renato S.',
        date: 'Hace 3 semanas',
        rating: 5,
        variantText: 'Presentación: 375ml · Compra verificada',
        comment: 'Llegó sellado con precinto de seguridad para evitar derrames en el delivery. 100% recomendado.',
        imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&auto=format&fit=crop&q=80',
        location: 'Cliente en Castillo Grande',
      },
    ];
  }

  if (/atun|filete|grated|conserva|aceite|leche/i.test(name) || cat === 'supermercados' || cat === 'bodegas') {
    return [
      {
        id: 'r1',
        author: 'Rosa P.',
        date: 'Hace 1 semana',
        rating: 5,
        variantText: 'Presentación: Lata 170g · Compra verificada',
        comment: 'Lomos enteros de atún en aceite vegetal de gran calidad y con fecha de vencimiento lejana. Muy rendidor para ensaladas.',
        location: 'Cliente en Centro de Tingo María',
      },
      {
        id: 'r2',
        author: 'Jorge T.',
        date: 'Hace 2 semanas',
        rating: 5,
        variantText: 'Presentación: Pack ahorro · Compra verificada',
        comment: 'Excelente sabor y frescura, llegó rápido y bien protegido junto con las compras del supermercado.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
        location: 'Cliente en Las Palmas',
      },
    ];
  }

  if (cat === 'ropa' || /zapatilla|calzado|vans|nike/i.test(name)) {
    return [
      {
        id: 'r1',
        author: 'Edwin B.',
        date: 'Hace 2 semanas',
        rating: 5,
        variantText: 'Color: Negro · Talla: 41 EU · Compra verificada',
        comment: 'Soy talla 41 y me quedó como un guante. La suela vulcanizada no resbala con la lluvia de la selva y la lona es resistente.',
        location: 'Cliente en Tingo María',
      },
      {
        id: 'r2',
        author: 'Andrea L.',
        date: 'Hace 1 mes',
        rating: 5,
        variantText: 'Color: Negro · Talla: 42 EU · Compra verificada',
        comment: 'Es encantadora esta zapatilla muy cómoda, la compré en mi talla habitual y el acabado es de primera calidad.',
        imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&auto=format&fit=crop&q=80',
        location: 'Cliente en Castillo Grande',
      },
    ];
  }

  return [
    {
      id: 'r1',
      author: 'Milagros Q.',
      date: 'Hace 1 semana',
      rating: 5,
      variantText: 'Porción: Personal · Compra verificada',
      comment: 'La cecina deliciosa con el auténtico ahumado tradicional tingalés. El tacacho en su punto y el ají de cocona buenísimo.',
      location: 'Cliente en Rupa Rupa',
    },
    {
      id: 'r2',
      author: 'Fernando M.',
      date: 'Hace 2 semanas',
      rating: 5,
      variantText: 'Porción: Familiar · Compra verificada',
      comment: 'Llegó calientito en envase térmico en menos de 25 minutos. El sabor es insuperable, volveré a pedir.',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
      location: 'Cliente en Centro de Tingo María',
    },
  ];
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

  // Fotos de reviews contextuales según el producto (celulares, shampoo, etc.)
  const reviewPhotos = useMemo(() => {
    return getCategoryReviewPhotos(product);
  }, [product]);

  // Resumen de opiniones IA contextual
  const aiSummary = useMemo(() => {
    return getCategoryAiSummary(product);
  }, [product]);

  // Reseñas de clientes contextuales al tipo de producto
  const sampleReviews = useMemo(() => {
    return getCategorySampleReviews(product);
  }, [product]);

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

            {/* AI Review Summary Card (Capture 3: Resumen de opiniones generado por IA) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50/90 to-pink-50/70 border border-primary-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>Resumen de opiniones generado por IA</span>
              </div>
              <p className="text-xs text-ink/80 leading-relaxed font-medium">
                {aiSummary}
              </p>
            </div>

            {/* Review Cards List */}
            <div className="space-y-4 pt-2">
              {sampleReviews.map((rev) => (
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
                      onClick={() => handleVoteUseful(rev.id)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        votedReviews[rev.id]
                          ? 'bg-primary-50 text-primary border-primary-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Útil {reviewHelpful[rev.id] || 4}</span>
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
                  : 19;
              const originalPrice =
                simProd.originalPriceCents || Math.round(simProd.priceCents * 1.22);
              const cuotaPrice = Math.round(simProd.priceCents / 6);

              return (
                <Link
                  key={simProd.id}
                  to={`/producto/${simProd.id}`}
                  className="group bg-white rounded-2xl border border-gray-200/90 hover:border-gray-300 shadow-subtle hover:shadow-card p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 text-left relative"
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
                        {formatCents(originalPrice)}
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-ink tabular-nums">
                          {formatCents(simProd.priceCents)}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                          {discountPercent}% OFF
                        </span>
                      </div>

                      {/* Cuotas sin interés */}
                      <p className="text-[11px] text-emerald-700 font-medium leading-tight pt-0.5">
                        6 cuotas de {formatCents(cuotaPrice)} sin interés
                      </p>

                      {/* Envío gratis */}
                      <p className="text-[11px] text-emerald-700 font-bold pt-0.5">
                        Envío gratis
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
