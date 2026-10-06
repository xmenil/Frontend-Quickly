import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-gray-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Return home link */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary transition-colors bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-full border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <BrandLogo size="lg" className="justify-center mb-2" />
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Tingo María, Rupa Rupa, provincia de Leoncio Prado
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-3xl border border-gray-100">
          <Outlet />
        </div>
      </div>

      <DemoSwitcher />
    </div>
  );
};
