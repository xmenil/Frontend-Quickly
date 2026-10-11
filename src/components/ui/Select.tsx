import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, children, id, ...props }, ref) => {
    const selectId = id || (label ? `select_${label.toLowerCase().replace(/\s+/g, '_')}` : undefined);
    const errorId = error && selectId ? `${selectId}-error` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-ink">
            {label}
            {props.required && <span className="text-primary ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={Boolean(error)}
            className={cn(
              'w-full min-h-11 appearance-none rounded-xl border bg-surface px-3 py-2 pr-10 text-base text-ink transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:bg-surface-subtle disabled:cursor-not-allowed',
              error ? 'border-destructive' : 'border-field hover:border-ink-muted',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 flex items-center text-ink-muted">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-xs text-destructive mt-0.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && <p className="text-xs text-ink-muted mt-0.5">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
