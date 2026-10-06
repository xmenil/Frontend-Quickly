import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'underline',
}) => {
  return (
    <div
      className={cn(
        'flex overflow-x-auto no-scrollbar border-b border-gray-200',
        variant === 'pills' && 'border-b-0 gap-2 p-1 bg-gray-100 rounded-xl',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'touch-target whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2',
                isActive
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-ink hover:bg-gray-200/50'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-primary-light text-primary' : 'bg-gray-200 text-gray-700'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'touch-target whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-ink hover:border-gray-300'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
