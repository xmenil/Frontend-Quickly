import React, { useState, useEffect, useRef } from 'react';
import { operationsApi, Zone } from '../../services/api/operationsApi';
import { formatCents } from '../../lib/currency';
import {
  MapPin,
  ChevronDown,
  Check,
  Bike,
  X,
  Loader2,
  Navigation,
  Compass,
} from 'lucide-react';

interface ZoneSelectorProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'button' | 'header-light' | 'topbar';
  onChangeZone?: (zoneId: string) => void;
}

const DEFAULT_TINGO_ZONES: Zone[] = [
  {
    id: 'zone-castillo-grande',
    code: 'castillo-grande',
    name: 'Castillo Grande',
    description: 'Cruzando Puente Corpac, Aeropuerto, Las Orquídeas',
    baseFeeCents: 650,
    estimatedMinutes: 35,
    isActive: true,
  },
  {
    id: 'zone-centro',
    code: 'centro',
    name: 'Centro de Tingo María',
    description: 'Plaza de Armas, Jr. Raymondi, Alameda Perú, Jr. Ucayali',
    baseFeeCents: 400,
    estimatedMinutes: 20,
    isActive: true,
  },
  {
    id: 'zone-rupa-rupa-norte',
    code: 'rupa-rupa-norte',
    name: 'Rupa Rupa Norte / UNAS',
    description: 'Av. Universitaria, Campus UNAS, Bella Durmiente',
    baseFeeCents: 500,
    estimatedMinutes: 25,
    isActive: true,
  },
  {
    id: 'zone-rupa-rupa-sur',
    code: 'rupa-rupa-sur',
    name: 'Rupa Rupa Sur / Afilador',
    description: 'Sector Afilador, Jr. Monzón, salida a Huánuco',
    baseFeeCents: 550,
    estimatedMinutes: 30,
    isActive: true,
  },
];

