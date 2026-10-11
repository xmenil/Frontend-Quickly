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
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ';

    const variants = {
      primary: 'bg-primary text-surface hover:bg-primary-hover shadow-sm active:bg-primary-hover',
      secondary: 'bg-primary-50 text-primary hover:bg-primary-light font-semibold',
      outline: 'border border-primary text-primary bg-surface hover:bg-primary-50 active:bg-primary-light',
      ghost: 'text-ink hover:bg-surface-subtle active:bg-surface-subtle',
      danger: 'bg-destructive text-surface hover:bg-destructive-strong active:bg-destructive-strong',
      selva: 'bg-selva text-surface hover:bg-selva-strong active:bg-selva-strong',
    };

    // Note: sizes maintain WCAG 44px min touch target on mobile/tablet
    const sizes = {
      sm: 'min-h-11 px-3 py-1.5 text-sm',
      md: 'min-h-11 px-4 py-2.5 text-base',
      lg: 'min-h-12 px-6 py-3 text-lg font-semibold',
      icon: 'min-h-11 min-w-11 p-2',
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
