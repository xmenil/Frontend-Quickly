import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, Lock, CheckCircle2 } from 'lucide-react';

export const RegisterCustomerPage: React.FC = () => {
  const { loginDemo } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('962 ');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      // In simulation mode, login as demo customer and redirect
      loginDemo('cliente');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-ink">Crear Cuenta de Cliente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pide tus platos favoritos y productos en Tingo María en minutos
        </p>
      </div>

      {isSuccess ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-emerald-900">¡Registro Exitoso!</h2>
          <p className="text-xs text-emerald-700">
            Tu cuenta simulada ha sido creada. Ingresando a Quickly...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombres y Apellidos"
            placeholder="Ej: Nilver Valdivia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tunombre@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Teléfono / WhatsApp"
            placeholder="962 123 456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Registrarme como Cliente
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
};
