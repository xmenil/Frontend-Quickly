import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Decision, operationsApi, Zone, ZoneInput } from '../../services/api/operationsApi';
import { useAuthStore } from '../../store/authStore';
import { formatCents } from '../../lib/currency';
import { Feedback, inputClass, PageTitle, Pager, panel, RemoteState, Status, statusLabels, useRemote, vehicleLabels } from './shared';

export function AdminOperationsLayout() {
  return <div className="space-y-7"><nav aria-label="Administración" className="flex flex-wrap gap-2">{[
    ['/admin/resumen','Resumen'], ['/admin/comercios','Comercios'], ['/admin/repartidores','Repartidores'], ['/admin/usuarios','Usuarios'], ['/admin/zonas','Zonas'],
  ].map(([to,label]) => <NavLink key={to} to={to} className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary text-white' : 'bg-white border border-border text-primary'}`}>{label}</NavLink>)}</nav><Outlet /></div>;
}

export function RealAdminOverviewPage() {
  const resource = useRemote('admin-overview', (signal) => operationsApi.overview(signal));
  return <div className="space-y-6"><PageTitle detail="Estado de las cuentas y afiliaciones registradas.">Resumen administrativo</PageTitle><RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} />
    {resource.data && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[
      ['Comercios pendientes', resource.data.pendingStores, '/admin/comercios'], ['Repartidores pendientes', resource.data.pendingCouriers, '/admin/repartidores'],
      ['Comercios aprobados', resource.data.activeStores, '/admin/comercios'], ['Repartidores aprobados', resource.data.activeCouriers, '/admin/repartidores'],
      ['Cuentas activas', resource.data.activeUsers, '/admin/usuarios'], ['Cuentas suspendidas', resource.data.suspendedUsers, '/admin/usuarios'],
    ].map(([label,value,to]) => <Link key={String(label)} to={String(to)} className={panel}><h2 className="text-sm text-ink-light">{label}</h2><p className="text-3xl font-bold">{value}</p></Link>)}</div>}
  </div>;
}
const decisionLabels: Record<Decision['decision'], string> = { approve: 'Aprobar', reject: 'Rechazar', suspend: 'Suspender', reactivate: 'Reactivar' };
const decisionsByStatus: Record<string, Decision['decision'][]> = { pending: ['approve','reject'], active: ['suspend'], suspended: ['reactivate'], rejected: [] };
interface ReviewItem { id: string; name: string; status: string; statusReason: string | null; facts: [string, string][] }

export function AdminRequestsPage({ kind }: { kind: 'stores' | 'couriers' }) {
  const [status, setStatus] = useState('pending'); const [cursor, setCursor] = useState<string>();
  const [selected, setSelected] = useState<{ id: string; decision: Decision['decision'] } | null>(null);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const resource = useRemote(`admin-${kind}:${status}:${cursor || ''}`, async (signal): Promise<{ items: ReviewItem[]; nextCursor: string | null }> => {
    if (kind === 'stores') {
      const response = await operationsApi.adminStores({ status: status || undefined, cursor }, signal);
      return { nextCursor: response.nextCursor, items: response.items.map((store) => ({ id: store.id, name: store.name, status: store.status, statusReason: store.statusReason,
        facts: [['Categoría',store.categoryCode], ['Zona',store.zoneName], ['Dirección',store.addressText], ['Teléfono',store.phone], ['Razón social',store.legalBusinessName || 'No indicada'], ['RUC',store.taxId || 'No indicado']] })) };
    }
    const response = await operationsApi.adminCouriers({ status: status || undefined, cursor }, signal);
    return { nextCursor: response.nextCursor, items: response.items.map((courier) => ({ id: courier.id, name: courier.fullName, status: courier.status, statusReason: courier.statusReason,
      facts: [['Correo',courier.email], ['Teléfono',courier.phone], ['Vehículo',vehicleLabels[courier.vehicleType]], ['Placa',courier.plate || 'No requiere'], ['Zona',courier.zoneName || 'Sin zona']] })) };
  });
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError(''); setSuccess('');
    try {
      const body: Decision = { decision: selected.decision, reason: reason.trim() };
      if (kind === 'stores') await operationsApi.decideStore(selected.id, body); else await operationsApi.decideCourier(selected.id, body);
      setSuccess('Decisión registrada correctamente.'); setSelected(null); setReason(''); resource.reload();
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo registrar la decisión.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><PageTitle detail="Revisa los datos y registra un motivo para cada decisión.">{kind === 'stores' ? 'Administrar comercios' : 'Administrar repartidores'}</PageTitle>
    <label className="text-sm font-semibold block max-w-sm space-y-2">Estado de solicitudes<select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setCursor(undefined); setSelected(null); setError(''); setSuccess(''); }}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} /><Feedback error={error} success={success} />
    {resource.data && <>
      {!resource.data.items.length && <p>No hay solicitudes en este estado.</p>}
      {resource.data.items.map((item) => <article key={item.id} className={panel}><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl font-bold">{item.name}</h2><Status value={item.status} /></div>
        <dl className="grid sm:grid-cols-2 gap-3">{item.facts.map(([label,value]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="text-sm break-words">{value}</dd></div>)}</dl>
        {item.statusReason && <p className="text-sm">Último motivo: {item.statusReason}</p>}
        <div className="flex flex-wrap gap-2">{(decisionsByStatus[item.status] || []).map((decision) => <Button key={decision} variant={decision === 'approve' ? 'primary' : 'outline'} disabled={busy} onClick={() => { setSelected({ id: item.id, decision }); setReason(''); setError(''); setSuccess(''); }}>{decisionLabels[decision]}</Button>)}</div>
        {selected?.id === item.id && <form onSubmit={submit} aria-label="Decisión administrativa" className="border-t border-border pt-4 space-y-4"><h3 className="font-bold">{decisionLabels[selected.decision]}: {item.name}</h3><Input label="Motivo de la decisión" required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} /><div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy}>Confirmar decisión</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setSelected(null)}>Cancelar</Button></div></form>}
      </article>)}
      <Pager next={resource.data.nextCursor} isFirst={!cursor} onFirst={() => setCursor(undefined)} onNext={() => setCursor(resource.data!.nextCursor || undefined)} />
    </>}
  </div>;
}

