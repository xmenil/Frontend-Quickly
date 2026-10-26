import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/demoAuthStore';
import { UserRole } from '../../domain/types';
import { Dialog } from '../../components/ui/Dialog';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Shield,
  Clock,
  ShieldAlert,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface DemoAccount {
  role: UserRole;
  title: string;
  sublabel: string;
  identifier: string;
  passwordDefault: string;
  targetPath: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'cliente',
    title: 'Cliente',
    sublabel: 'Consumidor',
    identifier: 'cliente@quickly.pe',
    passwordDefault: '123456',
    targetPath: '/',
  },
  {
    role: 'comercio',
    title: 'El Balcón',
    sublabel: 'Importaciones El Balcón',
    identifier: 'elbalcon@quickly.pe',
    passwordDefault: '123456',
    targetPath: '/comercio/productos',
  },
  {
    role: 'comercio',
    title: 'La Selva',
    sublabel: 'Restaurante Gourmet',
    identifier: 'comercio@quickly.pe',
    passwordDefault: '123456',
    targetPath: '/comercio/productos',
  },
  {
    role: 'repartidor',
    title: 'Repartidor',
    sublabel: 'Moto en Tingo María',
    identifier: 'repartidor@quickly.pe',
    passwordDefault: '123456',
    targetPath: '/repartidor/solicitudes',
  },
  {
    role: 'admin',
    title: 'Admin',
    sublabel: 'Gestión central',
    identifier: 'admin@quickly.pe',
    passwordDefault: '123456',
    targetPath: '/admin/resumen',
  },
];

