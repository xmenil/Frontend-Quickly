import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { normalizePhone } from '../../services/api/profileAdapter';
import { CourierInput, CourierProfile, operationsApi, Store, StoreInput, Zone } from '../../services/api/operationsApi';
import { Feedback, inputClass, PageTitle, Pager, panel, RemoteState, Status, useRemote, vehicleLabels } from './shared';

export function StoreFieldsForm({ initial, zones, categories, onSave }: {
  initial?: Store; zones: Zone[]; categories: { code: string; label: string }[]; onSave: (input: StoreInput) => Promise<void>;
}) {
  const user = useAuthStore((s) => s.currentUser);
  const authBusy = useAuthStore((s) => s.busy);
  const [form, setForm] = useState({ name: initial?.name || '', categoryCode: initial?.categoryCode || '', zoneId: initial?.zoneId || '',
    addressText: initial?.addressText || '', phone: initial?.phone || user?.phone || '', description: initial?.description || '',
    legalBusinessName: initial?.legalBusinessName || '', taxId: initial?.taxId || '', minimum: String((initial?.minimumOrderCents || 0) / 100), preparation: String(initial?.preparationMinutes || 30) });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const canIdentity = !initial || ['owner','admin'].includes(initial.membershipRole);
  const set = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!/^\d+([.,]\d{1,2})?$/.test(form.minimum)) { setError('El pedido mínimo debe ser un importe con hasta dos decimales.'); return; }
    setBusy(true);
    try { await onSave({ name: form.name, categoryCode: form.categoryCode, zoneId: form.zoneId, addressText: form.addressText,
      phone: normalizePhone(form.phone), description: form.description, legalBusinessName: form.legalBusinessName || null,
      taxId: form.taxId || null, minimumOrderCents: Math.round(Number(form.minimum.replace(',', '.')) * 100), preparationMinutes: Number(form.preparation) }); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la tienda.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4" aria-label="Datos de tienda">
    {!zones.length && <p className="text-amber-800">Todavía no hay zonas habilitadas. La administración debe configurar la cobertura.</p>}
    <fieldset disabled={busy || authBusy} className="space-y-4">
      <Input label="Nombre comercial" required minLength={3} maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} disabled={!canIdentity} />
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-2 text-sm font-semibold">Categoría<select className={inputClass} required value={form.categoryCode} onChange={(e) => set('categoryCode', e.target.value)} disabled={!canIdentity}><option value="">Selecciona una categoría</option>{categories.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></label>
        <label className="space-y-2 text-sm font-semibold">Zona de la tienda<select className={inputClass} required value={form.zoneId} onChange={(e) => set('zoneId', e.target.value)} disabled={!canIdentity}><option value="">Selecciona una zona</option>{initial && !zones.some((z) => z.id === initial.zoneId) && <option value={initial.zoneId} disabled>{initial.zoneName} (inactiva)</option>}{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></label>
      </div>
      <Input label="Dirección del negocio" required minLength={3} value={form.addressText} onChange={(e) => set('addressText', e.target.value)} disabled={!canIdentity} />
      <Input label="Teléfono del negocio" required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      <Input label="Razón social (opcional)" minLength={3} maxLength={180} value={form.legalBusinessName} onChange={(e) => set('legalBusinessName', e.target.value)} disabled={!canIdentity} />
      <Input label="RUC (opcional)" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} value={form.taxId} onChange={(e) => set('taxId', e.target.value)} helperText="Si lo indicas, debe tener 11 dígitos." disabled={!canIdentity} />
      <Input label="Descripción" maxLength={1000} value={form.description} onChange={(e) => set('description', e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-4"><Input label="Pedido mínimo (S/)" required inputMode="decimal" value={form.minimum} onChange={(e) => set('minimum', e.target.value)} /><Input label="Preparación (minutos)" required type="number" min={1} max={1440} value={form.preparation} onChange={(e) => set('preparation', e.target.value)} /></div>
      {initial?.status === 'active' && canIdentity && <p className="text-sm text-ink-light">Cambiar nombre, dirección, zona, categoría, razón social o RUC requiere una nueva aprobación y pausa la recepción de pedidos.</p>}
      <Feedback error={error} /><Button type="submit" isLoading={busy} disabled={!zones.length}>{initial ? 'Guardar datos de tienda' : 'Enviar solicitud de comercio'}</Button>
    </fieldset>
  </form>;
}

export function StoreApplicationPage() {
  const [params] = useSearchParams(); const id = params.get('store'); const navigate = useNavigate();
  const initialize = useAuthStore((s) => s.initialize);
  const resource = useRemote(`store-application:${id || 'new'}`, async (signal) => {
    const [zones, categories, store] = await Promise.all([operationsApi.zones(signal), operationsApi.categories(signal), id ? operationsApi.store(id, signal) : Promise.resolve(undefined)]);
    return { zones, categories, store };
  });
  return <section className={panel}><PageTitle detail="La administración revisará tu negocio antes de habilitarlo.">Afiliar mi negocio</PageTitle>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data && <>
      {resource.data.store && <><Status value={resource.data.store.status} /><p>{resource.data.store.statusReason}</p></>}
      {resource.data.store?.status === 'suspended' ? <p>Solicita una revisión administrativa para recuperar la habilitación.</p> : resource.data.store?.membershipRole === 'operator' ? <p>Solo el propietario o encargado puede editar la solicitud.</p> :
        <StoreFieldsForm key={JSON.stringify(resource.data.store)} initial={resource.data.store} zones={resource.data.zones} categories={resource.data.categories} onSave={async (input) => {
          if (id) await operationsApi.updateStore(id, input); else await operationsApi.applyStore(input);
          navigate('/cliente/solicitudes', { replace: true }); await initialize(true);
        }} />}
    </>}
  </section>;
}

