import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Store, Star, Power, MapPin, Bike } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminMerchantsPage: React.FC = () => {
  const { merchants, updateMerchantProfile } = useDataStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Comercios Afiliados</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Supervisión de tiendas, estado abierto/cerrado y tarifas en Tingo María
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {merchants.map((m) => (
            <div
              key={m.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors text-xs"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={m.logoUrl}
                  alt={m.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-ink">{m.name}</h3>
                    <span className="text-[10px] bg-primary-light text-primary font-bold px-2 py-0.5 rounded-full uppercase">
                      {m.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {m.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">{m.address}</p>
                  <div className="flex items-center gap-3 mt-1 text-gray-400">
                    <span className="text-amber-500 font-bold">★ {m.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span>Envío: {formatCents(m.deliveryFeeCents)}</span>
                    <span>•</span>
                    <span>Prep: {m.prepTimeMinutes} min</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  variant={m.isOpen ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => updateMerchantProfile(m.id, { isOpen: !m.isOpen })}
                >
                  <Power className="w-3.5 h-3.5 mr-1" />
                  <span>{m.isOpen ? 'Pausar Local' : 'Abrir Local'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminCouriersPage: React.FC = () => {
  const { couriers, toggleCourierAvailability } = useDataStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Flota de Repartidores</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Supervisión de repartidores activos, vehículos y disponibilidad en Tingo María
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {couriers.map((c) => (
            <div
              key={c.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors text-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center font-bold text-sm">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-ink">{c.name}</h3>
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full capitalize">
                      {c.vehicleType}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.isAvailable ? 'En Línea' : 'En Descanso'}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    Tel: {c.phone} • Placa: {c.plate || 'Sin placa'}
                  </p>
                  <p className="text-gray-400 mt-0.5">
                    Zona: {c.currentZone} • Calificación: ★ {c.rating.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCourierAvailability(c.id)}
                >
                  <Power className="w-3.5 h-3.5 mr-1" />
                  <span>{c.isAvailable ? 'Pausar' : 'Activar'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
