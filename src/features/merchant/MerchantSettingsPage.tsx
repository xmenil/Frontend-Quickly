import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CheckCircle2, CreditCard, Banknote, Bell } from 'lucide-react';

export const MerchantSettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { merchants } = useDataStore();

  const currentMerchant =
    merchants.find((m) => m.ownerUserId === currentUser?.id || m.id === currentUser?.merchantId) ||
    merchants[0];

  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptYapePlin, setAcceptYapePlin] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Configuración de Tienda</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Ajustes de medios de cobro y notificaciones para {currentMerchant.name}
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuración guardada en la sesión demo.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Payment Methods Acceptance */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Medios de Pago Habilitados
            </h3>
            <div className="space-y-2.5">
              <label className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-sm text-ink">Efectivo contra entrega</p>
                    <p className="text-xs text-gray-500">El repartidor cobra al entregar</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={acceptCash}
                  onChange={(e) => setAcceptCash(e.target.checked)}
                  className="w-5 h-5 text-primary rounded"
                />
              </label>

              <label className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-bold text-sm text-ink">Yape / Plin digital</p>
                    <p className="text-xs text-gray-500">Pagos instantáneos prepagados</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={acceptYapePlin}
                  onChange={(e) => setAcceptYapePlin(e.target.checked)}
                  className="w-5 h-5 text-primary rounded"
                />
              </label>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Notificaciones</h3>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <span>Emitir sonido de aviso al recibir un nuevo pedido</span>
            </label>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <Button type="submit" variant="primary" size="md">
              Guardar Preferencias
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
