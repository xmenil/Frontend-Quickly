import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { catalogPlaceholder, catalogImage } from '../../lib/catalogImage';
import { catalogApi, CatalogProduct, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { useRemote } from '../operations/shared';
import { ProductDetailModal } from './ProductDetailModal';
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
} from 'lucide-react';

function extractBrandOrStore(p: CatalogProduct): string {
  if (p.brand && p.brand.trim()) return p.brand.toUpperCase();
  const name = (p.name || '').toUpperCase();
  const brands = ['XIAOMI', 'SAMSUNG', 'APPLE', 'HONOR', 'HUAWEI', 'LENOVO', 'LG', 'OSTER', 'PHILIPS', 'VANS', 'MABE', 'INDURAMA', 'HAYLOU', 'STANDFORD', 'HOT WHEELS'];
  for (const b of brands) {
    if (name.includes(b)) return b;
  }
  return (p.storeName || 'TIENDA LOCAL').toUpperCase();
}

function getProductSpecBadges(p: CatalogProduct): [string, string] {
  const name = (p.name || '').toLowerCase();

  if (name.includes('celular') || name.includes('smartphone') || name.includes('redmi') || name.includes('samsung') || name.includes('galaxy') || name.includes('xiaomi') || name.includes('honor')) {
    if (name.includes('256gb')) return ['256GB ROM', '8GB RAM'];
    if (name.includes('128gb')) return ['128GB ROM', '6GB RAM'];
    return ['PANTALLA AMOLED', 'OCTA CORE'];
  }
  if (name.includes('smartwatch') || name.includes('reloj') || name.includes('band')) {
    return ['BLUETOOTH', 'RESISTENTE AL AGUA'];
  }
  if (name.includes('laptop') || name.includes('notebook')) {
    return ['16GB RAM', '512GB SSD'];
  }
  if (name.includes('tv') || name.includes('televisor')) {
    return ['4K ULTRA HD', 'SMART TV'];
  }
  if (name.includes('zapatillas') || name.includes('vans')) {
    return ['URBANO', 'SUELA ANTIDESLIZANTE'];
  }
  if (name.includes('pantalon') || name.includes('palazzo') || name.includes('denim')) {
    return ['DENIM FRESCO', 'TIRO ALTO'];
  }
  if (name.includes('polo') || name.includes('ropa')) {
    return ['100% ALGODÓN', 'ALTA CALIDAD'];
  }
  if (name.includes('bloqueador') || name.includes('solar')) {
    return ['FPS 50+', 'RESISTENTE AL AGUA'];
  }
  if (name.includes('repelente')) {
    return ['PROTECCIÓN SELVA', 'SPRAY 150ML'];
  }
  if (name.includes('termometro')) {
    return ['DIGITAL INFRARROJO', 'ALTA PRECISIÓN'];
  }
  if (name.includes('licuadora')) {
    return ['VASO DE VIDRIO', 'MOTOR POTENTE'];
  }
  if (name.includes('cocina') || name.includes('camping')) {
    return ['PORTÁTIL', 'IDEAL CAMPING'];
  }
  return ['ENVÍO EXPRESS', 'EN STOCK'];
}

function getProductImageUrl(p: CatalogProduct): string {
  const raw = p.images?.[0]?.url;
  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('placeholder')) {
    return catalogImage(raw);
  }
  const name = (p.name || '').toLowerCase();
  if (name.includes('samsung galaxy') || name.includes('a55')) {
    return 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('celular') || name.includes('smartphone') || name.includes('redmi') || name.includes('xiaomi')) {
    return 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('smartwatch') || name.includes('huawei') || name.includes('reloj') || name.includes('band')) {
    return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('laptop') || name.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('tv') || name.includes('televisor')) {
    return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('vans') || name.includes('zapatillas')) {
    return 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('pantalon') || name.includes('palazzo') || name.includes('denim')) {
    return 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('sombrero') || name.includes('safari')) {
    return 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('polo')) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('bloqueador') || name.includes('solar')) {
    return 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('repelente')) {
    return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('termometro') || name.includes('digital')) {
    return 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('licuadora') || name.includes('oster')) {
    return 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('cocina') || name.includes('camping')) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('hot wheels') || name.includes('carritos')) {
    return 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('chocolate') || name.includes('cacao')) {
    return 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('atun') || name.includes('durazno') || name.includes('aceite')) {
    return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800&auto=format&fit=crop&q=80';
  }
  return catalogPlaceholder;
}

