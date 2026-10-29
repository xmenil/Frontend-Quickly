import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Store, Bike, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../domain/types';
export const RoleSwitcher: React.FC = () => {
 const { currentUser, activeRole, roles, isAuthenticated, switchRole } = useAuthStore();
 const [isExpanded, setIsExpanded] = useState(false); const navigate = useNavigate();
 const panels: { role: UserRole; label: string; icon: React.ReactNode; path: string }[] = [
  { role: 'cliente', label: 'Cliente', icon: <UserCheck className="w-4 h-4" />, path: '/' },
  { role: 'comercio', label: 'Comercio', icon: <Store className="w-4 h-4" />, path: '/comercio/tienda' },
  { role: 'repartidor', label: 'Repartidor', icon: <Bike className="w-4 h-4" />, path: '/repartidor/solicitudes' },
  { role: 'admin', label: 'Admin', icon: <ShieldCheck className="w-4 h-4" />, path: '/admin/resumen' },
 ];
 if (!isAuthenticated || !currentUser) return null;
 return <div className="fixed bottom-16 sm:bottom-4 right-4 z-40 max-w-sm">{isExpanded ? <div className="bg-white/95 backdrop-blur-md text-ink p-4 rounded-2xl shadow-floating border border-gray-200 w-80 sm:w-88 animate-in fade-in slide-in-from-bottom-2 duration-200">
  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100"><div className="flex items-center gap-1.5 text-xs font-bold text-ink"><Sparkles className="w-4 h-4 text-primary" /><span>Cambiar panel</span></div><button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-ink p-1 rounded-lg" aria-label="Minimizar selector de panel"><ChevronDown className="w-4 h-4" /></button></div>
  <div className="grid grid-cols-2 gap-2 mb-3">{panels.filter(panel => roles.includes(panel.role)).map(panel => <button key={panel.role} type="button" onClick={() => { if (!useAuthStore.getState().roles.includes(panel.role)) return; switchRole(panel.role); navigate(panel.path); setIsExpanded(false); }} className={'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ' + (activeRole === panel.role ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100')}>{panel.icon}<span>{panel.label}</span></button>)}</div>
  <div className="pt-2 border-t border-gray-100 text-xs"><span className="text-[11px] text-gray-500">Cuenta: <span className="text-ink font-bold">{currentUser.name}</span></span></div>
 </div> : <button type="button" onClick={() => setIsExpanded(true)} className="flex items-center gap-2 bg-white/95 hover:bg-white text-ink px-3.5 py-2 rounded-full shadow-floating border border-gray-200 backdrop-blur-md transition-all hover:scale-105"><span aria-hidden="true" className="w-2 h-2 rounded-full bg-primary" /><span className="text-xs font-bold text-gray-700">Panel:</span><span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{activeRole}</span><ChevronUp className="w-3.5 h-3.5 text-gray-400" /></button>}</div>;
};
