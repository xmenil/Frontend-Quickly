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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuthStore();
  const { users, tickets } = useDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const pendingApprovalsCount = users.filter((u) => u.status === 'pendiente_aprobacion').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'abierto' || t.status === 'en_revision').length;

  const navLinks = [
    { to: '/admin/resumen', label: 'Panel Global', icon: <LayoutDashboard className="w-5 h-5 text-gray-500" /> },
    {
      to: '/admin/usuarios',
      label: 'Usuarios y Solicitudes',
      icon: <Users className="w-5 h-5 text-gray-500" />,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { to: '/admin/comercios', label: 'Comercios de Tingo', icon: <Store className="w-5 h-5 text-gray-500" /> },
    { to: '/admin/repartidores', label: 'Flota de Repartidores', icon: <Bike className="w-5 h-5 text-gray-500" /> },
    { to: '/admin/pedidos', label: 'Monitor de Pedidos', icon: <ShoppingBag className="w-5 h-5 text-gray-500" /> },
    { to: '/admin/zonas', label: 'Zonas y Tarifas', icon: <MapPin className="w-5 h-5 text-gray-500" /> },
    {
      to: '/admin/incidencias',
      label: 'Soporte e Incidencias',
      icon: <AlertTriangle className="w-5 h-5 text-gray-500" />,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
    },
    { to: '/admin/reportes', label: 'Métricas de Plataforma', icon: <BarChart3 className="w-5 h-5 text-gray-500" /> },
    { to: '/admin/auditoria', label: 'Historial de Auditoría', icon: <FileText className="w-5 h-5 text-gray-500" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <BrandLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-600 px-2.5 py-0.5 rounded-full font-bold">Admin</span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="touch-target p-2 text-slate-300 hover:text-white"
            aria-label="Menú administrador"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-64 lg:w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <BrandLogo size="md" />
            <span className="inline-block mt-2 text-[11px] font-extrabold uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-md">
              Administración Central
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
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
                `touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {link.icon}
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
          >
            <span>Ver vista cliente</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 p-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
        <Outlet />
      </main>

      <DemoSwitcher />
    </div>
  );
};