function getPromoBadge(p: CatalogProduct): string {
  const name = (p.name || '').toLowerCase();
  if (name.includes('celular') || name.includes('smartphone') || name.includes('samsung') || name.includes('xiaomi')) {
    return 'Hasta 25% Dscto';
  }
  if (name.includes('vans') || name.includes('zapatillas') || name.includes('pantalon') || name.includes('polo')) {
    return 'Hasta 40% Dscto';
  }
  if (name.includes('bloqueador') || name.includes('repelente') || name.includes('termometro')) {
    return 'Envío Express Hoy';
  }
  if (name.includes('licuadora') || name.includes('camping') || name.includes('tv') || name.includes('smartwatch')) {
    return 'Garantía Oficial';
  }
  if (name.includes('chocolate') || name.includes('cacao') || name.includes('cafe')) {
    return '100% Selva Alta';
  }
  return 'En Stock en Tienda';
}

function getCategoryDescriptor(p: CatalogProduct): string {
  const name = (p.name || '').toLowerCase();
  if (name.includes('celular') || name.includes('smartphone')) return 'en smartphones y telefonía';
  if (name.includes('smartwatch') || name.includes('reloj')) return 'en relojes inteligentes';
  if (name.includes('laptop')) return 'en laptops y computación';
  if (name.includes('vans') || name.includes('zapatillas')) return 'en calzado urbano de marca';
  if (name.includes('pantalon') || name.includes('polo')) return 'en prendas de vestir';
  if (name.includes('bloqueador') || name.includes('solar')) return 'en protección dermatológica';
  if (name.includes('repelente')) return 'en cuidado antimosquitos';
  if (name.includes('licuadora') || name.includes('tv')) return 'en electrodomésticos para el hogar';
  if (name.includes('camping') || name.includes('cocina')) return 'en artículos de viaje y camping';
  if (name.includes('chocolate') || name.includes('cacao')) return 'en cacao nativo premiado';
  return 'disponible en comercio verificado';
}

interface BannerSlideConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  bgColor: string;
  benefitBadge: string;
  benefitTitle: string;
  benefitSubtitle: string;
  linkText: string;
  linkUrl: string;
  matcher: (p: CatalogProduct) => boolean;
}

