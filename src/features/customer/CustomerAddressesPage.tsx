import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Address } from '../../domain/types';
import { AddressForm } from '../../components/shared/AddressForm';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { formatCents } from '../../lib/currency';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  Clock,
  Phone,
  User,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const CustomerAddressesPage: React.FC = () => {
  const { addresses, deleteAddress, setDefaultAddress, zones } = useDataStore();
  const { currentUser } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const userAddresses = addresses.filter((a) => a.userId === currentUser?.id);

  const handleOpenNew = () => {
    setEditingAddress(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (addressToDelete) {
      deleteAddress(addressToDelete.id);
      setAddressToDelete(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Direcciones Guardadas</h1>
            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {userAddresses.length} {userAddresses.length === 1 ? 'ubicación' : 'ubicaciones'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-light mt-1">
            Puntos de entrega para tus pedidos en Tingo María con sus zonas y tarifas
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleOpenNew}
          className="min-h-[44px] px-5 font-bold shadow-subtle self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Nueva Dirección</span>
        </Button>
      </div>

      {/* Address List */}
      <div className="space-y-3.5">
        {userAddresses.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-subtle max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto shadow-sm">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-extrabold text-lg sm:text-xl text-ink">No tienes direcciones guardadas</h2>
              <p className="text-xs sm:text-sm text-ink-light max-w-md mx-auto leading-relaxed">
                Guarda tu casa, oficina o lugar de estudio en el Centro, Rupa Rupa, Castillo Grande o
                cerca de la UNAS para pedir sin tener que volver a ingresar tus referencias.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenNew}
                className="min-h-[44px] px-6 font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Agregar mi primera dirección</span>
              </Button>
            </div>
          </div>
        ) : (
          userAddresses.map((addr) => {
            const zone = zones.find((z) => z.id === addr.zoneId);

            return (
              <div
                key={addr.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  addr.isDefault
                    ? 'border-emerald-300 bg-emerald-50/15 shadow-sm ring-1 ring-emerald-200/50'
                    : 'border-gray-100 shadow-subtle hover:border-gray-200'
                }`}
              >
                {/* Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base text-ink">{addr.label}</span>

                    {addr.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Principal</span>
                      </span>
                    ) : null}

                    {zone && (
                      <span className="text-[11px] text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{zone.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-ink font-bold">{formatCents(zone.baseFeeCents)}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-gray-800">
                    {addr.street} #{addr.number}
                  </p>

                  <p className="text-xs text-ink-light bg-gray-50/70 p-2 rounded-xl border border-gray-100">
                    <span className="font-semibold text-gray-700">Referencia:</span> {addr.reference}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>Recibe: <strong>{addr.recipientName}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>Tel: <strong>{addr.phone}</strong></span>
                    </span>
                    {zone && (
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>~{zone.estimatedMinutes} min estimado</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end flex-shrink-0">
                  {!addr.isDefault && currentUser && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(addr.id, currentUser.id)}
                      className="touch-target inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-3 py-2 rounded-xl transition-all min-h-[44px]"
                    >
                      <Star className="w-3.5 h-3.5 text-gray-400 hover:text-emerald-600" />
                      <span>Usar como principal</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="touch-target p-2.5 text-gray-500 hover:text-ink hover:bg-gray-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-gray-100"
                    aria-label={`Editar dirección ${addr.label}`}
                    title="Editar dirección"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddressToDelete(addr)}
                    className="touch-target p-2.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border border-gray-100"
                    aria-label={`Eliminar dirección ${addr.label}`}
                    title="Eliminar dirección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New / Edit Address Form Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAddress ? 'Editar Dirección' : 'Nueva Dirección de Entrega'}
        description="Indica la ubicación en Tingo María y referencias exactas para el repartidor"
        maxWidth="md"
      >
        <AddressForm
          initialData={editingAddress}
          userId={currentUser?.id || 'u_cliente_demo'}
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        title="¿Eliminar Dirección?"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-red-900 leading-relaxed">
              ¿Estás seguro de que deseas eliminar la dirección{' '}
              <strong>"{addressToDelete?.label} — {addressToDelete?.street} #{addressToDelete?.number}"</strong>?
              Esta acción no se puede deshacer.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setAddressToDelete(null)}
              className="min-h-[44px] px-4 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleConfirmDelete}
              className="min-h-[44px] px-5 font-bold shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>Sí, Eliminar</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
