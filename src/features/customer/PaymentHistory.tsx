import React, { useState } from 'react';
import { billingApi } from '../../services/api/billingApi';
import { allPages } from './customerAccountModel';
import { RemoteState, useRemote } from '../operations/shared';
import { formatCents } from '../../lib/currency';
const labels: Record<string,string> = { pending: 'Pendiente', processing: 'En proceso', succeeded: 'Confirmado', failed: 'Fallido', cancelled: 'Cancelado', cash: 'Efectivo' };
function Entries({ ids }: { ids: string[] }) {
 const resource = useRemote('payment-history:' + ids.join(','), async signal => (await Promise.all(ids.map(id => allPages(cursor => billingApi.history(id, cursor, signal))))).flat());
 return <div className="space-y-2 pt-2"><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />{resource.data?.map(payment => <div key={payment.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3"><p>{labels[payment.methodCode] || payment.methodCode} · {labels[payment.status]} · <strong>{formatCents(payment.amountCents)}</strong></p>{payment.refunds.map(refund => <p key={refund.id} className="mt-1">Reembolso: {formatCents(refund.amountCents)} · {labels[refund.status]}</p>)}</div>)}{!resource.loading && !resource.error && resource.data?.length === 0 && <p>Sin movimientos registrados.</p>}</div>;
}
export function PaymentHistory({ ids }: { ids: string[] }) {
 const [open, setOpen] = useState(false);
 return <details onToggle={e => setOpen(e.currentTarget.open)} className="border-t border-gray-100 pt-2"><summary className="cursor-pointer min-h-11 font-bold text-primary">Historial de pagos y reembolsos</summary>{open && <Entries ids={[...new Set(ids)]} />}</details>;
}
