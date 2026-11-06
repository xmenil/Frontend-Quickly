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
  const brands = [
    'NIKE', 'ADIDAS', 'VANS', 'PARAÍSO', 'MUEBLES TINGO', 'CANNON',
    'XIAOMI', 'SAMSUNG', 'APPLE', 'HONOR', 'HUAWEI', 'LENOVO', 'LG',
    'OSTER', 'PHILIPS', 'MABE', 'INDURAMA', 'HAYLOU', 'STANDFORD', 'HOT WHEELS'
  ];
  for (const b of brands) {
    if (name.includes(b)) return b;
  }
  return (p.storeName || 'TIENDA LOCAL').toUpperCase();
}

function getProductSpecBadges(p: CatalogProduct): [string, string] {
  const name = (p.name || '').toLowerCase();

  // Celulares y telefonía
  if (name.includes('celular') || name.includes('smartphone') || name.includes('redmi') || name.includes('samsung') || name.includes('galaxy') || name.includes('xiaomi') || name.includes('poco') || name.includes('honor') || name.includes('iphone')) {
    if (name.includes('512gb')) return ['512GB ROM', '12GB RAM'];
    if (name.includes('256gb')) return ['256GB ROM', '8GB RAM'];
    if (name.includes('128gb')) return ['128GB ROM', '6GB RAM'];
    return ['PANTALLA AMOLED', 'CÁMARA IA'];
  }
  // Laptops
  if (name.includes('laptop') || name.includes('notebook') || name.includes('lenovo')) {
    return ['16GB RAM', '512GB SSD'];
  }
  // Calzado y zapatillas
  if (name.includes('nike')) {
    return ['CORTE CLÁSICO', 'SUELA DE GOMA'];
  }
  if (name.includes('adidas')) {
    return ['CLOUDFOAM', 'TRANSPIRABLE'];
  }
  if (name.includes('vans')) {
    return ['URBANO VANS', 'VULCANIZADO'];
  }
  if (name.includes('botines') || name.includes('cuero')) {
    return ['CUERO IMPERMEABLE', 'ANTIDESLIZANTE'];
  }
  if (name.includes('zapatillas') || name.includes('sandalias')) {
    return ['CALZADO CÓMODO', 'ANTIDESLIZANTE'];
  }
  // Camas y colchones
  if (name.includes('paraíso') || (name.includes('colchón') && name.includes('royal'))) {
    return ['RESORTES POCKET', '2 PLAZAS'];
  }
  if (name.includes('tarima') || name.includes('cama')) {
    return ['MADERA TORNILLO', 'CON CABECERA'];
  }
  if (name.includes('inflable')) {
    return ['ATERCIOPELADO', 'CON INFLADOR'];
  }
  if (name.includes('sábanas') || name.includes('sabanas')) {
    return ['100% ALGODÓN', '400 HILOS'];
  }
  // Ropa y moda
  if (name.includes('casaca') || name.includes('bomber')) {
    return ['IMPERMEABLE', 'FORRO LIVIANO'];
  }
  if (name.includes('vestido')) {
    return ['VISCOSA FLORAL', 'CORTE EN A'];
  }
  if (name.includes('pantalon') || name.includes('palazzo') || name.includes('denim')) {
    return ['DENIM FRESCO', 'TIRO ALTO'];
  }
  if (name.includes('polo')) {
    return ['100% ALGODÓN', 'ESTAMPADO LOCAL'];
  }
  if (name.includes('sombrero')) {
    return ['PROTECCIÓN UV', 'IDEAL SELVA'];
  }
  // Smart TVs y Electro
  if (name.includes('tv') || name.includes('televisor')) {
    return ['4K CRYSTAL UHD', '55 PULGADAS'];
  }
  if (name.includes('cocina')) {
    return ['4 HORNILLAS', 'ENCENDIDO ELÉCTRICO'];
  }
  if (name.includes('licuadora')) {
    return ['VASO DE VIDRIO', 'MOTOR CLÁSICO'];
  }
  if (name.includes('freidora')) {
    return ['4.1 LITROS', 'AIRFRYER DIGITAL'];
  }
  if (name.includes('smartwatch') || name.includes('reloj') || name.includes('fit3') || name.includes('band')) {
    return ['PANTALLA AMOLED', 'BLUETOOTH 5.3'];
  }
  if (name.includes('bloqueador') || name.includes('solar')) {
    return ['FPS 50+', 'RESISTENTE AL AGUA'];
  }
  if (name.includes('repelente')) {
    return ['PROTECCIÓN SELVA', 'SPRAY 150ML'];
  }
  return ['ENVÍO EXPRESS', 'EN STOCK'];
}

