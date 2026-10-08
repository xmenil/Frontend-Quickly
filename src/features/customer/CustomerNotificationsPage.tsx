import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../lib/date';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  Bike,
  Tag,
  ShieldCheck,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const CustomerNotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useDataStore();
  const { currentUser } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Filter notifications for this user (or fallback to demo user if not explicitly assigned)
  const userNotifications = useMemo(() => {
    return notifications
      .filter((n) => (currentUser ? n.userId === currentUser.id : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, currentUser]);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.isRead).length,
    [userNotifications]
  );

  const displayedNotifications = useMemo(() => {
    if (filter === 'unread') {
      return userNotifications.filter((n) => !n.isRead);
    }
    return userNotifications;
  }, [userNotifications, filter]);

  // Icon and theme config based on type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'order':
        return {
          icon: <Package className="w-4 h-4 text-primary" />,
          label: 'Pedido',
          bg: 'bg-primary-50 text-primary border-primary-100',
        };
      case 'delivery':
        return {
          icon: <Bike className="w-4 h-4 text-emerald-700" />,
          label: 'Entrega',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'promo':
        return {
          icon: <Tag className="w-4 h-4 text-amber-700" />,
          label: 'Promoción',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'system':
      default:
        return {
          icon: <ShieldCheck className="w-4 h-4 text-sky-700" />,
          label: 'Sistema',
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
        };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Centro de Notificaciones</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary px-2.5 py-0.5 rounded-full shadow-subtle animate-pulse">
                <span>{unreadCount} sin leer</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Actualizaciones en tiempo real de tus pedidos en Tingo María y avisos de la plataforma
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllNotificationsAsRead(currentUser?.id)}
            className="touch-target inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover bg-primary-50/70 hover:bg-primary-50 border border-primary-100 px-3.5 py-2 rounded-xl transition-all self-start sm:self-center"
          >
            <CheckCheck className="w-4 h-4 text-primary" />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-[38px] px-4 py-1.5 rounded-xl transition-all touch-target select-none ${
            filter === 'all'
              ? 'bg-white text-primary shadow-sm font-extrabold'
              : 'text-ink-light hover:text-ink'
          }`}
        >
          Todas ({userNotifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`min-h-[38px] px-4 py-1.5 rounded-xl transition-all touch-target select-none ${
            filter === 'unread'
              ? 'bg-white text-primary shadow-sm font-extrabold'
              : 'text-ink-light hover:text-ink'
          }`}
        >
          Sin leer ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {displayedNotifications.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 text-center space-y-3 shadow-subtle">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
            <Bell className="w-7 h-7" />
          </div>
          <h2 className="font-bold text-base sm:text-lg text-ink">
            {filter === 'unread' ? 'No tienes notificaciones pendientes' : 'No tienes notificaciones'}
          </h2>
          <p className="text-xs sm:text-sm text-ink-light max-w-sm mx-auto">
            {filter === 'unread'
              ? 'Estás al día con todos los avisos y estados de tus pedidos.'
              : 'Cuando realices un pedido o haya promociones en Tingo María te avisaremos aquí.'}
          </p>
          {filter === 'unread' && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilter('all')}
                className="min-h-[44px]"
              >
                Ver todas las notificaciones
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notif) => {
            const badge = getTypeBadge(notif.type);

            return (
              <div
                key={notif.id}
                className={`relative p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.isRead
                    ? 'bg-white border-gray-100 shadow-subtle'
                    : 'bg-primary-50/50 border-primary-100 shadow-sm'
                }`}
              >
                {/* Left Content Area */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Unread indicator dot */}
                  {!notif.isRead ? (
                    <div className="mt-2.5 flex-shrink-0" title="No leída">
                      <span className="block w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary-100 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-2.5 flex-shrink-0" />
                  )}

                  {/* Icon badge */}
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-subtle mt-0.5">
                    {badge.icon}
                  </div>

                  {/* Text details */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2
                        className={`text-sm sm:text-base leading-snug ${
                          notif.isRead ? 'font-semibold text-ink' : 'font-extrabold text-ink'
                        }`}
                      >
                        {notif.title}
                      </h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        notif.isRead ? 'text-ink-light' : 'text-gray-700 font-medium'
                      }`}
                    >
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[11px] text-gray-500">
                        {formatDateTime(notif.createdAt)}
                      </span>

                      {notif.linkUrl && (
                        <Link
                          to={notif.linkUrl}
                          onClick={() => {
                            if (!notif.isRead) markNotificationAsRead(notif.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover hover:underline"
                        >
                          <span>Ver detalle</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                {!notif.isRead && (
                  <div className="self-end sm:self-center pl-6 sm:pl-0 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="touch-target inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-200 px-3 py-2 rounded-xl transition-all shadow-subtle min-h-[44px]"
                      aria-label="Marcar como leída"
                    >
                      <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                      <span>Leída</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
