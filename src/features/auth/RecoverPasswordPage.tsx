import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, CheckCircle2, ArrowLeft, ShieldAlert, Compass, Sparkles } from 'lucide-react';

export const RecoverPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('cliente@quickly.pe');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-1">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary transition-colors touch-target py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Volver al inicio de sesión</span>
        </Link>
        <span className="text-[11px] font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
          Soporte Quickly
        </span>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-ink">Recuperar Acceso</h1>
        <p className="text-xs sm:text-sm text-ink-light max-w-sm mx-auto leading-relaxed">
          Ingresa tu correo o celular registrado para recibir un enlace de restablecimiento seguro
        </p>
      </div>

      {sent ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-subtle">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-emerald-950">Instrucciones enviadas</h2>
          <p className="text-xs text-emerald-900 leading-relaxed max-w-xs mx-auto">
            Hemos generado el enlace de recuperación para <strong>{email}</strong>. En este prototipo demostrativo, tu contraseña temporal es <strong>123456</strong>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login">
              <Button variant="primary" size="md" className="w-full">
                Ir a Iniciar Sesión con clave temporal
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors py-1"
            >
              Probar con otro correo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico o teléfono registrado"
            type="text"
            placeholder="ejemplo@quickly.pe o 962 123 456"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
            helperText="Te enviaremos un código de verificación vía WhatsApp o correo"
          />

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-600">Demo rápido:</span>
            <button
              type="button"
              onClick={() => setEmail('cliente@quickly.pe')}
              className="font-bold text-primary hover:underline"
            >
              Usar correo demo tingalés
            </button>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Enviar Instrucciones de Recuperación
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Recordaste tu contraseña?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
};

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4 shadow-subtle">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-ink mb-2">Área Restringida</h1>
      <p className="text-xs sm:text-sm text-ink-light max-w-md mb-6 leading-relaxed">
        No tienes los permisos asignados para visualizar este módulo con tu perfil actual en Quickly Tingo María.
        Puedes cambiar a un perfil con permisos adecuados desde el selector demo flotante.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/login">
          <Button variant="primary" size="md">
            Cambiar de Perfil o Iniciar Sesión
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" size="md">
            Volver a la Portada
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 border border-primary-200 text-primary flex items-center justify-center mb-4 font-black text-3xl shadow-subtle">
        404
      </div>
      <h1 className="text-2xl font-extrabold text-ink mb-2">Página No Encontrada</h1>
      <p className="text-xs sm:text-sm text-ink-light max-w-md mb-6 leading-relaxed">
        La ruta a la que intentas acceder no existe en el catálogo ni en los módulos de Quickly Tingo María.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/">
          <Button variant="primary" size="md">
            Explorar Negocios y Productos
          </Button>
        </Link>
        <Link to="/negocios">
          <Button variant="outline" size="md">
            Ver Comercios Locales
          </Button>
        </Link>
      </div>
    </div>
  );
};

