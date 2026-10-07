import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SubCategory {
  name: string;
  query: string;
}

interface CategoryOption {
  id: string;
  name: string;
  hasSubcategories?: boolean;
  subcategories?: SubCategory[];
  route?: string;
  badge?: string;
}

const CATEGORIES_DATA: CategoryOption[] = [
  {
    id: 'tecnologia',
    name: 'Tecnología',
    hasSubcategories: true,
    subcategories: [
      { name: 'Celulares y Smartphones', query: 'celulares' },
      { name: 'Notebooks y Computación', query: 'notebooks' },
      { name: 'Audio y Audífonos', query: 'audio' },
      { name: 'Cámaras y Drones', query: 'camaras' },
      { name: 'Consolas y Videojuegos', query: 'videojuegos' },
      { name: 'Televisores y Smart TV', query: 'televisores' },
      { name: 'Accesorios y Cables', query: 'accesorios' },
    ],
  },
  {
    id: 'electrodomesticos',
    name: 'Electrodomésticos',
    hasSubcategories: true,
    subcategories: [
      { name: 'Refrigeración', query: 'refrigerador' },
      { name: 'Lavado y Secado', query: 'lavadora' },
      { name: 'Cocina y Microondas', query: 'cocina' },
      { name: 'Licuadoras y Batidoras', query: 'licuadora' },
      { name: 'Aires Acondicionados', query: 'aire' },
    ],
  },
  {
    id: 'hogar-muebles',
    name: 'Hogar y Muebles',
    hasSubcategories: true,
    subcategories: [
      { name: 'Muebles de Sala', query: 'sala' },
      { name: 'Dormitorio y Camas', query: 'camas' },
      { name: 'Cocina y Menaje', query: 'menaje' },
      { name: 'Iluminación y Lámparas', query: 'iluminacion' },
      { name: 'Organización y Cajas', query: 'organizacion' },
    ],
  },
  {
    id: 'deportes-fitness',
    name: 'Deportes y Fitness',
    hasSubcategories: true,
    subcategories: [
      { name: 'Zapatillas Deportivas', query: 'zapatillas' },
      { name: 'Ropa de Entrenamiento', query: 'ropa deportiva' },
      { name: 'Bicicletas y Ciclismo', query: 'bicicletas' },
      { name: 'Mancuernas y Pesas', query: 'pesas' },
      { name: 'Suplementos y Shakers', query: 'suplementos' },
    ],
  },
  {
    id: 'mascotas',
    name: 'Mascotas',
    hasSubcategories: true,
    subcategories: [
      { name: 'Alimento para Perros', query: 'perros' },
      { name: 'Alimento para Gatos', query: 'gatos' },
      { name: 'Accesorios y Correas', query: 'accesorios mascotas' },
      { name: 'Salud e Higiene Animal', query: 'veterinaria' },
    ],
  },
  {
    id: 'belleza-cuidado',
    name: 'Belleza y Cuidado personal',
    hasSubcategories: true,
    subcategories: [
      { name: 'Perfumes y Fragancias', query: 'perfumes' },
      { name: 'Cuidado Facial & Skincare', query: 'skincare' },
      { name: 'Maquillaje Profesional', query: 'maquillaje' },
      { name: 'Cuidado del Cabello', query: 'shampoo' },
    ],
  },
  {
    id: 'herramientas',
    name: 'Herramientas',
    hasSubcategories: true,
    subcategories: [
      { name: 'Herramientas Eléctricas', query: 'herramientas electricas' },
      { name: 'Taladros y Atornilladores', query: 'taladro' },
      { name: 'Herramientas Manuales', query: 'herramientas' },
      { name: 'Cajas y Organizadores', query: 'cajas herramientas' },
    ],
  },
  {
    id: 'construccion',
    name: 'Construcción',
    hasSubcategories: true,
    subcategories: [
      { name: 'Pinturas y Barnices', query: 'pintura' },
      { name: 'Plomería y Grifería', query: 'plomeria' },
      { name: 'Materiales Eléctricos', query: 'electricidad' },
    ],
  },
  {
    id: 'industrias-oficinas',
    name: 'Industrias y Oficinas',
    hasSubcategories: true,
    subcategories: [
      { name: 'Papelería y Cuadernos', query: 'papeleria' },
      { name: 'Impresoras y Tintas', query: 'impresoras' },
      { name: 'Equipamiento Comercial', query: 'oficina' },
    ],
  },
  {
    id: 'juegos-juguetes',
    name: 'Juegos y Juguetes',
    hasSubcategories: true,
    subcategories: [
      { name: 'Juegos de Mesa', query: 'juegos de mesa' },
      { name: 'Juguetes Didácticos', query: 'juguetes' },
      { name: 'Figuras de Acción y Muñecas', query: 'figuras' },
    ],
  },
  {
    id: 'bebes',
    name: 'Bebés',
    hasSubcategories: true,
    subcategories: [
      { name: 'Pañales y Toallitas', query: 'panales' },
      { name: 'Coches y Cunas', query: 'coches bebe' },
      { name: 'Ropa para Bebés', query: 'ropa bebe' },
    ],
  },
  {
    id: 'accesorios-vehiculos',
    name: 'Accesorios para Vehículos',
    hasSubcategories: true,
    subcategories: [
      { name: 'Cascos para Moto', query: 'cascos' },
      { name: 'Audio para Autos', query: 'audio auto' },
      { name: 'Repuestos y Baterías', query: 'baterias' },
    ],
  },
  {
    id: 'moda',
    name: 'Moda',
    route: '/negocios?categoria=ropa',
    hasSubcategories: true,
    subcategories: [
      { name: 'Ropa Hombre', query: 'ropa hombre' },
      { name: 'Ropa Mujer', query: 'ropa mujer' },
      { name: 'Calzado y Zapatillas', query: 'calzado' },
      { name: 'Mochilas y Bolsos', query: 'mochilas' },
    ],
  },
  {
    id: 'salud-medico',
    name: 'Salud y Equipamiento Médico',
    route: '/negocios?categoria=farmacias',
    hasSubcategories: true,
    subcategories: [
      { name: 'Botiquines y Primeros Auxilios', query: 'botiquin' },
      { name: 'Termómetros y Tensiómetros', query: 'termometro' },
      { name: 'Vitaminas y Suplementos', query: 'vitaminas' },
    ],
  },
  {
    id: 'vehiculos',
    name: 'Vehículos',
    hasSubcategories: true,
    subcategories: [
      { name: 'Motos y Mototaxis', query: 'motos' },
      { name: 'Bicicletas Eléctricas', query: 'bicicleta electrica' },
    ],
  },
];

