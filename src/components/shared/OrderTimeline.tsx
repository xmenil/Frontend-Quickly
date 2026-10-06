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
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'confirmado':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'en_preparacion':
        return <ChefHat className="w-4 h-4 text-purple-500" />;
      case 'listo_recoger':
        return <PackageCheck className="w-4 h-4 text-emerald-500" />;
      case 'en_camino':
        return <Bike className="w-4 h-4 text-indigo-500" />;
      case 'entregado':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'cancelado':
      case 'rechazado':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
      {events.map((event, idx) => {
        const isLatest = idx === events.length - 1;
        return (
          <div key={event.id || idx} className="relative group">
            {/* Dot indicator */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                isLatest
                  ? 'border-primary shadow-sm ring-4 ring-primary-light'
                  : 'border-gray-300'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isLatest ? 'bg-primary' : 'bg-gray-400'
                }`}
              />
            </div>

            {/* Event Content */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-subtle">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-ink flex items-center gap-1.5">
                  {getEventIcon(event.status)}
                  {event.title}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
              <div className="mt-2 text-[11px] text-gray-400 font-medium">
                Actor: <span className="text-gray-600 font-semibold">{event.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
