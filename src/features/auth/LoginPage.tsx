import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../domain/types';
import { BrandLogo } from '../../components/shared/BrandLogo';
import {
  UserCheck,
  Store,
  Bike,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Check,
} from 'lucide-react';

interface RoleOption {
  id: UserRole;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPath: string;
  demoUser: {
    name: string;
    identifier: string;
    detail: string;
    initials: string;
  };
  registerText?: string;
  registerLink?: string;
  submitLabel: string;
}

const ROLES: Record<UserRole, RoleOption> = {
  cliente: {
    id: 'cliente',
    label: 'Cliente',
    subtitle: 'Comida, botica y compras',
    icon: UserCheck,
    defaultPath: '/',
    demoUser: {
      name: 'Nilver Valdivia',
      identifier: 'cliente@quickly.pe',
      detail: 'Cliente frecuente • Zona Centro',
      initials: 'NV',
    },
    registerText: '¿Primera vez en Quickly? Crea tu cuenta gratis',
    registerLink: '/registro',
    submitLabel: 'Ingresar como Cliente',
  },
  comercio: {
    id: 'comercio',
    label: 'Comercio',
    subtitle: 'Restaurantes y tiendas',
    icon: Store,
    defaultPath: '/comercio/tienda',
    demoUser: {
      name: 'Marco Antonio',
      identifier: 'comercio@quickly.pe',
      detail: 'La Selva Gourmet • Menú amazónico',
      initials: 'SG',
    },
    registerText: '¿Tienes un negocio en Tingo María? Afiliar mi negocio',
    registerLink: '/registro/comercio',
    submitLabel: 'Ingresar al Panel de Comercio',
  },
  repartidor: {
    id: 'repartidor',
    label: 'Repartidor',
    subtitle: 'Despachos en moto o bici',
    icon: Bike,
    defaultPath: '/repartidor/solicitudes',
    demoUser: {
      name: 'Carlos Ramos',
      identifier: 'repartidor@quickly.pe',
      detail: 'Repartidor activo • Moto 125cc',
      initials: 'CR',
    },
    registerText: '¿Tienes moto o bici? Postula como repartidor',
    registerLink: '/registro/repartidor',
    submitLabel: 'Ingresar como Repartidor',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    subtitle: 'Control y supervisión',
    icon: ShieldCheck,
    defaultPath: '/admin/resumen',
    demoUser: {
      name: 'Administradora Quickly',
      identifier: 'admin@quickly.pe',
      detail: 'Operaciones central Tingo María',
      initials: 'AQ',
    },
    registerText: 'Acceso reservado para el equipo administrativo de Quickly.',
    registerLink: undefined,
    submitLabel: 'Ingresar como Administrador',
  },
};

