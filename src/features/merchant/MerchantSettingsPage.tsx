import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { operationsApi, Store, StoreSummary, StoreMember } from '../../services/api/operationsApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  WEEKDAYS,
  normalizePhone,
  displayPhone,
  canManageStore,
  canManageMembers,
} from './merchantModel';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Bell,
  Clock,
  UtensilsCrossed,
  Coffee,
  CloudRain,
  ShieldCheck,
  Volume2,
  Smartphone,
  Bike,
  Flame,
  Phone,
  User,
  Sliders,
  Users,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none ${
        checked ? 'bg-primary border border-primary' : 'bg-field/20 border border-field/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none ${
        checked
          ? 'bg-primary border-2 border-primary text-white shadow-sm'
          : 'bg-surface border-2 border-field text-transparent hover:border-ink-light'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Check
        className={`w-4 h-4 stroke-[3] transition-transform duration-150 ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      />
    </button>
  );
};

export const MerchantSettingsPage: React.FC = () => {
  const { currentUser, switchMerchant } = useAuthStore();

  // Estados de datos API
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [members, setMembers] = useState<StoreMember[]>([]);

  // Feedback
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tiempos de preparación por categoría (en minutos)
  const [prepTimeMainCourses, setPrepTimeMainCourses] = useState('25');
  const [prepTimeAppetizers, setPrepTimeAppetizers] = useState('15');
  const [prepTimeDrinks, setPrepTimeDrinks] = useState('8');
  const [prepTimeDesserts, setPrepTimeDesserts] = useState('10');

  // Tolerancia climática por lluvias en Tingo María
  const [rainDelayBuffer, setRainDelayBuffer] = useState(() => {
    return localStorage.getItem('quickly_merchant_rain_buffer') !== 'false';
  });

  // Canales de cobro habilitados
  const [acceptCash] = useState(true); // Siempre activo por regla de plataforma
  const [acceptYapePlin, setAcceptYapePlin] = useState(true);
  const [acceptCard, setAcceptCard] = useState(false);
  const [yapePhone, setYapePhone] = useState('');
  const [yapeHolder, setYapeHolder] = useState('');

  // Alertas operativas y sonido
  const [soundAlerts, setSoundAlerts] = useState(() => {
    return localStorage.getItem('quickly_merchant_sound_alerts') !== 'false';
  });
  const [notifyCourierArrival, setNotifyCourierArrival] = useState(true);
  const [alertKitchenDelay, setAlertKitchenDelay] = useState(true);
  const [maxConcurrentOrders, setMaxConcurrentOrders] = useState('10');

  // Horario semanal de atención (OpeningIntervals)
  const [intervals, setIntervals] = useState<
    { weekday: number; opensAt: string; closesAt: string }[]
  >([]);

  // Formulario para invitar/gestionar miembros
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'manager' | 'operator'>('operator');
  const [managingMemberBusy, setManagingMemberBusy] = useState(false);
  const [memberSuccessMsg, setMemberSuccessMsg] = useState<string | null>(null);

  // Cargar tiendas, detalle, horarios y miembros
  const loadSettingsData = useCallback(async (preferredStoreId?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const ownStoresResult = await operationsApi.ownStores();
      const items = ownStoresResult.items || [];
      setStores(items);

      if (items.length === 0) {
        setCurrentStore(null);
        setLoading(false);
        return;
      }

      const targetId =
        preferredStoreId ||
        currentUser?.merchantId ||
        items[0].id;
      const selectedItem = items.find((s) => s.id === targetId) || items[0];

      const [storeDetail, membersList] = await Promise.all([
        operationsApi.store(selectedItem.id),
        operationsApi.members(selectedItem.id).catch(() => []),
      ]);

      setCurrentStore(storeDetail);
      setMembers(membersList);
      setIntervals(storeDetail.openingIntervals || []);
      setPrepTimeMainCourses(String(storeDetail.preparationMinutes || 25));
      setYapePhone(displayPhone(storeDetail.phone));
      setYapeHolder(storeDetail.name || '');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la configuración de la tienda.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.merchantId]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const canEdit = canManageStore(currentStore?.membershipRole);
  const canAdminTeam = canManageMembers(currentStore?.membershipRole);

  const handleStepValue = (
    currentVal: string,
    setVal: React.Dispatch<React.SetStateAction<string>>,
    delta: number,
    min: number,
    max: number
  ) => {
    const num = parseInt(currentVal, 10) || min;
    const next = Math.max(min, Math.min(max, num + delta));
    setVal(String(next));
  };

  // Manejar cambio de turno en un día
  const handleUpdateInterval = (index: number, key: 'opensAt' | 'closesAt', val: string) => {
    setIntervals((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    );
  };

  // Agregar turno para un día específico
  const handleAddShift = (weekday: number) => {
    const existing = intervals.filter((row) => row.weekday === weekday);
    if (existing.length >= 4) {
      setErrorMessage('Máximo 4 turnos por día.');
      return;
    }
    setIntervals((prev) => [
      ...prev,
      { weekday, opensAt: '09:00', closesAt: '22:00' },
    ]);
  };

  // Quitar turno
  const handleRemoveShift = (indexToRemove: number) => {
    setIntervals((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Agregar o actualizar miembro del equipo
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !canAdminTeam) return;

    const email = memberEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    setManagingMemberBusy(true);
    setErrorMessage(null);
    setMemberSuccessMsg(null);

    try {
      await operationsApi.setMember(currentStore.id, {
        email,
        membershipRole: memberRole,
      });

      setMemberEmail('');
      setMemberSuccessMsg(`Membresía asignada correctamente a ${email}.`);
      setTimeout(() => setMemberSuccessMsg(null), 3500);

      const updatedMembers = await operationsApi.members(currentStore.id);
      setMembers(updatedMembers);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo registrar al integrante.');
    } finally {
      setManagingMemberBusy(false);
    }
  };

  // Revocar acceso a un miembro del equipo
  const handleRevokeMember = async (userId: string, memberName: string) => {
    if (!currentStore || !canAdminTeam) return;

    setManagingMemberBusy(true);
    setErrorMessage(null);
    try {
      await operationsApi.revokeMember(currentStore.id, userId);
      setMemberSuccessMsg(`Acceso revocado para ${memberName}.`);
      setTimeout(() => setMemberSuccessMsg(null), 3500);

      const updatedMembers = await operationsApi.members(currentStore.id);
      setMembers(updatedMembers);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo revocar el acceso.');
    } finally {
      setManagingMemberBusy(false);
    }
  };

  // Guardar configuración completa en el servidor
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    if (!canEdit) {
      setErrorMessage('Tu rol en la tienda no permite modificar la configuración.');
      return;
    }

    const parsedMinutes = parseInt(prepTimeMainCourses, 10) || 25;
    if (parsedMinutes < 1 || parsedMinutes > 1440) {
      setErrorMessage('El tiempo de preparación debe estar entre 1 y 1440 minutos.');
      return;
    }

    // Validar intervalos de horario
    for (const inv of intervals) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(inv.opensAt)) {
        setErrorMessage(`Horario de apertura inválido: ${inv.opensAt}. Formato requerido HH:mm (ej. 09:00).`);
        return;
      }
      if (!/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(inv.closesAt)) {
        setErrorMessage(`Horario de cierre inválido: ${inv.closesAt}. Formato requerido HH:mm o 24:00.`);
        return;
      }
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      // 1. Guardar parámetros de la tienda
      await operationsApi.updateStore(currentStore.id, {
        preparationMinutes: parsedMinutes,
        phone: normalizePhone(yapePhone),
      });

      // 2. Guardar horario semanal en el servidor
      await operationsApi.hours(currentStore.id, intervals);

      // 3. Persistir preferencias locales en el navegador
      localStorage.setItem('quickly_merchant_sound_alerts', String(soundAlerts));
      localStorage.setItem('quickly_merchant_rain_buffer', String(rainDelayBuffer));

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
      await loadSettingsData(currentStore.id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-xs text-ink-muted">Cargando configuración de la tienda...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-3">
        <div className="p-4 bg-destructive-soft border border-destructive-border rounded-2xl flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Error al consultar la configuración</p>
            <p>{loadError}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadSettingsData()}>
          Reintentar consulta
        </Button>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4 bg-surface rounded-2xl border border-border shadow-xs">
        <Sliders className="w-12 h-12 text-ink-muted mx-auto" />
        <h2 className="text-base font-bold text-ink">No tienes tiendas autorizadas</h2>
        <p className="text-xs text-ink-light max-w-md mx-auto">
          Para acceder a la configuración del local necesitas una membresía activa en una tienda.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              Configuración del Local
            </h1>
            <span className="text-[11px] sm:text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {currentStore.name}
            </span>

            {/* Selector de tienda si tiene varias */}
            {stores.length > 1 && (
              <div className="relative inline-block">
                <select
                  value={currentStore.id}
                  onChange={(e) => {
                    switchMerchant(e.target.value);
                    loadSettingsData(e.target.value);
                  }}
                  className="text-xs font-semibold bg-surface border border-border rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Control de tiempos de despacho, tolerancia por clima en Tingo María y métodos de cobro
          </p>
        </div>
      </div>

      {/* Banner de Feedback al Guardar con éxito */}
      {saved && (
        <div className="p-4 bg-selva-soft border border-selva-border rounded-2xl text-xs sm:text-sm text-selva-strong font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-selva flex-shrink-0" />
            <span>
              Configuración de cocina, horarios y cobros sincronizada y guardada con éxito en el servidor.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaved(false)}
            className="text-selva-strong/80 hover:text-selva-strong text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner de Error */}
      {errorMessage && (
        <div className="p-4 bg-destructive-soft border border-destructive-border rounded-2xl text-xs sm:text-sm text-destructive-strong font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECCIÓN 1: Tiempos de Preparación y Despacho en Cocina */}
        <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-border shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-primary-50 text-primary border border-primary-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Tiempos de Preparación por Categoría
              </h2>
              <p className="text-xs text-ink-light">
                Indica los minutos promedio para que el repartidor reciba la notificación en el momento exacto
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Categoría 1: Platos Principales */}
            <div className="p-4 rounded-2xl border border-border bg-surface-subtle/50 space-y-2.5">
              <div className="flex items-center gap-2 text-ink">
                <Flame className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Platos Calientes y Típicos</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Tacacho con cecina, juanes de gallina, patarashca, costillas ahumadas
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeMainCourses, setPrepTimeMainCourses, -5, 5, 90)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Disminuir minutos"
                >
                  -
                </button>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={prepTimeMainCourses}
                  onChange={(e) => setPrepTimeMainCourses(e.target.value)}
                  className="w-20 text-center font-black text-sm text-ink p-2 bg-surface rounded-xl border border-field focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeMainCourses, setPrepTimeMainCourses, 5, 5, 90)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Aumentar minutos"
                >
                  +
                </button>
                <span className="text-xs font-semibold text-ink-light ml-1">minutos</span>
              </div>
            </div>

            {/* Categoría 2: Entradas y Porciones Rápidas */}
            <div className="p-4 rounded-2xl border border-border bg-surface-subtle/50 space-y-2.5">
              <div className="flex items-center gap-2 text-ink">
                <UtensilsCrossed className="w-4 h-4 text-selva flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Entradas y Guarniciones Rápidas</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Plátanos fritos, yucas doradas, ensalada de chonta, caldos
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeAppetizers, setPrepTimeAppetizers, -2, 3, 45)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Disminuir minutos"
                >
                  -
                </button>
                <input
                  type="number"
                  min="3"
                  max="45"
                  value={prepTimeAppetizers}
                  onChange={(e) => setPrepTimeAppetizers(e.target.value)}
                  className="w-20 text-center font-black text-sm text-ink p-2 bg-surface rounded-xl border border-field focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeAppetizers, setPrepTimeAppetizers, 2, 3, 45)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Aumentar minutos"
                >
                  +
                </button>
                <span className="text-xs font-semibold text-ink-light ml-1">minutos</span>
              </div>
            </div>

            {/* Categoría 3: Bebidas y Jugos Naturales */}
            <div className="p-4 rounded-2xl border border-border bg-surface-subtle/50 space-y-2.5">
              <div className="flex items-center gap-2 text-ink">
                <Coffee className="w-4 h-4 text-info flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Bebidas y Jugos Amazónicos</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Camu camu, aguaje, cocona, maracuyá, refrescos embotellados
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeDrinks, setPrepTimeDrinks, -2, 2, 20)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Disminuir minutos"
                >
                  -
                </button>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={prepTimeDrinks}
                  onChange={(e) => setPrepTimeDrinks(e.target.value)}
                  className="w-20 text-center font-black text-sm text-ink p-2 bg-surface rounded-xl border border-field focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeDrinks, setPrepTimeDrinks, 2, 2, 20)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Aumentar minutos"
                >
                  +
                </button>
                <span className="text-xs font-semibold text-ink-light ml-1">minutos</span>
              </div>
            </div>

            {/* Categoría 4: Postres y Cafetería */}
            <div className="p-4 rounded-2xl border border-border bg-surface-subtle/50 space-y-2.5">
              <div className="flex items-center gap-2 text-ink">
                <Coffee className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold">Postres, Cacao y Cafetería</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-tight">
                Chocolates de Leoncio Prado, café pasado, postres de la selva
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeDesserts, setPrepTimeDesserts, -2, 2, 30)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Disminuir minutos"
                >
                  -
                </button>
                <input
                  type="number"
                  min="2"
                  max="30"
                  value={prepTimeDesserts}
                  onChange={(e) => setPrepTimeDesserts(e.target.value)}
                  className="w-20 text-center font-black text-sm text-ink p-2 bg-surface rounded-xl border border-field focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => handleStepValue(prepTimeDesserts, setPrepTimeDesserts, 2, 2, 30)}
                  className="w-10 h-10 rounded-xl bg-surface border border-field text-ink font-bold text-base hover:bg-surface-subtle touch-target flex items-center justify-center transition-colors"
                  aria-label="Aumentar minutos"
                >
                  +
                </button>
                <span className="text-xs font-semibold text-ink-light ml-1">minutos</span>
              </div>
            </div>
          </div>

          {/* Tolerancia por lluvias tropicales en Tingo María */}
          <div
            onClick={() => setRainDelayBuffer(!rainDelayBuffer)}
            className="p-4 rounded-2xl border border-info-border bg-info-soft flex items-center justify-between gap-3 cursor-pointer hover:bg-info-soft/80 transition-colors"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-info text-white flex-shrink-0 mt-0.5 sm:mt-0 shadow-sm">
                <CloudRain className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-ink">
                  Tolerancia climática automática (+10 min)
                </p>
                <p className="text-[11px] text-ink-light leading-relaxed">
                  Añade un margen preventivo de 10 minutos al estimado del comensal durante chaparrones o lluvias tropicales en Tingo María.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center">
              <ToggleSwitch
                checked={rainDelayBuffer}
                onChange={setRainDelayBuffer}
                ariaLabel="Tolerancia climática automática"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Horarios Semanales de Atención */}
        <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-border shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-primary-50 text-primary border border-primary-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Horario Semanal de Atención
              </h2>
              <p className="text-xs text-ink-light">
                Configura los turnos de apertura y cierre para cada día de la semana. La tienda solo abre cuando se encuentra dentro de su horario.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {WEEKDAYS.map((wd) => {
              const dayIntervals = intervals
                .map((row, idx) => ({ ...row, originalIndex: idx }))
                .filter((row) => row.weekday === wd.day);

              return (
                <div
                  key={wd.day}
                  className="p-3.5 rounded-2xl border border-border bg-surface-subtle/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-ink">{wd.name}</span>
                    {canEdit && dayIntervals.length < 4 && (
                      <button
                        type="button"
                        onClick={() => handleAddShift(wd.day)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar turno</span>
                      </button>
                    )}
                  </div>

                  {dayIntervals.length === 0 ? (
                    <p className="text-xs text-ink-muted italic">Cerrado todo el día</p>
                  ) : (
                    <div className="space-y-2">
                      {dayIntervals.map((shift) => (
                        <div
                          key={shift.originalIndex}
                          className="flex items-center gap-2 flex-wrap text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-ink-muted">Abre:</span>
                            <input
                              type="text"
                              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                              placeholder="09:00"
                              value={shift.opensAt}
                              disabled={!canEdit}
                              onChange={(e) =>
                                handleUpdateInterval(shift.originalIndex, 'opensAt', e.target.value)
                              }
                              className="w-20 text-center font-mono font-bold text-xs p-1.5 bg-surface border border-field rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-ink-muted">Cierra:</span>
                            <input
                              type="text"
                              pattern="(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)"
                              placeholder="22:00"
                              value={shift.closesAt}
                              disabled={!canEdit}
                              onChange={(e) =>
                                handleUpdateInterval(shift.originalIndex, 'closesAt', e.target.value)
                              }
                              className="w-20 text-center font-mono font-bold text-xs p-1.5 bg-surface border border-field rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleRemoveShift(shift.originalIndex)}
                              className="text-destructive hover:bg-destructive-soft p-1 rounded-lg text-xs"
                              title="Quitar turno"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 3: Equipo e Integrantes de la Tienda */}
        <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-border shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-selva-soft text-selva border border-selva-border">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Equipo e Integrantes de la Tienda
              </h2>
              <p className="text-xs text-ink-light">
                El encargado edita datos y productos; el operador atiende pedidos y comandas.
              </p>
            </div>
          </div>

          {memberSuccessMsg && (
            <div className="p-3 bg-selva-soft border border-selva-border rounded-xl text-xs text-selva-strong font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-selva flex-shrink-0" />
              <span>{memberSuccessMsg}</span>
            </div>
          )}

          {/* Listado de integrantes */}
          <div className="space-y-2.5">
            {members.map((member) => (
              <div
                key={member.userId}
                className="p-3 rounded-2xl border border-border bg-surface-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">{member.fullName}</p>
                  <p className="text-xs text-ink-light break-all">{member.email}</p>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="font-bold text-primary bg-primary-50 px-2 py-0.2 rounded capitalize">
                      {member.membershipRole === 'owner'
                        ? 'Propietario'
                        : member.membershipRole === 'manager'
                        ? 'Encargado'
                        : 'Operador'}
                    </span>
                    <span className={member.isActive ? 'text-selva-strong' : 'text-ink-muted'}>
                      {member.isActive ? '• Acceso Activo' : '• Acceso Revocado'}
                    </span>
                  </div>
                </div>

                {canAdminTeam && member.membershipRole !== 'owner' && member.isActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={managingMemberBusy}
                    onClick={() => handleRevokeMember(member.userId, member.fullName)}
                    className="text-xs text-destructive hover:bg-destructive-soft self-start sm:self-center"
                  >
                    Revocar acceso
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Formulario para agregar / invitar integrante */}
          {canAdminTeam ? (
            <div className="p-4 bg-primary-50/20 rounded-2xl border border-primary/20 space-y-3">
              <h3 className="font-bold text-xs sm:text-sm text-ink">Agregar o Modificar Integrante</h3>
              <p className="text-[11px] text-ink-muted">
                La persona debe contar con una cuenta registrada en Quickly con ese correo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-7">
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    disabled={managingMemberBusy}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-ink block mb-1">Rol</label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as 'manager' | 'operator')}
                    disabled={managingMemberBusy}
                    className="w-full bg-surface border border-field rounded-xl p-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary min-h-[38px]"
                  >
                    <option value="operator">Operador (Comandas)</option>
                    <option value="manager">Encargado (Catálogo)</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={managingMemberBusy || !memberEmail.trim()}
                    onClick={handleSaveMember}
                    className="w-full min-h-[38px] text-xs font-bold rounded-xl"
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-muted italic">
              Solo el propietario de la tienda puede administrar los integrantes del equipo.
            </p>
          )}
        </div>

        {/* SECCIÓN 4: Medios de Cobro y Facturación en Local */}
        <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-border shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-selva-soft text-selva border border-selva-border">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Medios de Cobro Habilitados
              </h2>
              <p className="text-xs text-ink-light">
                Define las formas de pago que tus comensales pueden usar para pedir a tu tienda
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Medio 1: Efectivo contra Entrega */}
            <div
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                acceptCash
                  ? 'border-primary/30 bg-primary-50/20'
                  : 'border-border bg-surface opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-selva-soft text-selva border border-selva-border flex-shrink-0">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">Efectivo contra entrega</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Medio principal activo. El repartidor de Quickly cobra al cliente en puerta en Tingo María y rinde cuentas al comercio.
                  </p>
                </div>
              </div>
              <CustomCheckbox
                checked={acceptCash}
                disabled={true}
                onChange={() => {}}
                ariaLabel="Efectivo contra entrega"
              />
            </div>

            {/* Medio 2: Yape / Plin Digital */}
            <div
              className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                acceptYapePlin
                  ? 'border-primary/30 bg-primary-50/20'
                  : 'border-border bg-surface opacity-80'
              }`}
            >
              <div
                onClick={() => setAcceptYapePlin(!acceptYapePlin)}
                className="flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-primary-50 text-primary border border-primary-100 flex-shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-ink">Yape / Plin Digital (Coordinación)</p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Transferencia directa al número celular de tu negocio en Tingo María.
                    </p>
                  </div>
                </div>
                <CustomCheckbox
                  checked={acceptYapePlin}
                  onChange={setAcceptYapePlin}
                  ariaLabel="Yape / Plin Digital"
                />
              </div>

              {acceptYapePlin && (
                <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">
                      Número Celular Yape / Plin (Se guarda en tu perfil comercial)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="tel"
                        value={yapePhone}
                        onChange={(e) => setYapePhone(e.target.value)}
                        placeholder="Ej. 962 123 456"
                        className="w-full bg-surface border border-field rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-ink font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                      />
                      <Phone className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">
                      Titular de la cuenta
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={yapeHolder}
                        onChange={(e) => setYapeHolder(e.target.value)}
                        placeholder="Ej. La Selva Gourmet SAC"
                        className="w-full bg-surface border border-field rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-ink font-bold focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                      />
                      <User className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Medio 3: Tarjeta de Crédito / Débito */}
            <div
              onClick={() => setAcceptCard(!acceptCard)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                acceptCard
                  ? 'border-primary/30 bg-primary-50/20'
                  : 'border-border bg-surface opacity-80 hover:bg-surface-subtle/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-info-soft text-info border border-info-border flex-shrink-0">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">Tarjeta de Débito / Crédito</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Pagos digitales con pasarela o datáfono móvil (Sujeto a integración de procesador de pagos).
                  </p>
                </div>
              </div>
              <CustomCheckbox
                checked={acceptCard}
                onChange={setAcceptCard}
                ariaLabel="Tarjeta de Débito / Crédito"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Alertas Operativas y Capacidad en Cocina */}
        <div className="bg-surface p-5 sm:p-7 rounded-3xl border border-border shadow-subtle space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-warning-soft text-warning border border-warning-border">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">
                Alertas y Capacidad Operativa
              </h2>
              <p className="text-xs text-ink-light">
                Notificaciones en tiempo real y límite de órdenes simultáneas para evitar demoras
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => setSoundAlerts(!soundAlerts)}
              className="p-3.5 rounded-2xl border border-border bg-surface-subtle/40 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle transition-colors"
            >
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">Timbre sonoro de nueva comanda</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Emite un sonido de campana de cocina al ingresar una orden para llamar la atención del cocinero
                  </p>
                </div>
              </div>
              <CustomCheckbox
                checked={soundAlerts}
                onChange={setSoundAlerts}
                ariaLabel="Timbre sonoro de nueva comanda"
              />
            </div>

            <div
              onClick={() => setNotifyCourierArrival(!notifyCourierArrival)}
              className="p-3.5 rounded-2xl border border-border bg-surface-subtle/40 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bike className="w-5 h-5 text-info flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">Aviso de repartidor en camino a recoger</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Alerta cuando el motorizado asignado se encuentre a menos de 5 minutos del local
                  </p>
                </div>
              </div>
              <CustomCheckbox
                checked={notifyCourierArrival}
                onChange={setNotifyCourierArrival}
                ariaLabel="Aviso de repartidor en camino a recoger"
              />
            </div>

            <div
              onClick={() => setAlertKitchenDelay(!alertKitchenDelay)}
              className="p-3.5 rounded-2xl border border-border bg-surface-subtle/40 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">Recordatorio de comanda demorada</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Avisa si una comanda supera los 20 minutos de preparación sin haberse marcado como lista
                  </p>
                </div>
              </div>
              <CustomCheckbox
                checked={alertKitchenDelay}
                onChange={setAlertKitchenDelay}
                ariaLabel="Recordatorio de comanda demorada"
              />
            </div>

            <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs sm:text-sm text-ink flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-ink-light" />
                  <span>Límite de comandas simultáneas en cocina</span>
                </p>
                <p className="text-xs text-ink-muted">
                  Pausa temporal automática si la cocina supera este número de órdenes al mismo tiempo
                </p>
              </div>

              <select
                value={maxConcurrentOrders}
                onChange={(e) => setMaxConcurrentOrders(e.target.value)}
                className="bg-surface border border-field rounded-xl py-2 px-3 text-xs sm:text-sm font-bold text-ink min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="5">Hasta 5 comandas</option>
                <option value="10">Hasta 10 comandas (Recomendado)</option>
                <option value="15">Hasta 15 comandas</option>
                <option value="99">Sin límite (Cocina amplia)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 6: Botón de Guardado */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-ink-light">
            <ShieldCheck className="w-4 h-4 text-selva flex-shrink-0" />
            <span>Los cambios se guardan y sincronizan directamente con el servidor en Tingo María</span>
          </div>

          {canEdit && (
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saving}
              className="w-full sm:w-auto min-h-[44px] touch-target px-8 font-bold shadow-subtle text-xs justify-center rounded-xl"
            >
              Guardar Configuración
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