function getProductImageUrl(p: CatalogProduct): string {
  const raw = p.images?.[0]?.url;
  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('placeholder')) {
    return catalogImage(raw);
  }
  const name = (p.name || '').toLowerCase();

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
  if (name.includes('laptop') || name.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop&q=80';
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
  if (name.includes('chocolate') || name.includes('cacao')) {
    return 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=900&auto=format&fit=crop&q=80';
  }

  return catalogPlaceholder;
}

function getPromoBadge(p: CatalogProduct): string {
  const name = (p.name || '').toLowerCase();
  if (name.includes('nike') || name.includes('adidas') || name.includes('vans') || name.includes('zapatillas')) {
    return 'Hasta 35% Dscto';
  }
  if (name.includes('paraíso') || name.includes('cama') || name.includes('colchón')) {
    return 'Entrega a Domicilio';
  }
  if (name.includes('pantalon') || name.includes('casaca') || name.includes('vestido') || name.includes('polo')) {
    return 'Colección 2026';
  }
  if (name.includes('celular') || name.includes('smartphone') || name.includes('laptop')) {
    return 'Garantía Oficial';
  }
  if (name.includes('tv') || name.includes('cocina') || name.includes('licuadora')) {
    return 'Hasta 25% Dscto';
  }
  if (name.includes('bloqueador') || name.includes('repelente')) {
    return 'Envío Express Hoy';
  }
  return 'En Stock en Tienda';
}

function getCategoryDescriptor(p: CatalogProduct): string {
  const name = (p.name || '').toLowerCase();
  if (name.includes('nike') || name.includes('adidas') || name.includes('vans') || name.includes('zapatillas')) {
    return 'en calzado urbano y deportivo';
  }
  if (name.includes('paraíso') || name.includes('colchón') || name.includes('cama')) {
    return 'en descanso y dormitorio';
  }
  if (name.includes('casaca') || name.includes('pantalon') || name.includes('vestido') || name.includes('polo')) {
    return 'en prendas de moda selva';
  }
  if (name.includes('celular') || name.includes('smartphone')) {
    return 'en telefonía y smartphones';
  }
  if (name.includes('laptop')) {
    return 'en computadoras portátiles';
  }
  if (name.includes('tv') || name.includes('cocina') || name.includes('licuadora')) {
    return 'en electrodomésticos para el hogar';
  }
  if (name.includes('bloqueador') || name.includes('repelente')) {
    return 'en farmacia y cuidado personal';
  }
  return 'disponible en comercio oficial';
}

function getProductDiscountPercent(p: CatalogProduct): number {
  const name = (p.name || '').toLowerCase();
  if (name.includes('celular') || name.includes('smartphone') || name.includes('laptop')) return 25;
  if (name.includes('nike') || name.includes('adidas') || name.includes('vans') || name.includes('zapatillas')) return 35;
  if (name.includes('pantalon') || name.includes('casaca') || name.includes('vestido') || name.includes('polo')) return 30;
  if (name.includes('paraíso') || name.includes('cama') || name.includes('colchón')) return 20;
  if (name.includes('tv') || name.includes('cocina') || name.includes('licuadora')) return 25;
  return 20;
}