export const LoginPage: React.FC = () => {
  const { login, loginGoogle, loginDemo, activeRole: storeActiveRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || '/';
  const redirectMessage = (location.state as any)?.message;

  const [selectedRole, setSelectedRole] = useState<UserRole>(storeActiveRole || 'cliente');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const currentRole = ROLES[selectedRole];

  useEffect(() => {
    setIdentifier(currentRole.demoUser.identifier);
    setError(null);
  }, [selectedRole]);

  const isPhone = /^\+?[\d\s-]{8,15}$/.test(identifier.trim());

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Por favor ingresa tu correo electrónico o teléfono celular.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Verificando acceso...');

    setTimeout(() => {
      const result = login(identifier, selectedRole);
      setIsLoading(false);
      setLoadingMessage(null);

      if (result.success) {
        const targetPath =
          selectedRole === 'cliente'
            ? from !== '/login' ? from : '/'
            : currentRole.defaultPath;

        navigate(targetPath, { replace: true });
      } else {
        setError(result.message || 'Credenciales no válidas. Por favor verifica los datos.');
      }
    }, 400);
  };

  const handleInstantDemoLogin = () => {
    setIsLoading(true);
    setLoadingMessage(`Iniciando sesión como ${currentRole.demoUser.name}...`);
    setError(null);

    setTimeout(() => {
      loginDemo(selectedRole);
      setIsLoading(false);
      setLoadingMessage(null);

      const targetPath =
        selectedRole === 'cliente'
          ? from !== '/login' ? from : '/'
          : currentRole.defaultPath;

      navigate(targetPath, { replace: true });
    }, 350);
  };

  const handleAutofill = () => {
    setIdentifier(currentRole.demoUser.identifier);
    setPassword('123456');
    setError(null);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setLoadingMessage('Conectando con tu cuenta de Google...');
    setTimeout(() => {
      loginGoogle();
      setIsLoading(false);
      setLoadingMessage(null);
      navigate(from !== '/login' ? from : '/', { replace: true });
    }, 400);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
      {redirectMessage && (
        <div className="p-3.5 rounded-2xl bg-primary-50 border border-primary-200 text-xs text-primary font-semibold flex items-center gap-2.5 shadow-subtle">
          <Sparkles className="w-4 h-4 flex-shrink-0 text-primary" />
          <span>{redirectMessage}</span>
        </div>
      )}

      {/* Main Friendly Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
        
        {/* Brand and Welcoming Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center mb-1" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-xs sm:text-sm text-ink-light max-w-sm mx-auto">
            Elige tu perfil para continuar en Quickly Tingo María
          </p>
        </div>

        {/* 1. ROOMY & FRIENDLY 4-ROLE SELECTOR */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-ink">
            ¿Cómo deseas ingresar hoy?
          </label>
          <div
            role="tablist"
            aria-label="Perfil de usuario"
            className="grid grid-cols-2 gap-2"
          >
            {(Object.keys(ROLES) as UserRole[]).map((roleKey) => {
              const roleItem = ROLES[roleKey];
              const isSelected = selectedRole === roleKey;
              const IconComp = roleItem.icon;

              return (
                <button
                  key={roleKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedRole(roleKey)}
                  className={`min-h-[56px] p-3 rounded-2xl border text-left transition-all flex items-center gap-3 select-none active:scale-98 touch-target ${
                    isSelected
                      ? 'bg-primary-50/70 border-primary text-ink shadow-subtle ring-2 ring-primary/20'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-ink-light'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-ink'}`}>
                        {roleItem.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 stroke-[3]" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 block truncate">
                      {roleItem.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SUBTLE & FRIENDLY DEMO HELPER PILL */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-primary font-extrabold flex items-center justify-center text-xs flex-shrink-0 shadow-subtle">
              {currentRole.demoUser.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ink truncate">
                  {currentRole.demoUser.name}
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/90 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  Demo
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutofill}
                className="text-[11px] text-gray-500 hover:text-primary transition-colors text-left truncate block"
              >
                Autocompletar formulario
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={isLoading}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60 flex-shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Entrar en 1 clic</span>
          </button>
        </div>

        {/* Error banner if present */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* 3. CLEAN CREDENTIALS FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* Identifier Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login_identifier" className="block text-xs font-bold text-ink">
                Correo o teléfono celular
              </label>
              {isPhone && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Celular tingalés
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
                {isPhone ? <Phone className="w-4 h-4 text-emerald-600" /> : <Mail className="w-4 h-4" />}
              </div>
              <input
                id="login_identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ejemplo@correo.com o 962 123 456"
                required
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle"
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
                className="text-xs font-bold text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl border border-gray-300 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-3.5 text-gray-400 hover:text-ink transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me option */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label
              htmlFor="remember_me"
              className="text-xs text-ink-light font-medium select-none cursor-pointer"
            >
              Recordar mi cuenta en este equipo
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sm transition-all active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingMessage || 'Ingresando...'}</span>
              </>
            ) : (
              <>
                <span>{currentRole.submitLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google sign-in (only for cliente) */}
        {selectedRole === 'cliente' && (
          <div className="space-y-3 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-xs text-gray-500 font-normal">
                o continuar con
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-ink text-xs sm:text-sm font-bold shadow-subtle transition-all active:scale-98 flex items-center justify-center gap-3"
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
          </div>
        )}

        {/* Contextual Register Link */}
        <div className="pt-2 text-center text-xs">
          {currentRole.registerLink ? (
            <p className="text-ink-light">
              <Link
                to={currentRole.registerLink}
                state={{ from }}
                className="font-bold text-primary hover:underline"
              >
                {currentRole.registerText}
              </Link>
            </p>
          ) : (
            <p className="text-gray-500 text-[11px]">
              {currentRole.registerText}
            </p>
          )}
        </div>

        {/* Guest access option */}
        <div className="pt-2 border-t border-gray-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <span>Explorar tiendas y menú como invitado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
