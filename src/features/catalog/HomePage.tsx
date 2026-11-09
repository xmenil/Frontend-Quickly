import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { catalogPlaceholder, catalogImage } from '../../lib/catalogImage';
import { catalogApi, CatalogProduct, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { useRemote } from '../operations/shared';
import fondo2Img from '../../assets/img/fondo2.webp';
import bannerZapatillasImg from '../../assets/img/banner-zapatillas.jpg';
import {
  Store,
  ArrowRight,
  Check,
  ChevronRight,
  ChevronLeft,
  Bike,
  Loader2,
  MapPin,
  Banknote,
  ShoppingCart,
  ShieldCheck,
  Gift,
  Sparkles,
} from 'lucide-react';

function extractBrandOrStore(p: CatalogProduct): string {
  if (p.brand && p.brand.trim()) return p.brand.toUpperCase();
  const name = (p.name || '').toUpperCase();
  const brands = [
    'NIKE', 'ADIDAS', 'VANS', 'PARAÍSO', 'MUEBLES TINGO', 'CANNON',
    'XIAOMI', 'SAMSUNG', 'APPLE', 'HONOR', 'HUAWEI', 'LENOVO', 'HP', 'LG',
    'OSTER', 'PHILIPS', 'MABE', 'INDURAMA', 'HAYLOU', 'STANDFORD', 'HOT WHEELS',
    'MAC', 'ESTÉE LAUDER', 'ESTEE LAUDER', 'LANCÔME', 'LANCOME'
  ];
  for (const b of brands) {
    if (name.includes(b)) return b;
  }
  return (p.storeName || 'TIENDA LOCAL').toUpperCase();
}

function getProductImageUrl(p: CatalogProduct): string {
  const name = (p.name || '').toLowerCase();
  if (name.includes('refrigeradora') || name.includes('refrigerador') || name.includes('mabe')) {
    return 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=900&auto=format&fit=crop&q=80';
  }
  const raw = p.images?.[0]?.url;
  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('placeholder')) {
    return catalogImage(raw);
  }

  // Laptops y cómputo
  if (name.includes('macbook') || name.includes('neo 13')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('loq') || name.includes('gamer')) {
    return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('hp') || name.includes('fc0287la')) {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('laptop') || name.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop&q=80';
  }

  // Belleza y cosméticos
  if (name.includes('teddy party') || (name.includes('mac') && name.includes('labiales'))) {
    return 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('sumptuous') || name.includes('estée') || name.includes('estee') || name.includes('máscara') || name.includes('mascara')) {
    return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('living legends') || name.includes('gloss')) {
    return 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=900&auto=format&fit=crop&q=80';
  }

  // Juguetes y regalos
  if (name.includes('hot wheels')) {
    return 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('pikachu') || name.includes('peluche')) {
    return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('whisky') || name.includes('black label')) {
    return 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=900&auto=format&fit=crop&q=80';
  }

  // Zapatos y Calzado
  if (name.includes('nike')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('adidas')) {
    return 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('vans') || name.includes('zapatillas')) {
    return 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('botines') || name.includes('cuero')) {
    return 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('sandalias')) {
    return 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=900&auto=format&fit=crop&q=80';
  }

  // Camas y Dormitorio
  if (name.includes('paraíso') || (name.includes('colchón') && name.includes('royal'))) {
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('tarima') || name.includes('cama')) {
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('colchón') || name.includes('inflable')) {
    return 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('sábanas') || name.includes('sabanas')) {
    return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&auto=format&fit=crop&q=80';
  }

  // Ropa y Moda
  if (name.includes('casaca') || name.includes('bomber')) {
    return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('vestido')) {
    return 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('pantalon') || name.includes('palazzo') || name.includes('denim')) {
    return 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('polo')) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('sombrero')) {
    return 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=900&auto=format&fit=crop&q=80';
  }

  // Tecnología
  if (name.includes('samsung') && name.includes('s24')) {
    return 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('xiaomi') || name.includes('poco') || name.includes('15t')) {
    return 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('celular') || name.includes('smartphone') || name.includes('a55')) {
    return 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('smartwatch') || name.includes('fit3') || name.includes('reloj')) {
    return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=900&auto=format&fit=crop&q=80';
  }

  // Electrohogar
  if (name.includes('tv') || name.includes('televisor')) {
    return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('cocina') || name.includes('indurama')) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('licuadora') || name.includes('oster')) {
    return 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('freidora') || name.includes('airfryer')) {
    return 'https://images.unsplash.com/photo-1585695085337-6775384e442f?w=900&auto=format&fit=crop&q=80';
  }

  // Farmacia y Cuidado
  if (name.includes('bloqueador') || name.includes('solar')) {
    return 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('repelente')) {
    return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=900&auto=format&fit=crop&q=80';
  }
  if (name.includes('chocolate') || name.includes('cacao') || name.includes('bombones') || name.includes('trufas')) {
    return 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=900&auto=format&fit=crop&q=80';
  }

  return catalogPlaceholder;
}