export function CourierFieldsForm({ initial, zones, onSave }: { initial?: CourierProfile | null; zones: Zone[]; onSave: (input: CourierInput) => Promise<void> }) {
  const authBusy = useAuthStore((s) => s.busy);
  const [vehicleType, setVehicle] = useState(initial?.vehicleType || 'bicycle'); const [plate, setPlate] = useState(initial?.plate || ''); const [zoneId, setZone] = useState(initial?.zoneId || '');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onSave({ vehicleType, zoneId, plate: plate.trim() ? plate.trim().toUpperCase() : null }); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.'); }
    finally { setBusy(false); }
  }
  return <form className="space-y-4" aria-label="Datos de reparto" onSubmit={submit}><fieldset disabled={busy || authBusy} className="space-y-4">
    <label className="text-sm font-semibold block space-y-2">Vehículo<select className={inputClass} value={vehicleType} onChange={(e) => setVehicle(e.target.value as CourierInput['vehicleType'])}>{Object.entries(vehicleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <Input label="Placa del vehículo" required={vehicleType !== 'bicycle'} minLength={3} maxLength={20} value={plate} onChange={(e) => setPlate(e.target.value)} helperText="Obligatoria para moto y mototaxi." />
    <label className="text-sm font-semibold block space-y-2">Zona de reparto<select className={inputClass} required value={zoneId} onChange={(e) => setZone(e.target.value)}><option value="">Selecciona una zona</option>{initial?.zoneId && !zones.some((z) => z.id === initial.zoneId) && <option value={initial.zoneId} disabled>{initial.zoneName} (inactiva)</option>}{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
    {!zones.length && <p className="text-amber-800">La administración todavía no ha habilitado zonas de reparto.</p>}
    {initial?.status === 'active' && <p className="text-sm text-ink-light">Cambiar vehículo o placa requiere nueva aprobación. Guardar tu perfil pausa tu disponibilidad.</p>}
    <Feedback error={error} /><Button type="submit" isLoading={busy} disabled={!zones.length}>{initial ? 'Guardar perfil de reparto' : 'Enviar solicitud de reparto'}</Button>
  </fieldset></form>;
}

export function CourierApplicationPage() {
  const navigate = useNavigate(); const initialize = useAuthStore((s) => s.initialize);
  const resource = useRemote('courier-application', async (signal) => ({ profile: await operationsApi.courier(signal), zones: await operationsApi.zones(signal) }));
  return <section className={panel}><PageTitle detail="Envía tus datos y consulta la revisión de tu perfil.">Ser repartidor</PageTitle>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data && <>{resource.data.profile && <><Status value={resource.data.profile.status} /><p>{resource.data.profile.statusReason}</p></>}
      {resource.data.profile?.status === 'suspended' ? <p>Solicita revisión administrativa para recuperar tu habilitación.</p> :
        <CourierFieldsForm key={JSON.stringify(resource.data.profile)} initial={resource.data.profile} zones={resource.data.zones} onSave={async (input) => {
          await operationsApi.applyCourier(input); navigate('/cliente/solicitudes', { replace: true }); await initialize(true);
        }} />}
    </>}
  </section>;
}

export function ApplicationsPage() {
  const [cursor, setCursor] = useState<string>(); const { initialize, busy } = useAuthStore();
  const resource = useRemote(`applications:${cursor || ''}`, async (signal) => {
    const [stores, courier] = await Promise.all([operationsApi.ownStores({ cursor }, signal), operationsApi.courier(signal)]);
    return { stores, courier };
  });
  return <div className="space-y-6"><PageTitle detail="Tus solicitudes y permisos se actualizan después de la revisión administrativa.">Mis solicitudes</PageTitle>
    <Button variant="outline" disabled={busy} onClick={() => void initialize(true)}>Actualizar estado</Button>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data && <>
      <section className={panel}><div className="flex flex-wrap gap-3 justify-between"><h2 className="text-xl font-bold">Mis comercios</h2><Link to="/registro/comercio" className="text-primary font-semibold">Afiliar otro negocio</Link></div>
        {!resource.data.stores.items.length && <p>Todavía no has solicitado la afiliación de un negocio.</p>}
        {resource.data.stores.items.map((store) => <article key={store.id} className="border border-border rounded-xl p-4 space-y-3"><h3 className="font-bold">{store.name}</h3><Status value={store.status} />{store.statusReason && <p className="text-sm">{store.statusReason}</p>}<p className="text-sm text-ink-light">{store.zoneName}</p><Link className="text-primary font-semibold" to={store.status === 'active' ? `/comercio/tienda?store=${store.id}` : `/registro/comercio?store=${store.id}`}>{store.status === 'active' ? 'Administrar tienda' : 'Ver o corregir solicitud'}</Link></article>)}
        <Pager next={resource.data.stores.nextCursor} isFirst={!cursor} onFirst={() => setCursor(undefined)} onNext={() => setCursor(resource.data!.stores.nextCursor || undefined)} />
      </section>
      <section className={panel}><h2 className="text-xl font-bold">Mi solicitud de reparto</h2>{resource.data.courier ? <><Status value={resource.data.courier.status} /><p>{vehicleLabels[resource.data.courier.vehicleType]} · {resource.data.courier.zoneName}</p>{resource.data.courier.statusReason && <p>{resource.data.courier.statusReason}</p>}<Link className="text-primary font-semibold" to={resource.data.courier.status === 'active' ? '/repartidor/perfil' : '/registro/repartidor'}>{resource.data.courier.status === 'active' ? 'Ver perfil de reparto' : 'Ver o corregir solicitud'}</Link></> : <><p>Todavía no tienes una solicitud de reparto.</p><Link className="text-primary font-semibold" to="/registro/repartidor">Solicitar perfil de repartidor</Link></>}</section>
    </>}
  </div>;
}
