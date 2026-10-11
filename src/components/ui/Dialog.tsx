import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const panel = dialogRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
    ) || []).filter((element) => !element.closest('[hidden]'));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          panel?.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const keepFocusInside = (event: FocusEvent) => {
      if (panel && !panel.contains(event.target as Node)) (focusable()[0] || panel).focus();
    };

    document.body.style.overflow = 'hidden';
    (focusable()[0] || panel)?.focus();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', keepFocusInside);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', keepFocusInside);
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector<HTMLElement>('main[tabindex]')?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Content */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-2xl bg-surface p-6 shadow-xl transition-all duration-200 z-10 max-h-full flex flex-col',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-border mb-4">
          <div>
            {title && (
              <h2 id={titleId} className="text-xl font-bold text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="text-sm text-ink-muted mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target -mr-2 -mt-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
};