const LOCAL_DELIVERY_SPECIALS = [
  { name: 'Restaurantes Amazónicos', route: '/negocios?categoria=restaurantes', icon: '🍽️' },
  { name: 'Farmacias Locales', route: '/negocios?categoria=farmacias', icon: '💊' },
  { name: 'Bodegas de Barrio', route: '/negocios?categoria=bodegas', icon: '🛒' },
  { name: 'Cacao, Café & Selva Central', route: '/negocios?categoria=emprendedores', icon: '☕' },
];

export const CategoriesDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (category: CategoryOption) => {
    setIsOpen(false);
    setHoveredCategory(null);
    if (category.route) {
      navigate(category.route);
    } else {
      navigate(`/negocios?q=${encodeURIComponent(category.name.toLowerCase())}`);
    }
  };

  const handleSubcategoryClick = (sub: SubCategory) => {
    setIsOpen(false);
    setHoveredCategory(null);
    navigate(`/negocios?q=${encodeURIComponent(sub.query)}`);
  };

  const handleLocalClick = (route: string) => {
    setIsOpen(false);
    setHoveredCategory(null);
    navigate(route);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block"
      onMouseLeave={() => {
        setIsOpen(false);
        setHoveredCategory(null);
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-1 text-white hover:text-pink-100 font-medium transition-colors py-1 cursor-pointer focus:outline-none group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-xs sm:text-[13px] leading-tight font-medium">Categorías</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/80 group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full pt-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{ minWidth: '240px' }}
        >
          {/* Top Triangle Caret Arrow pointing up to "Categorías" */}
          <div className="absolute top-[3px] left-6 w-0 h-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-[#333333] z-10" />

          {/* Dark Container exactly matching Mercado Libre */}
          <div className="relative bg-[#333333] text-gray-100 rounded-lg shadow-2xl border border-neutral-700/80 overflow-visible flex">
            {/* Main Categories Column */}
            <div className="w-60 py-2 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-600">
              {/* Delivery shortcuts banner */}
              <div className="px-3 pb-2 mb-1 border-b border-neutral-700/80">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Envíos Rápidos Tingo María
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {LOCAL_DELIVERY_SPECIALS.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleLocalClick(loc.route)}
                      className="text-left text-[11px] font-semibold text-amber-300 hover:text-white p-1 rounded hover:bg-neutral-700/60 transition-colors truncate flex items-center gap-1"
                    >
                      <span>{loc.icon}</span>
                      <span className="truncate">{loc.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mercado Libre Categories List */}
              <div className="space-y-0.5">
                {CATEGORIES_DATA.map((cat) => {
                  const isHovered = hoveredCategory?.id === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setHoveredCategory(cat)}
                      onClick={() => handleCategoryClick(cat)}
                      className={`px-4 py-1.5 flex items-center justify-between text-xs sm:text-[13px] font-normal cursor-pointer transition-colors ${
                        isHovered
                          ? 'bg-[#404040] text-white font-medium'
                          : 'text-gray-200 hover:bg-[#404040] hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      {cat.hasSubcategories && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                            isHovered ? 'text-white' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nested Subcategories Flyout Panel */}
            {hoveredCategory && hoveredCategory.subcategories && (
              <div
                className="w-64 bg-[#333333] border-l border-neutral-700/80 rounded-r-lg p-3 py-4 space-y-1.5 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-150 flex flex-col justify-between"
                onMouseEnter={() => setHoveredCategory(hoveredCategory)}
              >
                <div>
                  <div className="pb-2 mb-2 border-b border-neutral-700/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {hoveredCategory.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCategoryClick(hoveredCategory)}
                      className="text-[11px] text-amber-300 hover:underline font-semibold"
                    >
                      Ver todo
                    </button>
                  </div>

                  <div className="space-y-1">
                    {hoveredCategory.subcategories.map((sub) => (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => handleSubcategoryClick(sub)}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-300 hover:text-white hover:bg-[#404040] transition-colors truncate"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-700/80 text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Entrega disponible hoy en Tingo María</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
