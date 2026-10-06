import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../domain/types';
import {
  ShieldAlert,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginGoogle, loginDemo } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from checkout or high-level operation
  const from = (location.state as any)?.from || '/';
  const redirectMessage = (location.state as any)?.message;

  const [identifier, setIdentifier] = useState('nilver.valdivia@gmail.com');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoRoles, setShowDemoRoles] = useState(false);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor ingresa tu e-mail o teléfono.');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const result = login(identifier);
      setIsLoading(false);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    }, 400);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginGoogle();
      setIsLoading(false);
      navigate(from, { replace: true });
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
    <div className="space-y-6 max-w-md mx-auto">
      {redirectMessage && (
        <div className="p-3.5 rounded-2xl bg-pink-50 border border-primary-200 text-xs text-primary font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-primary" />
          <span>{redirectMessage}</span>
        </div>
      )}

      {/* Main ML Card matching Capture 4 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-snug">
            Ingresa tu e-mail o teléfono para iniciar sesión
          </h1>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              E-mail o teléfono
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ejemplo@correo.com o 962 123 456"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sm transition-all active:scale-98 disabled:opacity-70"
          >
            {isLoading ? 'Verificando...' : 'Continuar'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/registro"
            state={{ from }}
            className="text-xs font-bold text-primary hover:underline"
          >
            Crear cuenta
          </Link>
        </div>

        {/* Divider matching Capture 4 */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-xs text-gray-400 font-normal">o</span>
        </div>

        {/* Google Sign-in Button matching Capture 4 */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-ink text-xs sm:text-sm font-bold shadow-subtle transition-all active:scale-98 flex items-center justify-center gap-3"
        >
          {/* Official Google multi-color SVG icon */}
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Iniciar sesión con Google</span>
        </button>
      </div>

      {/* Security note matching Capture 4 */}
      <div className="space-y-3">
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-subtle flex items-center justify-between text-xs text-gray-700 hover:border-gray-300 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Tengo un problema de seguridad</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        <div className="text-center text-xs text-gray-500">
          <Link to="/recuperar-acceso" className="hover:underline">
            Necesito ayuda
          </Link>
        </div>
      </div>

      {/* Quick Demo Access Accordion */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => setShowDemoRoles(!showDemoRoles)}
          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{showDemoRoles ? 'Ocultar roles demo' : 'Ver accesos rápidos demo (1 clic)'}</span>
        </button>

        {showDemoRoles && (
          <div className="mt-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-subtle grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoAccess('cliente')}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between"
            >
              <span>👤 Cliente Demo</span>
              <CheckCircle2 className="w-3 h-3 text-primary" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccess('comercio')}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between"
            >
              <span>🏪 Comercio</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccess('repartidor')}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between"
            >
              <span>🛵 Repartidor</span>
              <CheckCircle2 className="w-3 h-3 text-purple-600" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccess('admin')}
              className="p-2 bg-gray-50 hover:bg-gray-100 text-ink rounded-xl font-bold border border-gray-200 flex items-center justify-between"
            >
              <span>🛡️ Admin</span>
              <CheckCircle2 className="w-3 h-3 text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
