import { create } from 'zustand';
import {
  Merchant,
  Product,
  Courier,
  User,
  CoverageZone,
  Purchase,
  Address,
  Review,
  SupportTicket,
  AuditLog,
  AppNotification,
  OrderStatus,
  UserRole,
} from '../domain/types';
import {
  INITIAL_MERCHANTS,
  INITIAL_PRODUCTS,
  INITIAL_COURIERS,
  INITIAL_USERS,
  INITIAL_ZONES,
  INITIAL_PURCHASES,
  INITIAL_ADDRESSES,
  INITIAL_TICKETS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../mocks/initialData';
import { canTransitionOrder, derivePurchaseStatus, calculateOrderRefund } from '../domain/orderRules';
import { safeJsonParse } from '../lib/utils';

interface DataState {
  merchants: Merchant[];
  products: Product[];
  couriers: Courier[];
  users: User[];
  zones: CoverageZone[];
  purchases: Purchase[];
  addresses: Address[];
  favoriteMerchantIds: string[];
  favoriteProductIds: string[];
  reviews: Review[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];

  // Purchase & Order Management
  createPurchase: (purchase: Purchase) => { success: boolean; message?: string };
  updateMerchantOrderStatus: (
    merchantOrderId: string,
    nextStatus: OrderStatus,
    actorName: string,
    actorRole: UserRole,
    reason?: string
  ) => { success: boolean; message?: string };
  cancelMerchantOrderAsCustomer: (
    merchantOrderId: string,
    reason: string
  ) => { success: boolean; message?: string };

  // Courier Operations
  courierAcceptOrder: (merchantOrderId: string, courierId: string) => { success: boolean; message?: string };
  courierAdvanceDelivery: (
    merchantOrderId: string,
    courierId: string,
    step: 'pickup' | 'delivered',
    notes?: string
  ) => { success: boolean; message?: string };
  courierReportIncident: (merchantOrderId: string, courierId: string, reason: string, note: string) => void;
  toggleCourierAvailability: (courierId: string) => void;

  // Merchant Operations
  createProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  toggleProductAvailability: (productId: string) => void;
  updateMerchantProfile: (merchantId: string, updates: Partial<Merchant>) => void;

  // Admin Operations
  adminApproveUser: (userId: string) => void;
  adminRejectUser: (userId: string, reason: string) => void;
  adminSuspendUser: (userId: string, reason: string) => void;
  adminActivateUser: (userId: string) => void;
  adminAssignCourier: (merchantOrderId: string, courierId: string) => void;

  // Addresses & Favorites
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (addressId: string, updates: Partial<Address>) => void;
  deleteAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string, userId: string) => void;
  toggleFavoriteMerchant: (merchantId: string) => void;
  toggleFavoriteProduct: (productId: string) => void;

  // Reviews & Tickets
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => void;
  resolveSupportTicket: (ticketId: string, response: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (userId?: string) => void;

  // Factory Reset
  resetToSeed: () => void;
}

const STORAGE_KEY = 'quickly_datastore_v2';

interface StoredDataPayload {
  merchants: Merchant[];
  products: Product[];
  couriers: Courier[];
  users: User[];
  zones: CoverageZone[];
  purchases: Purchase[];
  addresses: Address[];
  favoriteMerchantIds: string[];
  favoriteProductIds: string[];
  reviews: Review[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
}

function getInitialStoredData(): StoredDataPayload {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = safeJsonParse<StoredDataPayload | null>(raw, null);
    if (parsed && parsed.merchants && parsed.products) {
      const existingMerchantIds = new Set(parsed.merchants.map((m) => m.id));
      const missingMerchants = INITIAL_MERCHANTS.filter((m) => !existingMerchantIds.has(m.id));

      const existingProductIds = new Set(parsed.products.map((p) => p.id));
      const missingProducts = INITIAL_PRODUCTS.filter((p) => !existingProductIds.has(p.id));

      if (missingMerchants.length > 0 || missingProducts.length > 0) {
        const merged: StoredDataPayload = {
          ...parsed,
          merchants: [...parsed.merchants, ...missingMerchants],
          products: [...parsed.products, ...missingProducts],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }

      return parsed;
    }
  }

  return {
    merchants: INITIAL_MERCHANTS,
    products: INITIAL_PRODUCTS,
    couriers: INITIAL_COURIERS,
    users: INITIAL_USERS,
    zones: INITIAL_ZONES,
    purchases: INITIAL_PURCHASES,
    addresses: INITIAL_ADDRESSES,
    favoriteMerchantIds: ['m_selva_gourmet', 'm_cacao_cafe'],
    favoriteProductIds: ['p_tacacho_cecina'],
    reviews: [],
    tickets: INITIAL_TICKETS,
    auditLogs: INITIAL_AUDIT_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

const initialPayload = getInitialStoredData();

function saveToLocalStorage(state: DataState) {
  const payload: StoredDataPayload = {
    merchants: state.merchants,
    products: state.products,
    couriers: state.couriers,
    users: state.users,
    zones: state.zones,
    purchases: state.purchases,
    addresses: state.addresses,
    favoriteMerchantIds: state.favoriteMerchantIds,
    favoriteProductIds: state.favoriteProductIds,
    reviews: state.reviews,
    tickets: state.tickets,
    auditLogs: state.auditLogs,
    notifications: state.notifications,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export const useDataStore = create<DataState>((set, get) => ({
  ...initialPayload,

  createPurchase: (purchase: Purchase) => {
    const { products, purchases, auditLogs, notifications, merchants } = get();

    // 1. Re-validate stock for every item
    for (const suborder of purchase.merchantOrders) {
      for (const line of suborder.items) {
        const prod = products.find((p) => p.id === line.productId);
        if (!prod) {
          return { success: false, message: `El producto "${line.productName}" ya no está disponible.` };
        }
        if (prod.stock < line.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para "${line.productName}". Solo quedan ${prod.stock} unidades.`,
          };
        }
      }
    }

    // 2. Deduct reserved stock
    const updatedProducts = products.map((prod) => {
      let deductedQty = 0;
      for (const suborder of purchase.merchantOrders) {
        for (const line of suborder.items) {
          if (line.productId === prod.id) {
            deductedQty += line.quantity;
          }
        }
      }
      if (deductedQty > 0) {
        const newStock = Math.max(0, prod.stock - deductedQty);
        return {
          ...prod,
          stock: newStock,
          isAvailable: newStock > 0,
        };
      }
      return prod;
    });

    // 3. New audit log
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: purchase.customerName,
      actorRole: 'cliente',
      action: 'Creación de Compra',
      entity: `Purchase: ${purchase.code}`,
      details: `${purchase.merchantOrders.length} subpedidos. Total: S/ ${(purchase.grandTotalCents / 100).toFixed(2)}`,
    };

    // 4. Create notifications for merchants
    const newNotifications: AppNotification[] = [...notifications];
    purchase.merchantOrders.forEach((suborder) => {
      const merchant = merchants.find((m) => m.id === suborder.merchantId);
      if (merchant) {
        newNotifications.push({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: merchant.ownerUserId,
          title: `¡Nuevo pedido recibido! (${purchase.code})`,
          message: `Tienes un nuevo pedido por S/ ${(suborder.totalCents / 100).toFixed(2)}. Revisa tu panel para confirmarlo.`,
          type: 'order',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    const updatedPurchases = [purchase, ...purchases];

    set((state) => {
      const nextState = {
        ...state,
        products: updatedProducts,
        purchases: updatedPurchases,
        auditLogs: [newLog, ...auditLogs],
        notifications: newNotifications,
      };
      saveToLocalStorage(nextState);
      return nextState;
    });

    return { success: true };
  },

  updateMerchantOrderStatus: (
    merchantOrderId: string,
    nextStatus: OrderStatus,
    actorName: string,
    actorRole: UserRole,
    reason?: string
  ) => {
    const { purchases, products, auditLogs, notifications, couriers } = get();

    // Locate purchase and suborder
    let foundPurchaseIndex = -1;
    let foundSuborderIndex = -1;

    for (let pIdx = 0; pIdx < purchases.length; pIdx++) {
      const sIdx = purchases[pIdx].merchantOrders.findIndex((mo) => mo.id === merchantOrderId);
      if (sIdx > -1) {
        foundPurchaseIndex = pIdx;
        foundSuborderIndex = sIdx;
        break;
      }
    }

    if (foundPurchaseIndex === -1 || foundSuborderIndex === -1) {
      return { success: false, message: 'Pedido no encontrado.' };
    }

    const currentPurchase = purchases[foundPurchaseIndex];
    const currentSuborder = currentPurchase.merchantOrders[foundSuborderIndex];

    if (!canTransitionOrder(currentSuborder.status, nextStatus)) {
      return {
        success: false,
        message: `Transición no permitida: de "${currentSuborder.status}" a "${nextStatus}".`,
      };
    }

    // Clone purchases
    const updatedPurchases = [...purchases];
    const updatedMerchantOrders = [...currentPurchase.merchantOrders];
    let updatedProducts = [...products];

    // Build tracking event
    const trackingEvent = {
      id: `tr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: nextStatus,
      title: reason ? `Estado: ${nextStatus} (${reason})` : `Estado: ${nextStatus}`,
      description: `Actualizado por ${actorName} (${actorRole})`,
      actor: actorName,
    };

    let updatedPaymentStatus = currentSuborder.paymentStatus;
    let refundCents = currentSuborder.refundCents;

    // Handle stock restoration and refund on rejection or cancellation
    if (nextStatus === 'cancelado' || nextStatus === 'rechazado') {
      // Restore stock once
      updatedProducts = products.map((prod) => {
        const itemInSuborder = currentSuborder.items.find((it) => it.productId === prod.id);
        if (itemInSuborder) {
          return {
            ...prod,
            stock: prod.stock + itemInSuborder.quantity,
            isAvailable: true,
          };
        }
        return prod;
      });

      // Calculate refund
      const refundResult = calculateOrderRefund(currentSuborder, currentPurchase.paymentMethod);
      refundCents = refundResult.refundCents;
      updatedPaymentStatus = refundResult.paymentStatus;
    }

    // Handle payment status on delivery
    if (nextStatus === 'entregado' && currentPurchase.paymentMethod === 'efectivo') {
      updatedPaymentStatus = 'pagado';
    }

    const updatedSuborder = {
      ...currentSuborder,
      status: nextStatus,
      paymentStatus: updatedPaymentStatus,
      refundCents,
      rejectionReason: nextStatus === 'rechazado' ? reason : currentSuborder.rejectionReason,
      cancellationReason: nextStatus === 'cancelado' ? reason : currentSuborder.cancellationReason,
      updatedAt: new Date().toISOString(),
      timeline: [...currentSuborder.timeline, trackingEvent],
    };

    updatedMerchantOrders[foundSuborderIndex] = updatedSuborder;

    // Derive parent purchase status
    const derivedStatus = derivePurchaseStatus(updatedMerchantOrders);

    updatedPurchases[foundPurchaseIndex] = {
      ...currentPurchase,
      merchantOrders: updatedMerchantOrders,
      status: derivedStatus,
    };

    // Free courier if terminal
    let updatedCouriers = couriers;
    if (['entregado', 'cancelado', 'rechazado'].includes(nextStatus) && currentSuborder.courierId) {
      updatedCouriers = couriers.map((c) =>
        c.id === currentSuborder.courierId ? { ...c, activeDeliveryId: undefined } : c
      );
    }

    // Add audit log
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: actorName,
      actorRole,
      action: `Cambio de Estado a "${nextStatus}"`,
      entity: `Subpedido: ${currentSuborder.id}`,
      details: reason ? `Motivo: ${reason}` : undefined,
    };

    // Customer Notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: currentPurchase.customerId,
      title: `Actualización de pedido ${currentPurchase.code}`,
      message: `${currentSuborder.merchantName}: ahora está ${nextStatus}.`,
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/cliente/pedidos/${currentPurchase.id}`,
    };

    set((state) => {
      const nextState = {
        ...state,
        purchases: updatedPurchases,
        products: updatedProducts,
        couriers: updatedCouriers,
        auditLogs: [newLog, ...state.auditLogs],
        notifications: [newNotif, ...state.notifications],
      };
      saveToLocalStorage(nextState);
      return nextState;
    });

    return { success: true };
  },

  cancelMerchantOrderAsCustomer: (merchantOrderId: string, reason: string) => {
    return get().updateMerchantOrderStatus(
      merchantOrderId,
      'cancelado',
      'Cliente',
      'cliente',
      reason
    );
  },

  courierAcceptOrder: (merchantOrderId: string, courierId: string) => {
    const { purchases, couriers, auditLogs } = get();
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return { success: false, message: 'Repartidor no encontrado' };

    // Find purchase & suborder
    for (let pIdx = 0; pIdx < purchases.length; pIdx++) {
      const sIdx = purchases[pIdx].merchantOrders.findIndex((mo) => mo.id === merchantOrderId);
      if (sIdx > -1) {
        const suborder = purchases[pIdx].merchantOrders[sIdx];
        if (suborder.courierId && suborder.courierId !== courierId) {
          return { success: false, message: 'Este pedido ya fue tomado por otro repartidor.' };
        }

        const updatedPurchases = [...purchases];
        const updatedSuborder = {
          ...suborder,
          courierId: courier.id,
          courierName: courier.name,
          courierPhone: courier.phone,
          timeline: [
            ...suborder.timeline,
            {
              id: `tr_${Date.now()}`,
              timestamp: new Date().toISOString(),
              status: suborder.status,
              title: `Repartidor asignado: ${courier.name}`,
              description: `En camino hacia el comercio ${suborder.merchantName}`,
              actor: courier.name,
            },
          ],
        };

        updatedPurchases[pIdx].merchantOrders[sIdx] = updatedSuborder;

        const updatedCouriers = couriers.map((c) =>
          c.id === courierId ? { ...c, activeDeliveryId: merchantOrderId } : c
        );

        const newLog: AuditLog = {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: courier.name,
          actorRole: 'repartidor',
          action: 'Aceptación de Entrega',
          entity: `Subpedido: ${merchantOrderId}`,
        };

        set((state) => {
          const nextState = {
            ...state,
            purchases: updatedPurchases,
            couriers: updatedCouriers,
            auditLogs: [newLog, ...auditLogs],
          };
          saveToLocalStorage(nextState);
          return nextState;
        });

        return { success: true };
      }
    }

    return { success: false, message: 'Pedido no encontrado' };
  },

  courierAdvanceDelivery: (
    merchantOrderId: string,
    courierId: string,
    step: 'pickup' | 'delivered',
    notes?: string
  ) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    const actorName = courier?.name || 'Repartidor';

    if (step === 'pickup') {
      return get().updateMerchantOrderStatus(
        merchantOrderId,
        'en_camino',
        actorName,
        'repartidor',
        notes || 'Retirado de la tienda con éxito'
      );
    } else {
      return get().updateMerchantOrderStatus(
        merchantOrderId,
        'entregado',
        actorName,
        'repartidor',
        notes || 'Entregado al cliente'
      );
    }
  },

  courierReportIncident: (merchantOrderId: string, courierId: string, reason: string, note: string) => {
    const { couriers, tickets, purchases } = get();
    const courier = couriers.find((c) => c.id === courierId);
    const courierName = courier?.name || 'Repartidor';

    // Locate purchase
    const purchase = purchases.find((p) => p.merchantOrders.some((mo) => mo.id === merchantOrderId));

    const newTicket: SupportTicket = {
      id: `tkt_${Date.now()}`,
      userId: courier?.ownerUserId || courierId,
      userName: courierName,
      userRole: 'repartidor',
      orderId: purchase?.code || merchantOrderId,
      subject: `Incidencia en reparto: ${reason}`,
      description: note,
      status: 'en_revision',
      priority: 'alta',
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const nextState = {
        ...state,
        tickets: [newTicket, ...tickets],
      };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  toggleCourierAvailability: (courierId: string) => {
    const updated = get().couriers.map((c) =>
      c.id === courierId ? { ...c, isAvailable: !c.isAvailable } : c
    );
    set((state) => {
      const nextState = { ...state, couriers: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  createProduct: (prod) => {
    const newProduct: Product = {
      ...prod,
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    set((state) => {
      const nextState = { ...state, products: [newProduct, ...state.products] };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  updateProduct: (productId: string, updates: Partial<Product>) => {
    const updated = get().products.map((p) =>
      p.id === productId ? { ...p, ...updates } : p
    );
    set((state) => {
      const nextState = { ...state, products: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  toggleProductAvailability: (productId: string) => {
    const updated = get().products.map((p) =>
      p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p
    );
    set((state) => {
      const nextState = { ...state, products: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  updateMerchantProfile: (merchantId: string, updates: Partial<Merchant>) => {
    const updated = get().merchants.map((m) =>
      m.id === merchantId ? { ...m, ...updates } : m
    );
    set((state) => {
      const nextState = { ...state, merchants: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  adminApproveUser: (userId: string) => {
    const { users, merchants, couriers, auditLogs } = get();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'activo' as const } : u
    );

    // If merchant, activate merchant profile
    const updatedMerchants = merchants.map((m) =>
      m.ownerUserId === userId ? { ...m, status: 'activo' as const } : m
    );

    // If courier, activate courier profile
    const updatedCouriers = couriers.map((c) =>
      c.ownerUserId === userId ? { ...c, status: 'activo' as const } : c
    );

    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      actorRole: 'admin',
      action: 'Aprobación de Solicitud',
      entity: `Usuario: ${user.name} (${user.role})`,
    };

    set((state) => {
      const nextState = {
        ...state,
        users: updatedUsers,
        merchants: updatedMerchants,
        couriers: updatedCouriers,
        auditLogs: [newLog, ...auditLogs],
      };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  adminRejectUser: (userId: string, reason: string) => {
    const { users, merchants, couriers, auditLogs } = get();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'suspendido' as const } : u
    );
    const updatedMerchants = merchants.map((m) =>
      m.ownerUserId === userId ? { ...m, status: 'rechazado' as const } : m
    );
    const updatedCouriers = couriers.map((c) =>
      c.ownerUserId === userId ? { ...c, status: 'rechazado' as const } : c
    );

    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      actorRole: 'admin',
      action: 'Rechazo de Solicitud',
      entity: `Usuario: ${user.name}`,
      details: reason,
    };

    set((state) => {
      const nextState = {
        ...state,
        users: updatedUsers,
        merchants: updatedMerchants,
        couriers: updatedCouriers,
        auditLogs: [newLog, ...auditLogs],
      };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  adminSuspendUser: (userId: string, reason: string) => {
    const { users, auditLogs } = get();
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'suspendido' as const } : u
    );
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      actorRole: 'admin',
      action: 'Suspensión de Cuenta',
      entity: `Usuario: ${userId}`,
      details: reason,
    };
    set((state) => {
      const nextState = { ...state, users: updatedUsers, auditLogs: [newLog, ...auditLogs] };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  adminActivateUser: (userId: string) => {
    const { users, auditLogs } = get();
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, status: 'activo' as const } : u
    );
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      actorRole: 'admin',
      action: 'Reactivación de Cuenta',
      entity: `Usuario: ${userId}`,
    };
    set((state) => {
      const nextState = { ...state, users: updatedUsers, auditLogs: [newLog, ...auditLogs] };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  adminAssignCourier: (merchantOrderId: string, courierId: string) => {
    get().courierAcceptOrder(merchantOrderId, courierId);
  },

  addAddress: (addr) => {
    const newAddr: Address = {
      ...addr,
      id: `addr_${Date.now()}`,
    };
    set((state) => {
      let updated = [...state.addresses, newAddr];
      if (newAddr.isDefault) {
        updated = updated.map((a) =>
          a.id === newAddr.id ? a : a.userId === newAddr.userId ? { ...a, isDefault: false } : a
        );
      }
      const nextState = { ...state, addresses: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  updateAddress: (addressId, updates) => {
    set((state) => {
      let updated = state.addresses.map((a) => (a.id === addressId ? { ...a, ...updates } : a));
      if (updates.isDefault) {
        const target = updated.find((a) => a.id === addressId);
        if (target) {
          updated = updated.map((a) =>
            a.id === addressId ? a : a.userId === target.userId ? { ...a, isDefault: false } : a
          );
        }
      }
      const nextState = { ...state, addresses: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  deleteAddress: (addressId) => {
    set((state) => {
      const updated = state.addresses.filter((a) => a.id !== addressId);
      const nextState = { ...state, addresses: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  setDefaultAddress: (addressId, userId) => {
    set((state) => {
      const updated = state.addresses.map((a) =>
        a.userId === userId ? { ...a, isDefault: a.id === addressId } : a
      );
      const nextState = { ...state, addresses: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  toggleFavoriteMerchant: (merchantId) => {
    set((state) => {
      const exists = state.favoriteMerchantIds.includes(merchantId);
      const updated = exists
        ? state.favoriteMerchantIds.filter((id) => id !== merchantId)
        : [...state.favoriteMerchantIds, merchantId];
      const nextState = { ...state, favoriteMerchantIds: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  toggleFavoriteProduct: (productId) => {
    set((state) => {
      const exists = state.favoriteProductIds.includes(productId);
      const updated = exists
        ? state.favoriteProductIds.filter((id) => id !== productId)
        : [...state.favoriteProductIds, productId];
      const nextState = { ...state, favoriteProductIds: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  addReview: (review) => {
    const newRev: Review = {
      ...review,
      id: `rev_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const nextState = { ...state, reviews: [newRev, ...state.reviews] };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  createSupportTicket: (ticket) => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `tkt_${Date.now()}`,
      status: 'abierto',
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const nextState = { ...state, tickets: [newTicket, ...state.tickets] };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  resolveSupportTicket: (ticketId, response) => {
    set((state) => {
      const updated = state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'resuelto' as const,
              response,
              resolvedAt: new Date().toISOString(),
            }
          : t
      );
      const nextState = { ...state, tickets: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  markNotificationAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      const nextState = { ...state, notifications: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  markAllNotificationsAsRead: (userId) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        !userId || n.userId === userId ? { ...n, isRead: true } : n
      );
      const nextState = { ...state, notifications: updated };
      saveToLocalStorage(nextState);
      return nextState;
    });
  },

  resetToSeed: () => {
    localStorage.removeItem(STORAGE_KEY);
    const freshPayload: StoredDataPayload = {
      merchants: INITIAL_MERCHANTS,
      products: INITIAL_PRODUCTS,
      couriers: INITIAL_COURIERS,
      users: INITIAL_USERS,
      zones: INITIAL_ZONES,
      purchases: INITIAL_PURCHASES,
      addresses: INITIAL_ADDRESSES,
      favoriteMerchantIds: ['m_selva_gourmet', 'm_cacao_cafe'],
      favoriteProductIds: ['p_tacacho_cecina'],
      reviews: [],
      tickets: INITIAL_TICKETS,
      auditLogs: INITIAL_AUDIT_LOGS,
      notifications: INITIAL_NOTIFICATIONS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshPayload));
    set(freshPayload);
  },
}));

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      const parsed = safeJsonParse<StoredDataPayload | null>(e.newValue, null);
      if (parsed) {
        useDataStore.setState(parsed);
      }
    }
  });
}
