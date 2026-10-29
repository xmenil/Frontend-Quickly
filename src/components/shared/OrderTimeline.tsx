import React from 'react';
import { TrackingEvent } from '../../domain/types';
import { formatDate, formatTime, formatRelativeTime } from '../../lib/date';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  Bike,
  AlertCircle,
  XCircle,
  Radio,
  Calendar,
} from 'lucide-react';

interface OrderTimelineProps {
  events: TrackingEvent[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ events }) => {
  const getEventIcon = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'confirmado':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'en_preparacion':
        return <ChefHat className="w-4 h-4 text-purple-600" />;
      case 'listo_recoger':
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case 'en_camino':
        return <Bike className="w-4 h-4 text-primary" />;
      case 'entregado':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'cancelado':
      case 'rechazado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary/60 before:via-gray-200 before:to-gray-200">
      {events.map((event, idx) => {
        const isLatest = idx === events.length - 1;
        const relativeTime = formatRelativeTime(event.timestamp);
        const dateStr = formatDate(event.timestamp);
        const timeStr = formatTime(event.timestamp);

        return (
          <div key={event.id || idx} className="relative group">
            {/* Step Marker Dot with Active Pulsating Halo */}
            <div
              className={`absolute -left-6 top-2 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                isLatest
                  ? 'border-primary ring-4 ring-emerald-200/70 shadow-sm animate-pulse'
                  : 'border-emerald-500 bg-emerald-50'
              }`}
            >
              {isLatest ? (
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </div>

            {/* Event Card Container */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                isLatest
                  ? 'bg-gradient-to-br from-white to-emerald-50/40 border-primary/40 shadow-sm ring-1 ring-primary/20'
                  : 'bg-white border-gray-100 shadow-subtle hover:border-gray-200'
              }`}
            >
              {/* Event Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isLatest ? 'bg-primary-soft text-primary' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {getEventIcon(event.status)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-extrabold text-sm text-ink leading-snug">
                        {event.title}
                      </span>

                      {isLatest && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          <span>{['entregado', 'cancelado', 'rechazado'].includes(event.status) ? 'Estado final' : 'Último estado'}</span>
                        </span>
                      )}
                    </div>

                    {/* Clean, elegant and fully responsive Date & Time display */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1 shrink-0 font-medium text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{dateStr}</span>
                      </span>
                      <span className="text-gray-300 select-none">•</span>
                      <span className="inline-flex items-center gap-1 shrink-0 text-gray-700 font-semibold tabular-nums">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{timeStr}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Relative Time Badge */}
                {relativeTime && (
                  <span
                    className={`text-[11px] font-bold tabular-nums px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap self-start ${
                      isLatest
                        ? 'bg-primary-soft text-primary border border-primary/20'
                        : 'bg-gray-100 text-gray-600 font-medium'
                    }`}
                  >
                    {relativeTime}
                  </span>
                )}
              </div>

              {/* Event Description */}
              <p className="text-xs text-gray-700 leading-relaxed font-normal pl-9.5 sm:pl-10.5 mt-2">
                {event.description}
              </p>

              {/* Event Footer / Responsible Actor */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2 pl-9.5 sm:pl-10.5">
                <span>
                  Responsable: <strong className="text-ink font-semibold">{event.actor || 'No informado'}</strong>
                </span>

                {isLatest && event.status === 'en_camino' && (
                  <span className="text-primary font-bold flex items-center gap-1 shrink-0">
                    <Bike className="w-3.5 h-3.5" />
                    <span>Pedido en camino a tu dirección</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