export function RealAdminUsersPage() {
  const currentUser = useAuthStore((s) => s.currentUser); const [cursor, setCursor] = useState<string>(); const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<{ id: string; status: 'active' | 'suspended' } | null>(null); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const resource = useRemote(`admin-users:${status}:${cursor || ''}`, (signal) => operationsApi.adminUsers({ status: status || undefined, cursor }, signal));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError(''); setSuccess('');
    try { await operationsApi.userStatus(selected.id, { status: selected.status, reason: reason.trim() }); setSelected(null); setSuccess('Estado de cuenta actualizado.'); resource.reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo actualizar la cuenta.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><PageTitle detail="Suspender una cuenta revoca sus sesiones y pausa sus operaciones. Las entregas y pedidos activos deben resolverse primero.">Administrar usuarios</PageTitle>
    <label className="text-sm font-semibold block max-w-sm space-y-2">Estado de cuenta<select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setCursor(undefined); setSelected(null); }}><option value="">Todos</option><option value="active">Activa</option><option value="suspended">Suspendida</option><option value="pending">Pendiente</option></select></label>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} /><Feedback error={error} success={success} />
    {resource.data && <>{!resource.data.items.length && <p>No hay cuentas en este estado.</p>}{resource.data.items.map((user) => <article key={user.id} className={panel}><h2 className="text-xl font-bold">{user.fullName}</h2><p className="break-all">{user.email}</p><p className="text-sm">{user.phone}</p><p className="text-sm font-semibold">{user.status === 'active' ? 'Cuenta activa' : user.status === 'suspended' ? 'Cuenta suspendida' : 'Cuenta pendiente'}</p><p className="text-sm text-ink-light">Roles: {user.roles.map((role) => ({ customer: 'Cliente', merchant: 'Comercio', courier: 'Repartidor', admin: 'Administrador' }[role] || role)).join(', ') || 'Sin rol operativo'}</p>{user.statusReason && <p className="text-sm">Último motivo: {user.statusReason}</p>}
      {user.id !== currentUser?.id ? <Button variant="outline" disabled={busy} onClick={() => { setSelected({ id: user.id, status: user.status === 'active' ? 'suspended' : 'active' }); setReason(''); setError(''); setSuccess(''); }}>{user.status === 'active' ? 'Suspender cuenta' : 'Activar cuenta'}</Button> : <p className="text-sm text-ink-muted">Esta es tu cuenta administradora.</p>}
      {selected?.id === user.id && <form onSubmit={submit} aria-label="Cambiar estado de cuenta" className="space-y-4"><Input label="Motivo del cambio de cuenta" required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} /><div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy}>Confirmar cambio de cuenta</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setSelected(null)}>Cancelar</Button></div></form>}
    </article>)}<Pager next={resource.data.nextCursor} isFirst={!cursor} onFirst={() => setCursor(undefined)} onNext={() => setCursor(resource.data!.nextCursor || undefined)} /></>}
  </div>;
}

