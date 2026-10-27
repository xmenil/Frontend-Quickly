import React, {useState} from 'react';
import {Link, NavLink, useNavigate, useSearchParams} from 'react-router-dom';
import {Home, Store, ShoppingCart, User, FileText} from 'lucide-react';
import {BrandLogo} from './BrandLogo';
import {useAuthStore} from '../../store/authStore';
import {useRealCartStore} from '../../store/realCartStore';
import {destinationForRole} from '../../services/api/profileAdapter';

// Presentación verde y buscador del Navbar del prototipo, con sesión/carrito reales.
export function CatalogNavbar() {
  const {currentUser,roles,logout,switchRole,busy} = useAuthStore();
  const count = useRealCartStore(s=>s.items.reduce((total,item)=>total+item.quantity,0));
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error,setError] = useState('');
  async function signOut() {
    setError(''); const result=await logout();
    if(result.success)navigate('/login'); else setError(result.message || 'No se pudo cerrar la sesión.');
  }
  return <header className="sticky top-0 z-30 bg-primary border-b border-primary-dark/20 shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <BrandLogo size="md" variant="white" showSubtitle={false}/>
        <form key={params.get('q') || ''} aria-label="Búsqueda principal" className="order-3 sm:order-none w-full sm:flex-1 sm:max-w-xl flex gap-2" onSubmit={event=>{
          event.preventDefault();const value=String(new FormData(event.currentTarget).get('q') || '').trim();
          navigate(value?`/?${new URLSearchParams({q:value})}#catalogo`:'/#catalogo');
        }}>
          <label className="sr-only" htmlFor="header-search">Buscar en Quickly</label>
          <input id="header-search" name="q" maxLength={160} defaultValue={params.get('q') || ''} placeholder="Busca productos en tu ciudad" className="w-full min-w-0 min-h-11 rounded-xl border border-field px-3 bg-white text-ink placeholder:text-ink-muted"/>
          <button type="submit" className="min-h-11 rounded-xl bg-primary-dark hover:bg-selva px-4 text-white font-bold">Buscar</button>
        </form>
        <div className="flex items-center gap-2 text-primary-dark">
          <Link to="/carrito" aria-label={`Ver carrito con ${count} productos`} className="relative min-h-11 min-w-11 rounded-xl bg-white flex items-center justify-center"><ShoppingCart aria-hidden className="w-5 h-5"/>{count>0 && <span className="absolute -top-1 -right-1 rounded-full bg-primary-dark text-white min-w-5 px-1 text-xs text-center">{count}</span>}</Link>
          <Link to={currentUser?'/cliente/perfil':'/login'} aria-label={currentUser?'Mi perfil':'Ingresar a tu cuenta'} className="min-h-11 min-w-11 rounded-xl bg-white flex items-center justify-center"><User aria-hidden className="w-5 h-5"/></Link>
        </div>
      </div>
      <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 border-t border-primary-dark/20 text-sm font-semibold text-ink">
        <Link className="min-h-11 inline-flex items-center" to="/">Inicio</Link><Link className="min-h-11 inline-flex items-center" to="/#categorias">Categorías</Link><Link className="min-h-11 inline-flex items-center" to="/negocios">Negocios</Link><Link className="min-h-11 inline-flex items-center" to="/registro/comercio">Vender en Quickly</Link>
        {currentUser ? <details className="relative"><summary className="min-h-11 inline-flex items-center cursor-pointer rounded-xl px-3 bg-white text-primary-dark">Mi cuenta</summary>
          <nav aria-label="Cuenta" className="absolute right-0 top-full bg-white text-ink rounded-2xl shadow-floating border border-border p-3 w-60 max-h-[60vh] overflow-y-auto flex flex-col gap-1">
            {[
              ['/cliente/perfil','Mi perfil'],['/cliente/direcciones','Direcciones'],['/cliente/pedidos','Mis pedidos'],['/cliente/favoritos','Favoritos'],['/cliente/notificaciones','Notificaciones'],['/cliente/ayuda','Ayuda'],['/cliente/solicitudes','Mis solicitudes'],
            ].map(([to,label])=><Link key={to} className="min-h-11 flex items-center hover:bg-surface-subtle rounded-lg px-2" to={to} onClick={event=>event.currentTarget.closest('details')?.removeAttribute('open')}>{label}</Link>)}
            {roles.filter(role=>role!=='cliente').map(role=><Link key={role} className="min-h-11 flex items-center px-2 capitalize text-primary-dark" to={destinationForRole(role)} onClick={event=>{switchRole(role);event.currentTarget.closest('details')?.removeAttribute('open');}}>Panel de {role}</Link>)}
            <button type="button" disabled={busy} onClick={()=>void signOut()} className="min-h-11 text-left px-2 text-destructive disabled:opacity-50">Cerrar sesión</button>
          </nav>
        </details> : <><Link className="min-h-11 inline-flex items-center" to="/registro">Crear cuenta</Link><Link className="min-h-11 inline-flex items-center" to="/login">Iniciar sesión</Link></>}
      </nav>
    </div>
    {error && <p role="alert" className="bg-white text-destructive p-3">{error}</p>}
  </header>;
}

export function CatalogMobileNav() {
  const count=useRealCartStore(s=>s.items.reduce((total,item)=>total+item.quantity,0));
  return <nav aria-label="Navegación móvil principal" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border shadow-floating pb-safe">
    <div className="grid grid-cols-5 min-h-16 max-w-lg mx-auto">{[
      {to:'/',label:'Inicio',Icon:Home},{to:'/negocios',label:'Comercios',Icon:Store},{to:'/carrito',label:'Carrito',Icon:ShoppingCart},{to:'/cliente/pedidos',label:'Pedidos',Icon:FileText},{to:'/cliente/perfil',label:'Perfil',Icon:User},
    ].map(({to,label,Icon})=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`min-h-16 flex flex-col items-center justify-center gap-1 text-xs ${isActive?'text-primary-dark font-bold':'text-ink-light'}`}><Icon aria-hidden className="w-5 h-5"/><span>{label}{to==='/carrito' && count>0?` (${count})`:''}</span></NavLink>)}</div>
  </nav>;
}
