import React, { useState, useEffect } from 'react';
import { operationsApi, Zone } from '../../services/api/operationsApi';
import { formatCents } from '../../lib/currency';
import { MapPin, ChevronDown, Check, Clock, Bike, X, Loader2, Navigation, Compass } from 'lucide-react';

interface ZoneSelectorProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'button' | 'header-light' | 'topbar';
  onChangeZone?: (zoneId: string) => void;
}

const ZONE_LANDMARKS: Record<string, string[]> = {
  'castillo': ['Puente Corpac', 'Aeropuerto', 'Las Orquídeas', 'Av. Iquitos'],
  'centro': ['Plaza de Armas', 'Jr. Raymondi', 'Alameda Perú', 'Jr. Ucayali', 'Mercado Modelo'],
  'norte': ['Av. Universitaria', 'Campus UNAS', 'Bella Durmiente', 'Naranjillo'],
  'sur': ['Sector Afilador', 'Jr. Monzón', 'Salida a Huánuco', 'Puente Pérez'],
};

function getLandmarksForZone(zone: Zone): string[] {
  const code = ((zone.code || '') + ' ' + (zone.id || '') + ' ' + (zone.name || '')).toLowerCase();
  for (const [key, landmarks] of Object.entries(ZONE_LANDMARKS)) {
    if (code.includes(key)) return landmarks;
  }
  return zone.description
    ? zone.description.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  className = '',
  variant = 'navbar',
  onChangeZone,
}) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    return localStorage.getItem('quickly_selected_zone') || '';
  });
  const [isOpen, setIsOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    operationsApi
      .zones()
      .then((data) => {
        if (isMounted) {
          const activeZones = data.filter((z) => z.isActive);
          setZones(activeZones);
          setLoading(false);
          const saved = localStorage.getItem('quickly_selected_zone');
          if (saved && activeZones.some((z) => z.id === saved)) {
            setSelectedZoneId(saved);
          } else if (activeZones[0]) {
            setSelectedZoneId(activeZones[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Error cargando zonas de Tingo María:', err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Solicitar ubicación al ingresar por primera vez si no está configurada
  useEffect(() => {
    const hasSetLocation = localStorage.getItem('quickly_user_location_set');
    if (!hasSetLocation) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Sincronizar cambios externos de zona
  useEffect(() => {
    const handleZoneChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ zoneId: string }>;
      if (customEvent.detail?.zoneId) {
        setSelectedZoneId(customEvent.detail.zoneId);
      }
    };
    window.addEventListener('quickly:zone-changed', handleZoneChange);
    return () => {
      window.removeEventListener('quickly:zone-changed', handleZoneChange);
    };
  }, []);

  useEffect(() => {
    if (selectedZoneId) {
      localStorage.setItem('quickly_selected_zone', selectedZoneId);
      const matched = zones.find((z) => z.id === selectedZoneId);
      if (matched) {
        localStorage.setItem('quickly_selected_zone_name', matched.name);
      }
    }
  }, [selectedZoneId, zones]);

  const currentZone = zones.find((z) => z.id === selectedZoneId) || zones[0];

  const handleSelect = (zoneId: string, landmark?: string) => {
    setSelectedZoneId(zoneId);
    localStorage.setItem('quickly_user_location_set', 'true');
    const matched = zones.find((z) => z.id === zoneId);
    if (matched) {
      localStorage.setItem('quickly_selected_zone_name', matched.name);
    }
    if (landmark) {
      localStorage.setItem('quickly_selected_landmark', landmark);
    }
    window.dispatchEvent(
      new CustomEvent('quickly:zone-changed', {
        detail: { zoneId, zoneName: matched?.name || '', landmark },
      })
    );
    setIsOpen(false);
    if (onChangeZone) {
      onChangeZone(zoneId);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsMessage('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setGpsStatus('detecting');
    setGpsMessage('Detectando tu ubicación en Tingo María...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Búsqueda de coincidencia geográfica en Tingo María
        // Coordenadas Tingo María aprox: Lat -9.29, Lon -75.99
        let matchedZone = zones[0];

        if (longitude < -75.998) {
          // Oeste del río Huallaga: Castillo Grande
          matchedZone =
            zones.find((z) => z.name.toLowerCase().includes('castillo')) || zones[0];
        } else if (latitude > -9.290) {
          // Norte: UNAS / Rupa Rupa Norte
          matchedZone =
            zones.find((z) => z.name.toLowerCase().includes('norte')) || zones[0];
        } else if (latitude < -9.304) {
          // Sur: Afilador / Rupa Rupa Sur
          matchedZone =
            zones.find((z) => z.name.toLowerCase().includes('sur')) || zones[0];
        } else {
          // Centro
          matchedZone =
            zones.find((z) => z.name.toLowerCase().includes('centro')) || zones[0];
        }

        if (matchedZone) {
          setGpsStatus('success');
          setGpsMessage(`Ubicación detectada: ${matchedZone.name}`);
          setTimeout(() => {
            handleSelect(matchedZone.id);
            setGpsStatus('idle');
            setGpsMessage('');
          }, 800);
        } else {
          setGpsStatus('error');
          setGpsMessage('No se pudo determinar la zona exacta. Elige una opción abajo.');
        }
      },
      () => {
        // En caso de denegación de permisos o error
        const fallbackZone =
          zones.find((z) => z.name.toLowerCase().includes('centro')) || zones[0];
        setGpsStatus('error');
        setGpsMessage(
          'Permiso de GPS no concedido. Selecciona tu lugar de entrega en la lista.'
        );
        if (fallbackZone) {
          setTimeout(() => {
            setGpsStatus('idle');
          }, 3500);
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'header-light' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 text-xs text-gray-700 hover:text-primary transition-colors text-left cursor-pointer group ${className}`}
          aria-label={`Zona de entrega actual: ${currentZone?.name || 'Tingo María'}. Clic para cambiar`}
        >
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 font-normal">Ingresa tu ubicación:</span>
            <span className="font-bold text-gray-900 group-hover:text-primary flex items-center gap-0.5">
              <span className="max-w-[140px] sm:max-w-[180px] truncate">{currentZone?.name || 'Tingo María'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" />
            </span>
          </div>
        </button>
      ) : variant === 'topbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer ${className}`}
          aria-label={`Zona de entrega actual: ${currentZone?.name || 'Tingo María'}. Clic para cambiar`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-gray-400 font-normal">Enviar a</span>
          <span className="font-bold text-white max-w-[150px] truncate">{currentZone?.name || 'Tingo María'}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      ) : variant === 'navbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 text-left cursor-pointer ${className}`}
          aria-label={`Zona de entrega actual: ${currentZone?.name}. Clic para cambiar`}
        >
          <MapPin className="w-4 h-4 text-white flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-emerald-100">Enviar a</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-white max-w-[130px] sm:max-w-[160px] truncate">
                {currentZone?.name || 'Tingo María'}
              </span>
              <ChevronDown className="w-3 h-3 text-white flex-shrink-0" />
            </div>
          </div>
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-ink text-xs font-bold shadow-xs hover:shadow-sm border border-gray-100 transition-all cursor-pointer flex-shrink-0 ${className}`}
          aria-label={`Zona actual: ${currentZone?.name}. Clic para cambiar`}
        >
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate max-w-[160px]">Tingo María • {currentZone?.name?.replace(' de Tingo María', '') || 'Centro'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 stroke-[2.5]" />
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

            {/* GPS Ubicación Automática */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Ubicación GPS Automática</p>
                    <p className="text-[11px] text-gray-600">Detecta tu zona exacta con un solo toque</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={gpsStatus === 'detecting'}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                >
                  {gpsStatus === 'detecting' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detectando...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>Usar mi GPS</span>
                    </>
                  )}
                </button>
              </div>

              {gpsMessage && (
                <p className={`text-[11px] font-medium px-2 py-1 rounded-lg ${
                  gpsStatus === 'error'
                    ? 'text-red-700 bg-red-50 border border-red-200'
                    : 'text-emerald-800 bg-emerald-100/70 border border-emerald-200'
                }`}>
                  {gpsMessage}
                </p>
              )}
            </div>

            {/* Zone List */}
            <div className="space-y-2.5 pt-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Cargando zonas de cobertura...</span>
                </div>
              ) : zones.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  No se encontraron zonas de reparto activas.
                </div>
              ) : (
                zones.map((zone) => {
                  const isSelected = zone.id === selectedZoneId;
                  const landmarks = getLandmarksForZone(zone);

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

                      {/* Desglose de lugares de referencia como etiquetas interactivas */}
                      {landmarks.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap gap-1">
                          {landmarks.map((lm) => (
                            <span
                              key={lm}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(zone.id, lm);
                              }}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/15 text-primary hover:bg-primary/25'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {lm}
                            </span>
                          ))}
                        </div>
                      )}

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
              }))}
            </div>

            {/* Bottom info */}
            <div className="pt-2 text-center text-[11px] text-gray-500 border-t border-gray-100 flex items-center justify-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-gray-900 stroke-[2.2]" />
              <span>Reparto disponible de 7:00 am a 11:00 pm en todo el valle de la selva</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
