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
import {
  ArrowRight,
  MapPin,
  Clock,
  Check,
  Bike,
  Truck,
  ShoppingCart,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { merchants, products } = useDataStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedFeaturedId, setAddedFeaturedId] = useState<string | null>(null);

  // Categorías con botones simples de texto (sin iconos)
  const categories: {
    id: MerchantCategory;
    name: string;
  }[] = [
    { id: 'restaurantes', name: 'Restaurantes' },
    { id: 'farmacias', name: 'Farmacias' },
    { id: 'bodegas', name: 'Bodegas' },
    { id: 'ropa', name: 'Ropa' },
    { id: 'emprendedores', name: 'Emprendedores' },
  ];

  // 4 Featured products matching the reference images
  const featuredCards = [
    {
      id: 'p_zapatillas_vans',
      name: 'Zapatillas Vans Hombre Brooklyn Ls Negro',
      merchantName: 'Moda Selva Tingo',
      priceCents: 19920,
      originalPriceCents: 24900,
      discountPercent: 20,
      imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_tacacho_cecina',
      name: 'Tacacho con Cecina y Chorizo Regional',
      merchantName: 'La Selva Gourmet',
      priceCents: 2800,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_botiquin_1',
      name: 'Botiquín de Primeros Auxilios Familiar',
      merchantName: 'Farmacia Vida',
      priceCents: 2850,
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p_chocolate_70',
      name: 'Chocolate 70% Cacao Nativo Leoncio Prado',
      merchantName: 'Cacao & Café Tingo',
      priceCents: 1400,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&auto=format&fit=crop&q=80',
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

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
      {/* Client header tag badge matching the screenshot */}
      <div className="flex items-center justify-between pb-1">
        <span className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white shadow-sm">
          CLIENTE
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Tingo María, Huánuco</span>
        </div>
      </div>

      {/* Mercado Libre Style Quick Buttons Carousel Strip matching reference screenshot */}
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
            alt="Selva de Tingo María"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
          />
          {/* Gradient Overlay for high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

          <div className="relative z-10 space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              Todo lo que necesitas, en un solo lugar
            </h1>
            <p className="text-xs sm:text-sm text-gray-200 font-normal leading-relaxed drop-shadow">
              Restaurantes, farmacias, bodegas, ropa y más. ¡A un clic de ti!
            </p>

            {/* Carousel Pagination Dots */}
            <div className="flex items-center gap-1.5 pt-3">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* Categories Row: Botones simples de texto y sin iconos */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/negocios?categoria=${cat.id}`}
              className="py-2 px-4 sm:px-5 rounded-xl bg-white hover:bg-primary hover:text-white border border-gray-200 hover:border-primary text-gray-800 text-xs sm:text-sm font-bold transition-all shadow-2xs hover:shadow-xs active:scale-98"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mercado Libre Style 4x3 Categorías Grid Section matching Capture 1 */}
      <CategoryGridSection />

      {/* Official Big Stores & Supermarkets Section (from tiendas_tingo_maria.json) */}
      <OfficialStoresSection />

      {/* Big Stores Products & Deals Showcase (replaces previous buttons row) */}
      <BigStoreProductsSection />

      {/* Productos Destacados Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">Productos destacados</h2>
            <p className="text-xs text-gray-400">Haz clic en cualquier producto para ver su detalle completo</p>
          </div>
          <Link
            to="/negocios"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Cards Grid with Click-to-Detail & Berry [Agregar al carrito] Button */}
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
                <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  Envío rápido
                </span>
              </div>

              <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink group-hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.merchantName}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs sm:text-sm font-black text-ink">
                    {formatCents(item.priceCents)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleAddFeatured(e, item)}
                    title="Agregar al carrito"
                    aria-label={`Agregar ${item.name} al carrito`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer ${
                      addedFeaturedId === item.id
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-primary hover:bg-primary-hover text-white hover:shadow-md'
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

      {/* Bottom 3 Cards Row: Dirección de entrega | Estado de tu pedido | Mis pedidos */}
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

          <p className="text-xs text-gray-600 font-medium">Jr. Amazonas 123, Tingo María</p>

          {/* Stylized Schematic Mini Map */}
          <div className="rounded-xl overflow-hidden border border-gray-100 relative h-32 bg-sky-50/50 flex items-center justify-center">
            {/* Map lines */}
            <svg className="w-full h-full" viewBox="0 0 300 150" fill="none">
              <rect width="300" height="150" fill="#f8fafc" />
              {/* Roads */}
              <line x1="0" y1="75" x2="300" y2="75" stroke="#e2e8f0" strokeWidth="12" />
              <line x1="150" y1="0" x2="150" y2="150" stroke="#e2e8f0" strokeWidth="10" />
              <line x1="50" y1="0" x2="250" y2="150" stroke="#f1f5f9" strokeWidth="8" />
              {/* River Huallaga curve */}
              <path
                d="M 230 0 Q 250 80 270 150"
                stroke="#bae6fd"
                strokeWidth="16"
                fill="none"
              />
            </svg>

            {/* Marker Pin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="px-2 py-0.5 rounded-full bg-white shadow-md border border-gray-100 text-[10px] font-bold text-ink flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Tingo María
              </div>
              <MapPin className="w-5 h-5 text-primary fill-primary-100 -mt-0.5 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Card 2: Estado de tu pedido */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold text-ink">
            <Clock className="w-4 h-4 text-primary" />
            <span>Estado de tu pedido</span>
          </div>

          {/* Stepper with checkmarks */}
          <div className="space-y-2.5 py-1 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <div>
                <p className="font-bold text-ink text-[11px] leading-tight">Pedido confirmado</p>
                <p className="text-[10px] text-gray-400">Hoy, 10:24 a. m.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              <div>
                <p className="font-bold text-ink text-[11px] leading-tight">En preparación</p>
                <p className="text-[10px] text-gray-400">Hoy, 10:35 a. m.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full border-2 border-primary bg-white text-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-primary text-[11px] leading-tight">En camino</p>
                <p className="text-[10px] text-gray-400">Hoy, 11:05 a. m.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-gray-200 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-400 text-[11px] leading-tight">Entregado</p>
              </div>
            </div>
          </div>

          {/* ETA Banner with Delivery Truck */}
          <div className="p-2.5 bg-gray-50 rounded-xl flex items-center gap-2 text-[11px] text-gray-600 font-medium">
            <Truck className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Tu pedido llegará en aproximadamente 35 minutos</span>
          </div>
        </div>

        {/* Card 3: Mis pedidos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
            <span className="font-bold text-ink">Mis pedidos</span>
            <Link to="/cliente/pedidos" className="text-primary hover:underline font-semibold">
              Ver todos <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </div>

          {/* List of recent orders matching image */}
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-gray-50/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-ink">#QK1258</span>
                <p className="text-gray-500 font-semibold text-[11px]">S/ 79.40</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  En camino
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">12 may. 2025</p>
              </div>
            </div>

            <div className="p-2.5 bg-gray-50/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-ink">#QK1257</span>
                <p className="text-gray-500 font-semibold text-[11px]">S/ 32.00</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Entregado
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">10 may. 2025</p>
              </div>
            </div>

            <div className="p-2.5 bg-gray-50/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-ink">#QK1256</span>
                <p className="text-gray-500 font-semibold text-[11px]">S/ 58.90</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Entregado
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">8 may. 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer matching reference image */}
      <footer className="pt-6 pb-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {/* Hummingbird Logo */}
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center p-1 text-white shadow-sm">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
              <path
                d="M48 18C44 21 39 23 35 24C38 19 40 14 38 10C31 12 25 18 23 25C21 27 18 28 14 28C11 28 8 27 6 25C10 32 18 35 25 34C24 38 22 43 17 46C24 46 30 42 34 37C38 43 45 48 54 50C49 43 47 36 48 29C52 27 56 23 58 18C54 18 50 18 48 18Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-ink">Quickly</span>
            <span className="text-[10px] text-primary ml-1.5 font-semibold">
              IA para impulsar negocios locales
            </span>
          </div>
        </div>

        <div className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
          <span>Emprende hoy. Vende mañana. Crece siempre.</span>
          <span className="text-primary font-bold">✦</span>
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
