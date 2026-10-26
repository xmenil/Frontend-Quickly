import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { operationsApi, Store } from '../../services/api/operationsApi';
import { StoreFieldsForm } from './ApplicationPages';
import { Feedback, inputClass, PageTitle, Pager, panel, RemoteState, roleLabels, Status, useRemote } from './shared';

function HoursEditor({ store, saved }: { store: Store; saved: () => void }) {
  const [intervals, setIntervals] = useState(store.openingIntervals);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const names = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  function change(index: number, key: 'opensAt' | 'closesAt', value: string) { setIntervals((old) => old.map((row, i) => i === index ? { ...row, [key]: value } : row)); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await operationsApi.hours(store.id, intervals); saved(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar el horario.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5" aria-label="Horario semanal"><h2 className="text-xl font-bold">Horario semanal</h2>
    <p className="text-sm text-ink-light">Hora local de Tingo María. Para cerrar al final del día usa 24:00. Divide los turnos nocturnos entre dos días; los turnos del mismo día no pueden solaparse.</p>
    <fieldset disabled={busy} className="space-y-4">
      {names.map((name, day) => <section key={name} className="border border-border p-4 rounded-xl space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{name}</h3><Button type="button" variant="outline" size="sm" disabled={intervals.filter((row) => row.weekday === day + 1).length >= 4} onClick={() => setIntervals((old) => [...old, { weekday: day + 1, opensAt: '09:00', closesAt: '18:00' }])}>Agregar turno de {name.toLowerCase()}</Button></div>
        {!intervals.some((row) => row.weekday === day + 1) && <p className="text-sm text-ink-muted">Cerrado</p>}
        {intervals.map((row, index) => row.weekday === day + 1 && <div key={index} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Input label={`Apertura ${name} ${index + 1}`} required pattern="([01][0-9]|2[0-3]):[0-5][0-9]" placeholder="09:00" value={row.opensAt} onChange={(e) => change(index, 'opensAt', e.target.value)} />
          <Input label={`Cierre ${name} ${index + 1}`} required pattern="(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)" placeholder="18:00" value={row.closesAt} onChange={(e) => change(index, 'closesAt', e.target.value)} />
          <Button type="button" variant="ghost" aria-label={`Quitar turno ${name} ${index + 1}`} onClick={() => setIntervals((old) => old.filter((_, i) => i !== index))}>Quitar</Button>
        </div>)}
      </section>)}
      <Feedback error={error} /><Button type="submit" isLoading={busy}>Guardar horario</Button>
    </fieldset>
  </form>;
}

function MembersEditor({ storeId }: { storeId: string }) {
  const resource = useRemote(`members:${storeId}`, (signal) => operationsApi.members(storeId, signal));
  const [email, setEmail] = useState(''); const [membershipRole, setRole] = useState<'manager' | 'operator'>('operator');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [confirmId, setConfirm] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
    try { await operationsApi.setMember(storeId, { email: email.trim().toLowerCase(), membershipRole }); setSuccess('Membresía guardada.'); setEmail(''); resource.reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo actualizar el equipo.'); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) {
    setError(''); setSuccess(''); setBusy(true);
    try { await operationsApi.revokeMember(storeId, id); setConfirm(''); setSuccess('Acceso revocado.'); resource.reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo revocar el acceso.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5"><h2 className="text-xl font-bold">Equipo de la tienda</h2><p className="text-sm text-ink-light">El encargado edita datos y productos; el operador atiende pedidos. Solo el propietario administra el equipo. La persona debe tener una cuenta registrada.</p>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data?.map((member) => <article key={member.userId} className="border border-border rounded-xl p-4 space-y-2"><h3 className="font-semibold">{member.fullName}</h3><p className="text-sm break-all">{member.email}</p><p className="text-sm">{roleLabels[member.membershipRole]} · {member.isActive ? 'Acceso activo' : 'Acceso revocado'}</p>
      {member.membershipRole !== 'owner' && <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => { setEmail(member.email); setRole(member.membershipRole as 'manager' | 'operator'); }}>Editar rol</Button>{member.isActive && <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setConfirm(member.userId)}>Revocar acceso</Button>}</div>}
      {confirmId === member.userId && <div className="space-y-2"><p>¿Revocar el acceso de {member.fullName}?</p><div className="flex gap-2"><Button type="button" variant="danger" disabled={busy} onClick={() => void revoke(member.userId)}>Confirmar revocación</Button><Button type="button" variant="ghost" onClick={() => setConfirm('')}>Cancelar</Button></div></div>}
    </article>)}
    <form onSubmit={submit} className="space-y-4" aria-label="Agregar miembro"><Input label="Correo de la persona" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
      <label className="text-sm font-semibold block space-y-2">Rol en la tienda<select className={inputClass} value={membershipRole} onChange={(e) => setRole(e.target.value as 'manager' | 'operator')} disabled={busy}><option value="operator">Operador</option><option value="manager">Encargado</option></select></label>
      <Feedback error={error} success={success} /><Button type="submit" isLoading={busy}>Guardar miembro</Button>
    </form>
  </section>;
}

