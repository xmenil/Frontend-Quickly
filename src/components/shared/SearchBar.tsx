import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';

interface SearchBarProps {
  initialValue?: string;
  variant?: 'navbar-desktop' | 'navbar-mobile' | 'standalone';
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

const PLACEHOLDERS = [
  'Busca tacacho con cecina...',
  'Busca café de Leoncio Prado...',
  'Busca juanes o patarashca...',
  'Busca chocolates o cacao...',
  'Busca boticas o medicamentos...',
  'Busca productos del mercado...',
];

const POPULAR_SEARCHES = [
  'Tacacho con cecina',
  'Juane de gallina',
  'Café orgánico',
  'Chocolate al 70%',
  'Chupe de camarones',
  'Paracetamol',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  variant = 'navbar-desktop',
  placeholder,
  className = '',
  onSearch,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Rotating placeholder
  useEffect(() => {
    if (placeholder) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholder]);

  // Debounce 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (onSearch && query !== initialValue) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, onSearch, initialValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    setShowDropdown(false);
    if (!trimmed) return;
    if (onSearch) {
      onSearch(trimmed);
    }
    navigate(`/negocios?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSelectPopular = (term: string) => {
    setQuery(term);
    executeSearch(term);
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const activePlaceholder = placeholder || PLACEHOLDERS[placeholderIndex];

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        variant === 'navbar-desktop'
          ? 'max-w-xl'
          : variant === 'navbar-mobile'
          ? 'w-full'
          : 'max-w-2xl mx-auto'
      } ${className}`}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder={activePlaceholder}
          className={`w-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm border border-transparent transition-all ${
            variant === 'navbar-mobile'
              ? 'py-2 pl-9 pr-8 text-xs rounded-lg'
              : variant === 'standalone'
              ? 'py-3.5 pl-11 pr-24 text-base rounded-2xl shadow-subtle border-gray-200 focus:border-primary'
              : 'py-2 pl-3.5 pr-20 text-sm rounded-lg'
          }`}
          aria-label="Buscar productos, platos o comercios en Tingo María"
        />

        {/* Mobile Left Search Icon */}
        {variant === 'navbar-mobile' && (
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
        )}

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full ${
              variant === 'navbar-mobile'
                ? 'absolute right-2'
                : variant === 'standalone'
                ? 'absolute right-14'
                : 'absolute right-10'
            }`}
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Desktop / Standalone Search Button */}
        {variant !== 'navbar-mobile' && (
          <button
            type="submit"
            aria-label="Buscar"
            className={`absolute right-0 top-0 bottom-0 px-3.5 text-primary hover:text-primary-hover flex items-center justify-center transition-colors border-l border-gray-200 cursor-pointer ${
              variant === 'standalone' ? 'rounded-r-2xl px-5 bg-primary text-white hover:bg-primary-hover border-none' : 'rounded-r-lg'
            }`}
          >
            <Search className={`w-4 h-4 ${variant === 'standalone' ? 'text-white' : ''}`} />
          </button>
        )}
      </form>

      {/* Popular Suggestions Dropdown */}
      {showDropdown && !query && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-floating border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 px-1 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>Búsquedas populares en Tingo María</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onMouseDown={() => handleSelectPopular(term)}
                className="text-xs bg-gray-50 hover:bg-pink-50 hover:text-primary hover:border-primary/30 border border-gray-200 px-2.5 py-1.5 rounded-lg text-ink font-medium transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
