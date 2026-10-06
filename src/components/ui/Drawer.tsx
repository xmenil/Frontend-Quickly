import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBottom = position === 'bottom';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed bg-white shadow-2xl transition-transform duration-300 flex flex-col z-10',
          isBottom
            ? 'inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh]'
            : 'inset-y-0 right-0 w-full max-w-md rounded-l-3xl h-full'
        )}
      >
        {/* Handle for bottom sheet */}
        {isBottom && (
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />
        )}

        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="touch-target -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
