import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { MerchantCategory } from '../../domain/types';
import { formatCents, solesToCents } from '../../lib/currency';
import { CheckCircle2, Store, Clock, Bike, MapPin } from 'lucide-react';

export const MerchantStorePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, updateMerchantProfile, zones } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  const [name, setName] = useState(currentMerchant.name);
  const [description, setDescription] = useState(currentMerchant.description);
  const [category, setCategory] = useState<MerchantCategory>(currentMerchant.category);
  const [address, setAddress] = useState(currentMerchant.address);
  const [phone, setPhone] = useState(currentMerchant.phone);
  const [schedule, setSchedule] = useState(currentMerchant.schedule);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(currentMerchant.prepTimeMinutes.toString());
  const [deliveryFeeSoles, setDeliveryFeeSoles] = useState(
    (currentMerchant.deliveryFeeCents / 100).toFixed(2)
  );
  const [minOrderSoles, setMinOrderSoles] = useState(
    (currentMerchant.minOrderCents / 100).toFixed(2)
  );
  const [logoUrl, setLogoUrl] = useState(currentMerchant.logoUrl);
  const [bannerUrl, setBannerUrl] = useState(currentMerchant.bannerUrl);
  const [isOpen, setIsOpen] = useState(currentMerchant.isOpen);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMerchantProfile(currentMerchant.id, {
      name,
      description,
      category,
      address,
      phone,
      schedule,
      prepTimeMinutes: parseInt(prepTimeMinutes) || 20,
      deliveryFeeCents: solesToCents(parseFloat(deliveryFeeSoles) || 5),
      minOrderCents: solesToCents(parseFloat(minOrderSoles) || 15),
      logoUrl,
      bannerUrl,
      isOpen,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Perfil de Mi Tienda</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Personaliza los datos públicos, horarios y tiempos de preparación de tu local
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {saved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Perfil comercial guardado y reflejado en el catálogo de Tingo María.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner & Logo Preview */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              Previsualización de Portada y Logo
            </label>
            <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={bannerUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" fill="%23FFF1F6"><rect width="600" height="300" fill="%23FFF1F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23C60050" font-family="sans-serif" font-weight="bold" font-size="24">Banner Tienda</text></svg>';
                }}
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-md">
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                />
                <div>
                  <p className="font-extrabold text-sm text-ink">{name}</p>
                  <p className="text-xs text-gray-500 capitalize">{category}</p>
                </div>
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="URL Imagen de Logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              required
            />
            <Input
              label="URL Imagen de Banner"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              required
            />
          </div>

          {/* Business Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre Comercial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              leftIcon={<Store className="w-4 h-4" />}
            />
            <Select
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value as MerchantCategory)}
            >
              <option value="restaurantes">Restaurantes</option>
              <option value="farmacias">Farmacias</option>
              <option value="bodegas">Bodegas</option>
              <option value="ropa">Ropa y Calzado</option>
              <option value="emprendedores">Emprendedores</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-ink block mb-1">
              Descripción para clientes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Location & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Dirección física del local"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              leftIcon={<MapPin className="w-4 h-4" />}
            />
            <Input
              label="Teléfono / WhatsApp de atención"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Horario de atención"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              required
            />
            <Input
              label="Tiempo de preparación (minutos)"
              type="number"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value)}
              required
              leftIcon={<Clock className="w-4 h-4" />}
            />
            <Input
              label="Costo base de envío (S/)"
              type="number"
              step="0.5"
              value={deliveryFeeSoles}
              onChange={(e) => setDeliveryFeeSoles(e.target.value)}
              required
              leftIcon={<Bike className="w-4 h-4" />}
            />
          </div>

          {/* Status Toggle */}
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-ink">Estado de la Tienda</p>
              <p className="text-xs text-gray-500">
                Si está cerrada, los clientes no podrán agregar nuevos productos de tu negocio.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="w-5 h-5 text-primary rounded"
              />
              <span>{isOpen ? 'Abierto' : 'Cerrado'}</span>
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button type="submit" variant="primary" size="md">
              Guardar Cambios de Tienda
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
