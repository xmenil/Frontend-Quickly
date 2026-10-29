import React, { useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Decision } from '../../services/api/operationsApi';
import { decideAffiliation, decisionLabels, useAdminAction } from './adminModel';
export function AdminDecisionDialog({ kind, item, onClose, reload, blocked }: { kind: 'stores' | 'couriers'; item: { id: string; name: string; decision: Decision['decision'] }; onClose: () => void; reload: () => void; blocked: boolean }) {
 const [reason, setReason] = useState(''); const actions = useAdminAction(reload, blocked);
 async function submit(event: React.FormEvent) { event.preventDefault(); if (reason.trim().length < 3) return;
  if (await actions.execute(() => decideAffiliation(kind, item.id, { decision: item.decision, reason: reason.trim() }), 'Decisión confirmada.')) onClose();
 }
 return <Dialog isOpen onClose={() => { if (!actions.busy) onClose(); }} title={decisionLabels[item.decision] + (kind === 'stores' ? ' comercio' : ' repartidor')} description={item.name} maxWidth="md">
  <form onSubmit={submit} className="space-y-6"><Input id="admin-decision-reason" label="Motivo de la decisión" required minLength={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} />
   {actions.error && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong">{actions.error}</p>}
   <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={actions.busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={blocked || actions.busy || reason.trim().length < 3}>Confirmar decisión</Button></div>
  </form>
 </Dialog>;
}
