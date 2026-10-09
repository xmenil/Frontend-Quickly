import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, MoreHorizontal, LayoutGrid } from 'lucide-react';

interface CategoryCardItem {
  id: string;
  name: string;
  query: string;
  route?: string;
  imageUrl: string;
  highlight?: boolean;
}

const CATEGORIES_PAGE_1: CategoryCardItem[] = [
  {
    id: 'autos-motos',
    name: 'Autos, Motos y Otros',
    query: 'motos',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'celulares',
    name: 'Celulares y Teléfonos',
    query: 'celulares',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
    highlight: true,
  },
  {
    id: 'electrodomesticos',
    name: 'Electrodomésticos',
    query: 'electrodomesticos',
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'herramientas',
    name: 'Herramientas',
    query: 'herramientas',
    imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'accesorios-vehiculos',
    name: 'Accesorios para Vehículos',
    query: 'accesorios vehiculos',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'ropa-accesorios',
    name: 'Ropa y Accesorios',
    query: 'ropa',
    route: '/negocios?categoria=ropa',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'deportes-fitness',
    name: 'Deportes y Fitness',
    query: 'deportes',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'belleza-cuidado',
    name: 'Belleza y Cuidado Personal',
    query: 'belleza',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'hogar-muebles',
    name: 'Hogar, Muebles y Jardín',
    query: 'hogar',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'computacion',
    name: 'Computación',
    query: 'notebooks',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'inmuebles',
    name: 'Inmuebles',
    query: 'inmuebles',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'electronica-audio',
    name: 'Electrónica, Audio y Video',
    query: 'audio',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
  },
];

const CATEGORIES_PAGE_2: CategoryCardItem[] = [
  {
    id: 'restaurantes-selva',
    name: 'Restaurantes Amazónicos',
    query: 'restaurantes',
    route: '/negocios?categoria=restaurantes',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
    highlight: true,
  },
  {
    id: 'cacao-cafe',
    name: 'Cacao Nativo & Café Especial',
    query: 'cacao',
    route: '/negocios?categoria=emprendedores',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300&auto=format&fit=crop&q=80',
    highlight: true,
  },
  {
    id: 'farmacias-botiquin',
    name: 'Farmacias y Salud',
    query: 'farmacias',
    route: '/negocios?categoria=farmacias',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'bodegas-abarrotes',
    name: 'Bodegas y Abarrotes',
    query: 'bodegas',
    route: '/negocios?categoria=bodegas',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'mascotas',
    name: 'Alimentos y Mascotas',
    query: 'mascotas',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'juegos-juguetes',
    name: 'Juegos y Juguetes',
    query: 'juguetes',
    imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'bebes',
    name: 'Bebés y Maternidad',
    query: 'bebes',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'construccion',
    name: 'Construcción y Pinturas',
    query: 'construccion',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'industrias',
    name: 'Industrias y Oficinas',
    query: 'oficina',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'calzado-zapatillas',
    name: 'Calzado y Zapatillas',
    query: 'zapatillas',
    imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'parrillas-comida',
    name: 'Parrillas y Cecina Tingo',
    query: 'cecina',
    route: '/negocios?categoria=restaurantes',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'artesania-regional',
    name: 'Artesanías y Recuerdos Selva',
    query: 'selva',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=300&auto=format&fit=crop&q=80',
  },
];

export const CategoryGridSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const navigate = useNavigate();

  const currentItems = currentPage === 1 ? CATEGORIES_PAGE_1 : CATEGORIES_PAGE_2;

  const handleCardClick = (item: CategoryCardItem) => {
    if (item.route) {
      navigate(item.route);
    } else {
      navigate(`/negocios?q=${encodeURIComponent(item.query)}`);
    }
  };

  const togglePage = () => {
    setCurrentPage((prev) => (prev === 1 ? 2 : 1));
  };

  return (
    <section className="w-full bg-[#FAF5F8]/50 border-y border-pink-100/50 py-8 sm:py-10 select-none relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-200/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-ink tracking-tight">
                  Categorías
                </h2>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-extrabold bg-primary-50 text-primary border border-primary-100 px-2 py-0.5 rounded-full">
                  Explorar
                </span>
              </div>
              <p className="text-xs text-ink-light">
                Comercio, gastronomía, salud y servicios locales en Leoncio Prado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/negocios"
              className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover hover:underline transition-colors mr-2"
            >
              Mostrar todas las categorías
            </Link>

            {/* Page Indicators */}
            <div className="flex items-center gap-1.5 mr-1">
              <span
                onClick={() => setCurrentPage(1)}
                className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                  currentPage === 1 ? 'bg-primary w-4' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              />
              <span
                onClick={() => setCurrentPage(2)}
                className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                  currentPage === 2 ? 'bg-primary w-4' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={togglePage}
              aria-label="Más opciones"
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4x3 Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 animate-in fade-in duration-200">
          {currentItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="group bg-white rounded-xl border border-pink-100/80 hover:border-primary-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-card p-3 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              {/* Product / Category Thumbnail Box */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gray-50/80 group-hover:bg-primary-50/50 flex items-center justify-center p-2 flex-shrink-0 border border-gray-100/60 group-hover:border-primary-100 transition-colors">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300"
                />
              </div>

              {/* Title with brand berry hover highlight */}
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-xs sm:text-[13px] font-bold leading-snug transition-colors line-clamp-2 ${
                    item.highlight
                      ? 'text-primary'
                      : 'text-gray-800 group-hover:text-primary'
                  }`}
                >
                  {item.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Right Navigation Arrow Button matching Screenshot '>' */}
        <button
          type="button"
          onClick={togglePage}
          aria-label={currentPage === 1 ? 'Ver página siguiente' : 'Ver página anterior'}
          className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-floating border border-gray-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all z-20 hover:scale-108 active:scale-95"
        >
          {currentPage === 1 ? (
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          )}
        </button>
      </div>
    </section>
  );
};
