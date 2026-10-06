import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/shared/BrandLogo';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
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
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { users, tickets } = useDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const pendingApprovalsCount = users.filter((u) => u.status === 'pendiente_aprobacion').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'abierto' || t.status === 'en_revision').length;

  const navLinks = [
    { to: '/admin/resumen', label: 'Panel Global', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      to: '/admin/usuarios',
      label: 'Usuarios y Solicitudes',
      icon: <Users className="w-4 h-4" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { to: '/admin/comercios', label: 'Comercios de Tingo', icon: <Store className="w-4 h-4" /> },
    { to: '/admin/repartidores', label: 'Flota de Repartidores', icon: <Bike className="w-4 h-4" /> },
    { to: '/admin/pedidos', label: 'Monitor de Pedidos', icon: <ShoppingBag className="w-4 h-4" /> },
    { to: '/admin/zonas', label: 'Zonas y Tarifas', icon: <MapPin className="w-4 h-4" /> },
    {
      to: '/admin/incidencias',
      label: 'Soporte e Incidencias',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
    },
    { to: '/admin/reportes', label: 'Métricas de Plataforma', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/admin/auditoria', label: 'Historial de Auditoría', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-subtle">
        <BrandLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary text-white">
            ADMIN
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="touch-target p-2 text-gray-600 rounded-xl hover:bg-gray-100"
            aria-label="Menú administrador"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar - clean white matching provider sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <BrandLogo size="sm" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary font-bold shadow-none'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-ink font-medium'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-inherit">{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-primary p-2 rounded-xl hover:bg-gray-50"
          >
            <span>Ver vista cliente</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 p-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-100 px-8 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white shadow-sm">
              ADMINISTRADOR
            </span>
            <span className="text-xs text-gray-400 font-medium">Panel de Control General</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{currentUser?.name || 'Administración'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>

      <DemoSwitcher />
    </div>
  );
};
