import {NotificationLink} from '../features/engagement/RealEngagementPages';
import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { destinationForRole } from '../services/api/profileAdapter';

export function AccountLayout() {
  const { currentUser, roles, logout, switchRole, busy } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  async function signOut() {
    setError('');
    const result = await logout();
    if (result.success) navigate('/login', { replace: true }); else setError(result.message || 'No se pudo cerrar la sesión.');
  }
  return <div className="min-h-screen bg-background text-ink flex flex-col">
    <header className="bg-white border-b border-border"><div className="max-w-5xl mx-auto p-4 flex flex-wrap items-center justify-between gap-4">
      <BrandLogo size="md" />
      <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Cuenta">
        <Link to="/">Catálogo</Link><Link to="/negocios">Negocios</Link><Link to="/carrito">Carrito</Link>
        {currentUser ? <>
          <Link to="/cliente/perfil" className="font-semibold text-primary">Mi perfil</Link>
          <Link to="/cliente/direcciones">Direcciones</Link>
          <Link to="/cliente/pedidos">Mis pedidos</Link>
          <Link to="/cliente/favoritos">Favoritos</Link><NotificationLink/><Link to="/cliente/ayuda">Ayuda</Link><Link to="/cliente/solicitudes">Mis solicitudes</Link>
          {roles.filter((role) => role !== 'cliente').map((role) => <Link key={role} to={destinationForRole(role)} onClick={() => switchRole(role)} className="capitalize">{role}</Link>)}
          {roles.includes('comercio') && <><Link to="/comercio/reportes">Reportes de tienda</Link><Link to="/comercio/productos">Productos</Link><Link to="/comercio/pedidos">Pedidos de tienda</Link></>}
          {roles.includes('repartidor')&&<><Link to="/repartidor/solicitudes">Entregas</Link><Link to="/repartidor/ingresos">Mis tarifas</Link></>}
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void signOut()}>Cerrar sesión</Button>
        </> : <><Link to="/login" className="font-semibold text-primary">Iniciar sesión</Link><Link to="/registro">Crear cuenta</Link></>}
      </nav>
    </div></header>
    {error && <p className="max-w-5xl mx-auto px-4 pt-3 text-destructive" role="alert">{error}</p>}
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-12"><Outlet /></main>
    <footer className="border-t border-border p-5 text-center text-xs text-ink-muted">Quickly · Tingo María</footer>
  </div>;
}

export function AccountHomePage() {
  const { currentUser } = useAuthStore();
  return <section className="bg-white border border-border rounded-3xl p-7 sm:p-12 space-y-6 max-w-3xl mx-auto">
    <p className="text-sm font-semibold text-primary">Quickly · Tingo María</p>
    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{currentUser ? `Hola, ${currentUser.name.split(' ')[0]}` : 'Bienvenido a Quickly'}</h1>
    <p className="text-ink-light leading-relaxed">Administra tu cuenta y direcciones, o solicita la afiliación de tu negocio o perfil de repartidor. Estamos preparando el catálogo y las entregas de tu ciudad.</p>
    <div className="flex flex-wrap gap-4"><Link className="bg-primary text-white px-5 py-3 rounded-xl font-semibold" to={currentUser ? '/cliente/perfil' : '/registro'}>{currentUser ? 'Ver mi perfil' : 'Crear mi cuenta'}</Link>
      {!currentUser && <Link className="text-primary font-semibold px-5 py-3" to="/login">Ya tengo cuenta</Link>}
    </div>
    <div className="flex flex-wrap gap-4 pt-4 border-t border-border"><Link className="text-primary font-semibold" to="/registro/comercio">Afiliar mi negocio</Link><Link className="text-primary font-semibold" to="/registro/repartidor">Ser repartidor</Link></div>
  </section>;
}

export function PendingIntegrationPage() {
  return <section className="max-w-xl mx-auto p-7 bg-white border border-border rounded-2xl space-y-4">
    <h1 className="text-2xl font-bold">Esta sección estará disponible próximamente</h1>
    <p className="text-ink-light">Estamos preparando este servicio. Por ahora puedes crear tu cuenta y actualizar tus datos de contacto.</p>
    <Link to="/" className="inline-block text-primary font-semibold">Volver al inicio</Link>
  </section>;
}