export const LoginPage: React.FC = () => {
  const { login, loginGoogle } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || '/';
  const redirectMessage = (location.state as any)?.message;

  // Clean initial state (Heuristic #5: Error Prevention & Jakob's Law)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showDemoSection, setShowDemoSection] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // Status modal for pending/suspended accounts
  const [statusModal, setStatusModal] = useState<{
    type: 'pendiente' | 'suspendido';
    title: string;
    message: string;
  } | null>(null);

  // Auto-detect Peruvian mobile number (tolerant: spaces, dashes, +51)
  const cleanDigits = identifier.replace(/\D/g, '');
  const isPhone = cleanDigits.length === 9 && cleanDigits.startsWith('9');

  const handleQuickDemoLogin = (acc: DemoAccount) => {
    setIdentifier(acc.identifier);
    setPassword(acc.passwordDefault);
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Ingresando como ${acc.title}...`);

    setTimeout(() => {
      login(acc.identifier, acc.role);
      setIsLoading(false);
      setLoadingMessage(null);
      const destination = acc.role === 'cliente' ? (from !== '/login' ? from : '/') : acc.targetPath;
      navigate(destination, { replace: true });
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Ingresa tu celular o correo electrónico.');
      return;
    }
    if (!password.trim()) {
      setError('Ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Verificando credenciales...');

    setTimeout(() => {
      // Determine probable role if using known demo email or default to cliente
      const matchedDemo = DEMO_ACCOUNTS.find(
        (a) => a.identifier.toLowerCase() === identifier.trim().toLowerCase()
      );
      const roleHint = matchedDemo ? matchedDemo.role : 'cliente';

      const result = login(identifier, roleHint);
      setIsLoading(false);
      setLoadingMessage(null);

      if (result.success) {
        const destination =
          result.user?.role === 'cliente'
            ? from !== '/login' ? from : '/'
            : DEMO_ACCOUNTS.find((a) => a.role === result.user?.role)?.targetPath || '/';

        navigate(destination, { replace: true });
      } else {
        if (result.message?.includes('pendiente')) {
          setStatusModal({
            type: 'pendiente',
            title: 'Cuenta en revisión',
            message:
              'Tu registro se encuentra en proceso de validación por el equipo de Quickly en Tingo María.',
          });
        } else if (result.message?.includes('suspendid')) {
          setStatusModal({
            type: 'suspendido',
            title: 'Cuenta suspendida',
            message:
              'Esta cuenta se encuentra inactiva temporalmente. Comunícate con soporte de Quickly.',
          });
        } else {
          setError(result.message || 'Credenciales no válidas. Revisa los datos ingresados.');
        }
      }
    }, 400);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setLoadingMessage('Conectando con Google...');
    setTimeout(() => {
      loginGoogle();
      setIsLoading(false);
      setLoadingMessage(null);
      navigate(from !== '/login' ? from : '/', { replace: true });
    }, 350);
  };

  return (
    <div className="space-y-4">
      {/* Optional Notification banner if redirected from protected route */}
      {redirectMessage && (
        <div className="p-3.5 rounded-2xl bg-primary-50 border border-primary/20 text-xs text-primary font-semibold flex items-center gap-2.5 shadow-subtle animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary" />
          <span>{redirectMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
        {/* Header - Gestalt Focal Point */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-[26px] font-bold text-ink tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-xs sm:text-sm text-ink-light">
            Ingresa a tu cuenta para pedir o gestionar entregas en Tingo María
          </p>
        </div>

        {/* 1-Tap Google Login First (Jakob's Law for Mobile Deliveries) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full min-h-[46px] h-12 py-2.5 px-4 rounded-xl bg-surface border border-field hover:bg-surface-subtle text-ink text-xs sm:text-sm font-semibold shadow-subtle transition-all active:scale-[0.99] flex items-center justify-center gap-3 touch-target"
        >
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
          <span>Continuar con Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 select-none my-1" aria-hidden="true">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-ink-muted font-medium shrink-0">
            o con tu celular o correo
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-destructive-soft border border-destructive-border text-xs text-destructive-strong font-semibold flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User / Phone / Email Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login_identifier" className="block text-xs font-bold text-ink">
                Celular o correo electrónico
              </label>
              {isPhone && (
                <span className="text-[11px] font-medium text-selva flex items-center gap-1">
                  🇵🇪 Celular detectado
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
                {isPhone ? <Phone className="w-4 h-4 text-selva" /> : <Mail className="w-4 h-4 text-ink-muted" />}
              </div>
              <input
                id="login_identifier"
                type={isPhone ? 'tel' : 'text'}
                inputMode={/^\d+$/.test(cleanDigits) && cleanDigits.length > 2 ? 'tel' : 'email'}
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ej. 962 123 456 o cliente@quickly.pe"
                required
                className={`w-full min-h-[46px] h-11 pl-10 pr-4 py-2.5 rounded-xl border text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle ${
                  error ? 'border-destructive bg-destructive-soft/10' : 'border-field bg-surface'
                }`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login_password" className="block text-xs font-bold text-ink">
                Contraseña
              </label>
              <Link
                to="/recuperar-acceso"
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                required
                className={`w-full min-h-[46px] h-11 pl-10 pr-12 py-2.5 rounded-xl border text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle tracking-wider ${
                  error ? 'border-destructive bg-destructive-soft/10' : 'border-field bg-surface'
                }`}
              />
              {/* 44x44 px touch target for mobile thumb (Fitts's Law) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-1 w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded-lg touch-target"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-field text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label
              htmlFor="remember_me"
              className="text-xs text-ink-light font-medium select-none cursor-pointer"
            >
              Recordar sesión en este equipo
            </label>
          </div>

          {/* Primary Action Button (Single solid prominent button) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] h-12 py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-subtle transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 touch-target"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingMessage || 'Ingresando...'}</span>
              </>
            ) : (
              <span>Iniciar sesión</span>
            )}
          </button>
        </form>

        {/* Create Account Link (Jakob's Law: placed naturally at the end of auth options) */}
        <div className="pt-2 text-center text-xs sm:text-sm text-ink-light border-t border-border">
          ¿Aún no tienes una cuenta en Quickly?{' '}
          <Link
            to="/registro"
            state={{ from }}
            className="font-bold text-primary hover:text-primary-hover hover:underline ml-1 inline-block py-1"
          >
            Crear cuenta gratis
          </Link>
        </div>

        {/* Demo Accounts Utility (Secondary discrete drawer, doesn't confuse real buyers) */}
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowDemoSection(!showDemoSection)}
            className="w-full flex items-center justify-between text-xs text-ink-muted hover:text-ink py-1 px-1 transition-colors select-none"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Accesos rápidos de prueba (Demo local)</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showDemoSection ? 'rotate-180 text-primary' : ''
              }`}
            />
          </button>

          {showDemoSection && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
              <p className="text-[11px] text-ink-muted">
                Haz clic en cualquier rol para ingresar automáticamente sin escribir contraseña:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.identifier}
                    type="button"
                    onClick={() => handleQuickDemoLogin(acc)}
                    className="py-2 px-2.5 rounded-xl border border-border hover:border-primary/50 bg-surface-subtle hover:bg-primary-50 text-center transition-all select-none active:scale-95 touch-target min-h-[44px]"
                  >
                    <span className="block text-xs font-bold text-ink">
                      {acc.title}
                    </span>
                    <span className="block text-[10px] text-ink-muted truncate">
                      {acc.sublabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Support & Security Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs text-ink-light">
        <Link
          to="/cliente/ayuda"
          className="inline-flex items-center gap-1.5 hover:text-ink transition-colors py-1"
        >
          <Shield className="w-3.5 h-3.5 text-ink-muted" />
          <span>Seguridad y privacidad</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-semibold text-ink-light hover:text-primary transition-colors py-1"
        >
          <span>Explorar catálogo como invitado</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Account Status Modal (Pending / Suspended) */}
      <Dialog
        isOpen={Boolean(statusModal)}
        onClose={() => setStatusModal(null)}
        title={statusModal?.title}
        maxWidth="sm"
      >
        {statusModal && (
          <div className="space-y-4 pt-1">
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 border ${
                statusModal.type === 'pendiente'
                  ? 'bg-warning-soft border-warning-border text-warning-strong'
                  : 'bg-destructive-soft border-destructive-border text-destructive-strong'
              }`}
            >
              {statusModal.type === 'pendiente' ? (
                <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-bold text-sm">
                  {statusModal.type === 'pendiente' ? 'Validación pendiente' : 'Acceso restringido'}
                </p>
                <p>{statusModal.message}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-border text-xs font-bold text-ink transition-colors touch-target min-h-[44px]"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

