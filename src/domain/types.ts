/**
 * Core Domain Types for Quickly Delivery Prototype
 */

export type UserRole = 'cliente' | 'comercio' | 'repartidor' | 'admin';

export type UserStatus = 'activo' | 'suspendido' | 'pendiente_aprobacion';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  merchantId?: string;
  courierId?: string;
  createdAt: string;
}

export type MerchantCategory = 'restaurantes' | 'farmacias' | 'bodegas' | 'ropa' | 'emprendedores';

export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  description: string;
  address: string;
  phone: string;
  isOpen: boolean;
  logoUrl: string;
  bannerUrl: string;
  rating: number;
  ratingCount: number;
  prepTimeMinutes: number;
  deliveryFeeCents: number;
  minOrderCents: number;
  schedule: string;
  status: 'activo' | 'pendiente' | 'rechazado' | 'suspendido';
  ownerUserId: string;
  zoneId: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'moto' | 'bicicleta' | 'mototaxi';
  plate?: string;
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  activeDeliveryId?: string;
  status: 'activo' | 'pendiente' | 'rechazado' | 'suspendido';
  ownerUserId: string;
  currentZone: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceDifferenceCents: number;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  category: MerchantCategory;
  priceCents: number;
  stock: number;
  imageUrl: string;
  isAvailable: boolean;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  originalPriceCents?: number;
  images?: string[];
  condition?: string;
  soldCount?: number;
  rating?: number;
  ratingCount?: number;
  freeShipping?: boolean;
  brand?: string;
}

export interface CoverageZone {
  id: string;
  name: string;
  description: string;
  baseFeeCents: number;
  estimatedMinutes: number;
  isAvailable: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label: string; // e.g. "Casa", "Trabajo"
  recipientName: string;
  phone: string;
  street: string;
  number: string;
  reference: string;
  zoneId: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string; // Unique cart item key
  productId: string;
  merchantId: string;
  quantity: number;
  selectedVariantId?: string;
  selectedVariantName?: string;
  variantPriceDifferenceCents?: number;
  note?: string;
  unitPriceCents: number;
}

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo_recoger'
  | 'en_camino'
  | 'entregado'
  | 'cancelado'
  | 'rechazado';

export type ParentPurchaseStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'entrega_parcial'
  | 'completado'
  | 'cancelado'
  | 'finalizado_con_cancelaciones';

export type PaymentMethod = 'efectivo' | 'yape_plin' | 'tarjeta';

export type PaymentStatus =
  | 'pendiente'
  | 'pagado'
  | 'fallido'
  | 'reembolso_pendiente'
  | 'reembolsado';

export interface TrackingEvent {
  id: string;
  timestamp: string;
  status: OrderStatus;
  title: string;
  description: string;
  actor: string;
}

export interface OrderLineSnapshot {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPriceCents: number;
  variantName?: string;
  note?: string;
  subtotalCents: number;
}

export interface MerchantOrder {
  id: string;
  purchaseId: string;
  merchantId: string;
  merchantName: string;
  merchantPhone: string;
  merchantAddress: string;
  status: OrderStatus;
  items: OrderLineSnapshot[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  incidentReason?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TrackingEvent[];
  paymentStatus: PaymentStatus;
  refundCents?: number;
}

export interface Purchase {
  id: string;
  code: string; // QK-XXXXXX
  customerId: string;
  customerName: string;
  customerPhone: string;
  addressSnapshot: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  totalDeliveryFeeCents: number;
  grandTotalCents: number;
  merchantOrders: MerchantOrder[];
  createdAt: string;
  status: ParentPurchaseStatus;
  cashAmountPaidCents?: number; // For cash payments
  changeDueCents?: number;
  cardLastFour?: string;
  isDemoError?: boolean;
}

export interface DeliveryAssignment {
  id: string;
  merchantOrderId: string;
  courierId: string;
  status: 'solicitado' | 'aceptado' | 'en_camino' | 'entregado' | 'cancelado';
  assignedAt: string;
  deliveredAt?: string;
}

export interface Review {
  id: string;
  merchantId: string;
  merchantOrderId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  orderId?: string;
  subject: string;
  description: string;
  status: 'abierto' | 'en_revision' | 'resuelto';
  priority: 'baja' | 'media' | 'alta';
  createdAt: string;
  response?: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  details?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'delivery' | 'promo';
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}
