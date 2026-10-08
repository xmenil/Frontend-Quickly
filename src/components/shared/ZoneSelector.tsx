import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { MapPin, ChevronDown, Check, Clock, Bike, X } from 'lucide-react';

interface ZoneSelectorProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'button';
  onChangeZone?: (zoneId: string) => void;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  className = '',
  variant = 'navbar',
  onChangeZone,
}) => {
  const { zones } = useDataStore();
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    return localStorage.getItem('quickly_selected_zone') || zones[0]?.id || 'z_centro';
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('quickly_selected_zone', selectedZoneId);
  }, [selectedZoneId]);

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const handleSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setIsOpen(false);
    if (onChangeZone) {
      onChangeZone(zoneId);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'navbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 text-left cursor-pointer ${className}`}
          aria-label={`Zona de entrega actual: ${currentZone?.name}. Clic para cambiar`}
        >
          <MapPin className="w-4 h-4 text-white flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-pink-100/80">Enviar a</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-white max-w-[130px] sm:max-w-[160px] truncate">
                {currentZone?.name || 'Tingo María'}
              </span>
              <ChevronDown className="w-3 h-3 text-pink-100/90 flex-shrink-0" />
            </div>
          </div>
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-gray-200 text-xs font-bold text-ink hover:border-primary hover:text-primary transition-all shadow-subtle ${className}`}
        >
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="truncate max-w-[140px]">{currentZone?.name}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center justify-between w-full p-3 rounded-xl border border-gray-200 bg-white hover:border-primary transition-colors text-left ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center text-primary">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Zona de entrega seleccionada</p>
              <p className="font-bold text-sm text-ink">{currentZone?.name}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary">Cambiar</span>
        </button>
      )}

      {/* Modal / Bottom Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-floating border border-gray-100 space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="zone-dialog-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="zone-dialog-title" className="font-extrabold text-base text-ink">
                    ¿Dónde estás en Tingo María?
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ajustamos los comercios, tiempos y tarifa de delivery exactos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar selección de zona"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zone List */}
            <div className="space-y-2.5 pt-1">
              {zones.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleSelect(zone.id)}
                    className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary-soft/60 shadow-subtle ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50/80 bg-white'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{zone.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {zone.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1 text-ink font-semibold">
                          <Bike className="w-3.5 h-3.5 text-primary" />
                          <span>Envío {formatCents(zone.baseFeeCents)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="tabular-nums">~{zone.estimatedMinutes} min</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex-shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom info */}
            <div className="pt-2 text-center text-[11px] text-gray-500 border-t border-gray-100">
              <span>🛵 Reparto disponible de 7:00 am a 11:00 pm en todo el valle de la selva</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
