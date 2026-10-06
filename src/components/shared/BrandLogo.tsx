import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
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

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* SVG stylized hummingbird (colibrí origami) */}
      <div
        className={`${iconSizes[size]} bg-primary rounded-xl p-1.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}
      >
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
          <path
            d="M48 18C44 21 39 23 35 24C38 19 40 14 38 10C31 12 25 18 23 25C21 27 18 28 14 28C11 28 8 27 6 25C10 32 18 35 25 34C24 38 22 43 17 46C24 46 30 42 34 37C38 43 45 48 54 50C49 43 47 36 48 29C52 27 56 23 58 18C54 18 50 18 48 18Z"
            fill="#FFFFFF"
          />
          <circle cx="33" cy="18" r="2.5" fill="#BE185D" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-tight text-ink ${textSizes[size]}`}>
          Quickly<span className="text-primary">.</span>
        </span>
        {showSubtitle && size !== 'sm' && (
          <span className="text-[10px] font-semibold text-primary tracking-tight mt-0.5">
            IA para impulsar negocios locales
          </span>
        )}
      </div>
    </Link>
  );
};
