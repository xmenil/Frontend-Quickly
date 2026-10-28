import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { MerchantCategory } from '../../domain/types';
import { solesToCents } from '../../lib/currency';
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
  Power,
  Pencil,
  X,
  Upload,
  Maximize2,
  Sparkles,
  Camera,
  MoreVertical,
  RotateCcw,
} from 'lucide-react';

const BANNER_PRESETS = [
  {
    label: 'Platos & Gastronomía',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Parrillas & Brasas',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Café, Cacao & Selva',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Bodega & Abarrotes',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Farmacia & Salud',
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
    label: 'Café',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Comercio',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_BANNER = BANNER_PRESETS[0].url;
const DEFAULT_LOGO = LOGO_PRESETS[0].url;

export const MerchantStorePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants, updateMerchantProfile } = useDataStore();

  const currentMerchant =
    (currentUser?.merchantId ? merchants.find((m) => m.id === currentUser.merchantId) : null) ||
    merchants.find((m) => m.ownerUserId === currentUser?.id) ||
    merchants[0];

  // Modo edición: por defecto lectura limpia no editable
  const [isEditing, setIsEditing] = useState(false);

  // Estados del formulario
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
  const [logoUrl, setLogoUrl] = useState(currentMerchant.logoUrl || DEFAULT_LOGO);
  const [bannerUrl, setBannerUrl] = useState(currentMerchant.bannerUrl || DEFAULT_BANNER);
  const [isOpen, setIsOpen] = useState(currentMerchant.isOpen);
  const [saved, setSaved] = useState(false);

  // Sincronizar todos los datos cuando cambia la tienda seleccionada
  useEffect(() => {
    setName(currentMerchant.name);
    setDescription(currentMerchant.description);
    setCategory(currentMerchant.category);
    setAddress(currentMerchant.address);
    setPhone(currentMerchant.phone);
    setSchedule(currentMerchant.schedule);
    setPrepTimeMinutes(currentMerchant.prepTimeMinutes.toString());
    setDeliveryFeeSoles((currentMerchant.deliveryFeeCents / 100).toFixed(2));
    setMinOrderSoles((currentMerchant.minOrderCents / 100).toFixed(2));
    setLogoUrl(currentMerchant.logoUrl || DEFAULT_LOGO);
    setBannerUrl(currentMerchant.bannerUrl || DEFAULT_BANNER);
    setIsOpen(currentMerchant.isOpen);
    setIsEditing(false);
  }, [currentMerchant.id]);

  // Estados de menús de 3 puntos (visibles antes de pulsar editar)
  const [bannerMenuOpen, setBannerMenuOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);

  // Lightbox / Visor de Fotos
  const [viewerPhoto, setViewerPhoto] = useState<{ url: string; title: string } | null>(null);

  // Modal para ingresar URL manual si lo desea
  const [urlModal, setUrlModal] = useState<{ target: 'banner' | 'logo'; currentVal: string } | null>(null);
  const [tempUrlInput, setTempUrlInput] = useState('');

  // Refs para subir archivo desde el dispositivo
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleCancelEdit = () => {
    setName(currentMerchant.name);
    setDescription(currentMerchant.description);
    setCategory(currentMerchant.category);
    setAddress(currentMerchant.address);
    setPhone(currentMerchant.phone);
    setSchedule(currentMerchant.schedule);
    setPrepTimeMinutes(currentMerchant.prepTimeMinutes.toString());
    setDeliveryFeeSoles((currentMerchant.deliveryFeeCents / 100).toFixed(2));
    setMinOrderSoles((currentMerchant.minOrderCents / 100).toFixed(2));
    setLogoUrl(currentMerchant.logoUrl || DEFAULT_LOGO);
    setBannerUrl(currentMerchant.bannerUrl || DEFAULT_BANNER);
    setIsOpen(currentMerchant.isOpen);
    setIsEditing(false);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  // Subir archivo desde dispositivo directamente antes de editar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'banner') {
          setBannerUrl(reader.result);
          updateMerchantProfile(currentMerchant.id, { bannerUrl: reader.result });
        } else {
          setLogoUrl(reader.result);
          updateMerchantProfile(currentMerchant.id, { logoUrl: reader.result });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setBannerMenuOpen(false);
    setLogoMenuOpen(false);
  };

  const openUrlModal = (target: 'banner' | 'logo') => {
    setUrlModal({ target, currentVal: target === 'banner' ? bannerUrl : logoUrl });
    setTempUrlInput(target === 'banner' ? bannerUrl : logoUrl);
    setBannerMenuOpen(false);
    setLogoMenuOpen(false);
  };

  const handleConfirmUrl = () => {
    if (!urlModal || !tempUrlInput.trim()) return;
    if (urlModal.target === 'banner') {
      setBannerUrl(tempUrlInput.trim());
      updateMerchantProfile(currentMerchant.id, { bannerUrl: tempUrlInput.trim() });
    } else {
      setLogoUrl(tempUrlInput.trim());
      updateMerchantProfile(currentMerchant.id, { logoUrl: tempUrlInput.trim() });
    }
    setUrlModal(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Backdrop transparente para cerrar menús al hacer clic afuera */}
      {(bannerMenuOpen || logoMenuOpen) && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => {
            setBannerMenuOpen(false);
            setLogoMenuOpen(false);
          }}
        />
      )}

      {/* Inputs ocultos de carga de archivo */}
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'banner')}
      />
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'logo')}
      />

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Mi Tienda</h1>
            <span className="text-[11px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 capitalize">
              {category}
            </span>
          </div>
          <p className="text-xs text-ink-light mt-0.5">
            Información comercial, horarios, tarifas y presencia visual de tu local en Tingo María
          </p>
        </div>

        {/* Acciones de la Cabecera */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to={`/negocios/${currentMerchant.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-light hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle"
            title="Ver catálogo público"
          >
            <span>Ver como cliente</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {!isEditing ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="min-h-[36px] px-3.5 text-xs font-bold shadow-subtle flex items-center gap-1.5 rounded-xl"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Información</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="min-h-[36px] px-3 text-xs font-semibold rounded-xl"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Cancelar</span>
              </Button>
              <Button
                type="button"
                variant="selva"
                size="sm"
                onClick={() => handleSave()}
                className="min-h-[36px] px-3.5 text-xs font-bold shadow-subtle rounded-xl"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                <span>Guardar Cambios</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de guardado */}
      {saved && (
        <div className="p-3 bg-selva-soft border border-selva-border rounded-xl text-xs text-selva-strong font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0" />
          <span>Perfil comercial actualizado y guardado correctamente.</span>
        </div>
      )}

      {/* =========================================================================
          FOTOS DE LA TIENDA: PORTADA Y LOGO CON 3 PUNTOS (EDITABLES DIRECTAMENTE AQUÍ)
          Visible siempre para ver y cambiar fotos directamente antes o durante la edición
          ========================================================================= */}
      <div className="bg-surface p-3 sm:p-4 rounded-2xl border border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold text-ink">Foto de Portada y Logo</h2>
          </div>
          <span className="text-[11px] text-ink-muted">Usa los 3 puntos (⋮) para cambiar foto o subir desde dispositivo</span>
        </div>

        {/* Contenedor del Banner */}
        <div className="relative h-40 sm:h-48 w-full select-none">
          {/* Imagen redondeada con overflow-hidden interno */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-border bg-surface-subtle shadow-xs">
            <img
              src={bannerUrl}
              alt={name}
              onClick={() => setViewerPhoto({ url: bannerUrl, title: `Foto de Portada - ${name}` })}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
              title="Toca para ver la foto ampliada"
            />
          </div>

          {/* Botones de la esquina superior derecha: Badge de estado + 3 PUNTOS DE LA PORTADA */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-30">
            {/* Badge Abierto / Cerrado */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                isOpen ? 'bg-selva text-white' : 'bg-destructive text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{isOpen ? 'Abierto' : 'Cerrado'}</span>
            </span>

            {/* BOTÓN 3 PUNTOS DE LA PORTADA */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBannerMenuOpen(!bannerMenuOpen);
                  setLogoMenuOpen(false);
                }}
                className="h-8 px-2.5 rounded-full bg-surface/95 hover:bg-surface text-ink backdrop-blur-md border border-border shadow-md flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold"
                title="Opciones de Foto de Portada"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                <MoreVertical className="w-3.5 h-3.5 text-ink-muted" />
              </button>

              {/* Menú desplegable hacia abajo (NUNCA SE CORTA) */}
              {bannerMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface rounded-xl border border-border shadow-2xl p-1 z-40 animate-fadeIn text-xs font-medium space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setViewerPhoto({ url: bannerUrl, title: `Foto de Portada - ${name}` });
                      setBannerMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle flex items-center gap-2 text-ink"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-primary" />
                    <span>Ver foto completa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      bannerFileInputRef.current?.click();
                      setBannerMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle flex items-center gap-2 text-ink font-bold"
                  >
                    <Upload className="w-3.5 h-3.5 text-selva" />
                    <span>Subir desde dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openUrlModal('banner')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle flex items-center gap-2 text-ink"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-info" />
                    <span>Cambiar por URL o sugeridas</span>
                  </button>

                  <div className="border-t border-border my-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      setBannerUrl(DEFAULT_BANNER);
                      updateMerchantProfile(currentMerchant.id, { bannerUrl: DEFAULT_BANNER });
                      setBannerMenuOpen(false);
                      setSaved(true);
                      setTimeout(() => setSaved(false), 3000);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-destructive-soft text-destructive flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer portada</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TARJETA DE LOGO / PERFIL (Con sus propios 3 PUNTOS) */}
          <div className="absolute bottom-2.5 left-2.5 z-30">
            <div className="flex items-center gap-2 bg-surface/95 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-border shadow-md max-w-[90%]">
              {/* Foto de Logo Clickeable para ver */}
              <img
                src={logoUrl}
                alt={name}
                onClick={() => setViewerPhoto({ url: logoUrl, title: `Logo - ${name}` })}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Toca para ver el logo ampliado"
              />

              <div className="min-w-0 pr-1">
                <p className="font-extrabold text-xs sm:text-sm text-ink truncate max-w-[130px] sm:max-w-[170px]">{name}</p>
                <p className="text-[10px] text-ink-muted capitalize truncate">{category}</p>
              </div>

              {/* BOTÓN 3 PUNTOS DEL LOGO */}
              <div className="relative ml-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLogoMenuOpen(!logoMenuOpen);
                    setBannerMenuOpen(false);
                  }}
                  className="w-7 h-7 rounded-lg hover:bg-surface-subtle text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer border border-border/50"
                  title="Opciones de Foto de Perfil / Logo"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Menú desplegable hacia arriba pero SIN ser recortado */}
                {logoMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-56 bg-surface rounded-xl border border-border shadow-2xl p-1 z-40 animate-fadeIn text-xs font-medium space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setViewerPhoto({ url: logoUrl, title: `Logo - ${name}` });
                        setLogoMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle flex items-center gap-2 text-ink"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-primary" />
                      <span>Ver logo completo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logoFileInputRef.current?.click();
                        setLogoMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle flex items-center gap-2 text-ink font-bold"
                    >
                      <Upload className="w-3.5 h-3.5 text-selva" />
                      <span>Subir desde dispositivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openUrlModal('logo')}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle flex items-center gap-2 text-ink"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-info" />
                      <span>Cambiar por URL o sugeridos</span>
                    </button>

                    <div className="border-t border-border my-0.5" />

                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl(DEFAULT_LOGO);
                        updateMerchantProfile(currentMerchant.id, { logoUrl: DEFAULT_LOGO });
                        setLogoMenuOpen(false);
                        setSaved(true);
                        setTimeout(() => setSaved(false), 3000);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-destructive-soft text-destructive flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer logo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LO DEMÁS: MODO LECTURA NORMAL vs. MODO EDICIÓN
          ========================================================================= */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Tarjeta de Información Comercial (Normal y limpia) */}
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Store className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs sm:text-sm text-ink">Información Comercial</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-ink-muted block font-medium">Nombre Comercial</span>
                <p className="font-bold text-sm text-ink">{name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-ink-muted block font-medium">Rubro o Categoría</span>
                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-surface-subtle border border-border font-semibold text-ink capitalize text-xs">
                  {category}
                </span>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-1">
                <span className="text-[11px] text-ink-muted block font-medium">Descripción para clientes</span>
                <p className="text-xs text-ink-light leading-relaxed bg-surface-subtle p-2.5 rounded-xl border border-border">
                  {description || 'Sin descripción configurada.'}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-ink-muted block font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-selva" />
                  <span>Dirección física en Tingo María</span>
                </span>
                <p className="font-semibold text-xs text-ink">{address}</p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-ink-muted block font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>Teléfono / WhatsApp de atención</span>
                </span>
                <a href={`tel:${phone}`} className="font-semibold text-xs text-primary hover:underline">
                  {phone}
                </a>
              </div>
            </div>
          </div>

          {/* Tarjeta de Horarios y Operación (Normal y limpia) */}
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs sm:text-sm text-ink">Horarios, Despacho y Estado</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1 bg-surface-subtle p-2.5 rounded-xl border border-border">
                <span className="text-[11px] text-ink-muted block font-medium">Horario de Atención</span>
                <p className="font-bold text-ink">{schedule}</p>
              </div>

              <div className="space-y-1 bg-surface-subtle p-2.5 rounded-xl border border-border">
                <span className="text-[11px] text-ink-muted block font-medium">Tiempo de Preparación</span>
                <p className="font-bold text-ink">{prepTimeMinutes} minutos</p>
              </div>

              <div className="space-y-1 bg-surface-subtle p-2.5 rounded-xl border border-border">
                <span className="text-[11px] text-ink-muted block font-medium">Costo de Envío Base</span>
                <p className="font-extrabold text-ink tabular-nums">S/ {parseFloat(deliveryFeeSoles).toFixed(2)}</p>
              </div>
            </div>

            {/* Estado Operativo */}
            <div className="p-3 bg-surface-subtle rounded-xl border border-border flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-ink">
                  {isOpen ? 'Recepción de pedidos Activa' : 'Recepción de pedidos Pausada'}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {isOpen
                    ? 'Tu tienda se muestra como "Abierto" en Tingo María y puede recibir compras.'
                    : 'Tu tienda se muestra como "Cerrado" temporalmente.'}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  isOpen
                    ? 'bg-selva-soft text-selva-strong border-selva-border'
                    : 'bg-destructive-soft text-destructive-strong border-destructive-border'
                }`}
              >
                {isOpen ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           MODO EDICIÓN: SÓLO "LO DEMÁS" (DATOS COMERCIALES, CONTACTO, HORARIOS)
           LAS FOTOS YA SE GESTIONAN ARRIBA CON LOS 3 PUNTOS
           ========================================================================= */
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-primary/30 ring-1 ring-primary/20 shadow-xs space-y-4">
            {/* Aviso de Edición */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-primary" />
                <span>Edición de Datos Comerciales y Operativos</span>
              </h3>
              <span className="text-[11px] text-primary font-bold bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                Modo Edición Activo
              </span>
            </div>

            {/* 2. DATOS COMERCIALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre Comercial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
                <option value="supermercados">Supermercados</option>
                <option value="tecnologia">Tecnología</option>
                <option value="electrohogar">Electrohogar</option>
                <option value="hogar">Hogar</option>
                <option value="emprendedores">Emprendedores Locales</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1">
                Descripción para los clientes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                required
                placeholder="Especialidades, productos bandera o descripción de tu negocio..."
                className="w-full text-xs p-2.5 rounded-xl border border-field bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>

            {/* 3. CONTACTO Y UBICACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Dirección física en Tingo María"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                leftIcon={<MapPin className="w-3.5 h-3.5 text-ink-muted" />}
                placeholder="Ej. Av. Alameda Perú 450"
              />

              <Input
                label="Teléfono / WhatsApp de atención"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="tel"
                leftIcon={<Phone className="w-3.5 h-3.5 text-ink-muted" />}
                placeholder="Ej. 962 789 101"
              />
            </div>

            {/* 4. HORARIOS Y OPERACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Input
                label="Horario de atención"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                required
                leftIcon={<Clock className="w-3.5 h-3.5 text-ink-muted" />}
                placeholder="Lun - Dom: 11:30 AM - 10:00 PM"
              />

              <Input
                label="Tiempo preparación (min)"
                type="number"
                min="5"
                max="90"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                required
                inputMode="numeric"
                leftIcon={<Clock className="w-3.5 h-3.5 text-ink-muted" />}
              />

              <Input
                label="Costo envío base (S/)"
                type="number"
                step="any"
                min="0"
                value={deliveryFeeSoles}
                onChange={(e) => setDeliveryFeeSoles(e.target.value)}
                required
                inputMode="decimal"
                leftIcon={<Bike className="w-3.5 h-3.5 text-ink-muted" />}
              />
            </div>

            {/* Switch de Abierto / Cerrado */}
            <div className="p-3 bg-surface-subtle rounded-xl border border-border flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-ink">
                  {isOpen ? 'Tienda Abierta para recibir pedidos' : 'Tienda Cerrada / Pausada'}
                </p>
                <p className="text-[11px] text-ink-muted">
                  Controla si los clientes pueden hacer pedidos en este momento en el catálogo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 select-none ${
                  isOpen
                    ? 'bg-selva text-white border-selva shadow-xs'
                    : 'bg-destructive text-white border-destructive shadow-xs'
                }`}
              >
                <Power className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isOpen ? 'Abierto' : 'Cerrado'}</span>
              </button>
            </div>

            {/* Botones Guardar / Cancelar en el pie */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="min-h-[36px] px-4 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="min-h-[36px] px-6 text-xs font-bold shadow-subtle flex items-center gap-1.5 rounded-xl"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Modal Lightbox: Visor de Foto Ampliada */}
      <Dialog
        isOpen={Boolean(viewerPhoto)}
        onClose={() => setViewerPhoto(null)}
        title={viewerPhoto?.title || 'Vista Previa'}
        maxWidth="lg"
      >
        {viewerPhoto && (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl overflow-hidden bg-black/5 border border-border max-h-[70vh] flex items-center justify-center">
              <img
                src={viewerPhoto.url}
                alt={viewerPhoto.title}
                className="w-full h-auto max-h-[65vh] object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewerPhoto(null)}
                className="min-h-[34px] px-4 text-xs font-semibold rounded-xl"
              >
                Cerrar Visor
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modal para Ingresar URL Manual de Foto o Elegir Sugeridas */}
      <Dialog
        isOpen={Boolean(urlModal)}
        onClose={() => setUrlModal(null)}
        title={urlModal?.target === 'banner' ? 'Cambiar Foto de Portada' : 'Cambiar Foto de Perfil / Logo'}
        description={
          urlModal?.target === 'banner'
            ? 'Ingresa un enlace HTTPS directo o selecciona una imagen de nuestra galería sugerida.'
            : 'Ingresa un enlace HTTPS directo o selecciona un logo de nuestra galería sugerida.'
        }
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {/* Galería de Sugerencias Rápida */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Imágenes sugeridas (toca una para seleccionar):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(urlModal?.target === 'banner' ? BANNER_PRESETS : LOGO_PRESETS).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setTempUrlInput(preset.url)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    tempUrlInput === preset.url
                      ? 'bg-primary-50 text-primary border-primary font-bold shadow-xs'
                      : 'bg-surface hover:bg-surface-subtle text-ink-light border-border'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="O escribe/pega el enlace URL de la Imagen"
            value={tempUrlInput}
            onChange={(e) => setTempUrlInput(e.target.value)}
            placeholder="https://..."
            required
          />

          {tempUrlInput && (
            <div className="space-y-1">
              <span className="text-[11px] text-ink-muted block font-medium">Previsualización:</span>
              <div className="h-32 rounded-xl overflow-hidden border border-border bg-surface-subtle">
                <img
                  src={tempUrlInput}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" fill="%23F3F4F6"><rect width="300" height="100" fill="%23F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="12">URL no válida</text></svg>';
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUrlModal(null)}
              className="min-h-[36px] px-3.5 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmUrl}
              className="min-h-[36px] px-4 text-xs font-bold rounded-xl"
            >
              Aplicar Imagen
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
