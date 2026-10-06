import React from 'react';
import { OrderStatus } from '../../domain/types';
import { Store, Home, Bike, Info } from 'lucide-react';

interface SchematicMapProps {
  orderStatus: OrderStatus;
  merchantName: string;
  merchantAddress: string;
  customerAddress: string;
  zoneName?: string;
  courierName?: string;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({
  orderStatus,
  merchantName,
  merchantAddress,
  customerAddress,
  zoneName = 'Centro de Tingo María',
  courierName,
}) => {
  // Determine courier position on schematic route based on status
  let courierProgressPercent = 0; // 0% at merchant, 50% midpoint, 100% delivered
  if (orderStatus === 'en_camino') courierProgressPercent = 60;
  if (orderStatus === 'entregado') courierProgressPercent = 100;
  if (orderStatus === 'listo_recoger') courierProgressPercent = 10;

  return (
    <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-card border border-slate-800 text-white flex flex-col">
      {/* Map Header */}
      <div className="p-3.5 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Mapa Esquemático — Tingo María</span>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-full">
          {zoneName}
        </span>
      </div>

      {/* SVG Stylized Local Map */}
      <div className="relative aspect-[16/9] w-full bg-[#131b2e] overflow-hidden select-none">
        <svg
          viewBox="0 0 600 340"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Grid Pattern */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <rect width="600" height="340" fill="url(#grid)" />

          {/* Silhouette: La Bella Durmiente (Top hills) */}
          <path
            d="M 50 70 Q 140 30 220 55 T 380 40 T 520 70 L 600 90 L 600 0 L 0 0 L 0 90 Z"
            fill="#0f172a"
            opacity="0.8"
          />
          <text x="360" y="32" fill="#475569" fontSize="10" fontWeight="bold" letterSpacing="1">
            SILUETA LA BELLA DURMIENTE
          </text>

          {/* Río Huallaga (curving blue river) */}
          <path
            d="M 120 0 C 130 90, 80 180, 110 340"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <text x="75" y="220" fill="#38bdf8" fontSize="10" transform="rotate(-75 75 220)" opacity="0.6">
            RÍO HUALLAGA
          </text>

          {/* Puente Corpac */}
          <line x1="85" y1="140" x2="135" y2="140" stroke="#94a3b8" strokeWidth="6" strokeDasharray="3 2" />
          <text x="50" y="132" fill="#94a3b8" fontSize="8">Puente Corpac</text>

          {/* Urban Grid Streets */}
          {/* Alameda Perú / Centro */}
          <line x1="180" y1="80" x2="520" y2="80" stroke="#334155" strokeWidth="6" />
          <line x1="180" y1="140" x2="520" y2="140" stroke="#38bdf8" strokeWidth="3" opacity="0.3" />
          <line x1="180" y1="210" x2="520" y2="210" stroke="#334155" strokeWidth="5" />
          <line x1="180" y1="280" x2="520" y2="280" stroke="#334155" strokeWidth="4" />

          {/* Cross Streets */}
          <line x1="220" y1="60" x2="220" y2="300" stroke="#334155" strokeWidth="4" />
          <line x1="320" y1="60" x2="320" y2="300" stroke="#334155" strokeWidth="5" />
          <line x1="420" y1="60" x2="420" y2="300" stroke="#334155" strokeWidth="4" />
          <line x1="500" y1="60" x2="500" y2="300" stroke="#334155" strokeWidth="3" />

          {/* Landmark Labels */}
          <text x="325" y="100" fill="#64748b" fontSize="9">Av. Alameda Perú</text>
          <text x="325" y="170" fill="#64748b" fontSize="9">Plaza de Armas</text>
          <text x="18" y="80" fill="#64748b" fontSize="9">Castillo Grande</text>
          <text x="440" y="270" fill="#64748b" fontSize="9">Rupa Rupa / UNAS</text>

          {/* Plaza de Armas Green Park */}
          <rect x="300" y="125" width="40" height="30" rx="4" fill="#065f46" opacity="0.7" />

          {/* Delivery Route Path */}
          <path
            id="deliveryRoute"
            d="M 230 110 L 320 110 L 320 230 L 450 230"
            fill="none"
            stroke="#C60050"
            strokeWidth="4"
            strokeDasharray="6 4"
            className={orderStatus === 'en_camino' ? 'animate-pulse' : ''}
          />

          {/* Origin Pin (Store) at (230, 110) */}
          <g transform="translate(230, 110)">
            <circle r="14" fill="#C60050" />
            <circle r="6" fill="#ffffff" />
          </g>

          {/* Destination Pin (Customer) at (450, 230) */}
          <g transform="translate(450, 230)">
            <circle r="14" fill="#10B981" />
            <circle r="6" fill="#ffffff" />
          </g>

          {/* Moving Courier Icon on Route */}
          {courierProgressPercent > 0 && courierProgressPercent < 100 && (
            <g transform="translate(320, 180)" className="animate-bounce">
              <circle r="16" fill="#3B82F6" />
              <circle r="19" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.6" className="animate-ping" />
              {/* Little bike silhouette in SVG */}
              <circle cx="-5" cy="4" r="3" fill="white" />
              <circle cx="5" cy="4" r="3" fill="white" />
              <path d="M -5 4 L 0 -4 L 5 4 M 0 -4 L -3 -6" stroke="white" strokeWidth="1.5" fill="none" />
            </g>
          )}
        </svg>

        {/* Floating status badge on map */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 max-w-[280px] text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="font-bold text-white truncate">{merchantName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="truncate">{customerAddress}</span>
          </div>
          {courierName && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-sky-400 flex items-center gap-1">
              <Bike className="w-3 h-3" /> Repartidor: {courierName}
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Disclaimer from Section 5 */}
      <div className="p-2.5 bg-slate-800/60 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>
          Representación esquemática de Tingo María para simulación de ruta. No constituye GPS satelital en vivo.
        </span>
      </div>
    </div>
  );
};
