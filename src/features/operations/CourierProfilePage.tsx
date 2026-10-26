import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { operationsApi } from '../../services/api/operationsApi';
import { CourierFieldsForm } from './ApplicationPages';
import { Feedback, PageTitle, panel, RemoteState, Status, useRemote } from './shared';

export function OperationalCourierPage() {
  const resource = useRemote('operational-courier', async (signal) => {
    const [profile, zones] = await Promise.all([operationsApi.courier(signal), operationsApi.zones(signal)]); return { profile, zones };
  });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const initialize = useAuthStore((s) => s.initialize); const navigate = useNavigate();
  async function toggle() {
    if (!resource.data?.profile) return;
    setBusy(true); setError(''); setSuccess('');
    try { await operationsApi.availability(!resource.data.profile.isOnline); resource.reload(); setSuccess('Disponibilidad actualizada.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cambiar la disponibilidad.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><PageTitle detail="Tu habilitación y disponibilidad se verifican antes de tomar una entrega.">Mi perfil de reparto</PageTitle>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data && (resource.data.profile ? <>
      <section className={panel}><Status value={resource.data.profile.status} /><p className="font-semibold">{resource.data.profile.isOnline ? 'Disponible para recibir entregas' : 'Disponibilidad pausada'}</p><p>{resource.data.profile.zoneName}</p>{resource.data.profile.statusReason && <p>{resource.data.profile.statusReason}</p>}
        <Button variant="outline" disabled={busy || resource.data.profile.status !== 'active'} onClick={() => void toggle()}>{resource.data.profile.isOnline ? 'Pausar disponibilidad' : 'Activar disponibilidad'}</Button><Feedback error={error} success={success} />
      </section>
      <section className={panel}><h2 className="text-xl font-bold">Vehículo y zona</h2><CourierFieldsForm key={JSON.stringify({ ...resource.data.profile, isOnline: undefined })} initial={resource.data.profile} zones={resource.data.zones} onSave={async (input) => {
        const result = await operationsApi.applyCourier(input);
        if (result.status !== 'active') { navigate('/cliente/solicitudes'); await initialize(true); } else { resource.reload(); setSuccess('Perfil de reparto guardado.'); }
      }} /></section>
    </> : <section className={panel}><p>Todavía no tienes un perfil de reparto.</p><Link className="text-primary font-semibold" to="/registro/repartidor">Solicitar afiliación</Link></section>)}
  </div>;
}
