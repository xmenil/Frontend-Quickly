import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Address } from '../../domain/types';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const addressSchema = z.object({
  label: z.string().min(2, 'Ingresa una etiqueta como "Casa" o "Trabajo"'),
  recipientName: z.string().min(2, 'Ingresa el nombre de quien recibe'),
  phone: z.string().min(6, 'Ingresa un teléfono válido'),
  street: z.string().min(3, 'Ingresa la calle o avenida'),
  number: z.string().min(1, 'Ingresa el número o s/n'),
  reference: z.string().min(3, 'Ingresa una referencia para el repartidor'),
  zoneId: z.string().min(1, 'Selecciona una zona de cobertura'),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: Address;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  userId,
  onSuccess,
  onCancel,
}) => {
  const { zones, addAddress, updateAddress } = useDataStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData
      ? {
          label: initialData.label,
          recipientName: initialData.recipientName,
          phone: initialData.phone,
          street: initialData.street,
          number: initialData.number,
          reference: initialData.reference,
          zoneId: initialData.zoneId,
          isDefault: initialData.isDefault,
        }
      : {
          label: 'Casa',
          recipientName: '',
          phone: '962 ',
          street: '',
          number: '',
          reference: '',
          zoneId: zones[0]?.id || 'z_centro',
          isDefault: true,
        },
  });

  const onSubmit = (data: AddressFormData) => {
    if (initialData) {
      updateAddress(initialData.id, data);
    } else {
      addAddress({
        ...data,
        userId,
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Etiqueta"
          placeholder="Ej: Casa, Trabajo, Depa"
          {...register('label')}
          error={errors.label?.message}
        />
        <Select
          label="Zona de cobertura (Tingo María)"
          {...register('zoneId')}
          error={errors.zoneId?.message}
        >
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id} disabled={!zone.isAvailable}>
              {zone.name} {!zone.isAvailable ? '(Fuera de cobertura)' : ''}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Nombre de destinatario"
          placeholder="Quién recibe el pedido"
          {...register('recipientName')}
          error={errors.recipientName?.message}
        />
        <Input
          label="Teléfono de contacto"
          placeholder="Ej: 962 123 456"
          {...register('phone')}
          error={errors.phone?.message}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            label="Calle / Jirón / Avenida"
            placeholder="Ej: Jr. Raymondi"
            {...register('street')}
            error={errors.street?.message}
          />
        </div>
        <Input
          label="Número / Piso"
          placeholder="420 o s/n"
          {...register('number')}
          error={errors.number?.message}
        />
      </div>

      <Input
        label="Referencia exacta"
        placeholder="Ej: Portón verde frente al parque, al lado de la botica"
        {...register('reference')}
        error={errors.reference?.message}
        helperText="Ayuda a que el repartidor llegue rápido a tu ubicación."
      />

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isDefault"
          {...register('isDefault')}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
        />
        <label htmlFor="isDefault" className="text-sm font-medium text-ink cursor-pointer">
          Establecer como dirección principal de entrega
        </label>
      </div>

      <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {initialData ? 'Actualizar Dirección' : 'Guardar Dirección'}
        </Button>
      </div>
    </form>
  );
};
