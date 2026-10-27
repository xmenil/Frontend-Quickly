import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export const statusLabels: Record<string, string> = { pending: 'Pendiente de aprobación', active: 'Aprobado', rejected: 'Rechazado', suspended: 'Suspendido' };
export const vehicleLabels: Record<string, string> = { motorcycle: 'Moto', bicycle: 'Bicicleta', mototaxi: 'Mototaxi' };
export const roleLabels: Record<string, string> = { owner: 'Propietario', manager: 'Encargado', operator: 'Operador', admin: 'Administrador' };
export const panel = 'bg-white border border-border rounded-2xl p-5 sm:p-7 space-y-5';
export const inputClass = 'min-h-11 w-full border border-field rounded-xl bg-white px-3 py-2 text-ink';

export function useRemote<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const identity = useAuthStore((s) => s.currentUser?.id || 'guest');
  const profile = useAuthStore((s) => s.profile);
  const fullKey = `${identity}:${key}`;
  const loadRef = useRef(load); loadRef.current = load;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; data?: T; error?: string; loading: boolean }>({ key: fullKey, loading: true });
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setState((old) => ({ key: fullKey, data: old.key === fullKey ? old.data : undefined, loading: true }));
    loadRef.current(controller.signal).then((data) => {
      if (active) setState({ key: fullKey, data, loading: false });
    }).catch((error) => {
      if (active) setState((old) => ({ ...old, loading: false, error: error instanceof Error ? error.message : 'No se pudo cargar la sección.' }));
    });
    return () => { active = false; controller.abort(); };
  }, [fullKey, revision, profile]);
  return { ...(state.key === fullKey ? state : { key: fullKey, data: undefined, error: undefined, loading: true }), reload };
}
export function RemoteState({ loading, error, retry }: { loading: boolean; error?: string; retry: () => void }) {
  if (error) return <div className="space-y-3"><p role="alert" className="text-destructive">{error}</p><Button type="button" variant="outline" className="text-primary-dark border-primary-dark" onClick={retry}>Reintentar</Button></div>;
  return loading ? <p role="status" className="text-ink-light">Cargando información…</p> : null;
}
export function Status({ value }: { value: string }) {
  return <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${value === 'active' ? 'bg-emerald-50 text-emerald-800' : value === 'pending' ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-800'}`}>{statusLabels[value] || value}</span>;
}
export function Feedback({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{success && <p role="status" className="text-sm text-emerald-700">{success}</p>}</>;
}
export function PageTitle({ children, detail }: { children: React.ReactNode; detail?: string }) {
  return <header className="space-y-2"><h1 className="text-2xl sm:text-3xl font-bold">{children}</h1>{detail && <p className="text-ink-light">{detail}</p>}</header>;
}
export function Pager({ next, onNext, onFirst, isFirst }: { next: string | null; onNext: () => void; onFirst: () => void; isFirst: boolean }) {
  return <div className="flex flex-wrap gap-3"><Button variant="outline" className="text-primary-dark border-primary-dark" disabled={isFirst} onClick={onFirst}>Primera página</Button><Button variant="outline" className="text-primary-dark border-primary-dark" disabled={!next} onClick={onNext}>Siguiente página</Button></div>;
}