function ZoneForm({ initial, saved, cancel }: { initial?: Zone; saved: () => void; cancel: () => void }) {
  const [form, setForm] = useState({ code: initial?.code || '', name: initial?.name || '', description: initial?.description || '', fee: String((initial?.baseFeeCents || 0) / 100),
    estimated: String(initial?.estimatedMinutes || 30), isActive: initial?.isActive ?? true, reason: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const set = (key: keyof typeof form, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!/^\d+([.,]\d{1,2})?$/.test(form.fee)) { setError('Ingresa una tarifa con hasta dos decimales.'); return; }
    setBusy(true);
    const body: ZoneInput = { code: form.code, name: form.name, description: form.description, baseFeeCents: Math.round(Number(form.fee.replace(',', '.')) * 100), estimatedMinutes: Number(form.estimated), isActive: form.isActive };
    try { await operationsApi.saveZone(initial ? { ...body, reason: form.reason.trim() } : body, initial?.id); saved(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la zona.'); }
    finally { setBusy(false); }
  }
  return <form className="space-y-4" onSubmit={submit} aria-label="Datos de zona"><h2 className="text-xl font-bold">{initial ? 'Editar zona' : 'Nueva zona'}</h2><fieldset disabled={busy} className="space-y-4">
    <Input label="Código de zona" required pattern="[a-z0-9][a-z0-9_-]{1,39}" maxLength={40} value={form.code} onChange={(e) => set('code', e.target.value)} disabled={Boolean(initial)} helperText="Identificador único, con letras minúsculas, números o guiones." />
    <Input label="Nombre de zona" required minLength={3} maxLength={100} value={form.name} onChange={(e) => set('name', e.target.value)} />
    <Input label="Descripción de cobertura" maxLength={500} value={form.description} onChange={(e) => set('description', e.target.value)} helperText="Indica los sectores que cubre esta zona; los usuarios la seleccionarán al guardar su dirección." />
    <div className="grid sm:grid-cols-2 gap-4"><Input label="Tarifa de envío (S/)" required inputMode="decimal" value={form.fee} onChange={(e) => set('fee', e.target.value)} /><Input label="Tiempo estimado (minutos)" required type="number" min={1} max={1440} value={form.estimated} onChange={(e) => set('estimated', e.target.value)} /></div>
    <label className="inline-flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />Zona habilitada</label>
    {initial && <><p className="text-sm text-ink-light">Desactivar impide nuevas afiliaciones y compras en esta zona; las direcciones y pedidos existentes se conservan.</p><Input label="Motivo del cambio de zona" required minLength={3} maxLength={500} value={form.reason} onChange={(e) => set('reason', e.target.value)} /></>}
    <Feedback error={error} /><div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy}>Guardar zona</Button><Button type="button" variant="ghost" disabled={busy} onClick={cancel}>Cancelar</Button></div>
  </fieldset></form>;
}

export function RealAdminZonesPage() {
  const [cursor, setCursor] = useState<string>(); const [editing, setEditing] = useState<string | 'new' | null>(null); const [success, setSuccess] = useState('');
  const resource = useRemote(`admin-zones:${cursor || ''}`, (signal) => operationsApi.adminZones({ cursor }, signal));
  return <div className="space-y-6"><PageTitle detail="Configura la cobertura antes de recibir solicitudes de comercios y repartidores.">Administrar zonas</PageTitle>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} /><Feedback success={success} />
    {resource.data && <>
      {editing ? <section className={panel}><ZoneForm key={editing} initial={resource.data.items.find((zone) => zone.id === editing)} saved={() => { setEditing(null); setSuccess('Zona guardada correctamente.'); resource.reload(); }} cancel={() => setEditing(null)} /></section> : <Button onClick={() => { setEditing('new'); setSuccess(''); }}>Crear zona</Button>}
      {!resource.data.items.length && <p>No hay zonas configuradas.</p>}
      {resource.data.items.map((zone) => <article key={zone.id} className={panel}><h2 className="text-xl font-bold">{zone.name}</h2><p className="text-sm font-semibold">{zone.isActive ? 'Zona habilitada' : 'Zona inactiva'}</p><p>{zone.description}</p><p>{formatCents(zone.baseFeeCents)} · {zone.estimatedMinutes} minutos</p><Button variant="outline" onClick={() => { setEditing(zone.id); setSuccess(''); }}>Editar zona</Button></article>)}
      <Pager next={resource.data.nextCursor} isFirst={!cursor} onFirst={() => { setCursor(undefined); setEditing(null); }} onNext={() => { setCursor(resource.data!.nextCursor || undefined); setEditing(null); }} />
    </>}
  </div>;
}
