import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `input_${label.toLowerCase().replace(/\s+/g, '_')}` : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label}
            {props.required && <span className="text-primary ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-ink-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            className={cn(
              'w-full min-h-11 rounded-xl border bg-surface px-3 py-2 text-base text-ink transition-colors',
              'placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:bg-surface-subtle disabled:text-ink-muted disabled:cursor-not-allowed',
              error ? 'border-destructive focus:ring-destructive' : 'border-field hover:border-ink-muted',
              leftIcon ? 'pl-11' : '',
              rightIcon ? 'pr-11' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-ink-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-xs text-destructive mt-0.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-ink-muted mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
