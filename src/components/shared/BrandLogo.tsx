import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'default' | 'white';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'default',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const isWhite = variant === 'white';

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Ícono oficial: Repartidor Quickly corriendo con mochila de pedidos */}
      <div
        className={`${iconSizes[size]} ${
          isWhite ? 'bg-white shadow-md' : 'bg-primary shadow-sm'
        } rounded-xl p-1.5 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`w-full h-full ${isWhite ? 'text-primary' : 'text-white'}`}>
          {/* Mochila / caja de delivery */}
          <rect x="2" y="7" width="5" height="7" rx="1" fill="currentColor" fillOpacity="0.25" />
          {/* Cabeza */}
          <circle cx="15" cy="4" r="2" fill="currentColor" />
          {/* Cuerpo y piernas en carrera */}
          <path d="M10 8h4l2 5-3 2" />
          <path d="M13 15l-2 5-4-1" />
          <path d="M16 13l3 2 2-3" />
          <path d="M9 10l-2 3" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight ${
              isWhite ? 'text-white' : 'text-ink'
            } ${textSizes[size]}`}
          >
            Quickly
          </span>
          <span className={`font-black text-2xl ${isWhite ? 'text-white' : 'text-primary'}`}>.</span>
        </div>
        {showSubtitle && size !== 'sm' && (
          <span
            className={`text-[10px] font-medium tracking-tight mt-0.5 ${
              isWhite ? 'text-emerald-100' : 'text-ink-muted'
            }`}
          >
            IA para impulsar negocios locales
          </span>
        )}
      </div>
    </Link>
  );
};
