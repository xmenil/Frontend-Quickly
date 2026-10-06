import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Bike, Clock } from 'lucide-react';

export const RegisterCourierPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('962 ');
  const [vehicleType, setVehicleType] = useState<'moto' | 'mototaxi' | 'bicicleta'>('moto');
  const [plate, setPlate] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-ink">Ser Repartidor Quickly</h1>
        <p className="text-sm text-gray-500 mt-1">
          Genera ingresos repartiendo pedidos en Tingo María con tus propios horarios
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-6 bg-primary-50 border border-primary-200 rounded-2xl text-center space-y-3">
          <Clock className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-base font-bold text-ink">Solicitud en Revisión</h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            Tu postulación como repartidor en <strong>{vehicleType}</strong> ha sido registrada y está{' '}
            <span className="font-semibold text-primary">pendiente de aprobación</span> por la administración de Quickly.
          </p>
          <div className="p-3 bg-white/90 rounded-xl border border-primary-100 text-xs text-gray-600">
            💡 Puedes ir al panel de <strong>Admin</strong> para aprobar la cuenta de repartidor de prueba.
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full mt-2"
            onClick={() => navigate('/admin/usuarios')}
          >
            Ver en Panel Admin
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombres y Apellidos"
            placeholder="Ej: Juan Carlos Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<Bike className="w-4 h-4" />}
          />
          <Input
            label="Teléfono / WhatsApp"
            placeholder="962 444 888"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Select
            label="Tipo de Vehículo"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as any)}
          >
            <option value="moto">Motocicleta lineal</option>
            <option value="mototaxi">Mototaxi (Bajaj / Torito)</option>
            <option value="bicicleta">Bicicleta</option>
          </Select>
          <Input
            label="Placa de rodaje (si aplica)"
            placeholder="Ej: 5412-8B"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Enviar Solicitud de Repartidor
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Ya eres repartidor activo?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
};
