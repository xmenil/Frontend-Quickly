import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { ProductDetailModal } from './ProductDetailModal';
import { QuickCategoryStrip } from '../../components/shared/QuickCategoryStrip';
import { CategoryGridSection } from '../../components/shared/CategoryGridSection';
import { OfficialStoresSection } from '../../components/shared/OfficialStoresSection';
import { BigStoreProductsSection } from '../../components/shared/BigStoreProductsSection';
import { Product, MerchantCategory } from '../../domain/types';
import { formatCents } from '../../lib/currency';
import { formatDate } from '../../lib/date';
import {
  ArrowRight,
  MapPin,
  Clock,
  Check,
  Bike,
  Truck,
  ShoppingCart,
  Store,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { merchants, products, purchases } = useDataStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedFeaturedId, setAddedFeaturedId] = useState<string | null>(null);

  // Categorías locales de la selva
  const categories: {
    id: MerchantCategory;
    name: string;
  }[] = [
    { id: 'restaurantes', name: 'Restaurantes' },
    { id: 'farmacias', name: 'Farmacias y Boticas' },
    { id: 'bodegas', name: 'Bodegas y Abarrotes' },
    { id: 'emprendedores', name: 'Cacao & Café' },
    { id: 'ropa', name: 'Textil Local' },
  ];

  // 4 Platos y productos bandera 100% de Tingo María
  const featuredCards = [
    {
      id: 'p_tacacho_cecina',
      name: 'Tacacho con Cecina y Chorizo Amazónico',
      merchantName: 'La Selva Gourmet',
      priceCents: 2800,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_juane_gallina',
      name: 'Juane Tradicional de Gallina de Chacra',
      merchantName: 'La Selva Gourmet',
      priceCents: 2200,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_repelente_selva',
      name: 'Repelente Extra Fuerte para Selva Spray 150ml',
      merchantName: 'Farmacia Vida',
      priceCents: 1850,
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_chocolate_70',
      name: 'Chocolate 70% Cacao Nativo Leoncio Prado',
      merchantName: 'Cacao & Café Tingo',
      priceCents: 1400,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const handleAddFeatured = (e: React.MouseEvent, item: typeof featuredCards[0]) => {
    e.stopPropagation();
    e.preventDefault();
    const foundProd = products.find((p) => p.id === item.id) || products[0];
    if (foundProd) {
      addItem({
        productId: foundProd.id,
        merchantId: foundProd.merchantId,
        quantity: 1,
        unitPriceCents: item.priceCents,
      });
      setAddedFeaturedId(item.id);
      setTimeout(() => {
        setAddedFeaturedId((curr) => (curr === item.id ? null : curr));
      }, 1500);
    }
  };

  // Find active purchase for realistic status card
  const activePurchase = purchases.find((p) =>
    ['pendiente', 'en_proceso', 'entrega_parcial'].includes(p.status)
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
      {/* Location & Coverage Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-xs">
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-gray-200/90 shadow-subtle text-ink">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="font-bold">Tingo María • Zona Centro</span>
          <span className="text-ink-light hidden sm:inline">• Tarifa S/ 4.00</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-light font-medium">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span className="tabular-nums">Despachos en 20-35 min</span>
        </div>
      </div>

      {/* Quick Category Buttons Strip */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle px-3 sm:px-6 py-2">
        <QuickCategoryStrip />
      </div>

      {/* Top Section: Full Width Hero Banner & Simple Text Category Buttons */}
      <div className="space-y-4">
        {/* Hero Banner: Amazon Selva Landscape (Full Width) */}
        <div className="relative rounded-2xl overflow-hidden shadow-subtle min-h-[220px] sm:min-h-[280px] flex flex-col justify-end p-6 sm:p-8 text-white select-none group w-full">
          {/* Background Mountain/Jungle Photo */}
          <img
            src="https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=1400&auto=format&fit=crop&q=80"
            alt="Selva de Tingo María y Bella Durmiente"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
          />
          {/* Gradient Overlay for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/90 backdrop-blur-sm text-[11px] font-bold text-white shadow-subtle mb-1">
              Delivery centralizado en Leoncio Prado
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              Lo mejor de Tingo María, en tu puerta
            </h1>
            <p className="text-xs sm:text-sm text-gray-100 font-medium leading-relaxed drop-shadow">
              Tacacho, juanes, farmacias, bodegas y café de la selva alta con entrega rápida.
            </p>

            {/* Carousel Pagination Dots */}
            <div className="flex items-center gap-1.5 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* Categories Row: Botones limpios de texto */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/negocios?categoria=${cat.id}`}
              className="py-2 px-4 sm:px-5 rounded-xl bg-white hover:bg-primary hover:text-white border border-gray-200 hover:border-primary text-ink text-xs sm:text-sm font-bold transition-all shadow-subtle active:scale-[0.98]"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid Categorías de Tingo María */}
      <CategoryGridSection />

      {/* Official Stores Section */}
      <OfficialStoresSection />

      {/* Big Stores Products & Deals Showcase */}
      <BigStoreProductsSection />

      {/* Productos Destacados Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">Platos y productos más pedidos</h2>
            <p className="text-xs text-ink-light">Gastronomía amazónica y productos indispensables en Tingo María</p>
          </div>
          <Link
            to="/negocios"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid con feedback táctil inmediato */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {featuredCards.map((item) => (
            <Link
              key={item.id}
              to={`/producto/${item.id}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-primary-200 transition-all text-left"
            >
              <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  Despacho veloz
                </span>
              </div>

              <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-2">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-primary font-semibold mt-0.5">{item.merchantName}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs sm:text-sm font-black text-ink tabular-nums">
                    {formatCents(item.priceCents)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleAddFeatured(e, item)}
                    title="Agregar al pedido"
                    aria-label={`Agregar ${item.name} al pedido`}
                    className={`min-w-[36px] min-h-[36px] px-2 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-subtle active:scale-95 touch-target ${
                      addedFeaturedId === item.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    {addedFeaturedId === item.id ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom 3 Cards Row: Dirección de entrega | Estado de pedido dinámico | Mis pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Dirección de entrega */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Dirección de entrega</span>
            </div>
            <Link to="/cliente/direcciones" className="text-primary hover:underline font-semibold">
              Cambiar
            </Link>
          </div>

          <p className="text-xs text-ink font-medium">Jr. Amazonas 123, Tingo María (Zona Centro)</p>

          {/* Stylized Schematic Mini Map */}
          <div className="rounded-xl overflow-hidden border border-gray-100 relative h-32 bg-sky-50/50 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 150" fill="none">
              <rect width="300" height="150" fill="#f8fafc" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="#e2e8f0" strokeWidth="12" />
              <line x1="150" y1="0" x2="150" y2="150" stroke="#e2e8f0" strokeWidth="10" />
              <line x1="50" y1="0" x2="250" y2="150" stroke="#f1f5f9" strokeWidth="8" />
              <path
                d="M 230 0 Q 250 80 270 150"
                stroke="#bae6fd"
                strokeWidth="16"
                fill="none"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="px-2 py-0.5 rounded-full bg-white shadow-subtle border border-gray-100 text-[10px] font-bold text-ink flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Río Huallaga • Centro
              </div>
              <MapPin className="w-5 h-5 text-primary fill-primary-100 -mt-0.5 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Card 2: Estado del Pedido DINÁMICO (o Cobertura si no hay pedido activo) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Bike className="w-4 h-4 text-primary" />
              <span>{activePurchase ? 'Seguimiento de tu pedido' : 'Cobertura & Tarifas'}</span>
            </div>
            {activePurchase && (
              <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary font-bold text-[10px]">
                En curso
              </span>
            )}
          </div>

          {activePurchase ? (
            <div className="space-y-3 py-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-ink">#{activePurchase.code}</span>
                <span className="text-primary font-bold tabular-nums">
                  {formatCents(activePurchase.grandTotalCents)}
                </span>
              </div>
              <p className="text-[11px] text-ink-light">
                {activePurchase.merchantOrders.length} comercio(s) preparan tu pedido.
              </p>
              <div className="p-2.5 bg-primary-50 rounded-xl flex items-center gap-2 text-xs text-primary font-semibold">
                <Truck className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span>Tiempo estimado: ~25 min</span>
              </div>
              <Link
                to={`/pedidos/${activePurchase.id}`}
                className="w-full py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold text-center block hover:bg-primary-hover shadow-subtle transition-all"
              >
                Ver seguimiento en vivo →
              </Link>
            </div>
          ) : (
            <div className="space-y-2 py-1 text-xs">
              <p className="text-[11px] text-ink-light leading-relaxed">
                Repartidores locales en moto y bici conectando todos los sectores de Tingo María:
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="font-medium text-ink">Centro (Plaza de Armas / Raymondi)</span>
                  <span className="font-bold text-primary tabular-nums">S/ 4.00 • 20 min</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="font-medium text-ink">Rupa Rupa Norte / UNAS</span>
                  <span className="font-bold text-primary tabular-nums">S/ 5.00 • 25 min</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                  <span className="font-medium text-ink">Castillo Grande (Puente Corpac)</span>
                  <span className="font-bold text-primary tabular-nums">S/ 6.50 • 35 min</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Mis pedidos recientes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
            <span className="font-bold text-ink">Mis pedidos recientes</span>
            <Link to="/cliente/pedidos" className="text-primary hover:underline font-semibold">
              Ver todos <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {purchases.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to={`/pedidos/${p.id}`}
                className="p-2.5 bg-gray-50 hover:bg-primary-50/50 rounded-xl flex items-center justify-between transition-colors block border border-gray-100"
              >
                <div>
                  <span className="font-bold text-ink">#{p.code}</span>
                  <p className="text-gray-600 font-semibold text-[11px] tabular-nums mt-0.5">
                    {formatCents(p.grandTotalCents)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {p.status === 'completado' ? 'Entregado' : 'Procesado'}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Footer matching Quickly Branding */}
      <footer className="pt-6 pb-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-light">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center p-1 text-white shadow-subtle">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-ink">Quickly Tingo María</span>
            <span className="text-[11px] text-primary ml-1.5 font-bold">
              Plataforma de delivery de la Selva Alta
            </span>
          </div>
        </div>

        <div className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <span>Rupa Rupa • Castillo Grande • Leoncio Prado</span>
        </div>
      </footer>

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
