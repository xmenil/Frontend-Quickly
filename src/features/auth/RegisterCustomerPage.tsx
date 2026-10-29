import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { safeReturnPath } from '../../services/api/profileAdapter';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, CheckCircle2, Mail, Phone, Lock, User, Store, Bike, AlertCircle, RefreshCw } from 'lucide-react';
import { promptGoogleLogin } from '../../lib/googleAuth';
import { EmailVerificationModal } from '../../components/auth/EmailVerificationModal';
import { GoogleConfigModal } from '../../components/auth/GoogleConfigModal';

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
}

export const RegisterCustomerPage: React.FC = () => {
  const { registerCustomerWithApi, sendVerificationCode, loginGoogleWithToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = safeReturnPath((location.state as any)?.from, '/');

  // Clean initial state (Nielsen #5: Error Prevention - no prefilled dummy values)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allowContact, setAllowContact] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Email verification modal state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>(undefined);

  // Google setup modal state
  const [isGoogleConfigOpen, setIsGoogleConfigOpen] = useState(false);

  // Helper validation
  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};
    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 3) {
      newErrors.name = 'Ingresa tu nombre y apellido (al menos 3 letras).';
    }

    if (!cleanPhone) {
      newErrors.phone = 'Ingresa tu número de celular para coordinar la entrega.';
    } else if (cleanPhone.length !== 9 || !cleanPhone.startsWith('9')) {
      newErrors.phone = 'Ingresa un celular de 9 dígitos que empiece con 9 (ej. 962 123 456).';
    }

    if (!trimmedEmail) {
      newErrors.email = 'Ingresa tu correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Ingresa un correo electrónico válido (ej. tu@correo.pe).';
    }

    if (!password) {
      newErrors.password = 'Crea una contraseña para proteger tu cuenta.';
    } else if (password.length < 6 || password.length > 100) {
      newErrors.password = 'La contraseña debe tener entre 6 y 100 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    // Enviar código de verificación al correo para validar existencia
    const res = await sendVerificationCode(trimmedEmail);
    setIsLoading(false);

    if (!res.success) {
      if (res.message?.includes('Ya existe')) {
        setErrors((prev) => ({
          ...prev,
          email: 'Ya existe una cuenta con este correo. Inicia sesión en su lugar.',
        }));
      } else {
        setGeneralError(res.message || 'No se pudo enviar el código de verificación.');
      }
      return;
    }

    setDevCode(res.devCode);
    setIsVerificationModalOpen(true);
  };

  const handleVerifyCode = async (code: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const res = await registerCustomerWithApi({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: `+51 ${cleanPhone}`,
      password,
      verificationCode: code,
    });

    if (!res.success) {
      return { success: false, message: res.message || 'Código incorrecto o expirado.' };
    }

    setIsVerificationModalOpen(false);
    setIsSuccess(true);
    setTimeout(() => {
      navigate(from !== '/login' ? from : '/', { replace: true });
    }, 900);
    return { success: true };
  };

  const handleResendCode = async () => {
    return sendVerificationCode(email.trim().toLowerCase());
  };

  const handleGoogleRegister = () => {
    promptGoogleLogin(
      async (credential) => {
        setIsLoading(true);
        const cleanPhone = phone.replace(/\D/g, '');
        const res = await loginGoogleWithToken(credential, cleanPhone ? `+51${cleanPhone}` : undefined);
        setIsLoading(false);
        if (res.success) {
          navigate(from !== '/login' ? from : '/', { replace: true });
        } else {
          setGeneralError(res.message || 'No se pudo completar el registro con Google');
        }
      },
      () => {
        setIsGoogleConfigOpen(true);
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Friendly Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
        {/* Header - Gestalt Focal Point */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-[26px] font-bold text-ink tracking-tight">
            Crear cuenta
          </h1>
          <p className="text-xs sm:text-sm text-ink-light">
            Pide comida amazónica, botica y compras en Tingo María directo a tu puerta
          </p>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-selva-soft text-selva flex items-center justify-center mx-auto shadow-subtle border border-selva-border">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-ink">¡Cuenta creada con éxito!</h2>
            <p className="text-xs text-ink-light max-w-xs mx-auto leading-relaxed">
              Bienvenido a Quickly. Te estamos dirigiendo al catálogo de comercios en Tingo María...
            </p>
          </div>
        ) : (
          <>
            {/* 1. Google 1-Tap Quick Button (Jakob's Law: Mobile First Registration) */}
            <button
              type="button"
              onClick={handleGoogleRegister}
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
              <span>Registrarse con Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 select-none my-1" aria-hidden="true">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-ink-muted font-medium shrink-0">
                o completa tus datos
              </span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-destructive-soft border border-destructive-border text-xs text-destructive-strong font-semibold flex items-center gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Registration Form (Logical Order: Identity -> Phone -> Email -> Password) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Nombre completo */}
              <div className="space-y-1.5">
                <label htmlFor="reg_customer_name" className="block text-xs font-bold text-ink">
                  Nombre y apellido
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg_customer_name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Ej. Nilver Valdivia"
                    required
                    className={`w-full min-h-[46px] h-11 pl-10 pr-4 py-2.5 rounded-xl border text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle ${
                      errors.name ? 'border-destructive bg-destructive-soft/10' : 'border-field bg-surface'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* 2. Celular (WhatsApp para avisos de entrega) */}
              <div className="space-y-1.5">
                <label htmlFor="reg_customer_phone" className="block text-xs font-bold text-ink">
                  Celular (WhatsApp de entrega)
                </label>
                <div
                  className={`flex rounded-xl border shadow-subtle overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all ${
                    errors.phone ? 'border-destructive bg-destructive-soft/10' : 'border-field bg-surface'
                  }`}
                >
                  <div className="px-3.5 py-2.5 bg-surface-subtle border-r border-border flex items-center gap-1.5 text-xs font-bold text-ink flex-shrink-0 select-none">
                    <span className="text-base leading-none">🇵🇪</span>
                    <span>+51</span>
                  </div>
                  <input
                    id="reg_customer_phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="962 123 456"
                    required
                    className="w-full min-h-[46px] h-11 px-3.5 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none bg-transparent"
                  />
                </div>
                {errors.phone ? (
                  <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Te enviaremos el estado de tus pedidos y la ruta de tu repartidor por WhatsApp
                  </p>
                )}
              </div>

              {/* 3. Correo electrónico */}
              <div className="space-y-1.5">
                <label htmlFor="reg_customer_email" className="block text-xs font-bold text-ink">
                  Correo electrónico
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg_customer_email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="tu@correo.pe"
                    required
                    className={`w-full min-h-[46px] h-11 pl-10 pr-4 py-2.5 rounded-xl border text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle ${
                      errors.email ? 'border-destructive bg-destructive-soft/10' : 'border-field bg-surface'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* 4. Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg_customer_password" className="block text-xs font-bold text-ink">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-ink-muted">Mínimo 6 caracteres</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg_customer_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full min-h-[46px] h-11 pl-10 pr-12 py-2.5 rounded-xl border text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-subtle tracking-wider ${
                      errors.password ? 'border-destructive bg-destructive-soft/10' : 'border-field bg-surface'
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
                {errors.password && (
                  <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Checkbox: Notificaciones WhatsApp */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2.5 text-xs text-ink-light cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowContact}
                    onChange={(e) => setAllowContact(e.target.checked)}
                    className="mt-0.5 rounded border-field text-primary focus:ring-primary accent-primary cursor-pointer w-4 h-4 flex-shrink-0"
                  />
                  <span>Acepto recibir el estado de mis pedidos y promociones por WhatsApp o SMS.</span>
                </label>
              </div>

              {/* Legal terms disclaimer */}
              <p className="text-[11px] text-ink-muted leading-relaxed pt-1">
                Al continuar, aceptas nuestros{' '}
                <Link to="/cliente/ayuda" className="text-primary font-semibold hover:underline">
                  Términos y condiciones
                </Link>{' '}
                y autorizas el uso de tus datos conforme a la{' '}
                <Link to="/cliente/ayuda" className="text-primary font-semibold hover:underline">
                  Declaración de privacidad
                </Link>
                .
              </p>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] h-12 py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-subtle transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 touch-target"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando tu cuenta...</span>
                  </>
                ) : (
                  <span>Crear cuenta y comenzar</span>
                )}
              </button>
            </form>

            {/* Iniciar Sesión Link (Gestalt: Proximity with end of form) */}
            <div className="pt-2 text-center text-xs sm:text-sm text-ink-light border-t border-border">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link
                to="/login"
                state={{ from }}
                className="font-bold text-primary hover:text-primary-hover hover:underline ml-1 inline-block py-1"
              >
                Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Alternative merchant & courier enrollment (Discrete secondary navigation) */}
      <div className="bg-surface-subtle rounded-2xl border border-border p-4 text-center text-xs text-ink-light space-y-2">
        <p className="font-semibold text-ink">¿Tienes un negocio o moto en Tingo María?</p>
        <div className="flex items-center justify-center gap-4 text-xs font-bold text-primary">
          <Link
            to="/registro/comercio"
            className="hover:underline inline-flex items-center gap-1.5 hover:text-primary-hover py-1"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Afiliar mi comercio</span>
          </Link>
          <span className="text-border">•</span>
          <Link
            to="/registro/repartidor"
            className="hover:underline inline-flex items-center gap-1.5 hover:text-primary-hover py-1"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Ser repartidor</span>
          </Link>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isVerificationModalOpen}
        email={email}
        devCode={devCode}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerify={handleVerifyCode}
        onResend={handleResendCode}
        onEditEmail={() => setIsVerificationModalOpen(false)}
      />

      {/* Google Setup Guide Modal */}
      <GoogleConfigModal
        isOpen={isGoogleConfigOpen}
        onClose={() => setIsGoogleConfigOpen(false)}
      />
    </div>
  );
};

