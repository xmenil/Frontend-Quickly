import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { MobileNav } from '../components/shared/MobileNav';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { BrandLogo } from '../components/shared/BrandLogo';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-10">
        <Outlet />
      </main>
      <MobileNav />
      <DemoSwitcher />

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-gray-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <BrandLogo size="md" />
              <p className="text-xs text-gray-400 mt-2 text-center md:text-left">
                Plataforma de delivery para Tingo María, Rupa Rupa, provincia de Leoncio Prado, Huánuco, Perú.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 font-medium">
              <span>Restaurantes Amazónicos</span>
              <span>Farmacias Locales</span>
              <span>Bodegas de Barrio</span>
              <span>Emprendimientos de Cacao y Café</span>
            </div>
            <div className="text-xs text-gray-400 text-center md:text-right">
              <p>Quickly Delivery Prototype © 2026</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Demostración frontend simulada</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
