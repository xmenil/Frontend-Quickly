import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, CheckCircle2 } from 'lucide-react';

export const RecoverPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-ink">Recuperar Acceso</h1>
        <p className="text-sm text-gray-500 mt-1">
          Simulación de restablecimiento de contraseña para demostración
        </p>
      </div>

      {sent ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-emerald-900">Enlace Simulado Generado</h2>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Se ha simulado el envío de un enlace de recuperación para <strong>{email}</strong>.
            En este prototipo frontend no se envían correos reales.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" size="md" className="w-full">
                Volver a Iniciar Sesión Demo
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico registrado"
            type="email"
            placeholder="ejemplo@quickly.pe"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Enviar Enlace de Recuperación
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Te acordaste de tu clave?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
};

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <span className="text-2xl">🚫</span>
      </div>
      <h1 className="text-2xl font-extrabold text-ink mb-2">Acceso Denegado</h1>
      <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
        No tienes los permisos asignados para visualizar este módulo con tu rol actual.
        Puedes cambiar de rol utilizando el panel flotante de demostración.
      </p>
      <Link to="/">
        <Button variant="primary" size="md">
          Volver a la Portada
        </Button>
      </Link>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-primary-light text-primary flex items-center justify-center mb-4 font-black text-3xl">
        404
      </div>
      <h1 className="text-2xl font-extrabold text-ink mb-2">Página No Encontrada</h1>
      <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
        La ruta a la que intentas acceder no existe en el catálogo ni en los módulos de Quickly Tingo María.
      </p>
      <Link to="/">
        <Button variant="primary" size="md">
          Explorar Negocios y Productos
        </Button>
      </Link>
    </div>
  );
};
