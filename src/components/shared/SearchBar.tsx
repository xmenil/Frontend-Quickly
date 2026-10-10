import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, Trash2 } from 'lucide-react';

interface SearchBarProps {
  initialValue?: string;
  variant?: 'navbar-desktop' | 'navbar-mobile' | 'standalone';
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

const DEFAULT_HISTORY = [
  'samsung s23 ultra',
  'xiaomi 15t pro',
  'tacacho con cecina',
  'café de tingo maría',
  'juane de gallina',
  'farmacias y boticas',
];

const STORAGE_KEY = 'quickly_search_history';

export const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  variant = 'navbar-desktop',
  placeholder = 'Buscar productos, marcas y más...',
  className = '',
  onSearch,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_HISTORY;
  });

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const removeHistoryItem = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const executeSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    setIsFocused(false);
    if (!trimmed) return;
    saveToHistory(trimmed);
    if (onSearch) {
      onSearch(trimmed);
    }
    navigate(`/negocios?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  // Filter history if user is typing
  const filteredHistory = query.trim()
    ? history.filter((item) => item.toLowerCase().includes(query.toLowerCase().trim()))
    : history;

  const showDropdown = isFocused && (filteredHistory.length > 0 || query.trim().length > 0);

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
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full bg-white transition-all duration-150 ${
          showDropdown ? 'rounded-t-sm shadow-md' : 'rounded-sm shadow-xs'
        } ${
          isFocused
            ? 'border-2 border-[#3483fa]'
            : 'border border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-[13px] sm:text-sm py-2 px-3 sm:px-3.5"
          aria-label="Buscar productos, marcas y más..."
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 mr-1 rounded-full cursor-pointer"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Divider separator line before Search icon (as seen in Screenshot 1) */}
        <div className="h-5 w-[1px] bg-gray-200 flex-shrink-0" />

        {/* Magnifying Glass Search Button */}
        <button
          type="submit"
          aria-label="Buscar"
          className="px-3 sm:px-3.5 py-2 text-gray-500 hover:text-[#3483fa] flex items-center justify-center transition-colors cursor-pointer group"
        >
          <Search className="w-4 h-4 stroke-[1.75] group-hover:scale-105 transition-transform" />
        </button>
      </form>

      {/* Mercado Libre Search Dropdown with Recent Searches & Clock Icon */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full bg-white rounded-b-sm shadow-xl border-x-2 border-b-2 border-[#3483fa] z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in-50 duration-100">
          {filteredHistory.map((item) => (
            <div
              key={item}
              onMouseDown={() => {
                setQuery(item);
                executeSearch(item);
              }}
              className="flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-100/90 cursor-pointer text-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Thin Gray Clock Icon matching Screenshot 1 */}
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 stroke-[1.6]" />
                <span className="text-sm font-semibold text-gray-800 group-hover:text-black truncate">
                  {item}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => removeHistoryItem(e, item)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity text-xs"
                title="Eliminar de historial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Typing active query direct search option */}
          {query.trim() && (
            <div
              onMouseDown={() => executeSearch(query)}
              className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-pink-50/60 cursor-pointer text-primary transition-colors font-medium text-xs sm:text-sm"
            >
              <Search className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Buscar "<strong>{query.trim()}</strong>" en Tingo María
              </span>
            </div>
          )}

          {/* Bottom toolbar for clear history */}
          {history.length > 0 && !query.trim() && (
            <div className="px-3.5 py-1.5 bg-gray-50 flex items-center justify-end">
              <button
                type="button"
                onMouseDown={clearHistory}
                className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Limpiar historial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
