import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, ScrollRestoration, Link } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { MobileNav } from '../components/shared/MobileNav';
import { RoleSwitcher } from '../components/shared/RoleSwitcher';
import { BrandLogo } from '../components/shared/BrandLogo';
import {
  MapPin,
  Headphones,
  Instagram,
  Facebook,
  Youtube,
  Send,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isCheckoutFlow = pathname === '/carrito' || pathname === '/checkout';
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribedEmail.trim()) return;
    setSubscriptionSuccess(true);
    setTimeout(() => {
      setSubscriptionSuccess(false);
      setSubscribedEmail('');
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollRestoration />
      <Navbar />
      <main className="flex-1 pb-24 md:pb-12 w-full">
        <Outlet />
      </main>
      <MobileNav />
      {!isCheckoutFlow && <RoleSwitcher />}

      {/* Pestaña flotante lateral estilo pc Factory "Danos tu opinión" */}
      <Link
        to="/cliente/ayuda"
        aria-label="Danos tu opinión"
        className="hidden lg:flex items-center gap-1.5 fixed right-0 top-1/2 -translate-y-1/2 bg-[#d7ff64] hover:bg-[#c8f54c] text-gray-900 px-2.5 py-4 rounded-l-xl text-xs font-bold shadow-lg [writing-mode:vertical-rl] rotate-180 z-30 transition-all border border-lime-300"
      >
        <span>☺ Danos tu opinión</span>
      </Link>

      {/* Footer Estilo pc Factory Adaptado a Quickly (Imagen 5) */}
      <footer className="w-full bg-white border-t border-gray-200 mt-auto">
        {/* Barra superior de acento verde brillante */}
        <div className="w-full h-1.5 bg-[#00c853]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Columna Izquierda: Identidad, Encuentra tu tienda, Contacto, Suscripción y Redes */}
            <div className="lg:col-span-4 space-y-5">
              <div>
                <BrandLogo size="md" showSubtitle={true} />
              </div>

              {/* Botón Encuentra tu comercio local */}
              <div>
                <Link
                  to="/negocios"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#a7f3d0] hover:bg-[#6ee7b7] text-emerald-950 font-bold text-xs transition-colors shadow-2xs"
                >
                  <MapPin className="w-4 h-4 text-emerald-800" />
                  <span>Encuentra tu tienda local</span>
                </Link>
              </div>

              {/* Atención al Cliente */}
              <div className="space-y-0.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <Headphones className="w-4 h-4 text-[#00c853]" />
                  <span>Atención al Cliente</span>
                </div>
                <p className="text-sm font-black text-gray-900 tracking-wider">
                  +51 962 123 456
                </p>
                <p className="text-[11px] text-gray-500">
                  Tingo María: Lunes a Domingo 8:00 AM - 10:00 PM
                </p>
              </div>

              {/* Newsletter / Promociones exclusivas */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800">
                  Obtén ofertas y promociones exclusivas.
                </p>
                {subscriptionSuccess ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Gracias por suscribirte a Quickly!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      value={subscribedEmail}
                      onChange={(e) => setSubscribedEmail(e.target.value)}
                      placeholder="Ingresa tu correo"
                      className="px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-primary flex-1 bg-gray-50 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Suscríbete
                    </button>
                  </form>
                )}
              </div>

              {/* Redes Sociales con estilo de borde verde pc Factory */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-gray-800">Síguenos</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram Quickly"
                    className="w-8 h-8 rounded-lg border-2 border-[#00c853] text-[#00c853] hover:bg-[#00c853] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook Quickly"
                    className="w-8 h-8 rounded-lg border-2 border-[#00c853] text-[#00c853] hover:bg-[#00c853] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube Quickly"
                    className="w-8 h-8 rounded-lg border-2 border-[#00c853] text-[#00c853] hover:bg-[#00c853] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok Quickly"
                    className="w-8 h-8 rounded-lg border-2 border-[#00c853] text-[#00c853] hover:bg-[#00c853] hover:text-white flex items-center justify-center transition-colors font-black text-xs"
                  >
                    Tk
                  </a>
                </div>
              </div>
            </div>

            {/* 4 Columnas de Navegación Exactas al Modelo pc Factory */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-2">
              
              {/* Columna 1: Mundo Quickly */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Mundo Quickly
                </h4>
                <ul className="space-y-2 text-xs text-gray-600 font-medium">
                  <li>
                    <Link to="/negocios" className="hover:text-primary transition-colors">
                      Navidad & Temporada
                    </Link>
                  </li>
                  <li>
                    <Link to="/negocios" className="hover:text-primary transition-colors">
                      Cyber Ofertas
                    </Link>
                  </li>
                  <li>
                    <Link to="/negocios?q=celular" className="hover:text-primary transition-colors">
                      Tecnología & Celulares
                    </Link>
                  </li>
                  <li>
                    <Link to="/negocios?q=ropa" className="hover:text-primary transition-colors">
                      Moda & Calzado Selva
                    </Link>
                  </li>
                  <li>
                    <Link to="/negocios?q=cama" className="hover:text-primary transition-colors">
                      Camas & Dormitorio
                    </Link>
                  </li>
                  <li>
                    <Link to="/negocios" className="hover:text-primary transition-colors">
                      Sabores de Tingo María
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 2: ¿Necesitas Ayuda? */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  ¿Necesitas Ayuda?
                </h4>
                <ul className="space-y-2 text-xs text-gray-600 font-medium">
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Centro de ayuda
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/pedidos" className="hover:text-primary transition-colors">
                      Estado de mi despacho
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Revisa tu boleta
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Orden de servicio
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Preguntas frecuentes
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Términos y condiciones
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Acerca de Quickly */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Acerca de Quickly
                </h4>
                <ul className="space-y-2 text-xs text-gray-600 font-medium">
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Quiénes somos
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Representante Legal
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Beneficios de comprar con nosotros
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Privacidad y seguridad
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Sustentabilidad local
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Bases y Promociones
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 4: Servicios y Negocios */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Servicios
                </h4>
                <ul className="space-y-2 text-xs text-gray-600 font-medium">
                  <li>
                    <Link to="/registro/comercio" className="hover:text-primary transition-colors">
                      Afiliar mi tienda
                    </Link>
                  </li>
                  <li>
                    <Link to="/registro/repartidor" className="hover:text-primary transition-colors">
                      Conviértete en repartidor
                    </Link>
                  </li>
                  <li>
                    <Link to="/negocios" className="hover:text-primary transition-colors">
                      Comercios de la ciudad
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors">
                      Cobertura y Zonas
                    </Link>
                  </li>
                  <li>
                    <Link to="/cliente/ayuda" className="hover:text-primary transition-colors flex items-center gap-1 font-bold text-gray-900">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Libro de Reclamaciones</span>
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Barra Inferior de Copyright y Respaldo */}
          <div className="pt-8 mt-8 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p className="text-center sm:text-left">
              Quickly Delivery © 2026 • Plataforma de comercio y envíos para Tingo María, Rupa Rupa y Leoncio Prado, Huánuco, Perú.
            </p>
            <div className="flex items-center gap-3 font-semibold text-gray-700">
              <span>Pago contra entrega en efectivo o Yape</span>
              <span>•</span>
              <span>Garantía de comercios formales</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
