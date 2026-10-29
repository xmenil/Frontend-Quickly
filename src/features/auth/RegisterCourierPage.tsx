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
import { Bike, Clock } from 'lucide-react';

export const RegisterCourierPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const resource = useRemote('application-Courier', async signal => {
    if (!auth.isAuthenticated || auth.sessionStatus !== 'ready') return null;
    return { zones: await operationsApi.zones(signal), categories: [], requests: await operationsApi.courier(signal) };
  });
  const zones = resource.data?.zones || [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const submitRef = React.useRef(false);


  const [name, setName] = useState(auth.currentUser?.name || '');
  const [zoneId, setZoneId] = useState('');
  const [phone, setPhone] = useState(auth.currentUser?.phone || '');
  const [vehicleType, setVehicleType] = useState<'moto' | 'mototaxi' | 'bicicleta'>('moto');
  const [plate, setPlate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => { setName(auth.currentUser?.name || ''); setPhone(auth.currentUser?.phone || ''); setIsSubmitted(false); setError(''); setZoneId(''); setPlate(''); setVehicleType('moto'); }, [auth.currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitRef.current) return;
    if (!auth.isAuthenticated || !auth.currentUser) { setError('Inicia sesión antes de enviar la solicitud.'); return; }
    if (!zones.some(zone => zone.id === zoneId && zone.isActive)) { setError('Selecciona una zona activa.'); return; }
    submitRef.current = true; setBusy(true); setError(''); const owner = auth.currentUser.id;
    try {
      const profile = await auth.updateProfile({ name: name.trim(), phone: normalizePhone(phone) });
      if (!profile.success) throw new Error(profile.message);
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      const result = await operationsApi.applyCourier({ vehicleType: ({ moto: 'motorcycle', bicicleta: 'bicycle', mototaxi: 'mototaxi' } as const)[vehicleType], plate: plate.trim() || null, zoneId });
      if (useAuthStore.getState().currentUser?.id !== owner) return;
      setResultStatus(result.status); setIsSubmitted(true); await auth.initialize(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la solicitud.'); }
    finally { submitRef.current = false; setBusy(false); }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
      <div className="text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-selva-soft text-selva-strong border border-selva-border text-[10px] font-bold tracking-wider uppercase mb-2.5">
          Repartidores Tingaleses
        </span>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Ser Repartidor Quickly</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Genera ingresos repartiendo pedidos en Tingo María con tus propios horarios
        </p>
      </div>

      <RemoteState loading={resource.loading || auth.sessionStatus === "checking"} error={resource.error || auth.sessionError || undefined} retry={() => { void auth.initialize(); resource.reload(); }} />
      {!auth.isAuthenticated && auth.sessionStatus === "ready" && <Link to="/login" state={{ from: "/registro/repartidor" }} className="inline-flex min-h-11 items-center font-bold text-primary">Iniciar sesión para enviar la solicitud</Link>}
      {resource.data?.requests && <p className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs">Estado de tu postulación: {({ pending: "Pendiente de aprobación", active: "Aprobada", rejected: "Rechazada", suspended: "Suspendida" } as const)[resource.data.requests.status]}{resource.data.requests.statusReason && " · " + resource.data.requests.statusReason}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {isSubmitted ? (
        <div className="p-6 bg-primary-50 border border-primary-200 rounded-2xl text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary flex items-center justify-center mx-auto shadow-subtle">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-ink">Solicitud registrada</h2>
          <p className="text-xs text-ink-light leading-relaxed max-w-xs mx-auto">
            Tu postulación como repartidor en <strong>{vehicleType}</strong> ha sido registrada y está{' '}
            <span className="font-semibold text-primary">{resultStatus === "active" ? "aprobada" : resultStatus === "rejected" ? "rechazada" : resultStatus === "suspended" ? "suspendida" : "pendiente de aprobación"}</span> por la administración de Quickly en Tingo María.
          </p>
          <div className="p-3 bg-white/90 rounded-xl border border-primary-100 text-xs text-gray-700 flex items-start gap-2 text-left">
            <Bike className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
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
            label="Nombres y Apellidos"
            placeholder="Ej: Juan Carlos Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<Bike className="w-4 h-4" />}
          />
          <Input
            label="Teléfono / WhatsApp"
            placeholder="962 444 888"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Select
            label="Tipo de Vehículo"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as any)}
          >
            <option value="moto">Motocicleta lineal</option>
            <option value="mototaxi">Mototaxi (Bajaj / Torito)</option>
            <option value="bicicleta">Bicicleta</option>
          </Select>
          <Input
            label="Placa de rodaje (si aplica)"
            placeholder="Ej: 5412-8B"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />

          <Select label="Zona de reparto" value={zoneId} onChange={e => setZoneId(e.target.value)} required><option value="">Selecciona una zona</option>{zones.filter(zone => zone.isActive).map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</Select>
          <Button type="submit" isLoading={busy} disabled={!auth.isAuthenticated || auth.sessionStatus !== "ready" || resource.loading || !!resource.error} variant="primary" size="lg" className="w-full">
            Enviar Solicitud de Repartidor
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Ya eres repartidor activo?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
};
