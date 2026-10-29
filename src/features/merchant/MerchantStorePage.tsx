import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { operationsApi, Store, StoreSummary } from '../../services/api/operationsApi';
import { mediaApi, mediaUrl } from '../../services/api/mediaApi';
import { prepareImage } from '../../services/media/prepareImage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { solesToCents } from '../../lib/currency';
import {
  BANNER_PRESETS,
  LOGO_PRESETS,
  DEFAULT_BANNER,
  DEFAULT_LOGO,
  normalizePhone,
  displayPhone,
  formatOpeningIntervals,
  canManageStore,
  urlToPreparedImage,
} from './merchantModel';
import {
  CheckCircle2,
  AlertCircle,
  Store as StoreIcon,
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
  Loader2,
  ChevronDown,
} from 'lucide-react';

export const MerchantStorePage: React.FC = () => {
  const { currentUser, switchMerchant } = useAuthStore();

  // Estados de carga de datos de la API
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<{ code: string; label: string }[]>([]);
  const [baseFeeCents, setBaseFeeCents] = useState<number>(400);

  // Modo edición: por defecto lectura limpia no editable
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingOrders, setIsTogglingOrders] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados del formulario comercial
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryCode, setCategoryCode] = useState('restaurantes');
  const [addressText, setAddressText] = useState('');
  const [phone, setPhone] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('20');
  const [minOrderSoles, setMinOrderSoles] = useState('15.00');
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [bannerUrl, setBannerUrl] = useState(DEFAULT_BANNER);

  // Estados de menús de 3 puntos
  const [bannerMenuOpen, setBannerMenuOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Lightbox / Visor de Fotos
  const [viewerPhoto, setViewerPhoto] = useState<{ url: string; title: string } | null>(null);

  // Modal para ingresar URL manual o preset
  const [urlModal, setUrlModal] = useState<{ target: 'banner' | 'logo'; currentVal: string } | null>(null);
  const [tempUrlInput, setTempUrlInput] = useState('');

  // Refs para subir archivo desde el dispositivo
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Cargar tiendas y datos del comercio
  const loadStoreData = useCallback(async (preferredStoreId?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ownStoresResult, categoriesList, zonesList] = await Promise.all([
        operationsApi.ownStores(),
        operationsApi.categories().catch(() => [
          { code: 'restaurantes', label: 'Restaurantes' },
          { code: 'bodegas', label: 'Bodegas y Abarrotes' },
          { code: 'farmacias', label: 'Farmacias y Boticas' },
          { code: 'supermercados', label: 'Supermercados' },
          { code: 'ropa', label: 'Ropa y Calzado' },
          { code: 'tecnologia', label: 'Tecnología' },
          { code: 'electrohogar', label: 'Electrohogar' },
          { code: 'hogar', label: 'Hogar' },
          { code: 'emprendedores', label: 'Emprendedores Locales' },
        ]),
        operationsApi.zones().catch(() => []),
      ]);

      const items = ownStoresResult.items || [];
      setStores(items);
      setCategories(categoriesList);

      if (items.length === 0) {
        setCurrentStore(null);
        setLoading(false);
        return;
      }

      // Encontrar tienda objetivo
      const targetId =
        preferredStoreId ||
        currentUser?.merchantId ||
        items[0].id;
      const selectedItem = items.find((s) => s.id === targetId) || items[0];

      // Cargar detalle completo de la tienda y su branding
      const [storeDetail, branding] = await Promise.all([
        operationsApi.store(selectedItem.id),
        mediaApi.branding(selectedItem.id).catch(() => ({ logoUrl: null, bannerUrl: null })),
      ]);

      setCurrentStore(storeDetail);

      // Encontrar tarifa de zona
      const matchingZone = zonesList.find((z) => z.id === storeDetail.zoneId);
      if (matchingZone) {
        setBaseFeeCents(matchingZone.baseFeeCents);
      }

      // Sincronizar campos del formulario
      setName(storeDetail.name || '');
      setDescription(storeDetail.description || '');
      setCategoryCode(storeDetail.categoryCode || 'restaurantes');
      setAddressText(storeDetail.addressText || '');
      setPhone(displayPhone(storeDetail.phone));
      setPrepTimeMinutes(String(storeDetail.preparationMinutes || 20));
      setMinOrderSoles(((storeDetail.minimumOrderCents || 0) / 100).toFixed(2));
      setLogoUrl(branding.logoUrl ? mediaUrl(branding.logoUrl) : DEFAULT_LOGO);
      setBannerUrl(branding.bannerUrl ? mediaUrl(branding.bannerUrl) : DEFAULT_BANNER);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la información de la tienda.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.merchantId]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Sincronizar campos si cambia currentStore
  useEffect(() => {
    if (currentStore) {
      setName(currentStore.name || '');
      setDescription(currentStore.description || '');
      setCategoryCode(currentStore.categoryCode || 'restaurantes');
      setAddressText(currentStore.addressText || '');
      setPhone(displayPhone(currentStore.phone));
      setPrepTimeMinutes(String(currentStore.preparationMinutes || 20));
      setMinOrderSoles(((currentStore.minimumOrderCents || 0) / 100).toFixed(2));
      setIsEditing(false);
    }
  }, [currentStore?.id]);

  const showSuccess = (msg: string) => {
    setSavedMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSavedMessage(null);
  };

  const handleCancelEdit = () => {
    if (currentStore) {
      setName(currentStore.name || '');
      setDescription(currentStore.description || '');
      setCategoryCode(currentStore.categoryCode || 'restaurantes');
      setAddressText(currentStore.addressText || '');
      setPhone(displayPhone(currentStore.phone));
      setPrepTimeMinutes(String(currentStore.preparationMinutes || 20));
      setMinOrderSoles(((currentStore.minimumOrderCents || 0) / 100).toFixed(2));
    }
    setIsEditing(false);
    setErrorMessage(null);
  };

  // Guardar cambios comerciales en el servidor
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentStore) return;

    if (!canManageStore(currentStore.membershipRole)) {
      showError('Tu membresía en esta tienda no permite modificar los datos comerciales.');
      return;
    }

    const cleanName = name.trim();
    if (cleanName.length < 3) {
      showError('El nombre comercial debe tener al menos 3 caracteres.');
      return;
    }

    const cleanAddress = addressText.trim();
    if (cleanAddress.length < 3) {
      showError('La dirección debe tener al menos 3 caracteres.');
      return;
    }

    const parsedPrepTime = parseInt(prepTimeMinutes, 10);
    if (isNaN(parsedPrepTime) || parsedPrepTime < 1 || parsedPrepTime > 1440) {
      showError('El tiempo de preparación debe estar entre 1 y 1440 minutos.');
      return;
    }

    const parsedMinOrder = parseFloat(minOrderSoles) || 0;
    const minOrderCents = solesToCents(parsedMinOrder >= 0 ? parsedMinOrder : 0);

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await operationsApi.updateStore(currentStore.id, {
        name: cleanName,
        description: description.trim(),
        categoryCode,
        addressText: cleanAddress,
        phone: normalizePhone(phone),
        preparationMinutes: parsedPrepTime,
        minimumOrderCents: minOrderCents,
      });

      setCurrentStore(updated);
      setIsEditing(false);
      showSuccess('Perfil comercial actualizado y guardado correctamente en el servidor.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo guardar la información comercial.');
    } finally {
      setIsSaving(false);
    }
  };

  // Conmutar recepción de pedidos
  const handleToggleAcceptingOrders = async () => {
    if (!currentStore) return;
    if (!canManageStore(currentStore.membershipRole)) {
      showError('Tu membresía no permite modificar el estado de recepción de pedidos.');
      return;
    }

    setIsTogglingOrders(true);
    setErrorMessage(null);

    try {
      const updated = await operationsApi.updateStore(currentStore.id, {
        acceptingOrders: !currentStore.acceptingOrders,
      });
      setCurrentStore(updated);
      showSuccess(
        updated.acceptingOrders
          ? 'Recepción de pedidos activada con éxito.'
          : 'Recepción de pedidos pausada con éxito.'
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo actualizar el estado de recepción.');
    } finally {
      setIsTogglingOrders(false);
    }
  };

  // Subir archivo desde dispositivo para banner o logo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file || !currentStore) return;

    if (!canManageStore(currentStore.membershipRole)) {
      showError('Tu membresía no permite cambiar las imágenes de la tienda.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);
    try {
      const preparedContent = await prepareImage(file);
      const brandingResult = await mediaApi.saveBranding(currentStore.id, target, preparedContent);
      const newUrl = target === 'banner' ? brandingResult.bannerUrl : brandingResult.logoUrl;
      if (target === 'banner') {
        setBannerUrl(newUrl ? mediaUrl(newUrl) : DEFAULT_BANNER);
      } else {
        setLogoUrl(newUrl ? mediaUrl(newUrl) : DEFAULT_LOGO);
      }
      showSuccess(`Foto de ${target === 'banner' ? 'portada' : 'logo'} actualizada y guardada correctamente.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
      setBannerMenuOpen(false);
      setLogoMenuOpen(false);
    }
  };

  // Restablecer / eliminar branding
  const handleResetBranding = async (target: 'banner' | 'logo') => {
    if (!currentStore) return;
    if (!canManageStore(currentStore.membershipRole)) {
      showError('Tu membresía no permite modificar las imágenes.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);
    try {
      await mediaApi.removeBranding(currentStore.id, target);
      if (target === 'banner') {
        setBannerUrl(DEFAULT_BANNER);
      } else {
        setLogoUrl(DEFAULT_LOGO);
      }
      showSuccess(`Foto de ${target === 'banner' ? 'portada' : 'logo'} restablecida.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo restablecer la imagen.');
    } finally {
      setUploadingImage(false);
      setBannerMenuOpen(false);
      setLogoMenuOpen(false);
    }
  };

  const openUrlModal = (target: 'banner' | 'logo') => {
    setUrlModal({ target, currentVal: target === 'banner' ? bannerUrl : logoUrl });
    setTempUrlInput(target === 'banner' ? bannerUrl : logoUrl);
    setBannerMenuOpen(false);
    setLogoMenuOpen(false);
  };

  const handleConfirmUrl = async () => {
    if (!urlModal || !tempUrlInput.trim() || !currentStore) return;
    if (!canManageStore(currentStore.membershipRole)) {
      showError('Tu membresía no permite modificar las imágenes.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);

    try {
      const preparedContent = await urlToPreparedImage(tempUrlInput.trim());
      const brandingResult = await mediaApi.saveBranding(currentStore.id, urlModal.target, preparedContent);
      const newUrl = urlModal.target === 'banner' ? brandingResult.bannerUrl : brandingResult.logoUrl;
      if (urlModal.target === 'banner') {
        setBannerUrl(newUrl ? mediaUrl(newUrl) : DEFAULT_BANNER);
      } else {
        setLogoUrl(newUrl ? mediaUrl(newUrl) : DEFAULT_LOGO);
      }
      setUrlModal(null);
      showSuccess(`Foto de ${urlModal.target === 'banner' ? 'portada' : 'logo'} aplicada correctamente.`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'No se pudo procesar la imagen desde ese enlace.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Manejar cambio de tienda autorizada
  const handleSwitchStore = (newStoreId: string) => {
    switchMerchant(newStoreId);
    loadStoreData(newStoreId);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-xs text-ink-muted">Cargando información comercial autorizada...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-3">
        <div className="p-4 bg-destructive-soft border border-destructive-border rounded-2xl flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Error al consultar la tienda</p>
            <p>{loadError}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadStoreData()}>
          Reintentar consulta
        </Button>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4 bg-surface rounded-2xl border border-border shadow-xs">
        <StoreIcon className="w-12 h-12 text-ink-muted mx-auto" />
        <h2 className="text-base font-bold text-ink">No tienes tiendas autorizadas</h2>
        <p className="text-xs text-ink-light max-w-md mx-auto">
          Para gestionar una tienda en Tingo María debes registrar una solicitud o recibir una membresía de operador/encargado.
        </p>
        <Link to="/registro/comercio">
          <Button variant="primary" size="sm">
            Solicitar afiliación de tienda
          </Button>
        </Link>
      </div>
    );
  }

  const categoryLabel =
    categories.find((c) => c.code === categoryCode)?.label || categoryCode;
  const canEdit = canManageStore(currentStore.membershipRole);
  const scheduleText = formatOpeningIntervals(currentStore.openingIntervals);

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
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'banner')}
      />
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'logo')}
      />

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Mi Tienda</h1>
            <span className="text-[11px] font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 capitalize">
              {categoryLabel}
            </span>

            {/* Selector de tienda si tiene múltiples tiendas autorizadas */}
            {stores.length > 1 && (
              <div className="relative inline-block">
                <select
                  value={currentStore.id}
                  onChange={(e) => handleSwitchStore(e.target.value)}
                  className="text-xs font-semibold bg-surface border border-border rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.membershipRole})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs text-ink-light mt-0.5">
            Información comercial, horarios, tarifas y presencia visual de tu local en Tingo María
          </p>
        </div>

        {/* Acciones de la Cabecera */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to={`/negocios/${currentStore.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-light hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle"
            title="Ver catálogo público"
          >
            <span>Ver como cliente</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {canEdit && (
            <>
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
                    disabled={isSaving}
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
                    isLoading={isSaving}
                    className="min-h-[36px] px-3.5 text-xs font-bold shadow-subtle rounded-xl"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    <span>Guardar Cambios</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alerta de guardado exitoso */}
      {savedMessage && (
        <div className="p-3 bg-selva-soft border border-selva-border rounded-xl text-xs text-selva-strong font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Alerta de error */}
      {errorMessage && (
        <div className="p-3 bg-destructive-soft border border-destructive-border rounded-xl text-xs text-destructive-strong font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-xs p-1">
            ✕
          </button>
        </div>
      )}

      {/* Aviso de rol de sólo lectura si es operador */}
      {!canEdit && (
        <div className="p-3 bg-info-soft border border-info-border rounded-xl text-xs text-ink flex items-center gap-2">
          <StoreIcon className="w-4 h-4 text-info flex-shrink-0" />
          <span>
            Tu membresía de <strong>Operador</strong> te permite consultar la información comercial y atender pedidos.
            Las modificaciones de datos requieren rol de Encargado o Propietario.
          </span>
        </div>
      )}

      {/* =========================================================================
          FOTOS DE LA TIENDA: PORTADA Y LOGO CON 3 PUNTOS
          ========================================================================= */}
      <div className="bg-surface p-3 sm:p-4 rounded-2xl border border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold text-ink">Foto de Portada y Logo</h2>
          </div>
          <span className="text-[11px] text-ink-muted">
            {canEdit ? 'Usa los 3 puntos (⋮) para cambiar foto o subir desde dispositivo' : 'Fotos visibles para clientes'}
          </span>
        </div>

        {/* Contenedor del Banner */}
        <div className="relative h-40 sm:h-48 w-full select-none">
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-border bg-surface-subtle shadow-xs">
            <img
              src={bannerUrl}
              alt={name}
              onClick={() => setViewerPhoto({ url: bannerUrl, title: `Foto de Portada - ${name}` })}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
              title="Toca para ver la foto ampliada"
            />
          </div>

          {/* Badges superiores: Estado Abierto/Cerrado + 3 PUNTOS DE LA PORTADA */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-30">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                currentStore.isOpen ? 'bg-selva text-white' : 'bg-destructive text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{currentStore.isOpen ? 'Abierto' : 'Cerrado'}</span>
            </span>

            {/* BOTÓN 3 PUNTOS DE LA PORTADA */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBannerMenuOpen(!bannerMenuOpen);
                  setLogoMenuOpen(false);
                }}
                disabled={uploadingImage}
                className="h-8 px-2.5 rounded-full bg-surface/95 hover:bg-surface text-ink backdrop-blur-md border border-border shadow-md flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold"
                title="Opciones de Foto de Portada"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                <MoreVertical className="w-3.5 h-3.5 text-ink-muted" />
              </button>

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

                  {canEdit && (
                    <>
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
                        onClick={() => handleResetBranding('banner')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-destructive-soft text-destructive flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restablecer portada</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TARJETA DE LOGO / PERFIL */}
          <div className="absolute bottom-2.5 left-2.5 z-30">
            <div className="flex items-center gap-2 bg-surface/95 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-border shadow-md max-w-[90%]">
              <img
                src={logoUrl}
                alt={name}
                onClick={() => setViewerPhoto({ url: logoUrl, title: `Logo - ${name}` })}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-border flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Toca para ver el logo ampliado"
              />

              <div className="min-w-0 pr-1">
                <p className="font-extrabold text-xs sm:text-sm text-ink truncate max-w-[130px] sm:max-w-[170px]">{name}</p>
                <p className="text-[10px] text-ink-muted capitalize truncate">{categoryLabel}</p>
              </div>

              {/* BOTÓN 3 PUNTOS DEL LOGO */}
              <div className="relative ml-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLogoMenuOpen(!logoMenuOpen);
                    setBannerMenuOpen(false);
                  }}
                  disabled={uploadingImage}
                  className="w-7 h-7 rounded-lg hover:bg-surface-subtle text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer border border-border/50"
                  title="Opciones de Foto de Perfil / Logo"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

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

                    {canEdit && (
                      <>
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
                          onClick={() => handleResetBranding('logo')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-destructive-soft text-destructive flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restablecer logo</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODO LECTURA NORMAL vs. MODO EDICIÓN
          ========================================================================= */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Tarjeta de Información Comercial */}
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <StoreIcon className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs sm:text-sm text-ink">Información Comercial</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-ink-muted block font-medium">Nombre Comercial</span>
                <p className="font-bold text-sm text-ink">{currentStore.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-ink-muted block font-medium">Rubro o Categoría</span>
                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-surface-subtle border border-border font-semibold text-ink capitalize text-xs">
                  {categoryLabel}
                </span>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-1">
                <span className="text-[11px] text-ink-muted block font-medium">Descripción para clientes</span>
                <p className="text-xs text-ink-light leading-relaxed bg-surface-subtle p-2.5 rounded-xl border border-border">
                  {currentStore.description || 'Sin descripción configurada.'}
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-ink-muted block font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-selva" />
                  <span>Dirección física en Tingo María</span>
                </span>
                <p className="font-semibold text-xs text-ink">{currentStore.addressText || 'Sin dirección registrada'}</p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-ink-muted block font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>Teléfono / WhatsApp de atención</span>
                </span>
                <a href={`tel:${currentStore.phone}`} className="font-semibold text-xs text-primary hover:underline">
                  {displayPhone(currentStore.phone)}
                </a>
              </div>
            </div>
          </div>

          {/* Tarjeta de Horarios, Despacho y Estado */}
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs sm:text-sm text-ink">Horarios, Despacho y Estado</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1 bg-surface-subtle p-2.5 rounded-xl border border-border">
                <span className="text-[11px] text-ink-muted block font-medium">Horario de Atención</span>
                <p className="font-bold text-ink">{scheduleText}</p>
              </div>

              <div className="space-y-1 bg-surface-subtle p-2.5 rounded-xl border border-border">
                <span className="text-[11px] text-ink-muted block font-medium">Tiempo de Preparación</span>
                <p className="font-bold text-ink">{currentStore.preparationMinutes || 20} minutos</p>
              </div>

              <div className="space-y-1 bg-surface-subtle p-2.5 rounded-xl border border-border">
                <span className="text-[11px] text-ink-muted block font-medium">Costo de Envío Base (Zona)</span>
                <p className="font-extrabold text-ink tabular-nums">S/ {(baseFeeCents / 100).toFixed(2)}</p>
              </div>
            </div>

            {/* Estado Operativo y Recepción de Pedidos */}
            <div className="p-3 bg-surface-subtle rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-ink">
                  {currentStore.acceptingOrders ? 'Recepción de pedidos Activa' : 'Recepción de pedidos Pausada'}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {currentStore.acceptingOrders
                    ? 'Tu tienda puede recibir nuevas compras dentro de su horario de atención en Tingo María.'
                    : 'Tu tienda se encuentra pausada temporalmente y no acepta nuevas órdenes.'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    currentStore.acceptingOrders
                      ? 'bg-selva-soft text-selva-strong border-selva-border'
                      : 'bg-destructive-soft text-destructive-strong border-destructive-border'
                  }`}
                >
                  {currentStore.acceptingOrders ? 'Recepción Activa' : 'Pausada'}
                </span>

                {canEdit && (
                  <Button
                    type="button"
                    variant={currentStore.acceptingOrders ? 'danger' : 'primary'}
                    size="sm"
                    disabled={isTogglingOrders}
                    onClick={handleToggleAcceptingOrders}
                    className="min-h-[32px] text-xs font-bold rounded-xl"
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    <span>{currentStore.acceptingOrders ? 'Pausar' : 'Activar'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODO EDICIÓN: DATOS COMERCIALES Y OPERATIVOS */
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-primary/30 ring-1 ring-primary/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-primary" />
                <span>Edición de Datos Comerciales y Operativos</span>
              </h3>
              <span className="text-[11px] text-primary font-bold bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                Modo Edición Activo
              </span>
            </div>

            {/* DATOS COMERCIALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre Comercial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                placeholder="Ej. La Selva Gourmet"
              />

              <Select
                label="Rubro o Categoría"
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
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
                maxLength={1000}
                placeholder="Especialidades, productos bandera o descripción de tu negocio..."
                className="w-full text-xs p-2.5 rounded-xl border border-field bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>

            {/* CONTACTO Y UBICACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Dirección física en Tingo María"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                required
                maxLength={250}
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

            {/* PARÁMETROS OPERATIVOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Tiempo preparación promedio (min)"
                type="number"
                min="1"
                max="1440"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                required
                inputMode="numeric"
                leftIcon={<Clock className="w-3.5 h-3.5 text-ink-muted" />}
              />

              <Input
                label="Pedido mínimo (S/)"
                type="number"
                step="any"
                min="0"
                value={minOrderSoles}
                onChange={(e) => setMinOrderSoles(e.target.value)}
                inputMode="decimal"
                leftIcon={<Bike className="w-3.5 h-3.5 text-ink-muted" />}
              />
            </div>

            {/* Botones Guardar / Cancelar en el pie */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="min-h-[36px] px-4 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
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
            ? 'Selecciona una portada sugerida o ingresa un enlace HTTPS directo.'
            : 'Selecciona un logo sugerido o ingresa un enlace HTTPS directo.'
        }
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
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
              disabled={uploadingImage}
              className="min-h-[36px] px-3.5 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={uploadingImage}
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
