import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ShoppingBag, Store} from 'lucide-react';
import {HomeHero} from './HomeHero';
import {RealCatalogPage} from './RealCatalogPages';
import {HomeStoresSection, CoverageSection} from './HomeStoresSection';

export function HomePage() {
  return <div className="w-full flex flex-col bg-white text-ink">
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 pb-2 text-sm text-ink-light flex flex-wrap justify-between gap-2">
      <span>Compras locales en Tingo María</span><span>Efectivo · Envío independiente por tienda</span>
    </div>
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-3"><HomeHero /></div>
    <section id="catalogo" aria-label="Catálogo de productos" className="scroll-mt-36 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
      <RealCatalogPage home />
    </section>
    <HomeStoresSection />
    <section className="bg-primary-50 border-y border-border py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-4 sm:gap-6">
        <Link to="/cliente/direcciones" className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3 hover:border-primary-dark"><h2 className="font-bold">Tu dirección de entrega</h2><p className="text-sm text-ink-light">Administra tus direcciones y revisa la cobertura al cotizar.</p><ArrowRight className="w-5 h-5 text-primary-dark"/></Link>
        <CoverageSection />
        <Link to="/cliente/pedidos" className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3 hover:border-primary-dark"><h2 className="font-bold">Tus pedidos</h2><p className="text-sm text-ink-light">Consulta el estado de tus compras y el detalle de cada entrega.</p><ArrowRight className="w-5 h-5 text-primary-dark"/></Link>
      </div>
    </section>
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid sm:grid-cols-2 gap-4" aria-label="Afiliación">
      <Link to="/registro/comercio" className="bg-primary-dark text-white rounded-2xl p-6 space-y-3"><Store aria-hidden className="w-7 h-7"/><h2 className="text-xl font-bold">Tu negocio en Quickly</h2><p>Solicita la afiliación de tu comercio y administra tu catálogo.</p><span className="inline-flex items-center gap-2 font-bold">Afiliar mi negocio <ArrowRight className="w-5 h-5"/></span></Link>
      <Link to="/registro/repartidor" className="bg-surface-subtle border border-border rounded-2xl p-6 space-y-3"><ShoppingBag aria-hidden className="w-7 h-7 text-primary-dark"/><h2 className="text-xl font-bold">Reparte en tu ciudad</h2><p>Envía tu solicitud y consulta el proceso de habilitación.</p><span className="inline-flex items-center gap-2 font-bold text-primary-dark">Solicitar afiliación <ArrowRight className="w-5 h-5"/></span></Link>
    </section>
  </div>;
}
