import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../domain/types';
import {
  UserCheck,
  Store,
  Bike,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { currentUser, activeRole, switchRole } = useAuthStore();
  const { resetToSeed } = useDataStore();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const roles: { role: UserRole; label: string; icon: React.ReactNode; path: string }[] = [
    { role: 'cliente', label: 'Cliente', icon: <UserCheck className="w-4 h-4" />, path: '/' },
    { role: 'comercio', label: 'Comercio', icon: <Store className="w-4 h-4" />, path: '/comercio/tienda' },
    { role: 'repartidor', label: 'Repartidor', icon: <Bike className="w-4 h-4" />, path: '/repartidor/solicitudes' },
    { role: 'admin', label: 'Admin', icon: <ShieldCheck className="w-4 h-4" />, path: '/admin/usuarios' },
  ];

  const handleRoleSelect = (role: UserRole, targetPath: string) => {
    switchRole(role);
    navigate(targetPath);
  };

  const handleResetData = () => {
    resetToSeed();
    setShowConfirmReset(false);
    navigate('/');
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-4 z-40 max-w-sm">
      {/* Expanded Controls Card */}
      {isExpanded ? (
        <div className="bg-white/95 backdrop-blur-md text-ink p-4 rounded-2xl shadow-floating border border-gray-200 w-80 sm:w-88 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Simulador de Paneles</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-ink p-1 rounded-lg"
              aria-label="Minimizar panel demo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-gray-500 mb-2">
            Cambia entre las interfaces con la misma paleta y datos:
          </p>

          {/* Role Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {roles.map((r) => {
              const isActive = activeRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleSelect(r.role, r.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="text-[11px] text-gray-500 truncate max-w-[170px]">
              Activo: <span className="text-ink font-bold">{currentUser?.name}</span>
            </div>

            {/* Reset Seed Button */}
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar datos</span>
            </button>
          </div>

          {/* Reset Confirmation Prompt */}
          {showConfirmReset && (
            <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <p className="font-semibold mb-1">¿Restaurar datos a estado de fábrica?</p>
              <p className="text-[11px] text-rose-700 mb-2 leading-tight">
                Se reiniciarán los pedidos, comercios y productos al seed original de Tingo María.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2.5 py-1 text-[11px] bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-2.5 py-1 text-[11px] bg-primary hover:bg-primary-hover rounded-lg text-white font-bold"
                >
                  Sí, reiniciar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Minimized Floating Pill */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-white/95 hover:bg-white text-ink px-3.5 py-2 rounded-full shadow-floating border border-gray-200 backdrop-blur-md transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-700">Panel:</span>
          <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
            {activeRole}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
};
