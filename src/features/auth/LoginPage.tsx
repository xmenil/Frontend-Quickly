import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UserRole } from '../../domain/types';
import { Eye, EyeOff, User, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginDemo } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('cliente@quickly.pe');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Determine return path if redirected during checkout
  const from = (location.state as any)?.from || '/';

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const result = login(email);
      setIsLoading(false);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    }, 300);
  };

  const handleDemoAccess = (role: UserRole) => {
    loginDemo(role);
    if (role === 'comercio') navigate('/comercio/tienda');
    else if (role === 'repartidor') navigate('/repartidor/solicitudes');
    else if (role === 'admin') navigate('/admin/usuarios');
    else navigate(from || '/');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-ink">Iniciar Sesión</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ingresa tus credenciales o usa un acceso de demostración rápido
        </p>
      </div>

      {/* 1-Click Demo Logins */}
      <div className="bg-primary-light/60 p-4 rounded-2xl border border-primary-200">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-2.5">
          <Sparkles className="w-4 h-4" />
          <span>Acceso Rápido de Demostración (1 Clic)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleDemoAccess('cliente')}
            className="p-2.5 bg-white hover:bg-gray-50 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between shadow-subtle transition-transform active:scale-95"
          >
            <span>👤 Cliente Demo</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          </button>
          <button
            type="button"
            onClick={() => handleDemoAccess('comercio')}
            className="p-2.5 bg-white hover:bg-gray-50 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between shadow-subtle transition-transform active:scale-95"
          >
            <span>🏪 Comercio</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </button>
          <button
            type="button"
            onClick={() => handleDemoAccess('repartidor')}
            className="p-2.5 bg-white hover:bg-gray-50 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between shadow-subtle transition-transform active:scale-95"
          >
            <span>🛵 Repartidor</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
          </button>
          <button
            type="button"
            onClick={() => handleDemoAccess('admin')}
            className="p-2.5 bg-white hover:bg-gray-50 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between shadow-subtle transition-transform active:scale-95"
          >
            <span>🛡️ Administrador</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-white px-3 text-xs text-gray-400 font-semibold uppercase">O ingresa manual</span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Manual Form */}
      <form onSubmit={handleStandardLogin} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ejemplo@quickly.pe"
          required
          leftIcon={<User className="w-4 h-4" />}
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="touch-target p-1 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary" />
            <span>Recordar sesión</span>
          </label>
          <Link to="/recuperar-acceso" className="font-semibold text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Entrar a Quickly
        </Button>
      </form>

      {/* Registration Links */}
      <div className="pt-4 border-t border-gray-100 text-center space-y-2 text-xs text-gray-600">
        <p>
          ¿No tienes cuenta de cliente?{' '}
          <Link to="/registro" className="font-bold text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
        <div className="flex justify-center gap-3 pt-1 text-[11px] text-gray-500">
          <Link to="/registro/comercio" className="hover:text-primary underline">
            Afiliar mi negocio
          </Link>
          <span>•</span>
          <Link to="/registro/repartidor" className="hover:text-primary underline">
            Quiero ser repartidor
          </Link>
        </div>
      </div>
    </div>
  );
};
