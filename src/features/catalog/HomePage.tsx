import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { addCatalogProduct } from '../../store/realCartStore';
import { preferredSku, purchasableSku } from '../../domain/catalogRules';
import { catalogPlaceholder, catalogImage } from '../../lib/catalogImage';
import { catalogApi, CatalogProduct, money } from '../../services/api/catalogApi';
import { operationsApi } from '../../services/api/operationsApi';
import { useRemote } from '../operations/shared';
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

function getProductSpecBadges(p: CatalogProduct): [string, string] {
  const name = (p.name || '').toLowerCase();

  // Celulares y telefonía
  if (name.includes('celular') || name.includes('smartphone') || name.includes('redmi') || name.includes('samsung') || name.includes('galaxy') || name.includes('xiaomi') || name.includes('poco') || name.includes('honor') || name.includes('iphone')) {
    if (name.includes('512gb')) return ['512GB ROM', '12GB RAM'];
    if (name.includes('256gb')) return ['256GB ROM', '8GB RAM'];
    if (name.includes('128gb')) return ['128GB ROM', '6GB RAM'];
    if (name.includes('64gb')) return ['64GB ROM', '4GB RAM'];
    return ['PANTALLA AMOLED', 'CÁMARA IA'];
  }
  // Laptops y cómputo
  if (name.includes('macbook') || name.includes('neo 13')) {
    return ['256GB SSD', '8GB RAM'];
  }
  if (name.includes('loq') || name.includes('gamer')) {
    return ['512GB SSD', '16GB RAM'];
  }
  if (name.includes('15-fc0287la') || name.includes('hp')) {
    return ['512GB SSD', '8GB RAM'];
  }
  if (name.includes('laptop') || name.includes('notebook') || name.includes('lenovo')) {
    return ['16GB RAM', '512GB SSD'];
  }
  // Cosméticos y regalos
  if (name.includes('labiales') || name.includes('teddy party')) {
    return ['EDICIÓN LIMITADA', '3 TONOS MATE'];
  }
  if (name.includes('máscara') || name.includes('mascara') || name.includes('sumptuous')) {
    return ['EXTRA VOLUMEN', 'A PRUEBA DE AGUA'];
  }
  if (name.includes('living legends') || name.includes('gloss')) {
    return ['KIT COMPLETO', 'ALTA HIDRATACIÓN'];
  }
  // Juguetes
  if (name.includes('hot wheels')) {
    return ['PACK X5 AUTOS', 'COLECCIONABLE'];
  }
  if (name.includes('pikachu') || name.includes('peluche')) {
    return ['ORIGINAL 45CM', 'PELUCHE SUAVE'];
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
  if (name.includes('whisky') || name.includes('black label')) {
    return ['AÑEJADO 12 AÑOS', '750 ML ESCOCÉS'];
  }
  if (name.includes('chocolate') || name.includes('cacao') || name.includes('bombones')) {
    return ['70% CACAO PURO', 'AROMA NATIVO'];
  }
  return ['ENVÍO EXPRESS', 'EN STOCK'];
}

function getProductImageUrl(p: CatalogProduct): string {
  const raw = p.images?.[0]?.url;
  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('placeholder')) {
    return catalogImage(raw);
  }
  const name = (p.name || '').toLowerCase();

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
    subtitle: 'Smartphones de alta gama, Xiaomi, Samsung Galaxy, Apple y Redmi con garantía oficial',
    bgColor: '#064e3b',
    benefitBadge: 'HASTA 12 CUOTAS SIN INTERESES',
    benefitTitle: 'Pago contra entrega en efectivo',
    benefitSubtitle: 'La Curacao, Tiendas EFE y Carsa',
    linkText: 'Ver celulares',
    linkUrl: '/negocios?q=celular',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('celular') || n.includes('smartphone') || n.includes('samsung') ||
        n.includes('redmi') || n.includes('xiaomi') || n.includes('poco') || n.includes('iphone')
      );
    },
  },
  {
    id: 'laptops',
    badge: 'LO MEJOR EN CÓMPUTO',
    title: 'LAPTOPS & COMPUTADORAS',
    subtitle: 'Laptops HP, MacBook Neo y Lenovo Gamer con garantía oficial y soporte técnico',
    bgColor: '#0f172a',
    benefitBadge: 'ENVÍO EXPRESS EN EL DÍA',
    benefitTitle: 'Garantía oficial y servicio técnico',
    benefitSubtitle: 'Tiendas EFE, Carsa e Importaciones El Balcón',
    linkText: 'Ver laptops',
    linkUrl: '/negocios?q=laptop',
    matcher: (p) => {
      const n = (p.name || '').toLowerCase();
      return (
        n.includes('laptop') || n.includes('lenovo') || n.includes('notebook') ||
        n.includes('computadora') || n.includes('macbook') || n.includes('hp') ||
        n.includes('loq') || n.includes('gamer')
      );
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
        n.includes('smart tv') || n.includes('tv') || n.includes('cocina') ||
        n.includes('licuadora') || n.includes('freidora') || n.includes('refrigeradora') ||
        n.includes('lavadora') || n.includes('microondas')
      );
    },
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

  // 3 Productos destacados del slide activo (Garantía absoluta de 3 productos siempre)
  const currentSlideProducts = useMemo(() => {
    const isRestaurant = (storeName?: string) =>
      ['La Selva Gourmet', 'Restaurante & Pollería Rubén', 'El Encanto Amazónico', 'Recreo Campestre El Mirador'].includes(storeName || '');

    const matched = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      if (isRestaurant(p.storeName)) return false;
      return activeSlide.matcher(p);
    });

    if (matched.length >= 3) return matched.slice(0, 3);

    // Fallback inteligente para llenar siempre las 3 columnas sin huecos
    const slideId = activeSlide.id;
    const fallbackList = allProducts.filter(p => {
      if (!purchasableSku(p)) return false;
      if (isRestaurant(p.storeName)) return false;
      const n = (p.name || '').toLowerCase();
      if (slideId === 'celulares') return n.includes('samsung') || n.includes('xiaomi') || n.includes('celular') || n.includes('redmi') || n.includes('poco') || n.includes('iphone');
      if (slideId === 'laptops') return n.includes('laptop') || n.includes('lenovo') || n.includes('notebook') || n.includes('computadora') || n.includes('hp') || n.includes('macbook') || n.includes('smart tv') || n.includes('smartwatch');
      if (slideId === 'shoes') return n.includes('nike') || n.includes('adidas') || n.includes('vans') || n.includes('zapatillas') || n.includes('botines') || n.includes('calzado');
      if (slideId === 'fashion') return n.includes('palazzo') || n.includes('casaca') || n.includes('vestido') || n.includes('polo') || n.includes('denim');
      if (slideId === 'beds') return n.includes('colchón') || n.includes('cama') || n.includes('paraíso') || n.includes('sabanas') || n.includes('tarima');
      if (slideId === 'home') return n.includes('tv') || n.includes('cocina') || n.includes('licuadora') || n.includes('freidora') || n.includes('microondas');
      return false;
    });

    const combined = [...matched];
    for (const p of fallbackList) {
      if (combined.length >= 3) break;
      if (!combined.some(x => x.id === p.id)) {
        combined.push(p);
      }
    }

    // Si aún faltara por catálogo local corto, rellenar de productos no-restaurante para asegurar 3 siempre
    if (combined.length < 3) {
      for (const p of allProducts) {
        if (combined.length >= 3) break;
        if (!purchasableSku(p)) continue;
        if (isRestaurant(p.storeName)) continue;
        if (!combined.some(x => x.id === p.id)) {
          combined.push(p);
        }
      }
    }

    return combined.slice(0, 3);
  }, [allProducts, activeSlide]);

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

      {/* 1. Banner Promocional Oechsle / Falabella con Carrusel de Departamentos - Separación superior estilo Ripley */}
      <section className="relative w-full bg-[#f3f4f6] border-b border-gray-200 overflow-hidden mt-2 sm:mt-3">
        <div className="w-full flex flex-col lg:flex-row items-stretch relative">
          
          {/* Columna Izquierda: Fondo de la Categoría Activa con Tipografía Promocional en Texto Plano (Sin Emojis) */}
          <div
            className="text-white p-4 sm:p-5 lg:p-6 flex flex-col justify-between lg:w-[28%] xl:w-[26%] flex-shrink-0 transition-colors duration-500 relative z-10"
            style={{ backgroundColor: activeSlide.bgColor }}
          >
            <div className="space-y-2.5">
              <div className="space-y-0.5">
                <p className="text-amber-300 text-xs sm:text-sm font-serif italic tracking-wide">
                  Tingo María
                </p>
                <p className="text-[10px] sm:text-[11px] font-black tracking-widest text-emerald-300 uppercase">
                  {activeSlide.badge}
                </p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                {activeSlide.title}
              </h2>

              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal line-clamp-2">
                {activeSlide.subtitle}
              </p>

              {/* Tarjeta de beneficio estilo Oechsle (cyan brillante) */}
              <div className="bg-[#00a8e8] text-white p-2.5 rounded-xl shadow-xs space-y-0.5">
                <p className="text-[9.5px] font-black tracking-wider uppercase text-sky-100">
                  {activeSlide.benefitBadge}
                </p>
                <p className="text-xs sm:text-sm font-black leading-snug">
                  {activeSlide.benefitTitle}
                </p>
                <p className="text-[10px] text-sky-100 font-medium truncate">
                  {activeSlide.benefitSubtitle}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to={activeSlide.linkUrl}
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-5 py-2 rounded-full font-black text-xs shadow-md transition-all group"
              >
                <span>{activeSlide.linkText}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Tarima ajustada a la altura de los productos sin vacíos blancos */}
          <div className="relative flex-1 bg-[#f3f4f6] flex items-center justify-center p-1 sm:p-1.5 overflow-hidden">
            
            {/* Grid de 3 productos cuadrados bien pegados, sin ningún borde (Siempre 3 productos completos) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-1.5 lg:gap-2 w-full items-stretch">
              {currentSlideProducts.map((p) => {
                const sku = preferredSku(p);
                const price = sku ? sku.priceCents : 0;
                const hasStock = !!purchasableSku(p);
                const img = getProductImageUrl(p);
                const isJustAdded = addedProductId === p.id;
                const [spec1, spec2] = getProductSpecBadges(p);
                const brand = extractBrandOrStore(p);

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate('/producto/' + p.id)}
                    className="group relative aspect-square w-full rounded-none overflow-hidden bg-slate-900 transition-all duration-300 cursor-pointer flex flex-col justify-between flex-shrink-0"
                  >
                    {/* Badges superiores flotantes de especificaciones */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
                      <span className="bg-black/90 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                        {spec1}
                      </span>
                      <span className="bg-black/90 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                        {spec2}
                      </span>
                    </div>

                    {/* Imagen cuadrada que cubre el 100% del fondo sin bordes ni vacíos */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      <img
                        src={img}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = catalogPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/35 pointer-events-none" />
                    </div>

                    {/* Módulo inferior flotante con la información del producto */}
                    <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-6 pb-2.5 px-3 text-white flex flex-col">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-300 line-clamp-1">
                        {brand}
                      </span>

                      <h3 className="font-bold text-xs sm:text-[13px] text-white line-clamp-1 leading-snug my-0.5 group-hover:text-emerald-200 transition-colors">
                        {p.name}
                      </h3>

                      <div className="flex items-center justify-between gap-1.5 mt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="bg-[#00a8e8] text-white font-black text-xs sm:text-sm px-2 py-0.5 rounded-xs shadow-xs tabular-nums">
                            {sku ? money(price) : 'S/ --'}
                          </span>
                          {price > 0 && (
                            <span className="text-[10px] text-gray-300 line-through tabular-nums">
                              {money(Math.round(price * 1.25))}
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
                          className={`p-1.5 rounded-md transition-all cursor-pointer ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : hasStock
                              ? 'bg-primary hover:bg-primary-hover text-white shadow-2xs active:scale-95'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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
                );
              })}
            </div>

            {/* Flecha Anterior flotante */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-gray-900 shadow-xl border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Flecha Siguiente flotante */}
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-white text-gray-900 shadow-xl border border-gray-200 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Siguiente diapositiva"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Paginación de puntos centrada en la base */}
            <div className="absolute bottom-1 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
              {BANNER_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'w-7 bg-primary' : 'w-1.5 bg-gray-400 hover:bg-gray-600'
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

      {/* 2. Barra de Garantías y Beneficios Estilo Tarjetas Oficiales (Imagen 1) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-card transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-xs sm:text-sm text-gray-900">Pago contra entrega</p>
                <p className="text-[11px] text-gray-500">Efectivo o transferencia al recibir</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-card transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-xs sm:text-sm text-gray-900">Compra y retira</p>
                <p className="text-[11px] text-gray-500">En más de 400 comercios locales</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-card transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-xs sm:text-sm text-gray-900">Envío hoy mismo</p>
                <p className="text-[11px] text-gray-500">Entrega express a domicilio en tu puerta</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-card transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-xs sm:text-sm text-gray-900">Garantía oficial</p>
                <p className="text-[11px] text-gray-500">Cambio y respaldo de tiendas físicas</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
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

      {/* 7. Secciones Informativas: Afiliar Comercio y Ser Repartidor (Imagen 3) */}
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

    </div>
  );
}