function getProductDiscountPercent(p: CatalogProduct): number {
  const name = (p.name || '').toLowerCase();
  if (name.includes('celular') || name.includes('smartphone') || name.includes('laptop') || name.includes('macbook')) return 25;
  if (name.includes('nike') || name.includes('adidas') || name.includes('vans') || name.includes('zapatillas')) return 35;
  if (name.includes('pantalon') || name.includes('casaca') || name.includes('vestido') || name.includes('polo')) return 30;
  if (name.includes('paraíso') || name.includes('cama') || name.includes('colchón')) return 20;
  if (name.includes('tv') || name.includes('cocina') || name.includes('licuadora')) return 25;
  if (name.includes('labiales') || name.includes('máscara') || name.includes('gloss') || name.includes('mac')) return 34;
  return 20;
}

interface BannerSlideConfig {
  id: string;
  categoryTag: string;
  titleLine1: string;
  titleLine2: string;
  bannerImg: string;
  buttonText: string;
  linkUrl: string;
  alt: string;
  layout: 'left-dark' | 'center-light';
}

const BANNER_SLIDES: BannerSlideConfig[] = [
  {
    id: 'tecnologia',
    categoryTag: 'TECNOLOGÍA',
    titleLine1: 'Aquí encuentras las',
    titleLine2: 'mejores tecnologías',
    bannerImg: fondo2Img,
    buttonText: '¡VER TODO!',
    linkUrl: '/negocios?q=celular',
    alt: 'Aquí encuentras las mejores tecnologías en Tingo María',
    layout: 'left-dark',
  },
  {
    id: 'shoes',
    categoryTag: 'CALZADO URBANO',
    titleLine1: 'Aquí encuentras las',
    titleLine2: 'mejores zapatillas',
    bannerImg: bannerZapatillasImg,
    buttonText: '¡VER TODO!',
    linkUrl: '/negocios?q=zapatillas',
    alt: 'Aquí encuentras las mejores zapatillas urbanas y deportivas',
    layout: 'center-light',
  },
];

// Perfiles fotográficos de comercios de Tingo María para cubrir tarjetas completas
const STORE_COVER_IMAGES: Record<string, string> = {
  'botica san martín': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=700&auto=format&fit=crop&q=80',
  'cacao & café tingo': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&auto=format&fit=crop&q=80',
  'carsa tingo maría': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80',
  'el encanto amazónico': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80',
  'la selva gourmet': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80',
  'restaurante & pollería rubén': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=700&auto=format&fit=crop&q=80',
  'tiendas efe tingo maría': 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80',
  'moda selva tingo': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80',
  'muebles tingo': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
};

