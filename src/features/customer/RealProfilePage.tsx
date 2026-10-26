import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function RealProfilePage() {
  const { currentUser, updateProfile, busy } = useAuthStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setName(currentUser?.name || ''); setEmail(currentUser?.email || ''); setPhone(currentUser?.phone || '');
  }, [currentUser?.name, currentUser?.email, currentUser?.phone]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(''); setSaved(false);
    const result = await updateProfile({ name, email, phone });
    if (result.success) setSaved(true); else setError(result.message || 'No se pudieron guardar los cambios.');
  }
  return <section className="max-w-2xl mx-auto bg-white rounded-3xl border border-border p-6 sm:p-8 space-y-6">
    <header><p className="text-sm font-semibold text-primary">Mi cuenta</p><h1 className="text-2xl font-bold mt-1">Mi perfil</h1><p className="text-ink-light text-sm mt-2">Mantén tus datos de contacto actualizados.</p></header>
    <form className="space-y-5" onSubmit={save} aria-label="Datos personales">
      <Input id="profile-name" label="Nombres y apellidos" autoComplete="name" required minLength={3} maxLength={120} value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} disabled={busy} />
      <Input id="profile-email" label="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} disabled={busy} />
      <Input id="profile-phone" label="Celular" type="tel" autoComplete="tel" required value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false); }} disabled={busy} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-700">Tus datos se guardaron correctamente.</p>}
      <Button type="submit" isLoading={busy}>Guardar cambios</Button>
    </form>
  </section>;
}
