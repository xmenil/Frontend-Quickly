import React, { useRef, useState } from 'react';
import { engagementApi } from '../../services/api/engagementApi';
import { useRemote, RemoteState } from '../operations/shared';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/date';
function Messages({ id }: { id: string }) {
 const owner = useAuthStore(s => s.currentUser?.id);
 const resource = useRemote('ticket:' + id, signal => engagementApi.ticket(false, id, signal));
 const [body, setBody] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
 async function send(e: React.FormEvent) { e.preventDefault(); if (lock.current || !body.trim() || resource.data?.status === 'resolved') return;
  lock.current = true; setBusy(true); setError('');
  try { await engagementApi.message(id, { body: body.trim() }); if (useAuthStore.getState().currentUser?.id !== owner) return; setBody(''); resource.reload(); }
  catch(e) { setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje.'); } finally { lock.current = false; setBusy(false); }
 }
 return <div className="space-y-3 pt-3"><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />
  {resource.data?.messages.map(message => <div key={message.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs"><p className="font-bold text-primary">{message.authorUserId === owner ? 'Tú' : 'Soporte'} · {formatDateTime(message.createdAt)}</p><p className="mt-1 whitespace-pre-wrap break-words text-ink">{message.body}</p></div>)}
  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  {resource.data && resource.data.status !== 'resolved' && <form onSubmit={send} className="space-y-2"><textarea aria-label="Mensaje de seguimiento" required maxLength={3000} value={body} onChange={e => setBody(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 text-sm" /><Button type="submit" size="sm" isLoading={busy} disabled={busy || !body.trim() || resource.loading || !!resource.error}>Enviar mensaje</Button></form>}
 </div>;
}
export function TicketConversation({ id }: { id: string }) {
 const [open, setOpen] = useState(false);
 return <details onToggle={e => setOpen(e.currentTarget.open)} className="border-t border-gray-100 pt-3"><summary className="cursor-pointer min-h-11 text-xs font-bold text-primary">Ver conversación</summary>{open && <Messages id={id} />}</details>;
}
