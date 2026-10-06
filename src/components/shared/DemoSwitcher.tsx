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
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-floating border border-slate-700 w-80 sm:w-88 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Entorno de Demostración</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Minimizar panel demo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mb-2">
            Simula roles instantáneamente conservando pedidos y productos:
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
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
              Activo: <span className="text-white font-medium">{currentUser?.name}</span>
            </div>

            {/* Reset Seed Button */}
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 py-1 rounded-lg flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar datos</span>
            </button>
          </div>

          {/* Reset Confirmation Prompt */}
          {showConfirmReset && (
            <div className="mt-2.5 p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200">
              <p className="font-semibold mb-1.5">¿Restaurar datos a estado de fábrica?</p>
              <p className="text-[11px] text-red-300 mb-2 leading-tight">
                Se reiniciarán los pedidos, comercios y productos al seed original de Tingo María.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-2.5 py-1 text-[11px] bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold"
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
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white px-3.5 py-2 rounded-full shadow-floating border border-slate-700 backdrop-blur-md transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold capitalize">Modo Demo: {activeRole}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
};