function getStoreCoverImage(st: { name: string; bannerUrl?: string | null; category_code?: string }): string {
  if (st.bannerUrl && st.bannerUrl.startsWith('http')) return st.bannerUrl;
  const n = st.name.toLowerCase().trim();
  for (const [key, url] of Object.entries(STORE_COVER_IMAGES)) {
    if (n.includes(key) || key.includes(n)) return url;
  }
  const cat = (st.category_code || '').toLowerCase();
  if (cat.includes('farmacia') || cat.includes('salud') || cat.includes('botica')) {
    return 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('cafe') || cat.includes('café') || cat.includes('cacao') || cat.includes('emprendedor')) {
    return 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('electro') || cat.includes('tecno') || cat.includes('hogar')) {
    return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('restaurante') || cat.includes('comida') || cat.includes('gastronom')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&auto=format&fit=crop&q=80';
  }
  if (cat.includes('moda') || cat.includes('ropa') || cat.includes('calzado')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=700&auto=format&fit=crop&q=80';
}

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const giftScrollRef = useRef<HTMLDivElement>(null);

  // Recursos remotos conectados a PostgreSQL / Supabase
  const categoriesResource = useRemote('home-categories', signal => catalogApi.categories(signal));
  const storesResource = useRemote('home-stores', signal => catalogApi.stores(signal));
  
  // Paginación exhaustiva para cargar todo el catálogo multitienda (hasta 150 productos)
  const productsResource = useRemote('home-products', async (signal) => {
    const p1 = await catalogApi.search({ limit: 50 }, signal);
    let allItems = [...p1.items];
    if (p1.nextCursor) {
      try {
        const p2 = await catalogApi.search({ limit: 50, cursor: p1.nextCursor }, signal);
        allItems = allItems.concat(p2.items);
        if (p2.nextCursor) {
          const p3 = await catalogApi.search({ limit: 50, cursor: p2.nextCursor }, signal);
          allItems = allItems.concat(p3.items);
        }
      } catch {
        // En caso de corte en cursores, conservamos lo obtenido
      }
    }
    return { items: allItems, nextCursor: null };
  });

  const categories = categoriesResource.data || [];
  const stores = storesResource.data || [];
  const allProducts = productsResource.data?.items || [];

  // Estados locales
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [giftFilter, setGiftFilter] = useState<'all' | '49' | '99' | '199' | 'more'>('all');

  // Auto-rotación del carrusel cada 5.5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
  };

  const activeSlide = BANNER_SLIDES[currentSlide] || BANNER_SLIDES[0];

  // Selección de Regalos Populares y Reconocidos con filtro de presupuesto (Imagen 3)
  const giftProducts = useMemo(() => {
    const recognized = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('set de labiales') || n.includes('máscara') || n.includes('mascara') ||
        n.includes('mac') || n.includes('estée') || n.includes('estee') ||
        n.includes('hot wheels') || n.includes('pikachu') || n.includes('peluche') ||
        n.includes('chocolate') || n.includes('bombones') || n.includes('trufas') ||
        n.includes('whisky') || n.includes('smartwatch') || n.includes('fit3') ||
        n.includes('licuadora') || n.includes('freidora') || n.includes('vans') ||
        n.includes('nike') || n.includes('iphone') || n.includes('samsung galaxy')
      );
    });

    return recognized.filter(p => {
      const sku = preferredSku(p);
      const price = sku ? sku.priceCents / 100 : 0;
      if (giftFilter === '49') return price <= 49;
      if (giftFilter === '99') return price <= 99;
      if (giftFilter === '199') return price <= 199;
      if (giftFilter === 'more') return price > 199;
      return true;
    });
  }, [allProducts, giftFilter]);

  // Productos multitienda y multicategoría completamente mezclados (sin predominar una sola tienda ni categoría)
  const mixedDiverseProducts = useMemo(() => {
    if (allProducts.length === 0) return [];

    const byCategory = new Map<string, CatalogProduct[]>();
    for (const p of allProducts) {
      if (!purchasableSku(p)) continue;
      const cat = p.categoryId || 'other';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(p);
    }

    const result: CatalogProduct[] = [];
    const catArrays = Array.from(byCategory.values());
    const maxLen = Math.max(...catArrays.map(a => a.length), 0);

    for (let i = 0; i < maxLen && result.length < 16; i++) {
      for (const arr of catArrays) {
        if (arr[i] && result.length < 16) {
          if (!result.some(r => r.id === arr[i].id)) {
            result.push(arr[i]);
          }
        }
      }
    }

    return result;
  }, [allProducts]);

  // Manejo de agregar al carrito
  const handleAddToCart = (e: React.MouseEvent, product: CatalogProduct) => {
    e.stopPropagation();
    e.preventDefault();

    const sku = purchasableSku(product);
    if (!sku) return;

    try {
      addCatalogProduct(product, sku.id, 1);
      setAddError('');
      setAddedProductId(product.id);
      setTimeout(() => {
        setAddedProductId((curr) => (curr === product.id ? null : curr));
      }, 1500);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'No se pudo agregar al carrito.');
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#f8f9fa] select-none min-h-screen">

      {/* 1. Banner Panorámico Full-Width estilo Metro / Falabella (Ejemplo Imagen 1) */}
      <section className="relative w-full overflow-hidden bg-gray-100 h-[160px] sm:h-[200px] md:h-[240px] lg:h-[265px] xl:h-[285px] select-none">
        <div
          onClick={() => navigate(activeSlide.linkUrl)}
          className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-pointer select-none group"
        >
          {/* Imagen de banner de ancho completo sin productos pegados */}
          <img
            src={activeSlide.bannerImg}
            alt={activeSlide.alt}
            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
            loading="eager"
          />

          {/* Contenido tipográfico y botón sobre el banner estilo Imagen 2 */}
          {activeSlide.layout === 'left-dark' ? (
            <>
              {/* Gradiente oscuro a la izquierda que se desvanece suavemente hacia el centro-derecha estilo Metro */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 via-35% sm:via-40% to-transparent pointer-events-none" />

              {/* Bloque de texto y botón idéntico a la Imagen 2 */}
              <div className="absolute inset-y-0 left-0 z-20 flex flex-col justify-center pl-10 sm:pl-16 md:pl-20 lg:pl-24 pr-4 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl pointer-events-none">
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-300 tracking-[0.22em] uppercase mb-1 sm:mb-1.5 select-none drop-shadow-xs">
                  {activeSlide.categoryTag}
                </span>

                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-md mb-2.5 sm:mb-3.5 select-none">
                  {activeSlide.titleLine1} <br />
                  {activeSlide.titleLine2}
                </h2>

                <div className="pointer-events-auto flex items-center gap-2">
                  <Link
                    to={activeSlide.linkUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 group/btn cursor-pointer"
                  >
                    <span className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-[11px] sm:text-xs md:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg tracking-wider uppercase transition-transform group-hover/btn:scale-105 active:scale-95">
                      {activeSlide.buttonText}
                    </span>
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center shadow-lg transition-transform group-hover/btn:scale-105 active:scale-95">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Sutil gradiente para legibilidad en zapatillas */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white/10 to-black/5 pointer-events-none" />

              <div className="relative z-10 max-w-xl mx-auto px-6 text-center flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 py-3 pointer-events-none">
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-600 tracking-[0.22em] uppercase select-none">
                  {activeSlide.categoryTag}
                </span>

                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-950 leading-tight select-none">
                  {activeSlide.titleLine1} <br className="hidden sm:inline" /> {activeSlide.titleLine2}
                </h2>

                <div className="pt-1 sm:pt-2 pointer-events-auto flex items-center justify-center gap-2">
                  <Link
                    to={activeSlide.linkUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 group/btn cursor-pointer"
                  >
                    <span className="inline-flex items-center justify-center bg-gray-950 hover:bg-black text-white font-extrabold text-[11px] sm:text-xs md:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg tracking-wider uppercase transition-transform group-hover/btn:scale-105 active:scale-95">
                      {activeSlide.buttonText}
                    </span>
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-950 hover:bg-black text-white flex items-center justify-center shadow-lg transition-transform group-hover/btn:scale-105 active:scale-95">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Flecha Anterior flotante estilo Imagen 1 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevSlide();
          }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Diapositiva anterior"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Flecha Siguiente flotante estilo Imagen 1 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextSlide();
          }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Siguiente diapositiva"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Paginación de puntos centrada en la base estilo Imagen 1 */}
        <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-30 pointer-events-auto">
          {BANNER_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-primary' : 'w-1.5 bg-gray-400/80 hover:bg-gray-600'
              }`}
              aria-label={`Ir a ${slide.titleLine1} ${slide.titleLine2}`}
            />
          ))}
        </div>
      </section>

      {/* Alerta de error de carrito */}
      {addError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <p role="alert" className="text-xs font-bold text-destructive bg-red-50 p-3 rounded-xl border border-red-200">
            {addError}
          </p>
        </div>
      )}

      {/* 2. Barra de Garantías y Beneficios Estilo Tarjetas Oficiales Integradas */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#eaeff2] hover:bg-[#e2e8ec] rounded-2xl p-4 transition-all flex items-center justify-between group cursor-pointer border-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-950 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Banknote className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="font-black text-xs sm:text-sm text-gray-950 tracking-tight">Pago contra entrega</p>
                <p className="text-[11px] text-gray-600 font-medium">Efectivo o transferencia al recibir</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all flex-shrink-0 stroke-[2.5]" />
          </div>

          <div className="bg-[#eaeff2] hover:bg-[#e2e8ec] rounded-2xl p-4 transition-all flex items-center justify-between group cursor-pointer border-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-950 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Store className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="font-black text-xs sm:text-sm text-gray-950 tracking-tight">Compra y retira</p>
                <p className="text-[11px] text-gray-600 font-medium">En más de 400 comercios locales</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all flex-shrink-0 stroke-[2.5]" />
          </div>

          <div className="bg-[#eaeff2] hover:bg-[#e2e8ec] rounded-2xl p-4 transition-all flex items-center justify-between group cursor-pointer border-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-950 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Bike className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="font-black text-xs sm:text-sm text-gray-950 tracking-tight">Envío hoy mismo</p>
                <p className="text-[11px] text-gray-600 font-medium">Entrega express a domicilio en tu puerta</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all flex-shrink-0 stroke-[2.5]" />
          </div>

          <div className="bg-[#eaeff2] hover:bg-[#e2e8ec] rounded-2xl p-4 transition-all flex items-center justify-between group cursor-pointer border-0 select-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-950 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <p className="font-black text-xs sm:text-sm text-gray-950 tracking-tight">Garantía oficial</p>
                <p className="text-[11px] text-gray-600 font-medium">Cambio y respaldo de tiendas físicas</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-950 group-hover:translate-x-0.5 transition-all flex-shrink-0 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. Tiendas y Comercios Oficiales de la Ciudad (Imagen 2) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-7 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-gray-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              Tiendas oficiales de la ciudad
            </h2>
            <p className="text-xs text-gray-500">
              Comercios destacados en Rupa Rupa y Castillo Grande
            </p>
          </div>

          <Link
            to="/negocios"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver más tiendas</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Tiendas principales con perfil de imagen de fondo que cubre la tarjeta completa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stores.slice(0, 4).map((st) => {
            const coverImg = getStoreCoverImage(st);
            return (
              <Link
                key={st.id}
                to={`/negocios/${st.id}`}
                className="relative group rounded-2xl overflow-hidden h-36 sm:h-44 flex flex-col justify-between p-3.5 sm:p-4 text-left transition-all duration-300 hover:shadow-card hover:-translate-y-1 cursor-pointer select-none border border-gray-200/50"
              >
                {/* Imagen de fondo que cubre la tarjeta completa */}
                <img
                  src={coverImg}
                  alt={st.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Capa de contraste / degradado oscuro para que el texto sea perfectamente legible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 group-hover:via-black/60 transition-colors" />

                {/* Header de la tarjeta sobre la imagen: Badge de estado y logo */}
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`font-black text-[10px] tracking-wide px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                      st.isOpen
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-black/65 text-gray-300'
                    }`}
                  >
                    {st.isOpen ? 'Abierto ahora' : 'Cerrado'}
                  </span>

                  <div className="w-7 h-7 rounded-lg bg-white/95 text-emerald-900 flex items-center justify-center shadow-xs">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Footer de la tarjeta sobre la imagen: Nombre de la tienda, categoría y Entrar > */}
                <div className="relative z-10 pt-2">
                  <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider line-clamp-1 mb-0.5">
                    {st.category_code}
                  </p>
                  <h4 className="font-black text-xs sm:text-sm text-white group-hover:text-emerald-200 transition-colors truncate drop-shadow-xs">
                    {st.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-200">
                    <span className="font-semibold text-white/90">Ver catálogo</span>
                    <span className="font-bold text-white group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Entrar <ChevronRight className="w-3 h-3 text-emerald-400" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Sección Encuentra el regalo ideal (Integrada sin fondo de tarjeta blanca) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-gray-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              Encuentra el regalo ideal
            </h2>
            <p className="text-xs text-gray-500">
              Selección de las mejores marcas y detalles para sorprender hoy
            </p>
          </div>

          {/* Pastillas de presupuesto estilo formal limpio */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Todos' },
              { id: '49', label: 'Hasta S/ 49' },
              { id: '99', label: 'Hasta S/ 99' },
              { id: '199', label: 'Hasta S/ 199' },
              { id: 'more', label: 'Más de S/ 200' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setGiftFilter(btn.id as any)}
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
                  giftFilter === btn.id
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Carrusel horizontal integrado con flechas de navegación */}
        <div className="relative group/gift">
          <button
            type="button"
            onClick={() => {
              giftScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
            }}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white text-gray-900 shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 hidden sm:flex"
            aria-label="Anterior regalo"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              giftScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
            }}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white text-gray-900 shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 hidden sm:flex"
            aria-label="Siguiente regalo"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div
            ref={giftScrollRef}
            className="flex items-stretch gap-3 sm:gap-5 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth"
          >
            {giftProducts.map((p) => {
              const sku = preferredSku(p);
              const price = sku ? sku.priceCents : 0;
              const hasStock = !!purchasableSku(p);
              const pImg = getProductImageUrl(p);
              const brand = extractBrandOrStore(p);
              const discountPct = getProductDiscountPercent(p);
              const originalPrice = price > 0 ? Math.round(price / (1 - discountPct / 100)) : 0;
              const isJustAdded = addedProductId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => navigate('/producto/' + p.id)}
                  className="w-44 sm:w-52 flex-shrink-0 flex flex-col justify-between p-1.5 sm:p-2.5 rounded-xl hover:bg-gray-50/60 transition-all cursor-pointer group/card text-left bg-transparent"
                >
                  <div>
                    {/* Imagen integrada directamente a la pantalla sin marco blanco */}
                    <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-xl bg-transparent">
                      <img
                        src={pImg}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Badge ENVIO HOY */}
                    <div className="mb-1">
                      <span className="bg-[#4b5563] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs inline-block">
                        ENVÍO HOY
                      </span>
                    </div>

                    {/* Marca en mayúsculas negrita */}
                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-900 line-clamp-1">
                      {brand}
                    </p>

                    {/* Nombre del producto */}
                    <h3 className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug my-1 group-hover/card:text-primary transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  {/* Precios y botón de agregar */}
                  <div className="pt-1 mt-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-black text-gray-900 tabular-nums">
                          {sku ? money(price) : 'S/ --'}
                        </span>
                        {discountPct > 0 && (
                          <span className="bg-[#1f2937] text-white text-[10px] font-bold px-1 py-0.5 rounded-xs">
                            -{discountPct}%
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(e, p);
                        }}
                        disabled={!hasStock}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : hasStock
                            ? 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        aria-label={`Agregar ${p.name}`}
                      >
                        {isJustAdded ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {originalPrice > price && (
                      <p className="text-[11px] text-gray-400 line-through tabular-nums mt-0.5">
                        {money(originalPrice)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Bloques Promocionales Informativos (Sin mencionar la palabra categoría) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Bloque 1: Zapatillas */}
          <div
            onClick={() => navigate('/negocios?q=zapatillas')}
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#172554] to-[#1e3a8a] text-white p-5 sm:p-6 flex items-center justify-between cursor-pointer shadow-2xs hover:shadow-card transition-all"
          >
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-sky-300 uppercase">
                VANS • NIKE • ADIDAS • URBANAS
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                Tus zapatillas favoritas
              </h3>
              <p className="text-xs text-sky-100 font-medium">
                Hasta <span className="font-black text-amber-300">40% dcto.</span> en modelos seleccionados
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-white text-gray-900 px-4 py-1.5 rounded-full group-hover:bg-sky-50 transition-colors">
                  Ver modelos <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>

            <div className="w-28 sm:w-36 aspect-square rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80"
                alt="Zapatillas favoritas"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Bloque 2: Juguetes y regalos */}
          <div
            onClick={() => navigate('/negocios?q=juguetes')}
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#701a75] to-[#86198f] text-white p-5 sm:p-6 flex items-center justify-between cursor-pointer shadow-2xs hover:shadow-card transition-all"
          >
            <div className="relative z-10 max-w-[65%] space-y-1">
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-pink-300 uppercase">
                HOT WHEELS • POKÉMON • REGALOS
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                Miles de juguetes y diversión
              </h3>
              <p className="text-xs text-pink-100 font-medium">
                Hasta <span className="font-black text-amber-300">35% dcto.</span> para todas las edades
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-white text-gray-900 px-4 py-1.5 rounded-full group-hover:bg-pink-50 transition-colors">
                  Ver juguetes <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>

            <div className="w-28 sm:w-36 aspect-square rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80"
                alt="Miles de juguetes"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </div>

      {/* 6. Productos Variados y Mezclados de Diversas Tiendas (Integrados sin fondo blanco) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              Ofertas y Productos Destacados de Tingo María
            </h2>
            <p className="text-xs text-gray-500">
              Variedad multitienda: tecnología, moda, calzado, farmacia, camping y artesanías locales
            </p>
          </div>

          <Link
            to="/negocios"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todo el catálogo</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading state */}
        {productsResource.loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-gray-500 bg-white rounded-2xl border border-gray-200">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span>Cargando productos de Tingo María...</span>
          </div>
        ) : mixedDiverseProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
            <p className="font-bold text-sm text-gray-800">No hay productos disponibles por el momento</p>
            <p className="text-gray-500">Pronto agregaremos más comercios a la plataforma.</p>
          </div>
        ) : (
          <>
            {/* Grid de productos sin marco ni fondo, directo al detalle del producto */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {mixedDiverseProducts.map((item) => {
                const isJustAdded = addedProductId === item.id;
                const sku = preferredSku(item);
                const price = sku ? sku.priceCents : 0;
                const hasStock = !!purchasableSku(item);
                const productImg = getProductImageUrl(item);
                const brand = extractBrandOrStore(item);
                const discountPct = getProductDiscountPercent(item);
                const originalPrice = price > 0 ? Math.round(price / (1 - discountPct / 100)) : 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate('/producto/' + item.id)}
                    className="group cursor-pointer flex flex-col justify-between text-left p-1.5 sm:p-2.5 transition-all duration-200 hover:bg-gray-50/60 rounded-xl bg-transparent"
                  >
                    <div>
                      {/* Imagen del producto integrada a la página, sin fondo blanco ni marcos */}
                      <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-xl bg-transparent">
                        <img
                          src={productImg}
                          alt={item.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Badge ENVIO HOY estilo Falabella */}
                      <div className="mb-1">
                        <span className="bg-[#4b5563] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-xs inline-block">
                          ENVÍO HOY
                        </span>
                      </div>

                      {/* Marca en mayúsculas negrita */}
                      <p className="text-[11px] font-black uppercase tracking-wider text-gray-900 line-clamp-1">
                        {brand}
                      </p>

                      {/* Título del producto */}
                      <h3 className="text-xs sm:text-[13px] text-gray-700 font-medium line-clamp-2 leading-snug my-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                    </div>

                    {/* Fila de precio con porcentaje de descuento y botón de carrito */}
                    <div className="pt-1 mt-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-black text-gray-900 tabular-nums">
                            {sku ? money(price) : 'S/ --'}
                          </span>
                          {discountPct > 0 && (
                            <span className="bg-[#1f2937] text-white text-[10px] font-bold px-1 py-0.5 rounded-xs">
                              -{discountPct}%
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(e, item);
                          }}
                          disabled={!hasStock}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : hasStock
                              ? 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          aria-label={`Agregar ${item.name} al carrito`}
                        >
                          {isJustAdded ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {originalPrice > price && (
                        <p className="text-[11px] text-gray-400 line-through tabular-nums mt-0.5">
                          {money(originalPrice)}
                        </p>
                      )}

                      <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
                        {item.storeName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón integrado para ver más productos con estilo plomo */}
            <div className="flex justify-center pt-4 pb-2">
              <Link
                to="/negocios"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#eaeff2] hover:bg-[#e2e8ec] text-gray-950 font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span>Explorar todos los productos del catálogo ({allProducts.length})</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 7. Secciones Informativas Integradas con Fondo Plomo y Tipografía Oechsle (Imagen 1 y 2) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
        <section className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            to="/registro/comercio"
            className="bg-[#eaeff2] hover:bg-[#e2e8ec] rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-3 transition-all duration-300 group block select-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center font-bold group-hover:scale-105 transition-transform shadow-xs">
              <Store className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight leading-snug">
              ¿Tienes un negocio en Tingo María?
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
              Afilia tu restaurante, bodega o tienda a Quickly y recibe pedidos en línea de toda la ciudad.
            </p>
            <span className="inline-flex items-center gap-2 font-black text-xs sm:text-sm text-gray-950 group-hover:text-primary transition-colors pt-1">
              <span>Afiliar mi negocio</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            to="/registro/repartidor"
            className="bg-[#eaeff2] hover:bg-[#e2e8ec] rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-3 transition-all duration-300 group block select-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center font-bold group-hover:scale-105 transition-transform shadow-xs">
              <Bike className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight leading-snug">
              Reparte en tu ciudad
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
              Genera ingresos entregando pedidos en moto, bicicleta o mototaxi en todo el valle del Huallaga.
            </p>
            <span className="inline-flex items-center gap-2 font-black text-xs sm:text-sm text-gray-950 group-hover:text-primary transition-colors pt-1">
              <span>Solicitar afiliación como repartidor</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </section>
      </div>

    </div>
  );
}
