import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { Home, Store, ShoppingBag, ShoppingCart, User } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  const navItems = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/negocios', label: 'Comercios', icon: Store },
    {
      to: '/carrito',
      label: 'Carrito',
      icon: ShoppingCart,
      badge: cartCount,
    },
    { to: '/cliente/pedidos', label: 'Pedidos', icon: ShoppingBag },
    { to: '/cliente/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-floating"
      aria-label="Navegación móvil principal"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 min-h-[48px] touch-target select-none transition-colors group ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Top Active Indicator Bar (2px primary) */}
                  <span
                    className={`absolute top-0 h-[2.5px] w-8 rounded-full bg-primary transition-all duration-300 ease-out ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                  />

                  {/* Icon with translateY(-2px) and subtle scale when active */}
                  <div
                    className={`relative transition-all duration-200 ease-out ${
                      isActive ? '-translate-y-0.5 scale-105 text-primary' : 'text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform" />

                    {/* Cart count badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label with fade-in and high-contrast font weight */}
                  <span
                    className={`text-[11px] leading-none transition-all duration-200 ease-out ${
                      isActive
                        ? 'font-bold text-primary opacity-100'
                        : 'font-medium text-gray-500 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
