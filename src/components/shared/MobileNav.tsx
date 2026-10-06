import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { Home, Store, ShoppingBag, ShoppingCart, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  const navItems = [
    { to: '/', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { to: '/negocios', label: 'Comercios', icon: <Store className="w-5 h-5" /> },
    {
      to: '/carrito',
      label: 'Carrito',
      icon: (
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      ),
    },
    { to: '/cliente/pedidos', label: 'Pedidos', icon: <ShoppingBag className="w-5 h-5" /> },
    { to: '/cliente/perfil', label: 'Perfil', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-floating"
      aria-label="Navegación móvil principal"
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `touch-target flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-gray-500 hover:text-ink'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
