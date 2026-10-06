import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, User, Mail, Phone } from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Mi Perfil</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Gestiona tus datos personales y número de contacto en Tingo María
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Perfil actualizado correctamente en la simulación.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombres y Apellidos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            leftIcon={<User className="w-4 h-4" />}
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Teléfono / WhatsApp de contacto"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
