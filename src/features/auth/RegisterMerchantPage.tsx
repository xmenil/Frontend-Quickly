import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Store, CheckCircle2, Clock } from 'lucide-react';
import { MerchantCategory } from '../../domain/types';

export const RegisterMerchantPage: React.FC = () => {
  const { zones } = useDataStore();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [category, setCategory] = useState<MerchantCategory>('restaurantes');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('962 ');
  const [zoneId, setZoneId] = useState(zones[0]?.id || 'z_centro');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-ink">Afiliar mi Negocio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Únete a la red comercial de Quickly en Tingo María y recibe pedidos en línea
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-subtle">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-amber-950">Solicitud Enviada con Éxito</h2>
          <p className="text-xs text-amber-900 leading-relaxed max-w-xs mx-auto">
            Tu negocio <strong>{businessName}</strong> ha quedado registrado como{' '}
            <span className="font-semibold text-amber-950">pendiente de aprobación</span> por la administración de Quickly Tingo María.
          </p>
          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-gray-700 flex items-start gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              En este prototipo interactivo, puedes cambiar al rol de <strong>Admin</strong> desde el menú flotante para aprobar tu negocio al instante.
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            className="w-full mt-2"
            onClick={() => navigate('/admin/usuarios')}
          >
            Ir al Panel Admin para Aprobar Solicitud
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Comercial del Negocio"
            placeholder="Ej: Juguería La Bella Durmiente"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            leftIcon={<Store className="w-4 h-4" />}
          />
          <Input
            label="Nombre del Representante"
            placeholder="Ej: Carmen Gómez"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />
          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value as MerchantCategory)}
          >
            <option value="restaurantes">Restaurantes y Comida</option>
            <option value="farmacias">Farmacias y Salud</option>
            <option value="bodegas">Bodegas y Minimarkets</option>
            <option value="ropa">Ropa y Calzado</option>
            <option value="emprendedores">Emprendimientos Locales</option>
          </Select>
          <Input
            label="Dirección del local físico"
            placeholder="Ej: Av. Alameda Perú 520"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <Select
            label="Zona de ubicación"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </Select>
          <Input
            label="Teléfono / WhatsApp de atención"
            placeholder="962 123 456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="lg" className="w-full">
            Enviar Solicitud de Comercio
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
        ¿Ya tienes negocio afiliado?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Acceder a mi panel
        </Link>
      </div>
    </div>
  );
};
