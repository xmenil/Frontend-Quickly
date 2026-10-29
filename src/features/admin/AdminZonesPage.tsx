import React, { useState } from 'react';
import { loadAdminZones, saveAdminZone, useAdminAction, useAdminResource } from './adminModel';
import { RemoteState } from '../operations/shared';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import type { Zone } from '../../services/api/operationsApi';
import { formatCents } from '../../lib/currency';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { MapPin } from 'lucide-react';

export const AdminZonesPage: React.FC = () => {
  const resource = useAdminResource('zones', loadAdminZones);
  const zones = resource.data || [];
  const actions = useAdminAction(resource.reload, resource.loading || !!resource.error);
  const [editing, setEditing] = useState<Zone | 'new' | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', fee: '', minutes: '20', isActive: true, reason: '' });
  const [formError, setFormError] = useState('');
  const open = (zone: Zone | 'new') => {
    actions.clear(); setFormError(''); setEditing(zone);
    setForm(zone === 'new' ? { code: '', name: '', description: '', fee: '', minutes: '20', isActive: true, reason: '' } : { code: zone.code, name: zone.name, description: zone.description, fee: (zone.baseFeeCents / 100).toFixed(2), minutes: String(zone.estimatedMinutes), isActive: zone.isActive, reason: '' });
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!editing) return; setFormError('');
    if (!/^\d+(?:\.\d{1,2})?$/.test(form.fee)) { setFormError('Ingresa una tarifa con hasta dos decimales.'); return; }
    const [whole, fraction = ''] = form.fee.split('.'); const baseFeeCents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    const estimatedMinutes = Number(form.minutes);
    if (!Number.isSafeInteger(baseFeeCents) || baseFeeCents > 100000000 || !Number.isInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 1440) { setFormError('Revisa la tarifa y el tiempo estimado (1 a 1440 minutos).'); return; }
    const body = { code: form.code.trim(), name: form.name.trim(), description: form.description.trim(), baseFeeCents, estimatedMinutes, isActive: form.isActive, ...(editing === 'new' ? {} : { reason: form.reason.trim() }) };
    if (await actions.execute(() => saveAdminZone(body, editing === 'new' ? undefined : editing.id), 'Zona guardada y confirmada.')) setEditing(null);
  }
  if ((resource.loading || resource.error) && !resource.data) return <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Zonas y tarifas</h1>
        <p className="text-sm text-ink-light">
          Consulta la cobertura, la tarifa base y el tiempo estimado de reparto en Tingo María.
        </p>
      </header>

      <Button type="button" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => open('new')}>Nueva zona</Button>
      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
      {actions.notice && <p role="status" className="text-sm text-selva-strong">{actions.notice}</p>}
      <section aria-labelledby="admin-zones-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-zones-heading" className="text-base font-semibold text-ink">Zonas de cobertura</h2>
          <p className="text-sm tabular-nums text-ink-muted">
            {zones.length} {zones.length === 1 ? 'zona registrada' : 'zonas registradas'}
          </p>
        </div>
        {zones.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-8 w-8" aria-hidden="true" />}
            title="Aún no hay zonas de cobertura registradas"
            description="Las zonas aparecerán aquí cuando estén disponibles en la plataforma."
          />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Zonas de cobertura: referencias, disponibilidad, tarifa base de envío y tiempo estimado.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/4 rounded-tl-2xl px-4 py-3 font-semibold">Zona</th>
                  <th scope="col" className="w-1/3 px-3 py-3 font-semibold">Cobertura y referencias</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Disponibilidad</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Tarifa base</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Tiempo estimado</th>
                  <th scope="col" className="rounded-tr-2xl px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {zones.map((zone) => (
                  <tr key={zone.id} className="block p-4 xl:table-row xl:p-0">
                    <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-4 xl:align-middle">
                      <div className="flex min-w-0 items-start gap-3">
                        <MapPin className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                        <h3 className="break-words text-sm font-semibold text-ink">{zone.name}</h3>
                      </div>
                    </th>
                    <td className="block pb-3 xl:table-cell xl:px-3 xl:py-4 xl:align-middle">
                      <p className="mb-1 text-xs text-ink-muted xl:hidden">Cobertura y referencias</p>
                      <p className="break-words text-xs leading-relaxed text-ink-light">{zone.description}</p>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-4 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Disponibilidad</span>
                      <Badge variant={zone.isActive ? 'success' : 'danger'}>{zone.isActive ? 'Habilitada' : 'Fuera de cobertura'}</Badge>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-4 xl:text-right xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Tarifa base de envío</span>
                      <span className="font-semibold tabular-nums text-ink">{formatCents(zone.baseFeeCents)}</span>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-4 xl:py-4 xl:text-right xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Tiempo estimado</span>
                      <span className="tabular-nums text-ink-light">{zone.estimatedMinutes} min</span>
                    </td>
                    <td className="block pt-3 xl:table-cell xl:px-4 xl:py-4"><Button variant="outline" size="sm" disabled={actions.busy || resource.loading || !!resource.error} onClick={() => open(zone)} aria-label={'Editar zona: ' + zone.name}>Editar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Dialog isOpen={Boolean(editing)} onClose={() => { if (!actions.busy) setEditing(null); }} title={editing === 'new' ? 'Nueva zona' : 'Editar zona'} description="Define la cobertura, tarifa y tiempo estimado." maxWidth="md">
        <form onSubmit={submit} className="space-y-4"><Input id="zone-code" label="Código de zona" required pattern="[a-z0-9][-a-z0-9_]{1,39}" disabled={editing !== 'new'} value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} /><Input id="zone-name" label="Nombre de zona" required minLength={3} maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /><Input id="zone-description" label="Cobertura y referencias" maxLength={500} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input id="zone-fee" label="Tarifa base (S/)" required inputMode="decimal" value={form.fee} onChange={event => setForm({ ...form, fee: event.target.value })} /><Input id="zone-minutes" label="Tiempo estimado (min)" required type="number" min={1} max={1440} value={form.minutes} onChange={event => setForm({ ...form, minutes: event.target.value })} /></div><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />Zona habilitada</label>{editing !== 'new' && <Input id="zone-reason" label="Motivo del cambio" required minLength={3} maxLength={500} value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} />}
        {(formError || actions.error) && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong">{formError || actions.error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={actions.busy} onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" disabled={actions.busy || resource.loading || !!resource.error}>Guardar zona</Button></div></form>
      </Dialog>
    </div>
  );
};
