import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { Address } from '../../domain/types';
import { AddressForm } from '../../components/shared/AddressForm';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Trash2, Edit2, Check } from 'lucide-react';

export const CustomerAddressesPage: React.FC = () => {
  const { addresses, deleteAddress, setDefaultAddress, zones } = useDataStore();
  const { currentUser } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);

  const userAddresses = addresses.filter((a) => a.userId === currentUser?.id);

  const handleOpenNew = () => {
    setEditingAddress(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Direcciones Guardadas</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Puntos de entrega guardados para pedidos en Tingo María
          </p>
        </div>

        <Button type="button" variant="primary" size="md" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Nueva Dirección</span>
        </Button>
      </div>

      <div className="space-y-3">
        {userAddresses.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center space-y-3">
            <MapPin className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-bold text-ink">No tienes direcciones guardadas</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Guarda tus direcciones de casa, trabajo o estudio en Tingo María para pedir más rápido.
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenNew}>
              Agregar Dirección
            </Button>
          </div>
        ) : (
          userAddresses.map((addr) => {
            const zone = zones.find((z) => z.id === addr.zoneId);

            return (
              <div
                key={addr.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-ink">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-primary-light text-primary font-bold px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                    {zone && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                        {zone.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">
                    {addr.street} #{addr.number}
                  </p>
                  <p className="text-xs text-gray-500">Ref: {addr.reference}</p>
                  <p className="text-[11px] text-gray-400">
                    Recibe: {addr.recipientName} • Tel: {addr.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!addr.isDefault && currentUser && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAddress(addr.id, currentUser.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Hacer Principal
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="touch-target p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-xl transition-colors"
                    aria-label="Editar dirección"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    className="touch-target p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    aria-label="Eliminar dirección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
        description="Completa los datos de ubicación para los envíos de Quickly"
        maxWidth="md"
      >
        <AddressForm
          initialData={editingAddress}
          userId={currentUser?.id || 'u_cliente_demo'}
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      </Dialog>
    </div>
  );
};
