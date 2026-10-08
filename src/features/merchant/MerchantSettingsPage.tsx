import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
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
} from 'lucide-react';

export const MerchantSettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  // Category prep times (F-5)
  const [prepTimeMainCourses, setPrepTimeMainCourses] = useState('25');
  const [prepTimeAppetizers, setPrepTimeAppetizers] = useState('15');
  const [prepTimeDrinks, setPrepTimeDrinks] = useState('8');
  const [prepTimeDesserts, setPrepTimeDesserts] = useState('10');
  const [rainDelayBuffer, setRainDelayBuffer] = useState(true);

  // Payment methods
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptYapePlin, setAcceptYapePlin] = useState(true);

  // Sound alerts
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [notifyCourierArrival, setNotifyCourierArrival] = useState(true);

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Configuración del Local</h1>
          <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
            {currentMerchant.name}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-ink-light mt-1">
          Ajustes de tiempos de preparación en cocina, tolerancia por lluvias y cobros
        </p>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-gray-100 shadow-subtle space-y-7">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Configuración de cocina y tiempos de despacho guardada con éxito.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-7">
          {/* F-5: Category Prep Times */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-ink">
                Tiempos de Preparación por Categoría (F-5)
              </h2>
            </div>
            <p className="text-xs text-ink-light leading-relaxed">
              Define los minutos promedio de cocción para que el repartidor reciba la notificación en
              el momento exacto y la comida llegue caliente al cliente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-ink">
                  <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-extrabold">Platos Calientes y Tradicionales</span>
                </div>
                <p className="text-[11px] text-gray-500">Tacacho con cecina, juanes, patarashca</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={prepTimeMainCourses}
                    onChange={(e) => setPrepTimeMainCourses(e.target.value)}
                    className="w-20 text-xs sm:text-sm font-extrabold text-ink p-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-center"
                  />
                  <span className="text-xs font-bold text-gray-700">minutos</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-ink">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-extrabold">Entradas y Porciones Rápidas</span>
                </div>
                <p className="text-[11px] text-gray-500">Plátanos fritos, yucas doradas, caldos</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="3"
                    max="45"
                    value={prepTimeAppetizers}
                    onChange={(e) => setPrepTimeAppetizers(e.target.value)}
                    className="w-20 text-xs sm:text-sm font-extrabold text-ink p-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-center"
                  />
                  <span className="text-xs font-bold text-gray-700">minutos</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-ink">
                  <Coffee className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-extrabold">Bebidas y Jugos Naturales</span>
                </div>
                <p className="text-[11px] text-gray-500">Camu camu, cocona, aguaje, refrescos</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={prepTimeDrinks}
                    onChange={(e) => setPrepTimeDrinks(e.target.value)}
                    className="w-20 text-xs sm:text-sm font-extrabold text-ink p-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-center"
                  />
                  <span className="text-xs font-bold text-gray-700">minutos</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 text-ink">
                  <Coffee className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-extrabold">Postres y Cafetería</span>
                </div>
                <p className="text-[11px] text-gray-500">Cacao orgánico, café de Leoncio Prado</p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={prepTimeDesserts}
                    onChange={(e) => setPrepTimeDesserts(e.target.value)}
                    className="w-20 text-xs sm:text-sm font-extrabold text-ink p-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-center"
                  />
                  <span className="text-xs font-bold text-gray-700">minutos</span>
                </div>
              </div>
            </div>

            {/* Rain Buffer in Tingo María */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CloudRain className="w-5 h-5 text-sky-600 flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-xs sm:text-sm text-ink">
                    Tolerancia climática automática (+10 min)
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Añade un margen de seguridad al estimado del cliente en días de lluvia tropical en Tingo María.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={rainDelayBuffer}
                onChange={(e) => setRainDelayBuffer(e.target.checked)}
                className="w-5 h-5 text-primary rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Payment Methods Acceptance */}
          <div className="space-y-3.5 pt-4 border-t border-gray-100">
            <h2 className="text-base font-extrabold text-ink">Medios de Cobro Habilitados</h2>
            <div className="space-y-2.5">
              <label className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-ink">Efectivo contra entrega</p>
                    <p className="text-xs text-gray-500">
                      El repartidor de Quickly cobra al cliente y liquida el total.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={acceptCash}
                  onChange={(e) => setAcceptCash(e.target.checked)}
                  className="w-5 h-5 text-primary rounded cursor-pointer"
                />
              </label>

              <label className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-ink">Yape / Plin digital</p>
                    <p className="text-xs text-gray-500">
                      Transferencia directa al número celular tingalés registrado de tu negocio.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={acceptYapePlin}
                  onChange={(e) => setAcceptYapePlin(e.target.checked)}
                  className="w-5 h-5 text-primary rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Operations & Alerts */}
          <div className="space-y-3.5 pt-4 border-t border-gray-100">
            <h2 className="text-base font-extrabold text-ink">Alertas y Notificaciones de Cocina</h2>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <Volume2 className="w-4 h-4 text-primary" />
                <span>Emitir timbre de aviso audible al entrar una comanda nueva</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyCourierArrival}
                  onChange={(e) => setNotifyCourierArrival(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <Bell className="w-4 h-4 text-primary" />
                <span>Avisar cuando el repartidor esté a menos de 5 minutos de llegar al local</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 hidden sm:inline flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Configuración sincronizada con los despachos de Tingo María</span>
            </span>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="min-h-[44px] px-6 font-bold shadow-subtle w-full sm:w-auto"
            >
              Guardar Configuración
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