function getProductCategoryLink(p: CatalogProduct, slideUrl: string): string {
  const n = (p.name || '').toLowerCase();
  if (n.includes('laptop') || n.includes('notebook') || n.includes('lenovo')) return '/negocios?q=laptop';
  if (n.includes('celular') || n.includes('smartphone') || n.includes('samsung') || n.includes('xiaomi') || n.includes('poco') || n.includes('iphone')) return '/negocios?q=celular';
  if (n.includes('nike') || n.includes('adidas') || n.includes('vans') || n.includes('zapatillas')) return '/negocios?q=zapatillas';
  if (n.includes('botines') || n.includes('calzado')) return '/negocios?q=calzado';
  if (n.includes('palazzo') || n.includes('pantalon') || n.includes('denim')) return '/negocios?q=pantalon';
  if (n.includes('casaca') || n.includes('bomber')) return '/negocios?q=casaca';
  if (n.includes('vestido')) return '/negocios?q=vestido';
  if (n.includes('polo')) return '/negocios?q=polo';
  if (n.includes('paraíso') || n.includes('colchón') || n.includes('colchon')) return '/negocios?q=colchon';
  if (n.includes('cama') || n.includes('tarima')) return '/negocios?q=cama';
  if (n.includes('sábanas') || n.includes('sabanas')) return '/negocios?q=sabanas';
  if (n.includes('smart tv') || n.includes('tv') || n.includes('televisor')) return '/negocios?q=tv';
  if (n.includes('cocina')) return '/negocios?q=cocina';
  if (n.includes('licuadora')) return '/negocios?q=licuadora';
  if (n.includes('freidora')) return '/negocios?q=electrohogar';
  return slideUrl;
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
    id: 'celulares',
    badge: 'OFICIAL EN TINGO MARÍA',
    title: 'CELULARES',
    subtitle: 'Smartphones de alta gama, Xiaomi, Samsung Galaxy y Redmi con garantía oficial',
    bgColor: '#064e3b',
    benefitBadge: 'HASTA 12 CUOTAS SIN INTERESES',
    benefitTitle: 'Pago contra entrega en efectivo',
    benefitSubtitle: 'La Curacao, Tiendas EFE y Carsa',
    linkText: 'Ver celulares',
    linkUrl: '/negocios?q=celular',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('celular') || n.includes('smartphone') || n.includes('samsung galaxy') ||
        n.includes('redmi') || n.includes('xiaomi') || n.includes('poco') || n.includes('iphone')
      );
    },
  },
  {
    id: 'laptops',
    badge: 'LO MEJOR EN CÓMPUTO',
    title: 'LAPTOPS & COMPUTADORAS',
    subtitle: 'Laptops Lenovo IdeaPad, gamers LOQ y accesorios con garantía oficial',
    bgColor: '#0f172a',
    benefitBadge: 'ENVÍO EXPRESS EN EL DÍA',
    benefitTitle: 'Garantía oficial y servicio técnico',
    benefitSubtitle: 'Tiendas EFE, Carsa e Importaciones El Balcón',
    linkText: 'Ver laptops',
    linkUrl: '/negocios?q=laptop',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return n.includes('laptop') || n.includes('lenovo') || n.includes('notebook') || n.includes('computadora');
    },
  },
  {
    id: 'shoes',
    badge: 'CALZADO URBANO',
    title: 'ZAPATOS & ZAPATILLAS',
    subtitle: 'Zapatillas Nike, Adidas, Vans y botines de cuero para selva y ciudad',
    bgColor: '#172554',
    benefitBadge: 'HASTA 35% DSCTO',
    benefitTitle: 'Garantía oficial y cambio de talla',
    benefitSubtitle: 'Moda Selva Tingo y Galería San Benito',
    linkText: 'Ver calzado',
    linkUrl: '/negocios?q=zapatillas',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('nike') || n.includes('adidas') || n.includes('vans') ||
        n.includes('botines') || n.includes('zapatillas') || n.includes('sandalias')
      );
    },
  },
  {
    id: 'fashion',
    badge: 'MODA SELVA',
    title: 'ROPA & MODA ACTUAL',
    subtitle: 'Pantalones palazzo denim, casacas bomber, vestidos y polos frescos',
    bgColor: '#14532d',
    benefitBadge: 'TENDENCIAS 2026',
    benefitTitle: 'Confección fresca y cómoda',
    benefitSubtitle: 'Galería San Benito y Moda Selva Tingo',
    linkText: 'Ver ropa',
    linkUrl: '/negocios?q=ropa',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('palazzo') || n.includes('casaca') || n.includes('vestido') ||
        n.includes('polo') || n.includes('pantalon') || n.includes('denim') ||
        n.includes('sombrero')
      );
    },
  },
  {
    id: 'beds',
    badge: 'DORMITORIO & CONFORT',
    title: 'CAMAS & COLCHONES',
    subtitle: 'Colchones Paraíso Royal, camas box tarima y juegos de sábanas finas',
    bgColor: '#1e1b4b',
    benefitBadge: 'DORMITORIO COMPLETO',
    benefitTitle: 'Envío directo y armado en casa',
    benefitSubtitle: 'Carsa, Tiendas EFE e Importaciones El Balcón',
    linkText: 'Ver camas y colchones',
    linkUrl: '/negocios?q=cama',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('paraíso') || n.includes('cama box') || n.includes('colchón') ||
        n.includes('colchon') || n.includes('tarima') || n.includes('sábanas') ||
        n.includes('sabanas')
      );
    },
  },
  {
    id: 'home',
    badge: 'EQUIPA TU HOGAR',
    title: 'ELECTROHOGAR & COCINA',
    subtitle: 'Smart TVs 55", cocinas Indurama, licuadoras clásicas y freidoras de aire',
    bgColor: '#312e81',
    benefitBadge: 'GARANTÍA OFICIAL',
    benefitTitle: 'Marcas líderes Oster, Samsung e Indurama',
    benefitSubtitle: 'Importaciones El Balcón, Carsa y Tiendas EFE',
    linkText: 'Ver electrohogar',
    linkUrl: '/negocios?q=electrohogar',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('smart tv') || n.includes('tv') || n.includes('cocina indurama') ||
        n.includes('licuadora') || n.includes('freidora') || n.includes('refrigeradora') ||
        n.includes('lavadora')
      );
    },
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

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

  // 3 Productos destacados del slide activo (100% de la categoría correcta)
  const currentSlideProducts = useMemo(() => {
    const isRestaurant = (storeName?: string) =>
      ['La Selva Gourmet', 'Restaurante & Pollería Rubén', 'El Encanto Amazónico', 'Recreo Campestre El Mirador'].includes(storeName || '');

    const matched = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      if (isRestaurant(p.storeName)) return false;
      return activeSlide.matcher(p);
    });

    if (matched.length >= 3) return matched.slice(0, 3);

    // Si hay menos de 3 por filtro estricto, buscar coincidencias más amplias pero de la misma categoría
    const slideId = activeSlide.id;
    const fallbackList = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      if (isRestaurant(p.storeName)) return false;
      const n = (p.name || '').toLowerCase();
      if (slideId === 'celulares') return n.includes('samsung') || n.includes('xiaomi') || n.includes('celular') || n.includes('redmi') || n.includes('poco');
      if (slideId === 'laptops') return n.includes('laptop') || n.includes('lenovo') || n.includes('notebook') || n.includes('computadora');
      if (slideId === 'shoes') return n.includes('nike') || n.includes('adidas') || n.includes('vans') || n.includes('zapatillas');
      if (slideId === 'fashion') return n.includes('palazzo') || n.includes('casaca') || n.includes('vestido') || n.includes('polo');
      if (slideId === 'beds') return n.includes('colchón') || n.includes('cama') || n.includes('paraíso') || n.includes('sabanas');
      if (slideId === 'home') return n.includes('tv') || n.includes('cocina') || n.includes('licuadora') || n.includes('freidora');
      return false;
    });

    const combined = [...matched];
    for (const p of fallbackList) {
      if (combined.length >= 3) break;
      if (!combined.some(x => x.id === p.id)) {
        combined.push(p);
      }
    }
    return combined.slice(0, 3);
  }, [allProducts, activeSlide]);

  // Productos multitienda y multicategoría completamente mezclados (sin predominar una sola tienda ni categoría)
  const mixedDiverseProducts = useMemo(() => {
    if (allProducts.length === 0) return [];

    // Agrupar productos por categoría
    const byCategory = new Map<string, CatalogProduct[]>();
    for (const p of allProducts) {
      if (!purchasableSku(p)) continue;
      const cat = p.categoryId || 'other';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(p);
    }

    // Selección round-robin para mezclar ropa, calzado, tecnología, camas, alimentos, etc.
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

      {/* 1. Banner Promocional Oechsle / Falabella con Carrusel de Departamentos - De esquina a esquina */}
      <section className="relative w-full bg-[#f3f4f6] border-b border-gray-200 overflow-hidden">
        <div className="w-full flex flex-col lg:flex-row h-auto lg:h-[370px] xl:h-[385px] relative">
          
          {/* Columna Izquierda: Fondo de la Categoría Activa con Tipografía Promocional en Texto Plano (Sin Emojis) */}
          <div
            className="text-white p-5 sm:p-6 lg:p-7 flex flex-col justify-between lg:w-[30%] xl:w-[27%] flex-shrink-0 transition-colors duration-500 relative z-10"
            style={{ backgroundColor: activeSlide.bgColor }}
          >
            <div className="space-y-3">
              <div className="space-y-0.5">
                <p className="text-amber-300 text-xs sm:text-sm font-serif italic tracking-wide">
                  Tingo María
                </p>
                <p className="text-[10px] sm:text-[11px] font-black tracking-widest text-emerald-300 uppercase">
                  {activeSlide.badge}
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                {activeSlide.title}
              </h2>

              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal line-clamp-2">
                {activeSlide.subtitle}
              </p>

              {/* Tarjeta de beneficio estilo Oechsle (cyan brillante) */}
              <div className="bg-[#00a8e8] text-white p-3 rounded-xl shadow-xs space-y-0.5">
                <p className="text-[9.5px] font-black tracking-wider uppercase text-sky-100">
                  {activeSlide.benefitBadge}
                </p>
                <p className="text-xs sm:text-sm font-black leading-snug">
                  {activeSlide.benefitTitle}
                </p>
                <p className="text-[10.5px] text-sky-100 font-medium truncate">
                  {activeSlide.benefitSubtitle}
                </p>
              </div>
            </div>

            <div className="pt-3">
              <Link
                to={activeSlide.linkUrl}
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-6 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-md transition-all group"
              >
                <span>{activeSlide.linkText}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Flecha Anterior flotante estilo Oechsle (en el margen izquierdo) */}
          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Diapositiva anterior"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Flecha Siguiente flotante estilo Oechsle (en el margen derecho) */}
          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Siguiente diapositiva"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Columna Derecha: Tarima Clara con 3 Productos erguidos a la misma altura completa (Estilo exacto Imagen 2) */}
          <div className="relative flex-1 bg-[#ebedef] flex flex-col justify-between overflow-hidden">
            
            {/* 3 Columnas de productos - Full height de esquina a esquina, divididos por líneas sutiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 h-full divide-y sm:divide-y-0 sm:divide-x divide-gray-300/70 items-stretch">
              {currentSlideProducts.map((p) => {
                const sku = preferredSku(p);
                const price = sku ? sku.priceCents : 0;
                const hasStock = !!purchasableSku(p);
                const img = getProductImageUrl(p);
                const isJustAdded = addedProductId === p.id;
                const [spec1, spec2] = getProductSpecBadges(p);
                const brand = extractBrandOrStore(p);
                const categoryLink = getProductCategoryLink(p, activeSlide.linkUrl);

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(categoryLink)}
                    className="group relative flex flex-col justify-between p-3.5 sm:p-5 hover:bg-white/40 transition-colors duration-200 cursor-pointer h-full"
                  >
                    {/* Badges superiores de especificaciones en píldora negra (Estilo Imagen 2) */}
                    <div className="flex items-center justify-center gap-1.5 pt-0.5 z-10 pointer-events-none">
                      <span className="bg-black/90 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {spec1}
                      </span>
                      <span className="bg-black/90 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {spec2}
                      </span>
                    </div>

                    {/* Imagen del producto erguida, en toda la altura central de la sección, alineada con el texto */}
                    <div className="flex-1 flex items-center justify-center py-2 relative min-h-[160px] sm:min-h-[180px] lg:min-h-[195px]">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="max-h-[160px] sm:max-h-[180px] lg:max-h-[200px] w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                        loading="lazy"
                      />
                    </div>

                    {/* Información inferior del producto - Estilo exacto Imagen 2 de Oechsle */}
                    <div className="pt-1 pb-1 z-10 flex flex-col">
                      <p className="font-black text-xs sm:text-[13px] uppercase tracking-wider text-gray-900 line-clamp-1">
                        {brand}
                      </p>

                      <p className="text-[11.5px] text-gray-600 font-medium truncate mt-0.5">
                        {p.name}
                      </p>

                      {/* Fila de precio con badge azul cyan, badge oferta y botón de carrito */}
                      <div className="flex items-center justify-between gap-1.5 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="bg-[#00a8e8] text-white font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-xs shadow-2xs tabular-nums">
                            {sku ? money(price) : 'S/ --'}
                          </span>
                          <span className="bg-black text-white text-[8.5px] font-black uppercase px-1 py-0.5 rounded-xs tracking-wider">
                            oferta
                          </span>
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
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

                      {price > 0 && (
                        <div className="flex items-center gap-2 mt-1 text-[10.5px] text-gray-400 tabular-nums">
                          <span className="font-bold text-gray-700">{money(Math.round(price * 1.08))}</span>
                          <span className="line-through">{money(Math.round(price * 1.25))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación de puntos inferiores centrada en la base del banner (Estilo Imagen 2) */}
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
              {BANNER_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'w-7 bg-gray-800' : 'w-1.5 bg-gray-400 hover:bg-gray-600'
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
            {/* Grid de productos estilo Imagen 1: Sin marco ni fondo, sin borde de cuadro */}
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
                    onClick={() => setSelectedProduct(item)}
                    className="group cursor-pointer flex flex-col justify-between text-left p-1.5 sm:p-2.5 transition-all duration-200 hover:bg-gray-50/60 rounded-xl"
                  >
                    <div>
                      {/* Imagen del producto sin marco ni fondo */}
                      <div className="relative w-full aspect-square flex items-center justify-center p-3 mb-2 overflow-hidden bg-white rounded-xl">
                        <img
                          src={productImg}
                          alt={item.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                          }}
                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
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
