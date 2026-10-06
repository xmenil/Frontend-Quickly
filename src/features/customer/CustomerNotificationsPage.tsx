import React from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../lib/date';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bell, Check, ShoppingBag, Info, Bike } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerNotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead } = useDataStore();
  const { currentUser } = useAuthStore();

  const userNotifications = notifications.filter((n) =>
    currentUser ? n.userId === currentUser.id : true
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-primary" />;
      case 'delivery':
        return <Bike className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Centro de Notificaciones</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Avisos de estados de pedidos, promociones y mensajes del sistema
        </p>
      </div>

      {userNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-gray-400" />}
          title="No tienes notificaciones"
          description="Cuando tus pedidos cambien de estado o haya novedades aparecerán aquí."
        />
      ) : (
        <div className="space-y-3">
          {userNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                notif.isRead
                  ? 'bg-white border-gray-100 shadow-subtle'
                  : 'bg-primary-light/30 border-primary-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-subtle mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <h2 className="font-bold text-sm text-ink">{notif.title}</h2>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    {formatDateTime(notif.createdAt)}
                  </span>
                  {notif.linkUrl && (
                    <Link
                      to={notif.linkUrl}
                      className="text-xs font-bold text-primary hover:underline mt-1.5 inline-block"
                    >
                      Ver detalle del pedido →
                    </Link>
                  )}
                </div>
              </div>

              {!notif.isRead && (
                <button
                  type="button"
                  onClick={() => markNotificationAsRead(notif.id)}
                  className="touch-target text-xs text-gray-400 hover:text-primary p-2 flex items-center gap-1 rounded-lg"
                  aria-label="Marcar como leída"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