const BANNER_SLIDES: BannerSlideConfig[] = [
  {
    id: 'tech',
    badge: 'COMERCIO LOCAL',
    title: 'CELULARES & TECNOLOGÍA',
    subtitle: 'Smartphones, smartwatches y laptops con garantía oficial',
    bgColor: '#042817',
    benefitBadge: 'ENVÍOS EXPRESS EN EL DÍA',
    benefitTitle: 'Pago contra entrega en efectivo',
    benefitSubtitle: 'En Tingo María y Castillo Grande',
    linkText: 'Ver celulares',
    linkUrl: '/negocios?q=celular',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      const s = (p.storeName || '').toLowerCase();
      return (
        s.includes('curacao') || s.includes('efe') || s.includes('carsa') ||
        n.includes('smartphone') || n.includes('samsung') || n.includes('xiaomi') ||
        n.includes('redmi') || n.includes('celular') || n.includes('smartwatch') ||
        n.includes('laptop') || n.includes('reloj') || n.includes('tv')
      );
    },
  },
  {
    id: 'fashion',
    badge: 'LO + NUEVO',
    title: 'CALZADO & MODA SELVA',
    subtitle: 'Zapatillas urbanas, prendas frescas y accesorios locales',
    bgColor: '#064e3b',
    benefitBadge: 'HASTA 30% DSCTO',
    benefitTitle: 'Pruébate y paga al recibir',
    benefitSubtitle: 'Moda Selva y Galería San Benito',
    linkText: 'Ver moda',
    linkUrl: '/negocios?q=ropa',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      const s = (p.storeName || '').toLowerCase();
      return (
        s.includes('moda') || s.includes('benito') ||
        n.includes('zapatillas') || n.includes('vans') || n.includes('pantalon') ||
        n.includes('polo') || n.includes('sombrero') || n.includes('denim') ||
        n.includes('sandalias')
      );
    },
  },
  {
    id: 'health',
    badge: 'FARMACIAS & BOTICAS',
    title: 'SALUD & CUIDADO PERSONAL',
    subtitle: 'Bloqueadores, repelentes para selva y botiquín familiar',
    bgColor: '#0b2923',
    benefitBadge: 'BOTICAS FORMALES',
    benefitTitle: 'Atención y delivery inmediato',
    benefitSubtitle: 'Botica San Martín y Farmacia Vida',
    linkText: 'Ver farmacia',
    linkUrl: '/negocios?q=farmacia',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      const s = (p.storeName || '').toLowerCase();
      return (
        s.includes('farmacia') || s.includes('botica') ||
        n.includes('bloqueador') || n.includes('repelente') || n.includes('termometro') ||
        n.includes('vitamina') || n.includes('alcohol') || n.includes('paracetamol')
      );
    },
  },
  {
    id: 'home',
    badge: 'TU HOGAR EQUIPADO',
    title: 'ELECTROHOGAR & CAMPING',
    subtitle: 'Smart TVs, licuadoras clásicas y cocinas portátiles',
    bgColor: '#0d1e2d',
    benefitBadge: 'GARANTÍA DE TIENDA',
    benefitTitle: 'Marcas líderes Oster, Samsung y Mabe',
    benefitSubtitle: 'Importaciones El Balcón y Tiendas EFE',
    linkText: 'Ver electrohogar',
    linkUrl: '/negocios?q=electrohogar',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      const s = (p.storeName || '').toLowerCase();
      return (
        s.includes('balcon') || s.includes('continental') ||
        n.includes('licuadora') || n.includes('cocina') || n.includes('camping') ||
        n.includes('olla') || n.includes('termo') || n.includes('gas') ||
        n.includes('hot wheels') || n.includes('freidora')
      );
    },
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Recursos remotos conectados a PostgreSQL
  const categoriesResource = useRemote('home-categories', signal => catalogApi.categories(signal));
  const storesResource = useRemote('home-stores', signal => catalogApi.stores(signal));
  const productsResource = useRemote('home-products', signal => catalogApi.search({ limit: 40 }, signal));
  const coverageResource = useRemote('home-zones', signal => operationsApi.zones(signal));

  const categories = categoriesResource.data || [];
  const stores = storesResource.data || [];
  const allProducts = productsResource.data?.items || [];

  // Modal y agregados
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  // Carrusel activo
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Productos del slide activo (3 productos no gastronómicos por slide)
  const currentSlideProducts = useMemo(() => {
    const isRestaurant = (storeName?: string) =>
      ['La Selva Gourmet', 'Restaurante & Pollería Rubén', 'El Encanto Amazónico', 'Recreo Campestre El Mirador'].includes(storeName || '');

    const matched = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      if (isRestaurant(p.storeName)) return false;
      return activeSlide.matcher(p);
    });

    if (matched.length >= 3) return matched.slice(0, 3);

    // Fallback con productos no gastronómicos
    const nonFood = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      return !isRestaurant(p.storeName);
    });

    const combined = [...matched];
    for (const p of nonFood) {
      if (combined.length >= 3) break;
      if (!combined.some(x => x.id === p.id)) {
        combined.push(p);
      }
    }
    return combined.slice(0, 3);
  }, [allProducts, activeSlide]);

  // Productos variados y mezclados de diferentes tiendas para la sección inferior
  const mixedDiverseProducts = useMemo(() => {
    if (allProducts.length === 0) return [];

    // Agrupar productos por tienda
    const byStore = new Map<string, CatalogProduct[]>();
    for (const p of allProducts) {
      if (!purchasableSku(p)) continue;
      const store = p.storeName || 'Tienda';
      if (!byStore.has(store)) byStore.set(store, []);
      byStore.get(store)!.push(p);
    }

    // Selección round-robin para mezclar tiendas y categorías
    const result: CatalogProduct[] = [];
    const storeArrays = Array.from(byStore.values());
    const maxLen = Math.max(...storeArrays.map(a => a.length), 0);

    for (let i = 0; i < maxLen && result.length < 12; i++) {
      for (const arr of storeArrays) {
        if (arr[i] && result.length < 12) {
          result.push(arr[i]);
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

      {/* 1. Banner Promocional Oechsle / Falabella con Carrusel de Departamentos - De esquina a esquina */}
      <section className="relative w-full bg-[#f3f4f6] border-b border-gray-200 overflow-hidden">
        <div className="w-full flex flex-col lg:flex-row min-h-[460px] lg:min-h-[500px]">
          
          {/* Columna Izquierda: Fondo de la Categoría Activa con Tipografía Promocional en Texto Plano (Sin Emojis) */}
          <div
            className="text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between lg:w-[32%] xl:w-[28%] flex-shrink-0 transition-colors duration-500"
            style={{ backgroundColor: activeSlide.bgColor }}
          >
            <div className="space-y-4">
              <div className="space-y-0.5">
                <p className="text-amber-300 text-sm sm:text-base font-serif italic tracking-wide">
                  Tingo María
                </p>
                <p className="text-[10px] sm:text-[11px] font-black tracking-widest text-emerald-300 uppercase">
                  {activeSlide.badge}
                </p>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                {activeSlide.title}
              </h2>

              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal">
                {activeSlide.subtitle}
              </p>

              {/* Tarjeta de beneficio estilo Oechsle (cyan brillante) */}
              <div className="bg-[#00a8e8] text-white p-4 rounded-xl shadow-xs space-y-1">
                <p className="text-[10px] font-black tracking-wider uppercase text-sky-100">
                  {activeSlide.benefitBadge}
                </p>
                <p className="text-sm sm:text-base font-black leading-snug">
                  {activeSlide.benefitTitle}
                </p>
                <p className="text-[11px] text-sky-100 font-medium">
                  {activeSlide.benefitSubtitle}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to={activeSlide.linkUrl}
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-7 py-3 rounded-full font-black text-xs sm:text-sm shadow-md transition-all group"
              >
                <span>{activeSlide.linkText}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarima Clara con 3 Productos Grandes sin fondo que cubren la tarima */}
          <div className="relative flex-1 bg-gradient-to-r from-[#eceef1] via-[#f3f4f6] to-[#eceef1] p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
            
            {/* Flecha Anterior flotante */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Flecha Siguiente flotante */}
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Siguiente diapositiva"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Grid de 3 productos del slide activo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200/80 items-stretch px-6 sm:px-8">
              {currentSlideProducts.map((p) => {
                const sku = preferredSku(p);
                const price = sku ? sku.priceCents : 0;
                const img = getProductImageUrl(p);
                const isJustAdded = addedProductId === p.id;
                const [spec1, spec2] = getProductSpecBadges(p);
                const brand = extractBrandOrStore(p);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="flex flex-col justify-between items-center text-center p-4 sm:p-5 lg:p-6 cursor-pointer group transition-all duration-200 hover:bg-white/50"
                  >
                    {/* Badges superiores tipo especificación en negro claro (Imagen Oechsle) */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2 w-full">
                      <span className="bg-[#18181b] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-2xs">
                        {spec1}
                      </span>
                      <span className="bg-[#18181b] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-2xs">
                        {spec2}
                      </span>
                    </div>

                    {/* Imagen grande sin fondo que cubre la tarima con sombra suave en la base */}
                    <div className="relative w-full h-56 sm:h-64 lg:h-72 flex items-center justify-center my-2">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="h-full w-auto max-w-full object-contain mix-blend-multiply filter drop-shadow-[0_12px_14px_rgba(0,0,0,0.18)] group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Información debajo de la foto: Marca, Nombre y Pastilla de Precio */}
                    <div className="w-full space-y-1.5 mt-2 flex flex-col items-center">
                      <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 line-clamp-1">
                        {brand}
                      </span>

                      <h3 className="font-bold text-xs sm:text-sm text-gray-700 group-hover:text-primary transition-colors line-clamp-2 leading-snug max-w-[220px]">
                        {p.name}
                      </h3>

                      {/* Pastilla de precio en cyan brillante estilo Oechsle */}
                      <div className="pt-1 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#00a8e8] text-white font-black text-xs sm:text-sm px-3 py-1 rounded-sm shadow-2xs tabular-nums">
                            {sku ? money(price) : 'S/ --'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, p)}
                            className={`p-1.5 rounded-sm transition-all cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación de puntos inferiores estilo Oechsle */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {BANNER_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'w-8 bg-primary shadow-xs' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a ${slide.title}`}
                />
              ))}
            </div>
          </div>
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

      {/* 2. Barra de Garantías y Beneficios */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Pago en efectivo</p>
              <p className="text-[11px] text-gray-500">Contra entrega al recibir</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Envíos express</p>
              <p className="text-[11px] text-gray-500">En moto a tu dirección</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Comercios formales</p>
              <p className="text-[11px] text-gray-500">Tiendas verificadas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-xs sm:text-sm text-gray-900">Cobertura local</p>
              <p className="text-[11px] text-gray-500">Tingo María y Castillo Grande</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tiendas y Comercios Oficiales de la Ciudad */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-3">
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

        {/* 4 Tiendas principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stores.slice(0, 4).map((st) => (
            <Link
              key={st.id}
              to={`/negocios/${st.id}`}
              className="bg-white rounded-2xl border border-gray-200/90 hover:border-primary p-3.5 sm:p-4 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between gap-3 group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform flex-shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors truncate">
                    {st.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 capitalize truncate">
                    {st.category_code}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  st.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {st.isOpen ? 'Abierto ahora' : 'Cerrado'}
                </span>
                <span className="font-bold text-primary flex items-center">
                  Entrar <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Productos Variados y Mezclados de Diversas Tiendas (Estilo Tarjetas Imagen 5/6) */}
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
            {/* Grid de productos multitienda con tarjetas estilo Imagen 5/6 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {mixedDiverseProducts.map((item) => {
                const isJustAdded = addedProductId === item.id;
                const sku = preferredSku(item);
                const price = sku ? sku.priceCents : 0;
                const hasStock = !!purchasableSku(item);
                const productImg = getProductImageUrl(item);
                const brand = extractBrandOrStore(item);
                const promoBadge = getPromoBadge(item);
                const categoryName = getCategoryDescriptor(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className="group bg-[#f4f6f8] rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-card hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between text-left p-3.5 sm:p-4 cursor-pointer"
                  >
                    {/* Cabecera superior: Marca y Tienda en mayúsculas elegante */}
                    <div className="pb-2 flex items-center justify-between border-b border-gray-200/60">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 line-clamp-1">
                        {brand}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                        {item.storeName}
                      </span>
                    </div>

                    {/* Imagen grande centrada con efecto sin fondo */}
                    <div className="relative h-44 sm:h-52 w-full flex items-center justify-center my-3 overflow-hidden">
                      <img
                        src={productImg}
                        alt={item.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Módulo blanco inferior tipo pastilla de descuento (Estilo Imagen 5/6) */}
                    <div className="bg-white rounded-xl p-3 shadow-xs border border-gray-150 flex flex-col justify-between gap-1.5 text-center">
                      <div>
                        <p className="text-xs sm:text-sm font-black text-rose-600 uppercase tracking-tight">
                          {promoBadge}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium line-clamp-1">
                          {categoryName}
                        </p>
                      </div>

                      <h3 className="font-bold text-xs text-gray-800 group-hover:text-primary transition-colors line-clamp-1 text-center">
                        {item.name}
                      </h3>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-gray-900 tabular-nums">
                          {sku ? money(price) : 'S/ --'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, item)}
                          disabled={!hasStock}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón para ver más productos */}
            <div className="flex justify-center pt-4 pb-2">
              <Link
                to="/negocios"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-800 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <span>Explorar todos los productos del catálogo ({allProducts.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 5. Secciones Informativas: Afiliar Comercio y Ser Repartidor */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8">
        <section className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/registro/comercio"
            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-2 hover:border-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">¿Tienes un negocio en Tingo María?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Afilia tu restaurante, bodega o tienda a Quickly y recibe pedidos en línea de toda la ciudad.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-xs text-primary pt-1">
              Afiliar mi negocio <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/registro/repartidor"
            className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-2 hover:border-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Bike className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Reparte en tu ciudad</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Genera ingresos entregando pedidos en moto, bicicleta o mototaxi en todo el valle del Huallaga.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-xs text-primary pt-1">
              Solicitar afiliación como repartidor <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </section>
      </div>

      {/* Modal de Detalle de Producto */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
