import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../../services/api/catalogApi';
import { RemoteState, useRemote } from '../../features/operations/shared';
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

interface CategoriesDropdownProps {
  variant?: 'default' | 'compact';
}

export const CategoriesDropdown: React.FC<CategoriesDropdownProps> = ({ variant = 'default' }) => {
  const resource = useRemote('navigation-categories', signal => catalogApi.categories(signal));
  const CATEGORIES_DATA: CategoryOption[] = resource.error ? [] : (resource.data || []).map(category => ({ id: category.id, name: category.name, hasSubcategories: true, subcategories: [], route: '/negocios?categoriaProducto=' + encodeURIComponent(category.id) }));
  const LOCAL_DELIVERY_SPECIALS = CATEGORIES_DATA.slice(0, 4).map(category => ({ name: category.name, route: category.route!, icon: '🛍️' }));
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
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-ink text-xs font-bold shadow-xs hover:shadow-sm border border-gray-100 transition-all cursor-pointer flex-shrink-0"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-xs leading-tight">Categorías</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 stroke-[2.5] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          className={`flex items-center gap-1 transition-all py-1 px-2.5 rounded-full cursor-pointer focus:outline-none group ${
            isOpen
              ? 'bg-white text-primary font-black shadow-sm ring-1 ring-white/50'
              : 'text-white hover:text-white hover:bg-white/15 font-medium'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-xs sm:text-[13px] leading-tight font-inherit">Categorías</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : 'text-white/80 group-hover:text-white'
            }`}
          />
        </button>
      )}

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
                  Explorar categorías
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
                <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
                {!resource.loading && !resource.error && !CATEGORIES_DATA.length && <p className="px-4 py-2 text-xs text-gray-300">No hay categorías disponibles.</p>}
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
                    {!hoveredCategory.subcategories.length && <p className="px-2 py-2 text-xs text-gray-300">Subcategorías no disponibles.</p>}
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
                  <span>Consulta disponibilidad en cada comercio</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
