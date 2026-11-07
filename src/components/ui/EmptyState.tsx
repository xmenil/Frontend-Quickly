import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#eaeff2] rounded-3xl border-0 select-none ${className || ''}`}>
      <div className="w-14 h-14 rounded-2xl bg-gray-950 text-white flex items-center justify-center mb-4 shadow-xs [&>svg]:w-7 [&>svg]:h-7 [&>svg]:text-white [&>svg]:stroke-[2.2]">
        {icon || <PackageOpen className="w-7 h-7 text-white stroke-[2.2]" />}
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-700 font-medium max-w-md mx-auto mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full bg-gray-950 hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
