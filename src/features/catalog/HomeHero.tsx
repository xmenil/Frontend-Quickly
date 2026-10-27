import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Sprout} from 'lucide-react';
import heroFamilyGroceries from '../../assets/img/image copy 2.png';
import heroMotorcycleDelivery from '../../assets/img/image copy 3.png';
import heroSmartphoneView from '../../assets/img/image copy 4.png';
const slides = [
 {id:1,image:heroFamilyGroceries,badge:'Quickly · Tingo María',title:'Todo lo que necesitas, en un solo lugar',description:'Explora los productos y presentaciones de los comercios disponibles.',ctaText:'Ver categorías',ctaLink:'/#categorias'},
 {id:2,image:heroMotorcycleDelivery,badge:'Compras de varios comercios',title:'Tus compras, tienda por tienda',description:'Cada tienda tiene su propio envío y cobro. Revisa la cobertura y el total antes de confirmar.',ctaText:'Explorar comercios',ctaLink:'/negocios'},
 {id:3,image:heroSmartphoneView,badge:'Pago en efectivo',title:'Tus compras del hogar directo a tu puerta',description:'Elige tus productos y revisa precios, existencias y envío antes de comprar.',ctaText:'Ver mi carrito',ctaLink:'/carrito'}
];
export function HomeHero() {
 const [currentHeroSlide,setCurrentHeroSlide]=useState(0);
 return <section aria-label="Presentación de Quickly">          {/* Hero Banner Carousel (estilo prototipo v2 con micro-copys concisos) */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm min-h-[340px] sm:min-h-[300px] flex flex-col justify-center p-5 pb-24 sm:p-7 sm:pb-24 text-white group w-full bg-primary-dark">
            {/* Background Slides with crossfade transition */}
            {slides.map((slide, idx) => {
              const isActive = idx === currentHeroSlide;
              return (
                <div
                  key={slide.id}
                  aria-hidden="true"
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center filter brightness-[0.85] scale-100 group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
              );
            })}

            {/* Sombra y gradiente para contraste limpio sobre fondos naturales */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent z-10" />

            {/* Slide Content */}
            <div className="relative z-20 space-y-2 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-dark text-white text-[11px] sm:text-xs font-bold shadow-xs">
                <Sprout className="w-3.5 h-3.5 text-white" />
                <span>{slides[currentHeroSlide].badge}</span>
              </span>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                {slides[currentHeroSlide].title}
              </h1>

              <p className="text-xs sm:text-sm text-gray-100 font-medium leading-snug drop-shadow line-clamp-2 max-w-md">
                {slides[currentHeroSlide].description}
              </p>

              <div className="pt-1 flex items-center gap-2">
                <Link
                  to={slides[currentHeroSlide].ctaLink}
                  className="inline-flex min-h-11 items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full bg-primary-dark hover:bg-selva text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{slides[currentHeroSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* Carousel Pagination Dots */}
            <div className="absolute bottom-3.5 right-3.5 sm:bottom-5 sm:right-6 z-20 flex items-center gap-1.5 bg-ink/80 px-3 py-1.5 rounded-full border border-white/20">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentHeroSlide(idx)}
                  aria-pressed={idx === currentHeroSlide}
                  className={`min-w-11 min-h-11 text-sm font-bold transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentHeroSlide
                      ? 'border-2 border-white bg-primary-dark'
                      : 'border border-white/70 bg-ink/80 hover:bg-primary-dark'
                  }`}
                  aria-label={`Ver presentación ${idx + 1}`}
                >{idx + 1}</button>
              ))}
            </div>
          </div>

</section>;
}
