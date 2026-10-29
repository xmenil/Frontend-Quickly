import { ArrowDown, ArrowRight, Banknote, Bike, Coffee, HeartPulse, Leaf, MapPin, Package, ShoppingBag, ShoppingBasket, Smartphone, Store, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi, imageUrl } from '../../services/api/catalogApi';
import { RemoteState, useRemote } from '../operations/shared';
import deliveryImage from '../../assets/img/image copy 3.png';

export function CatalogLandingHero() {
 return <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#153d30] text-white">
  <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_rgba(133,190,89,.22),_transparent_65%)]" />
  <div className="grid lg:grid-cols-[1.05fr_1fr]">
   <div className="px-6 py-10 sm:p-10 lg:p-12 flex flex-col items-start justify-center">
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide"><MapPin className="h-3.5 w-3.5" aria-hidden="true"/>Hecho para Tingo María</span>
    <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight">Tu ciudad.<br/>Tus favoritos.<br/><span className="text-[#c2ed86]">A tu puerta.</span></h1>
    <p className="mt-5 max-w-md text-sm sm:text-base leading-7 text-white/75">Descubre lo que tienen los negocios de tu ciudad. Elige, arma tu carrito y recibe tus pedidos donde estés.</p>
    <a href="#catalogo" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#c2ed86] px-6 py-3 text-sm font-bold text-[#153d30] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Explorar productos<ArrowDown className="h-4 w-4" aria-hidden="true"/></a>
    <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-white/80"><span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-[#c2ed86]" aria-hidden="true"/>Negocios locales</span><span className="inline-flex items-center gap-2"><Banknote className="h-4 w-4 text-[#c2ed86]" aria-hidden="true"/>Pago en efectivo</span></div>
   </div>
   <div className="relative min-h-64 sm:min-h-80 lg:min-h-[450px] overflow-hidden">
    <img src={deliveryImage} alt="Reparto en motocicleta en Tingo María" decoding="async" className="absolute inset-0 h-full w-full object-cover"/>
    <div className="absolute inset-0 bg-gradient-to-t from-[#153d30]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#153d30]/25 lg:to-transparent"/>
    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl border border-white/30 bg-white/95 p-4 text-ink shadow-lg backdrop-blur-sm sm:left-8 sm:right-8"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary"><Bike className="h-6 w-6" aria-hidden="true"/></span><div><p className="text-sm font-bold">Varias tiendas, una confirmación</p><p className="mt-1 text-xs leading-5 text-ink-light">Revisa el envío y el cobro de cada tienda antes de pedir.</p></div></div>
   </div>
  </div>
 </section>;
}

const categoryIcons:Record<string,typeof Package>={comida_preparada:UtensilsCrossed,bebidas:Coffee,despensa:ShoppingBasket,salud:HeartPulse,cuidado_personal:Leaf,hogar:ShoppingBag,tecnologia:Smartphone};
export function CatalogCategoryLinks({ categories, selected, choose }: {categories:{id:string;code:string;name:string}[];selected:string|null;choose:(id:string)=>void}) {
 return <section aria-label="Explorar categorías" className="space-y-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Un poco de todo, cerca de ti</p><h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">¿Qué buscas hoy?</h2></div></div>
  <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">{categories.map(category=>{const Icon=categoryIcons[category.code]||Package;const active=selected===category.id;return <button type="button" key={category.id} aria-pressed={active} onClick={()=>choose(active?'':category.id)} className={`group min-w-28 max-w-36 flex-1 rounded-2xl border p-4 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${active?'border-primary bg-primary-light text-primary':'border-border bg-white hover:border-primary/40 hover:bg-primary-light/40'}`}><span className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${active?'bg-primary text-white':'bg-surface-subtle text-primary group-hover:bg-primary-light'}`}><Icon className="h-5 w-5" aria-hidden="true"/></span><span className="block text-xs font-semibold leading-5">{category.name}</span></button>;})}</div>
 </section>;
}

export function HomeStoresSection(){
 const stores=useRemote('home-stores',signal=>catalogApi.stores(signal));
 return <section className="space-y-5 border-t border-border pt-9" aria-label="Negocios locales"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Compra cerca. Apoya lo local.</p><h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">Los negocios de tu ciudad</h2></div><Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/negocios">Ver todos<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link></div>
  <RemoteState loading={stores.loading} error={stores.error} retry={stores.reload}/>
  {!stores.error&&stores.data&&<>{!stores.data.length?<div className="rounded-2xl border border-dashed border-border bg-white p-7"><p className="font-semibold">Pronto podrás descubrir negocios aquí.</p><p className="mt-2 text-sm text-ink-light">Los comercios aparecerán cuando estén habilitados y tengan cobertura disponible.</p></div>:<div className="grid gap-4 sm:grid-cols-2">{stores.data.slice(0,4).map(store=><Link key={store.id} to={`/negocios/${store.id}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary/40"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-subtle flex items-center justify-center">{store.logoUrl?<img src={imageUrl(store.logoUrl)} alt="" loading="lazy" className="h-full w-full object-contain"/>:<Store className="h-7 w-7 text-primary" aria-hidden="true"/>}</div><div className="min-w-0 flex-1"><h3 className="font-bold break-words">{store.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-ink-muted"><MapPin className="h-3 w-3 shrink-0" aria-hidden="true"/>{store.zone_name}</p><p className={`mt-2 text-xs font-semibold ${store.isOpen?'text-primary':'text-ink-muted'}`}>{store.isOpen?'Abierto ahora':'Fuera de horario'}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true"/></Link>)}</div>}</>}
 </section>;
}

export function CatalogCommunityBanner(){
 return <section className="grid gap-6 rounded-[1.75rem] bg-[#e9efdf] p-7 sm:p-9 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Hagamos crecer lo nuestro</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-[#153d30]">Tu negocio también puede estar aquí.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-ink-light">Presenta tu solicitud y lleva tus productos a más personas en Tingo María.</p></div><Link to="/registro/comercio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#153d30] px-6 py-3 text-sm font-bold text-white hover:bg-primary">Afiliar mi negocio<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link></section>;
}
