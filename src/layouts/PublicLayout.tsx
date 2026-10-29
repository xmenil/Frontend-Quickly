import React, { useEffect } from 'react';
import { Outlet, useLocation, ScrollRestoration, Link } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { MobileNav } from '../components/shared/MobileNav';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { BrandLogo } from '../components/shared/BrandLogo';
import { isDemoMode } from '../config/appMode';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isCheckoutFlow = pathname === '/carrito' || pathname === '/checkout';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollRestoration />
      <Navbar />
      <main className="flex-1 pb-24 md:pb-12 w-full">
        <Outlet />
      </main>
      <MobileNav />
      {!isCheckoutFlow && <DemoSwitcher />}

      {/* Footer */}
      <footer className="bg-white border-t border-border pt-10 pb-24 md:pb-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <BrandLogo size="md" showSubtitle={true} />
              <p className="text-xs text-ink-light mt-2 text-center md:text-left">
                Plataforma de delivery para Tingo María, Rupa Rupa, provincia de Leoncio Prado, Huánuco, Perú.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-ink-light font-medium">
              <Link className="min-h-11 inline-flex items-center" to="/negocios">Comercios</Link>
              <Link className="min-h-11 inline-flex items-center" to="/registro/comercio">Afiliar mi negocio</Link>
              <Link className="min-h-11 inline-flex items-center" to="/registro/repartidor">Ser repartidor</Link>
              <Link className="min-h-11 inline-flex items-center" to="/cliente/ayuda">Ayuda</Link>
            </div>
            <div className="text-xs text-ink-light text-center md:text-right">
              <p>Quickly Delivery © 2026</p>
              <p className="text-[11px] text-ink-light mt-0.5">{isDemoMode ? 'Demostración frontend simulada' : 'Pago en efectivo · Envío por tienda'}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
