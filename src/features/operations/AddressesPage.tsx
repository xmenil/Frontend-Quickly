import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { Address, operationsApi, Zone } from '../../services/api/operationsApi';
import { normalizePhone } from '../../services/api/profileAdapter';
import { Feedback, inputClass, PageTitle, panel, RemoteState, useRemote } from './shared';

function AddressForm({ address, zones, saved, cancel }: { address?: Address; zones: Zone[]; saved: () => void; cancel: () => void }) {
  const user = useAuthStore((s) => s.currentUser);
  const [form, setForm] = useState({ label: address?.label || '', recipientName: address?.recipientName || user?.name || '', phone: address?.phone || user?.phone || '',
    street: address?.street || '', streetNumber: address?.streetNumber || '', reference: address?.reference || '', zoneId: address?.zoneId || '',
    latitude: address?.latitude == null ? '' : String(address.latitude), longitude: address?.longitude == null ? '' : String(address.longitude) });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const set = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (Boolean(form.latitude) !== Boolean(form.longitude)) { setError('Completa ambas coordenadas o deja las dos vacías.'); return; }
    setBusy(true);
    try { await operationsApi.saveAddress({ ...form, phone: normalizePhone(form.phone), latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null }, address?.id); saved(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la dirección.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} aria-label="Datos de dirección" className="space-y-4"><h2 className="text-xl font-bold">{address ? 'Editar dirección' : 'Nueva dirección'}</h2><fieldset disabled={busy} className="space-y-4">
    <Input label="Nombre de la dirección" required maxLength={60} placeholder="Casa o trabajo" value={form.label} onChange={(e) => set('label', e.target.value)} />
    <Input label="Persona que recibe" required minLength={3} maxLength={120} value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} />
    <Input label="Celular de contacto" type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
    <div className="grid sm:grid-cols-2 gap-4"><Input label="Calle o avenida" required maxLength={180} value={form.street} onChange={(e) => set('street', e.target.value)} /><Input label="Número" required maxLength={30} value={form.streetNumber} onChange={(e) => set('streetNumber', e.target.value)} /></div>
    <Input label="Referencia" maxLength={500} value={form.reference} onChange={(e) => set('reference', e.target.value)} />
    <label className="text-sm font-semibold block space-y-2">Zona de cobertura<select className={inputClass} required value={form.zoneId} onChange={(e) => set('zoneId', e.target.value)}><option value="">Selecciona tu zona</option>{address && !zones.some((z) => z.id === address.zoneId) && <option value={address.zoneId}>{address.zoneName} (inactiva)</option>}{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
    {!zones.length && !address && <p className="text-amber-800">Aún no hay zonas habilitadas. Podrás guardar tu dirección cuando se configure la cobertura.</p>}
    <details className="space-y-3"><summary className="cursor-pointer text-sm font-semibold">Coordenadas opcionales</summary><p className="text-sm text-ink-light">La cobertura se elige por zona. Las coordenadas no sustituyen esa selección.</p><div className="grid sm:grid-cols-2 gap-4"><Input label="Latitud" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={(e) => set('latitude', e.target.value)} /><Input label="Longitud" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={(e) => set('longitude', e.target.value)} /></div></details>
    <Feedback error={error} /><div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy} disabled={!zones.length && !address}>Guardar dirección</Button><Button type="button" variant="ghost" onClick={cancel}>Cancelar</Button></div>
  </fieldset></form>;
}

export function RealAddressesPage() {
  const resource = useRemote('addresses', async (signal) => { const [addresses, zones] = await Promise.all([operationsApi.addresses(signal), operationsApi.zones(signal)]); return { addresses, zones }; });
  const [editing, setEditing] = useState<string | 'new' | null>(null); const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  async function action(id: string, archive: boolean) {
    setBusy(true); setError(''); setSuccess('');
    try { if (archive) await operationsApi.archiveAddress(id); else await operationsApi.defaultAddress(id); setConfirm(''); setSuccess(archive ? 'Dirección archivada.' : 'Dirección predeterminada actualizada.'); resource.reload(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo actualizar la dirección.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><PageTitle detail="Las direcciones guardadas estarán disponibles cuando el servicio de pedidos se habilite.">Mis direcciones</PageTitle>
    <RemoteState loading={!resource.data && resource.loading} error={resource.error} retry={resource.reload} /><Feedback error={error} success={success} />
    {resource.data && <>
      {editing ? <section className={panel}><AddressForm key={editing} address={resource.data.addresses.find((a) => a.id === editing)} zones={resource.data.zones} cancel={() => setEditing(null)} saved={() => { setEditing(null); resource.reload(); setSuccess('Dirección guardada correctamente.'); }} /></section> : <Button onClick={() => { setEditing('new'); setSuccess(''); setError(''); }}>Agregar dirección</Button>}
      {!resource.data.addresses.length && <p>Todavía no has guardado direcciones.</p>}
      {resource.data.addresses.map((address) => <article key={address.id} className={panel}><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold">{address.label}</h2>{address.isDefault && <span className="text-xs rounded-full px-3 py-1 bg-emerald-50 text-emerald-800">Predeterminada</span>}</div><p>{address.street} {address.streetNumber}</p><p>{address.recipientName} · {address.phone}</p><p className="text-sm text-ink-light">{address.zoneName}{!address.zoneActive && ' · Zona inactiva'}</p>{address.reference && <p className="text-sm">{address.reference}</p>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={() => { setEditing(address.id); setError(''); setSuccess(''); }}>Editar dirección</Button>{!address.isDefault && <Button variant="outline" size="sm" disabled={busy} onClick={() => void action(address.id, false)}>Definir como predeterminada</Button>}<Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirm(address.id)}>Archivar dirección</Button></div>
        {confirm === address.id && <div className="space-y-2"><p>¿Archivar la dirección {address.label}?</p><div className="flex gap-2"><Button variant="danger" disabled={busy} onClick={() => void action(address.id, true)}>Confirmar archivo</Button><Button variant="ghost" onClick={() => setConfirm('')}>Cancelar</Button></div></div>}
      </article>)}
    </>}
  </div>;
}
