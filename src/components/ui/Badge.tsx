import React from 'react';
import { cn } from '../../lib/utils';
import { OrderStatus, ParentPurchaseStatus, PaymentStatus, UserRole } from '../../domain/types';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  XCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  RotateCcw,
} from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'selva';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    selva: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  switch (status) {
    case 'pendiente':
      return (
        <Badge variant="warning" icon={<Clock className="w-3.5 h-3.5" />}>
          Pendiente
        </Badge>
      );
    case 'confirmado':
      return (
        <Badge variant="info" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          Confirmado
        </Badge>
      );
    case 'en_preparacion':
      return (
        <Badge variant="purple" icon={<ChefHat className="w-3.5 h-3.5" />}>
          En preparación
        </Badge>
      );
    case 'listo_recoger':
      return (
        <Badge variant="selva" icon={<PackageCheck className="w-3.5 h-3.5" />}>
          Listo para recojo
        </Badge>
      );
    case 'en_camino':
      return (
        <Badge variant="info" icon={<Bike className="w-3.5 h-3.5" />}>
          En camino
        </Badge>
      );
    case 'entregado':
      return (
        <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          Entregado
        </Badge>
      );
    case 'cancelado':
      return (
        <Badge variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}>
          Cancelado
        </Badge>
      );
    case 'rechazado':
      return (
        <Badge variant="danger" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
          Rechazado
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PurchaseStatusBadge: React.FC<{ status: ParentPurchaseStatus }> = ({ status }) => {
  switch (status) {
    case 'pendiente':
      return <Badge variant="warning">Pendiente</Badge>;
    case 'en_proceso':
      return <Badge variant="info">En proceso</Badge>;
    case 'entrega_parcial':
      return <Badge variant="purple">Entrega parcial</Badge>;
    case 'completado':
      return <Badge variant="success">Completado</Badge>;
    case 'cancelado':
      return <Badge variant="danger">Cancelado</Badge>;
    case 'finalizado_con_cancelaciones':
      return <Badge variant="warning">Con cancelaciones</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus; method?: string }> = ({
  status,
}) => {
  switch (status) {
    case 'pagado':
      return (
        <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          Pagado
        </Badge>
      );
    case 'pendiente':
      return (
        <Badge variant="warning" icon={<Banknote className="w-3.5 h-3.5" />}>
          Pago pendiente (Efectivo)
        </Badge>
      );
    case 'fallido':
      return (
        <Badge variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}>
          Pago fallido
        </Badge>
      );
    case 'reembolso_pendiente':
      return (
        <Badge variant="purple" icon={<RotateCcw className="w-3.5 h-3.5" />}>
          Reembolso pendiente
        </Badge>
      );
    case 'reembolsado':
      return (
        <Badge variant="info" icon={<RotateCcw className="w-3.5 h-3.5" />}>
          Reembolsado
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const configs = {
    cliente: { label: 'Cliente', variant: 'info' as const },
    comercio: { label: 'Comercio', variant: 'selva' as const },
    repartidor: { label: 'Repartidor', variant: 'purple' as const },
    admin: { label: 'Administrador', variant: 'danger' as const },
  };

  const c = configs[role] || { label: role, variant: 'default' as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
};