const ZONE_LANDMARKS: Record<string, string[]> = {
  castillo: ['Puente Corpac', 'Aeropuerto', 'Las Orquídeas', 'Av. Iquitos'],
  centro: ['Plaza de Armas', 'Jr. Raymondi', 'Alameda Perú', 'Jr. Ucayali', 'Mercado Modelo'],
  norte: ['Av. Universitaria', 'Campus UNAS', 'Bella Durmiente', 'Naranjillo'],
  sur: ['Sector Afilador', 'Jr. Monzón', 'Salida a Huánuco', 'Puente Pérez'],
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<Zone[]>(DEFAULT_TINGO_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    return localStorage.getItem('quickly_selected_zone') || DEFAULT_TINGO_ZONES[0].id;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    operationsApi
      .zones()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const activeZones = data.filter((z) => z.isActive);
          if (activeZones.length > 0) {
            setZones(activeZones);
            const saved = localStorage.getItem('quickly_selected_zone');
            if (saved && activeZones.some((z) => z.id === saved)) {
              setSelectedZoneId(saved);
            }
          }
        }
      })
      .catch((err) => {
        // En caso de corte o desconexión, se conservan los DEFAULT_TINGO_ZONES
        console.debug('Usando zonas por defecto de Tingo María:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cierre limpio al hacer clic afuera del cuadro desplegable
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
          setGpsMessage(`Detectado: ${matchedZone.name}`);
          setTimeout(() => {
            handleSelect(matchedZone.id);
            setGpsStatus('idle');
            setGpsMessage('');
          }, 600);
        } else {
          setGpsStatus('error');
          setGpsMessage('Selecciona tu lugar de entrega abajo.');
        }
      },
      () => {
        setGpsStatus('error');
        setGpsMessage('GPS no disponible. Selecciona tu lugar de entrega en la lista.');
        setTimeout(() => setGpsStatus('idle'), 3000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Botón Trigger de Ubicación */}
      {variant === 'header-light' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 text-xs text-gray-700 hover:text-primary transition-colors text-left cursor-pointer group ${className}`}
          aria-expanded={isOpen}
          aria-label={`Zona de entrega actual: ${currentZone?.name || 'Tingo María'}. Clic para cambiar`}
        >
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 font-normal">Ingresa tu ubicación:</span>
            <span className="font-bold text-gray-900 group-hover:text-primary flex items-center gap-0.5">
              <span className="max-w-[140px] sm:max-w-[180px] truncate">{currentZone?.name || 'Tingo María'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </span>
          </div>
        </button>
      ) : variant === 'topbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer ${className}`}
          aria-expanded={isOpen}
          aria-label={`Zona de entrega actual: ${currentZone?.name || 'Tingo María'}. Clic para cambiar`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-gray-400 font-normal">Enviar a</span>
          <span className="font-bold text-white max-w-[150px] truncate">{currentZone?.name || 'Tingo María'}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'navbar' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 text-left cursor-pointer ${className}`}
          aria-expanded={isOpen}
          aria-label={`Zona de entrega actual: ${currentZone?.name}. Clic para cambiar`}
        >
          <MapPin className="w-4 h-4 text-white flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-emerald-100">Enviar a</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-white max-w-[130px] sm:max-w-[160px] truncate">
                {currentZone?.name || 'Tingo María'}
              </span>
              <ChevronDown className={`w-3 h-3 text-white flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-ink text-xs font-bold shadow-xs hover:shadow-sm border border-gray-100 transition-all cursor-pointer flex-shrink-0 ${className}`}
          aria-expanded={isOpen}
          aria-label={`Zona actual: ${currentZone?.name}. Clic para cambiar`}
        >
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate max-w-[160px]">Tingo María • {currentZone?.name?.replace(' de Tingo María', '') || 'Centro'}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 stroke-[2.5] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center justify-between w-full p-3 rounded-xl border border-gray-200 bg-white hover:border-primary transition-colors text-left ${className}`}
          aria-expanded={isOpen}
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

      {/* Cuadro Blanco Desplegable "Ahí nomás" (Sin fondo flotante oscuro) */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
          role="dialog"
          aria-labelledby="zone-dropdown-title"
        >
          {/* Header del cuadro blanco */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-150">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 id="zone-dropdown-title" className="font-extrabold text-xs sm:text-sm text-gray-950">
                  ¿Dónde estás en Tingo María?
                </h4>
                <p className="text-[11px] text-gray-500">
                  Elige tu lugar para calcular delivery exacto
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Cerrar opciones de ubicación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Opción 1: Activar GPS Automático */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-gray-900">Ubicación GPS Automática</span>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsStatus === 'detecting'}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60"
              >
                {gpsStatus === 'detecting' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Detectando...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3" />
                    <span>Activar GPS</span>
                  </>
                )}
              </button>
            </div>

            {gpsMessage && (
              <p
                className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                  gpsStatus === 'error'
                    ? 'text-red-700 bg-red-50 border border-red-200'
                    : 'text-emerald-800 bg-emerald-100/70 border border-emerald-200'
                }`}
              >
                {gpsMessage}
              </p>
            )}
          </div>

          {/* Opción 2: Lista de Lugares de Tingo María */}
          <div className="space-y-2 pt-0.5">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              O elige tu zona o lugar de entrega:
            </p>

            {zones.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              const landmarks = getLandmarksForZone(zone);

              return (
                <div
                  key={zone.id}
                  onClick={() => handleSelect(zone.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500/30'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900">{zone.name}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-bold text-gray-900">
                        {formatCents(zone.baseFeeCents)}
                      </span>
                      <span className="text-gray-400">~{zone.estimatedMinutes}m</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Etiquetas de lugares / referencias específicas */}
                  {landmarks.length > 0 && (
                    <div className="pt-1.5 flex flex-wrap gap-1">
                      {landmarks.map((lm) => (
                        <button
                          key={lm}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(zone.id, lm);
                          }}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                          }`}
                        >
                          {lm}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center text-[10px] text-gray-400 border-t border-gray-100 flex items-center justify-center gap-1">
            <Bike className="w-3 h-3 text-gray-500" />
            <span>Reparto en todo Tingo María de 7am a 11pm</span>
          </div>
        </div>
      )}
    </div>
  );
};
