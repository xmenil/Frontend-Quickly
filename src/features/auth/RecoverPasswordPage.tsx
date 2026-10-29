import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, CheckCircle2, ArrowLeft, ShieldAlert, Compass, Sparkles } from 'lucide-react';

export const RecoverPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(false);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-subtle p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-1">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-light hover:text-primary transition-colors touch-target py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Volver al inicio de sesión</span>
        </Link>
        <span className="text-[11px] font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-light">
          Soporte Quickly
        </span>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-ink">Recuperar Acceso</h1>
        <p className="text-xs sm:text-sm text-ink-light max-w-sm mx-auto leading-relaxed">
          Ingresa tu correo o celular registrado para recibir un enlace de restablecimiento seguro
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico o teléfono registrado"
            type="text"
            placeholder="ejemplo@quickly.pe o 962 123 456"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
            helperText="Este servicio está pendiente de habilitación."
          />

          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">La recuperación de contraseña todavía no está disponible. No se ha enviado ningún enlace ni generado una contraseña temporal.</p>

          <Button type="submit" disabled variant="primary" size="lg" className="w-full">
            Enviar Instrucciones de Recuperación
          </Button>
        </form>

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
        Accede con una cuenta que tenga los permisos asignados por la administración.
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

