import React, { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import {
  Check,
  CheckCircle2,
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
  AlertCircle,
  Phone,
  User,
  Sliders,
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
  const { currentUser } = useAuthStore();
  const { merchants, updateMerchantProfile } = useDataStore();

  const currentMerchant = useMemo(() => {
    return (
      merchants.find(
        (m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId
      ) || merchants[0]
    );
  }, [merchants, currentUser]);

  // Tiempos de preparación por categoría (en minutos)
  const [prepTimeMainCourses, setPrepTimeMainCourses] = useState(
    currentMerchant.prepTimeMinutes ? String(currentMerchant.prepTimeMinutes) : '25'
  );
  const [prepTimeAppetizers, setPrepTimeAppetizers] = useState('15');
  const [prepTimeDrinks, setPrepTimeDrinks] = useState('8');
  const [prepTimeDesserts, setPrepTimeDesserts] = useState('10');

  // Tolerancia climática por lluvias en Tingo María
  const [rainDelayBuffer, setRainDelayBuffer] = useState(true);

  // Canales de cobro habilitados
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptYapePlin, setAcceptYapePlin] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [yapePhone, setYapePhone] = useState(currentMerchant.phone || '962 789 101');
  const [yapeHolder, setYapeHolder] = useState(currentMerchant.name || 'La Selva Gourmet');

  // Alertas operativas y sonido
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [notifyCourierArrival, setNotifyCourierArrival] = useState(true);
  const [alertKitchenDelay, setAlertKitchenDelay] = useState(true);

  // Capacidad de comandas en cocina
  const [maxConcurrentOrders, setMaxConcurrentOrders] = useState('10');

  // Estado de feedback de guardado
  const [saved, setSaved] = useState(false);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Persistir el tiempo de preparación principal en el perfil del comercio
    const parsedMinutes = parseInt(prepTimeMainCourses, 10) || 25;
    updateMerchantProfile(currentMerchant.id, {
      prepTimeMinutes: parsedMinutes,
      phone: yapePhone.trim(),
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* BLOQUE 1: Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              Configuración del Local
            </h1>
            <span className="text-[11px] sm:text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
              {currentMerchant.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Control de tiempos de despacho, tolerancia por clima en Tingo María y métodos de cobro
          </p>
        </div>
      </div>

      {/* Banner de Feedback al Guardar */}
      {saved && (
        <div className="p-4 bg-selva-soft border border-selva-border rounded-2xl text-xs sm:text-sm text-selva-strong font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-selva flex-shrink-0" />
            <span>
              Configuración de cocina, tiempos y cobros guardada y sincronizada con éxito en Tingo María.
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

        {/* SECCIÓN 2: Medios de Cobro y Facturación en Local */}
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
              onClick={() => setAcceptCash(!acceptCash)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                acceptCash
                  ? 'border-primary/30 bg-primary-50/20'
                  : 'border-border bg-surface opacity-80 hover:bg-surface-subtle/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-selva-soft text-selva border border-selva-border flex-shrink-0">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-ink">Efectivo contra entrega</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    El repartidor de Quickly cobra al cliente en puerta y rinde cuentas al comercio
                  </p>
                </div>
              </div>
              <CustomCheckbox
                checked={acceptCash}
                onChange={setAcceptCash}
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
                    <p className="font-bold text-xs sm:text-sm text-ink">Yape / Plin Digital</p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Transferencia directa al número celular tingalés registrado de tu negocio
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
                      Número Celular Yape / Plin
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
                    Pago seguro procesado en línea o con datáfono móvil del repartidor
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

        {/* SECCIÓN 3: Alertas Operativas y Capacidad en Cocina */}
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

            {/* Capacidad máxima simultánea */}
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

        {/* SECCIÓN 4: Botón de Guardado y Garantía */}
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-ink-light">
            <ShieldCheck className="w-4 h-4 text-selva flex-shrink-0" />
            <span>Los cambios se sincronizan en tiempo real para repartidores y clientes en Tingo María</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto min-h-[44px] touch-target px-8 font-bold shadow-subtle text-xs justify-center"
          >
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
};
