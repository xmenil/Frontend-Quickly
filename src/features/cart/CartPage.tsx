import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { calculateCart } from '../../domain/pricingRules';
import { formatCents } from '../../lib/currency';
import { PriceSummary } from '../../components/shared/PriceSummary';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import {
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const { merchants, products } = useDataStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const cartCalculations = calculateCart(items, merchants);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="Tu carrito está vacío"
          description="Explora los restaurantes, farmacias y bodegas locales de Tingo María para agregar tus productos favoritos."
          actionText="Explorar Comercios"
          onAction={() => navigate('/negocios')}
        />
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/negocios"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Seguir comprando</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Tu Carrito de Compras</h1>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="touch-target text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items Grouped by Merchant */}
        <div className="lg:col-span-2 space-y-6">
          {cartCalculations.groups.map((group) => {
            const isStoreClosed = !group.merchant.isOpen;

            return (
              <div
                key={group.merchant.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Merchant Subheader */}
                <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={group.merchant.logoUrl}
                      alt={group.merchant.name}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                    />
                    <div>
                      <Link
                        to={`/negocios/${group.merchant.id}`}
                        className="font-extrabold text-sm sm:text-base text-ink hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <Store className="w-4 h-4 text-primary" />
                        <span>{group.merchant.name}</span>
                      </Link>
                      <p className="text-xs text-gray-500">
                        Envío estimado: {formatCents(group.deliveryFeeCents)}
                      </p>
                    </div>
                  </div>

                  {isStoreClosed && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Cerrado
                    </span>
                  )}
                </div>

                {/* Items in this merchant order */}
                <div className="divide-y divide-gray-100 p-4 sm:p-5 space-y-4">
                  {group.items.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    const itemUnitPrice =
                      item.unitPriceCents + (item.variantPriceDifferenceCents || 0);
                    const itemSubtotal = itemUnitPrice * item.quantity;
                    const isOutOfStock = product ? product.stock < item.quantity : false;

                    return (
                      <div
                        key={item.id}
                        className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {product && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 rounded-2xl object-cover bg-gray-100 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-ink text-sm sm:text-base truncate">
                              {product ? product.name : 'Producto'}
                            </h2>
                            {item.selectedVariantName && (
                              <p className="text-xs text-primary font-medium">
                                Opción: {item.selectedVariantName}
                              </p>
                            )}
                            {item.note && (
                              <p className="text-xs text-gray-500 italic mt-0.5 truncate">
                                Nota: "{item.note}"
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatCents(itemUnitPrice)} c/u
                            </p>

                            {isOutOfStock && (
                              <p className="text-xs text-red-600 font-bold mt-1">
                                ⚠️ Stock limitado ({product?.stock} unid.)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Line Total */}
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                          <div className="flex items-center border border-gray-200 rounded-xl p-0.5 bg-gray-50">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="touch-target w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-xs text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={product ? item.quantity >= product.stock : false}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="touch-target w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-white disabled:opacity-40"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-extrabold text-sm sm:text-base text-ink min-w-[75px] text-right">
                            {formatCents(itemSubtotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="touch-target p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal of this store */}
                <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>Subtotal {group.merchant.name}:</span>
                  <span className="font-bold text-ink">{formatCents(group.subtotalCents)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Summary & Proceed to Checkout */}
        <div className="space-y-4 sticky top-24">
          <PriceSummary
            groups={cartCalculations.groups}
            itemsSubtotalCents={cartCalculations.itemsSubtotalCents}
            totalDeliveryFeeCents={cartCalculations.totalDeliveryFeeCents}
            grandTotalCents={cartCalculations.grandTotalCents}
          />

          <Button
            type="button"
            onClick={handleProceedToCheckout}
            variant="primary"
            size="lg"
            className="w-full shadow-lg"
          >
            <span>Continuar al Checkout</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {!isAuthenticated && (
            <p className="text-center text-xs text-gray-400">
              Podrás iniciar sesión o continuar con tu cuenta de demostración en el siguiente paso.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
