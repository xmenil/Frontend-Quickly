import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';
import { operationsApi } from '../../services/api/operationsApi';
import { allPages } from '../customer/customerAccountModel';
import { normalizePhone } from '../../services/api/profileAdapter';
import { useRemote, RemoteState } from '../operations/shared';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Store, CheckCircle2, Clock } from 'lucide-react';
import { MerchantCategory } from '../../domain/types';

export const RegisterMerchantPage: React.FC = () => {

  const navigate = useNavigate();
  const auth = useAuthStore();
  const resource = useRemote('application-Merchant', async signal => {
    if (!auth.isAuthenticated || auth.sessionStatus !== 'ready') return null;
    return { zones: await operationsApi.zones(signal), categories: await operationsApi.categories(signal), requests: await allPages(cursor => operationsApi.ownStores({ cursor }, signal)) };
  });
  const zones = resource.data?.zones || [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const submitRef = React.useRef(false);


  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(auth.currentUser?.name || '');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(auth.currentUser?.phone || '');
  const [zoneId, setZoneId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => { setOwnerName(auth.currentUser?.name || ''); setPhone(auth.currentUser?.phone || ''); setIsSubmitted(false); setError(''); setBusinessName(''); setAddress(''); setCategory(''); setZoneId(''); }, [auth.currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitRef.current) return;
    if (!auth.isAuthenticated || !auth.currentUser) { setError('Inicia sesión antes de enviar la solicitud.'); return; }
    if (!zones.some(zone => zone.id === zoneId && zone.isActive)) { setError('Selecciona una zona activa.'); return; }
    submitRef.current = true; setBusy(true); setError(''); const owner = auth.currentUser.id;
    try {
      const profile = await auth.updateProfile({ name: ownerName.trim() });
      if (!profile.success) throw new Error(profile.message);
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      const result = await operationsApi.applyStore({ name: businessName.trim(), categoryCode: category, zoneId, addressText: address.trim(), phone: normalizePhone(phone) });
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      setResultStatus(result.status); setIsSubmitted(true); await auth.initialize(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la solicitud.'); }
    finally { submitRef.current = false; setBusy(false); }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
      <div className="text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary border border-primary-light text-[10px] font-bold tracking-wider uppercase mb-2.5">
          Comercios y Emprendimientos
        </span>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Afiliar mi Negocio</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Únete a la red comercial de Quickly en Tingo María y recibe pedidos en línea
        </p>
      </div>

      <RemoteState loading={resource.loading || auth.sessionStatus === "checking"} error={resource.error || auth.sessionError || undefined} retry={() => { void auth.initialize(); resource.reload(); }} />
      {!auth.isAuthenticated && auth.sessionStatus === "ready" && <Link to="/login" state={{ from: "/registro/comercio" }} className="inline-flex min-h-11 items-center font-bold text-primary">Iniciar sesión para enviar la solicitud</Link>}
      {resource.data?.requests.map(request => <p key={request.id} className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs">{request.name}: {({ pending: "Pendiente de aprobación", active: "Aprobada", rejected: "Rechazada", suspended: "Suspendida" } as const)[request.status]}{request.statusReason && " · " + request.statusReason}</p>)}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {isSubmitted ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-subtle">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-amber-950">Solicitud registrada</h2>
          <p className="text-xs text-amber-900 leading-relaxed max-w-xs mx-auto">
            Tu negocio <strong>{businessName}</strong> ha quedado registrado como{' '}
            <span className="font-semibold text-amber-950">{resultStatus === "active" ? "aprobada" : resultStatus === "rejected" ? "rechazada" : resultStatus === "suspended" ? "suspendida" : "pendiente de aprobación"}</span> por la administración de Quickly Tingo María.
          </p>
          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-gray-700 flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              La administración revisará tu solicitud. Los permisos se habilitan únicamente después de su aprobación.
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full mt-2"
            onClick={() => navigate('/cliente/perfil')}
          >
            Volver a mi cuenta
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Comercial del Negocio"
            placeholder="Ej: Juguería La Bella Durmiente"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            leftIcon={<Store className="w-4 h-4" />}
          />
          <Input
            label="Nombre del Representante"
            placeholder="Ej: Carmen Gómez"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />
          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Selecciona una categoría</option>
            {resource.data?.categories.map(entry => <option key={entry.code} value={entry.code}>{entry.label}</option>)}
          </Select>
          <Input
            label="Dirección del local físico"
            placeholder="Ej: Av. Alameda Perú 520"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <Select
            label="Zona de ubicación"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
          >
            <option value="">Selecciona una zona</option>
            {zones.filter(zone => zone.isActive).map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </Select>
          <Input
            label="Teléfono / WhatsApp de atención"
            placeholder="962 123 456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Button type="submit" isLoading={busy} disabled={!auth.isAuthenticated || auth.sessionStatus !== "ready" || resource.loading || !!resource.error} variant="primary" size="lg" className="w-full">
            Enviar Solicitud de Comercio
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Ya tienes negocio afiliado?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Acceder a mi panel
        </Link>
      </div>
    </div>
  );
};