export function StoreManagementPage() {
  const [params, setParams] = useSearchParams(); const selected = params.get('store') || '';
  const [cursor, setCursor] = useState<string>(); const [tab, setTab] = useState<'profile' | 'hours' | 'members'>('profile');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const navigate = useNavigate(); const { initialize, switchMerchant } = useAuthStore();
  const resource = useRemote(`my-stores:${selected}:${cursor || ''}`, async (signal) => {
    const [list, zones, categories] = await Promise.all([operationsApi.ownStores({ cursor }, signal), operationsApi.zones(signal), operationsApi.categories(signal)]);
    const id = selected || list.items[0]?.id;
    return { list, zones, categories, store: id ? await operationsApi.store(id, signal) : null };
  });
  async function toggle() {
    if (!resource.data?.store) return;
    setBusy(true); setError(''); setSuccess('');
    try { await operationsApi.updateStore(resource.data.store.id, { acceptingOrders: !resource.data.store.acceptingOrders }); resource.reload(); setSuccess('Recepción de pedidos actualizada.'); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo actualizar la recepción.'); }
    finally { setBusy(false); }
  }
  const store = resource.data?.store;
  const canManage = store && ['owner','manager','admin'].includes(store.membershipRole) && store.status !== 'suspended';
  return <div className="space-y-6"><PageTitle detail="Gestiona únicamente las tiendas en las que tienes una membresía vigente.">Mis tiendas</PageTitle>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} /><Feedback error={error} success={success} />
    {resource.data && <>
      {!store ? <section className={panel}><p>No tienes una tienda habilitada.</p><Link to="/cliente/solicitudes" className="text-primary font-semibold">Revisar solicitudes</Link></section> : <>
        <section className={panel}><label className="block text-sm font-semibold space-y-2">Tienda seleccionada<select className={inputClass} value={store.id} onChange={(e) => { setParams({ store: e.target.value }); switchMerchant(e.target.value); setTab('profile'); setError(''); setSuccess(''); }}>
          {!resource.data.list.items.some((s) => s.id === store.id) && <option value={store.id}>{store.name}</option>}{resource.data.list.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></label><Pager next={resource.data.list.nextCursor} isFirst={!cursor} onFirst={() => { setCursor(undefined); setParams({}); }} onNext={() => { setCursor(resource.data!.list.nextCursor || undefined); setParams({}); }} />
          <div className="flex flex-wrap gap-3 items-center"><Status value={store.status} /><span className="text-sm">{roleLabels[store.membershipRole]}</span><span className="text-sm font-semibold">{store.isOpen ? 'Abierta para pedidos' : 'Cerrada para pedidos'}</span></div>
          {store.statusReason && <p className="text-sm">{store.statusReason}</p>}
          {!store.openingIntervals.length && <p className="text-sm text-amber-800">Configura el horario semanal para abrir la tienda.</p>}
          {canManage && store.status === 'active' && <Button variant="outline" disabled={busy} onClick={() => void toggle()}>{store.acceptingOrders ? 'Pausar recepción' : 'Activar recepción'}</Button>}
        </section>
        <section className={panel}>{canManage ? <>
          <div className="flex flex-wrap gap-2" aria-label="Gestión de tienda">{(['profile','hours','members'] as const).filter((t) => t !== 'members' || ['owner','admin'].includes(store.membershipRole)).map((t) => <Button key={t} variant={tab === t ? 'primary' : 'outline'} aria-pressed={tab === t} onClick={() => setTab(t)}>{t === 'profile' ? 'Datos de tienda' : t === 'hours' ? 'Horarios' : 'Equipo'}</Button>)}</div>
          {tab === 'profile' && <StoreFieldsForm key={JSON.stringify({ ...store, openingIntervals: undefined, acceptingOrders: undefined, isOpen: undefined })} initial={store} zones={resource.data.zones} categories={resource.data.categories} onSave={async (input) => {
            const result = await operationsApi.updateStore(store.id, input);
            if (result.status !== 'active') { navigate('/cliente/solicitudes'); await initialize(true); } else { resource.reload(); setSuccess('Datos de tienda guardados.'); }
          }} />}
          {tab === 'hours' && <HoursEditor key={`${store.id}:${JSON.stringify(store.openingIntervals)}`} store={store} saved={() => { resource.reload(); setSuccess('Horario guardado correctamente.'); }} />}
          {tab === 'members' && ['owner','admin'].includes(store.membershipRole) && <MembersEditor key={store.id} storeId={store.id} />}
        </> : <><h2 className="text-xl font-bold">{store.name}</h2><p>{store.addressText}</p><p>{store.phone}</p><p>Tu acceso no permite modificar la configuración de esta tienda.</p></>}</section>
      </>}
    </>}
  </div>;
}
