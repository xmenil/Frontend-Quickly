import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { ProductCard } from '../../components/shared/ProductCard';
import { MerchantCard } from '../../components/shared/MerchantCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Product, MerchantCategory } from '../../domain/types';
import {
  UtensilsCrossed,
  Pill,
  ShoppingBasket,
  Shirt,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { merchants, products, zones } = useDataStore();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: {
    id: MerchantCategory;
    name: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'restaurantes',
      name: 'Restaurantes',
      icon: <UtensilsCrossed className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'farmacias',
      name: 'Farmacias',
      icon: <Pill className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'bodegas',
      name: 'Bodegas',
      icon: <ShoppingBasket className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'ropa',
      name: 'Ropa',
      icon: <Shirt className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'emprendedores',
      name: 'Emprendedores',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
    },
  ];

  const featuredMerchants = merchants.filter((m) => m.status === 'activo').slice(0, 4);
  const featuredProducts = products.filter((p) => p.isAvailable && p.stock > 0).slice(0, 8);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/negocios?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Banner (Tingo María Theme) */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 text-white shadow-card">
        {/* Decorative backdrop elements */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
            <path
              d="M0 200 C150 150 250 250 400 180 C550 110 650 220 800 160 L800 400 L0 400 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 sm:py-16 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/95">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>Tingo María, Rupa Rupa • Huánuco</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Tus comidas y compras de la selva en la puerta de tu casa
          </h1>

          <p className="text-sm sm:text-base text-white/85 max-w-2xl mx-auto font-normal leading-relaxed">
            Pide en los mejores restaurantes, farmacias, bodegas y emprendimientos locales con seguimiento en tiempo real.
          </p>

          {/* Search bar inside Hero */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-2 max-w-xl mx-auto flex items-center bg-white rounded-2xl p-1.5 shadow-floating border border-white/20"
          >
            <div className="pl-3 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué se te antoja hoy? Tacacho, café, panadol..."
              className="flex-1 px-3 py-2 text-ink text-sm sm:text-base placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="touch-target bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              Buscar
            </button>
          </form>

          {/* Value Props */}
          <div className="pt-4 flex flex-wrap justify-center gap-6 text-xs text-white/80 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-300" /> Envíos rápidos en 25-35 min
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Precios transparentes sin cobros ocultos
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" /> Multi-tienda en un solo pedido
            </span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-ink">Explorar Categorías</h2>
          <Link
            to="/negocios"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1"
          >
            Ver todos los comercios <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/negocios?categoria=${cat.id}`}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2.5 transition-all hover:scale-102 hover:shadow-sm bg-white ${cat.color}`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-subtle">
                {cat.icon}
              </div>
              <span className="text-xs sm:text-sm font-bold text-ink">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Merchants Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">Comercios Destacados</h2>
            <p className="text-xs text-gray-500">Los favoritos de la comunidad en Tingo María</p>
          </div>
          <Link
            to="/negocios"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1"
          >
            Ver catálogo completo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredMerchants.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">Platos y Productos Populares</h2>
            <p className="text-xs text-gray-500">Agrega directo a tu carrito o personaliza</p>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">
            Entregas directas en Rupa Rupa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {featuredProducts.map((product) => {
            const merchant = merchants.find((m) => m.id === product.merchantId);
            return (
              <ProductCard
                key={product.id}
                product={product}
                merchant={merchant}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
              />
            );
          })}
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        merchant={merchants.find((m) => m.id === selectedProduct?.merchantId)}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
