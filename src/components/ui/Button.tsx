import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'selva';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm active:bg-primary-900',
      secondary: 'bg-primary-light text-primary hover:bg-primary-100 font-semibold',
      outline: 'border border-gray-300 bg-white text-ink hover:bg-gray-50 active:bg-gray-100',
      ghost: 'text-ink hover:bg-gray-100 active:bg-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      selva: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
    };

    // Note: sizes maintain WCAG 44px min touch target on mobile/tablet
    const sizes = {
      sm: 'min-h-[40px] px-3 py-1.5 text-sm',
      md: 'min-h-[44px] px-4 py-2.5 text-base',
      lg: 'min-h-[50px] px-6 py-3 text-lg font-semibold',
      icon: 'min-h-[44px] min-w-[44px] p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
