import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { RoleSwitcher } from '../components/shared/RoleSwitcher';
import { ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between text-ink antialiased">
      {/* Top Header Bar - Matches Home Main Navbar (primary green token) */}
      <header className="w-full bg-primary border-b border-primary-hover sticky top-0 z-30 shadow-md select-none text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" variant="white" showSubtitle={false} />
            <span className="hidden sm:inline-block h-4 w-px bg-white/30" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
              <span>🚚 Tingo María • Selva Alta</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all px-3.5 py-1.5 rounded-full active:scale-95 shadow-subtle"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>Volver a la tienda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-[480px] mx-auto animate-in fade-in duration-200">
          <Outlet />
        </div>
      </main>

      {/* Footer - Mercado Libre style reassurance */}
      <footer className="w-full bg-surface border-t border-border py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-light">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 font-medium">
            <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
              Cómo cuidamos tu privacidad
            </Link>
            <span>•</span>
            <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
              Términos y condiciones
            </Link>
            <span>•</span>
            <Link to="/cliente/ayuda" className="hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Centro de ayuda</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-center text-[11px] text-ink-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-selva flex-shrink-0" />
            <span>© 2026 Quickly Delivery • Tingo María, Leoncio Prado</span>
          </div>
        </div>
      </footer>

      <RoleSwitcher />
    </div>
  );
};


