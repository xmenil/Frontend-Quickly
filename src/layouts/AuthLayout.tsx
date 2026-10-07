import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { ArrowLeft, Sparkles, MapPin, Shield } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50/70 relative flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Ambient background decoration matching Amazonian & Berry palette */}
      <div
        className="fixed top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-primary-200/25 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 right-10 w-[30rem] h-[30rem] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/2 right-1/4 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-4 sm:mb-8 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-ink-light hover:text-primary transition-all bg-white/90 hover:bg-white backdrop-blur-md px-3.5 py-2 rounded-full border border-gray-200/80 shadow-subtle active:scale-95 touch-target"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          <span>Volver a la tienda</span>
        </Link>

        {/* Local presence badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200/70 text-xs font-semibold text-ink-light shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Tingo María • Rupa Rupa</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col justify-center items-center z-10 my-auto">
        {isLoginPage ? (
          <div className="w-full max-w-2xl mx-auto">
            <Outlet />
          </div>
        ) : (
          <div className="w-full sm:max-w-md mx-auto space-y-6">
            <div className="text-center">
              <BrandLogo size="lg" className="justify-center mb-2" />
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Tingo María, Rupa Rupa, provincia de Leoncio Prado
              </p>
            </div>
            <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-3xl border border-gray-100">
              <Outlet />
            </div>
          </div>
        )}
      </main>

      {/* Footer reassurance */}
      <footer className="w-full max-w-6xl mx-auto mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-light gap-2 z-10">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">Quickly Delivery • Plataforma para el desarrollo de la Selva Alta</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600 font-medium">
          <span>Castillo Grande</span>
          <span>•</span>
          <span>Centro</span>
          <span>•</span>
          <span>UNAS</span>
          <span>•</span>
          <span>Afilador</span>
        </div>
      </footer>

      <DemoSwitcher />
    </div>
  );
};

