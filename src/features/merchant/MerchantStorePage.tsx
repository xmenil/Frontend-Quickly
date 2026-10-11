import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { MerchantCategory } from '../../domain/types';
import { formatCents, solesToCents } from '../../lib/currency';
import {
  CheckCircle2,
  Store,
  Clock,
  Bike,
  MapPin,
  Phone,
  ExternalLink,
  Save,
  Image as ImageIcon,
  Sparkles,
  Coins,
} from 'lucide-react';

// Preset photos representing Tingo María gastronomy and regional businesses
const BANNER_PRESETS = [
  {
    label: 'Platos Típicos',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cecina y Brasas',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Parrilla Campestre',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Café & Cacao',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Botica / Salud',
    url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&auto=format&fit=crop&q=80',
  },
];

const LOGO_PRESETS = [
  {
    label: 'Gourmet',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Brasas',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Natural',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cafetería',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&auto=format&fit=crop&q=80',
  },
];

export const MerchantStorePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, updateMerchantProfile } = useDataStore();

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
  const [showCustomUrlFields, setShowCustomUrlFields] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMerchantProfile(currentMerchant.id, {
      name: name.trim(),
      description: description.trim(),
      category,
      address: address.trim(),
      phone: phone.trim(),
      schedule: schedule.trim(),
      prepTimeMinutes: parseInt(prepTimeMinutes, 10) || 20,
      deliveryFeeCents: solesToCents(parseFloat(deliveryFeeSoles) || 4),
      minOrderCents: solesToCents(parseFloat(minOrderSoles) || 15),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      isOpen,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Perfil de Mi Tienda</h1>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Personaliza los datos públicos, horarios y tiempos de preparación de tu local en Tingo María
          </p>
        </div>

        <Link
          to={`/negocios/${currentMerchant.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-center"
        >
          <span>Ver tienda como cliente</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="bg-surface p-5 sm:p-8 rounded-3xl border border-border shadow-subtle space-y-7">
        {/* Save Success Alert */}
        {saved && (
          <div className="p-4 bg-selva-soft border border-selva-border rounded-2xl text-xs sm:text-sm text-selva-strong font-bold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-selva flex-shrink-0" />
            <span>Perfil comercial guardado y sincronizado con el catálogo de Tingo María.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BLOQUE 1: Identidad Visual y Presets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-ink">
                  Previsualización de Portada y Logo
                </h2>
                <p className="text-xs text-ink-muted">
                  Así verán los clientes de Tingo María tu negocio en la cabecera del catálogo
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomUrlFields(!showCustomUrlFields)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showCustomUrlFields ? 'Ocultar URLs manuales' : 'Editar URLs manuales'}</span>
              </button>
            </div>

            {/* Live Banner & Logo Display */}
            <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full rounded-2xl overflow-hidden bg-surface-subtle border border-border shadow-sm">
              <img
                src={bannerUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" fill="%23FDF2F8"><rect width="600" height="300" fill="%23FDF2F8"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-weight="bold" font-size="20">Portada de Tienda - Tingo María</text></svg>';
                }}
              />

              {/* Status Badge Over Banner */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
                    isOpen
                      ? 'bg-selva-soft text-selva-strong border border-selva-border'
                      : 'bg-destructive-soft text-destructive-strong border border-destructive-border'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOpen ? 'bg-selva animate-pulse' : 'bg-destructive'
                    }`}
                  />
                  <span>{isOpen ? 'Abierto ahora' : 'Cerrado / En pausa'}</span>
                </span>
              </div>

              {/* Store Avatar + Name Glass Card */}
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-3 bg-surface/95 backdrop-blur-md p-2.5 rounded-2xl border border-border/80 shadow-md max-w-[85%] sm:max-w-md">
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-border flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23FDF2F8"><rect width="64" height="64" rx="12" fill="%23FDF2F8"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23BE185D" font-family="sans-serif" font-weight="bold" font-size="22">Q</text></svg>';
                  }}
                />
                <div className="min-w-0">
                  <p className="font-extrabold text-sm sm:text-base text-ink truncate">{name || 'Mi Comercio'}</p>
                  <p className="text-xs text-ink-muted capitalize truncate">{category}</p>
                </div>
              </div>
            </div>

            {/* Quick Regional Presets */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-light">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Portadas recomendadas de Tingo María:</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBannerUrl(preset.url)}
                    className={`touch-target px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      bannerUrl === preset.url
                        ? 'bg-primary-50 text-primary border-primary font-bold'
                        : 'bg-surface text-ink-light border-border hover:bg-surface-subtle'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-ink-light pt-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Logos sugeridos por rubro:</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LOGO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setLogoUrl(preset.url)}
                    className={`touch-target px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      logoUrl === preset.url
                        ? 'bg-primary-50 text-primary border-primary font-bold'
                        : 'bg-surface text-ink-light border-border hover:bg-surface-subtle'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Manual URLs */}
            {showCustomUrlFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface-subtle border border-border animate-fadeIn">
                <Input
                  label="URL Personalizada de Logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
                <Input
                  label="URL Personalizada de Portada"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>
            )}
          </div>

          <hr className="border-border" />

          {/* BLOQUE 2: Datos Comerciales y Ubicación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink">
              <Store className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold">Datos Comerciales del Local</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre Comercial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                leftIcon={<Store className="w-4 h-4 text-ink-muted" />}
                placeholder="Ej. La Selva Gourmet"
              />

              <Select
                label="Rubro o Categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value as MerchantCategory)}
              >
                <option value="restaurantes">Restaurantes</option>
                <option value="farmacias">Farmacias y Boticas</option>
                <option value="bodegas">Bodegas y Abarrotes</option>
                <option value="ropa">Ropa y Calzado</option>
                <option value="emprendedores">Emprendedores Locales</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1.5">
                Descripción para clientes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                placeholder="Describe tus especialidades tingalesas, ingredientes y platos bandera..."
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-field bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-ink mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">Ubicación y Contacto en Tingo María</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Dirección física del local"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  leftIcon={<MapPin className="w-4 h-4 text-ink-muted" />}
                  placeholder="Ej. Av. Alameda Perú 450, Centro"
                />

                <Input
                  label="Teléfono / WhatsApp de atención"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  inputMode="tel"
                  leftIcon={<Phone className="w-4 h-4 text-ink-muted" />}
                  placeholder="Ej. 962 789 101"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* BLOQUE 3: Horarios, Tiempos, Switch Táctil y Guardado */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-ink">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold">Operación de Delivery y Despacho</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Horario de atención"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                required
                leftIcon={<Clock className="w-4 h-4 text-ink-muted" />}
                placeholder="Lun - Dom: 11:30 AM - 10:00 PM"
              />

              <Input
                label="Tiempo promedio de cocción (min)"
                type="number"
                min="5"
                max="90"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                required
                inputMode="numeric"
                leftIcon={<Clock className="w-4 h-4 text-ink-muted" />}
              />

              <Input
                label="Costo base de envío (S/)"
                type="number"
                step="0.5"
                min="0"
                value={deliveryFeeSoles}
                onChange={(e) => setDeliveryFeeSoles(e.target.value)}
                required
                inputMode="decimal"
                leftIcon={<Bike className="w-4 h-4 text-ink-muted" />}
              />
            </div>

            <div className="p-3 bg-surface-subtle rounded-xl border border-border text-[11px] text-ink-muted flex items-center gap-2">
              <Bike className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                Referencia de tarifas por zonas: <strong>Centro S/ 4.00</strong> • <strong>Rupa Rupa S/ 5.00</strong> • <strong>Castillo Grande S/ 6.50</strong>
              </span>
            </div>

            {/* Reception Status Switch */}
            <div className="p-4 sm:p-5 bg-surface-subtle rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-bold text-sm text-ink">
                  {isOpen ? 'Recepción de pedidos activa' : 'Recepción de pedidos pausada'}
                </p>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {isOpen
                    ? 'Tu negocio se muestra como "Abierto ahora" y recibe órdenes en el catálogo de Tingo María.'
                    : 'Tu catálogo sigue visible para los clientes pero no podrán enviar nuevas compras.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`touch-target relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex-shrink-0 ${
                  isOpen ? 'bg-selva' : 'bg-gray-300'
                }`}
                aria-label="Alternar estado de apertura de la tienda"
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform ${
                    isOpen ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="min-h-[44px] touch-target px-8 text-xs sm:text-sm font-bold shadow-subtle flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios de Tienda</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
