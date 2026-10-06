import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';

export const RegisterCustomerPage: React.FC = () => {
  const { registerCustomer, loginGoogle } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from || '/';

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('962 123 456');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allowContact, setAllowContact] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      registerCustomer({
        name: name || 'Nilver Valdivia',
        email: email || 'cliente@quickly.pe',
        phone: `+51 ${phone}`,
      });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 900);
    }, 400);
  };

  const handleGoogleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginGoogle();
      setIsLoading(false);
      navigate(from, { replace: true });
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Title matching Capture 5 */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
          Crea tu cuenta y compra con envíos gratis
        </h1>
      </div>

      {isSuccess ? (
        <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-card text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-extrabold text-ink">¡Cuenta creada con éxito!</h2>
          <p className="text-xs text-gray-500">
            Bienvenido a Quickly. Redirigiendo a tu compra...
          </p>
        </div>
      ) : (
        /* Card matching Capture 5 */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 space-y-5">
          {/* Button: Registrarse con Google */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-ink text-xs sm:text-sm font-bold shadow-subtle transition-all active:scale-98 flex items-center justify-center gap-3"
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
            <span>Registrarse con Google</span>
          </button>

          {/* Divider matching Capture 5 */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-xs text-gray-400 font-normal">
              O ingresa tu e-mail
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle"
              />
            </div>

            {/* Teléfono with Flag */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
              <div className="flex rounded-xl border border-gray-200 shadow-subtle overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 flex items-center gap-1.5 text-xs font-bold text-ink flex-shrink-0 select-none">
                  <span>🇵🇪</span>
                  <span>+51</span>
                  <span className="text-gray-400 text-[10px]">▼</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="962 123 456"
                  required
                  className="w-full px-3 py-2 text-sm text-ink placeholder-gray-400 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Nilver Valdivia"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-ink placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Ver u ocultar contraseña"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirement Bullets matching Capture 5 */}
              <div className="mt-2 space-y-1 text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span>Usa mínimo 8 caracteres.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 && /[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span>No uses secuencias como 123 ni caracteres repetidos como aaa.</span>
                </div>
              </div>
            </div>

            {/* Checkbox: Acepto contacto SMS & WhatsApp */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowContact}
                  onChange={(e) => setAllowContact(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Acepto que me contacten por SMS y WhatsApp.</span>
              </label>
            </div>

            {/* Legal terms text matching Capture 5 */}
            <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
              Al continuar, acepto los{' '}
              <span className="text-primary hover:underline cursor-pointer">
                Términos y condiciones
              </span>{' '}
              y autorizo el uso de mis datos de acuerdo a la{' '}
              <span className="text-primary hover:underline cursor-pointer">
                Declaración de privacidad
              </span>
              .
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-sm transition-all active:scale-98 disabled:opacity-70"
            >
              {isLoading ? 'Creando cuenta...' : 'Continuar'}
            </button>
          </form>

          <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              state={{ from }}
              className="font-bold text-primary hover:underline"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
