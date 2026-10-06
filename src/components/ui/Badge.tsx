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
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'primary-solid';
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
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    info: 'bg-sky-50 text-sky-700 border-sky-200 font-medium',
    primary: 'bg-primary-50 text-primary border-primary-200 font-medium',
    'primary-solid': 'bg-primary text-white border-transparent font-bold',
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
        <Badge variant="primary" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          Confirmado
        </Badge>
      );
    case 'en_preparacion':
      return (
        <Badge variant="warning" icon={<ChefHat className="w-3.5 h-3.5" />}>
          En preparación
        </Badge>
      );
    case 'listo_recoger':
      return (
        <Badge variant="success" icon={<PackageCheck className="w-3.5 h-3.5" />}>
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
      return <Badge variant="primary">Entrega parcial</Badge>;
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
        <Badge variant="primary" icon={<RotateCcw className="w-3.5 h-3.5" />}>
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
  const configs: Record<UserRole, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'primary-solid' }> = {
    cliente: { label: 'Cliente', variant: 'primary-solid' },
    comercio: { label: 'Proveedor', variant: 'primary-solid' },
    repartidor: { label: 'Repartidor', variant: 'primary-solid' },
    admin: { label: 'Administrador', variant: 'primary-solid' },
  };

  const c = configs[role] || { label: role, variant: 'primary-solid' };
  return <Badge variant={c.variant} className="uppercase font-bold tracking-wider text-[11px] px-3 py-1">{c.label}</Badge>;
};
