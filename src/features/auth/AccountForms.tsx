import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { destinationForRole, safeReturnPath } from '../../services/api/profileAdapter';

export function RealLoginPage() {
  const { login, busy } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const result = await login(email, password);
    if (result.success) navigate(safeReturnPath(location.state?.from, destinationForRole(result.user?.role)), { replace: true });
    else setError(result.message || 'No se pudo iniciar sesión.');
  }
  return <section className="bg-white rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
    <div><h1 className="text-2xl font-bold">Iniciar sesión</h1><p className="text-sm text-ink-light mt-2">Ingresa a tu cuenta de Quickly.</p></div>
    <form onSubmit={submit} className="space-y-5" aria-label="Iniciar sesión">
      <Input id="login-email" label="Correo electrónico" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
      <Input id="login-password" label="Contraseña" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy}
        rightIcon={<button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)} className="text-xs px-1 min-h-11">{showPassword ? 'Ocultar' : 'Ver'}</button>} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" isLoading={busy} className="w-full">Ingresar</Button>
    </form>
    <p className="text-sm text-ink-light">¿Aún no tienes cuenta? <Link to="/registro" state={location.state} className="text-primary font-semibold">Crear cuenta</Link></p>
  </section>;
}

export function RealRegisterPage() {
  const { registerCustomer, busy } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const result = await registerCustomer({ name, email, phone, password });
    if (result.success) navigate(safeReturnPath(location.state?.from, '/cliente/perfil'), { replace: true });
    else setError(result.message || 'No se pudo crear tu cuenta.');
  }
  return <section className="bg-white rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
    <div><h1 className="text-2xl font-bold">Crear cuenta</h1><p className="text-sm text-ink-light mt-2">Regístrate para acceder a tu perfil de Quickly.</p></div>
    <form onSubmit={submit} className="space-y-4" aria-label="Crear cuenta">
      <Input id="register-name" label="Nombres y apellidos" autoComplete="name" minLength={3} maxLength={120} required value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
      <Input id="register-email" label="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
      <Input id="register-phone" label="Celular" type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} helperText="Puedes ingresar 9 dígitos o el número con +51." disabled={busy} />
      <Input id="register-password" label="Contraseña" type="password" autoComplete="new-password" minLength={6} maxLength={100} required value={password} onChange={(e) => setPassword(e.target.value)} helperText="Entre 6 y 100 caracteres." disabled={busy} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" isLoading={busy} className="w-full">Crear mi cuenta</Button>
    </form>
    <p className="text-sm text-ink-light">¿Ya tienes cuenta? <Link to="/login" state={location.state} className="text-primary font-semibold">Iniciar sesión</Link></p>
  </section>;
}
