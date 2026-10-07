import React from 'react';
import { TrackingEvent } from '../../domain/types';
import { formatDateTime } from '../../lib/date';
import { CheckCircle2, Clock, ChefHat, PackageCheck, Bike, AlertCircle, XCircle } from 'lucide-react';

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
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
      {events.map((event, idx) => {
        const isLatest = idx === events.length - 1;
        return (
          <div key={event.id || idx} className="relative group">
            {/* Dot indicator with active pulse */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                isLatest
                  ? 'border-primary shadow-sm ring-4 ring-primary-soft'
                  : 'border-gray-300'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isLatest ? 'bg-primary animate-ping' : 'bg-gray-400'
                }`}
              />
            </div>

            {/* Event Content */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isLatest
                  ? 'bg-white border-primary/30 shadow-sm ring-1 ring-primary/10'
                  : 'bg-white/90 border-gray-100 shadow-subtle'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <span className="font-extrabold text-sm text-ink flex items-center gap-2">
                  {getEventIcon(event.status)}
                  <span>{event.title}</span>
                  {isLatest && (
                    <span className="text-[10px] bg-primary-soft text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                      Actual
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500 font-medium tabular-nums whitespace-nowrap">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-normal">{event.description}</p>
              <div className="mt-2.5 pt-2 border-t border-gray-50 text-[11px] text-gray-500 flex items-center justify-between">
                <span>
                  Responsable: <strong className="text-ink font-semibold">{event.actor}</strong>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
