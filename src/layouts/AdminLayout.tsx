import React, { useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  ShoppingBag,
  MapPin,
  AlertTriangle,
  BarChart3,
  FileText,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { users, tickets } = useDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const pendingApprovalsCount = users.filter((u) => u.status === 'pendiente_aprobacion').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'abierto' || t.status === 'en_revision').length;

  const navGroups = [
    {
      label: 'Operación',
      links: [
        { to: '/admin/resumen', label: 'Resumen', icon: LayoutDashboard, count: 0 },
        { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, count: 0 },
        { to: '/admin/incidencias', label: 'Soporte e incidencias', icon: AlertTriangle, count: openTicketsCount },
      ],
    },
    {
      label: 'Gestión',
      links: [
        { to: '/admin/usuarios', label: 'Usuarios y solicitudes', icon: Users, count: pendingApprovalsCount },
        { to: '/admin/comercios', label: 'Comercios', icon: Store, count: 0 },
        { to: '/admin/repartidores', label: 'Repartidores', icon: Bike, count: 0 },
        { to: '/admin/zonas', label: 'Zonas y tarifas', icon: MapPin, count: 0 },
      ],
    },
    {
      label: 'Análisis',
      links: [
        { to: '/admin/reportes', label: 'Reportes', icon: BarChart3, count: 0 },
        { to: '/admin/auditoria', label: 'Historial de actividad', icon: FileText, count: 0 },
      ],
    },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  const navigation = (mobile: boolean) => (
    <nav aria-label={mobile ? 'Navegación móvil de administración' : 'Navegación de administración'} className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-xs font-semibold text-ink-muted">{group.label}</p>
          <ul className="space-y-1">
            {group.links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => {
                    if (mobile) {
                      setMobileMenuOpen(false);
                      requestAnimationFrame(() => mainRef.current?.focus());
                    }
                  }}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-50 font-semibold text-primary'
                        : 'font-medium text-ink-light hover:bg-surface-subtle hover:text-ink'
                    }`
                  }
                >
                  <link.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{link.label}</span>
                  {link.count > 0 && (
                    <span className="shrink-0 rounded-full bg-warning-soft px-2 py-1 text-xs font-semibold tabular-nums text-warning-strong">
                      {link.count}<span className="sr-only"> en espera de atención</span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="space-y-3 border-t border-border p-4">
      <div className="flex min-w-0 items-start gap-3 px-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-ink">{currentUser?.name || 'Administración'}</p>
          <p className="text-xs text-ink-muted">Cuenta de administrador</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full justify-start gap-3 px-3 text-sm text-ink-light hover:bg-surface-subtle active:bg-surface-subtle"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        Cerrar sesión
      </Button>
    </div>
  );

  return (
    <div className="h-screen h-dvh overflow-hidden bg-background font-sans text-ink flex flex-col md:flex-row">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:p-4 focus:text-primary focus:shadow-subtle"
      >
        Ir al contenido
      </a>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        id="admin-mobile-menu"
        className={`fixed md:hidden inset-y-0 left-0 z-50 w-72 h-full bg-surface border-r border-border flex flex-col transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú móvil de administración"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeMobileMenu();
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <BrandLogo size="sm" showSubtitle={false} className="min-h-11" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={closeMobileMenu}
            aria-label="Cerrar menú móvil"
            className="p-2 text-ink-muted hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{navigation(true)}</div>
        {account}
      </aside>

      {/* Desktop Sidebar (Fijo a la izquierda) */}
      <aside className="hidden md:flex md:static h-full md:h-screen w-72 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-6 py-4">
          <BrandLogo size="sm" showSubtitle={false} className="min-h-11" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{navigation(false)}</div>
        {account}
      </aside>

      {/* Área principal con header estático y contenido con scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-full md:h-screen overflow-hidden">
        <header className="shrink-0 z-20 border-b border-border bg-surface shadow-xs">
          <div className="flex min-h-16 md:min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-ink">Administración</p>
              <p className="text-xs text-ink-muted">Quickly - Tingo María</p>
            </div>
            <Button
              ref={menuButtonRef}
              type="button"
              variant="ghost"
              className="min-h-11 gap-2 text-sm hover:bg-surface-subtle active:bg-surface-subtle md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              {mobileMenuOpen ? 'Cerrar menú' : 'Menú'}
            </Button>
            <span className="hidden items-center gap-2 text-sm text-ink-light md:flex">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Panel de administración
            </span>
          </div>
        </header>

        <main
          id="admin-content"
          ref={mainRef}
          tabIndex={-1}
          aria-label="Contenido de administración"
          className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24 scroll-smooth"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <DemoSwitcher />
    </div>
  );
};
