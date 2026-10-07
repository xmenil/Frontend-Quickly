import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Address } from '../../domain/types';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { formatCents } from '../../lib/currency';
import { MapPin, Info } from 'lucide-react';

const addressSchema = z.object({
  label: z.string().min(2, 'Ingresa una etiqueta como "Casa", "Trabajo" o "Depa"'),
  recipientName: z.string().min(2, 'Ingresa el nombre de quien recibe el pedido'),
  phone: z
    .string()
    .min(9, 'Ingresa un número celular de 9 dígitos')
    .refine((val) => /^9\d{8}$/.test(val.replace(/\s+|-/g, '')), {
      message: 'Ingresa un celular peruano válido de 9 dígitos (ej. 962 123 456)',
    }),
  street: z.string().min(3, 'Ingresa la calle, jirón o avenida'),
  number: z.string().min(1, 'Ingresa el número exterior o s/n'),
  reference: z.string().min(4, 'Ingresa una referencia clara para el repartidor'),
  zoneId: z.string().min(1, 'Selecciona una zona de cobertura en Tingo María'),
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
    watch,
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

  const selectedZoneId = watch('zoneId');
  const activeZone = zones.find((z) => z.id === selectedZoneId);

  const onSubmit = (data: AddressFormData) => {
    // Normalizar teléfono quitando espacios
    const normalizedData = {
      ...data,
      phone: data.phone.trim(),
    };

    if (initialData) {
      updateAddress(initialData.id, normalizedData);
    } else {
      addAddress({
        ...normalizedData,
        userId,
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          label="Etiqueta"
          placeholder="Ej: Casa, Trabajo, Depa"
          {...register('label')}
          error={errors.label?.message}
          helperText="Nombre rápido para identificarla"
        />
        <div className="space-y-1">
          <Select
            label="Zona de cobertura (Tingo María)"
            {...register('zoneId')}
            error={errors.zoneId?.message}
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id} disabled={!zone.isAvailable}>
                {zone.name} — {formatCents(zone.baseFeeCents)} {!zone.isAvailable ? '(Sin cobertura)' : ''}
              </option>
            ))}
          </Select>
          {activeZone && (
            <p className="text-[11px] text-gray-600 flex items-center gap-1 pl-1">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <span>
                Tarifa de envío: <strong>{formatCents(activeZone.baseFeeCents)}</strong> • {activeZone.description}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          label="Nombre de destinatario"
          placeholder="Quién recibe el pedido en la puerta"
          {...register('recipientName')}
          error={errors.recipientName?.message}
        />
        <Input
          label="Teléfono celular de contacto"
          type="tel"
          inputMode="tel"
          maxLength={11}
          placeholder="Ej: 962 123 456"
          {...register('phone')}
          error={errors.phone?.message}
          helperText="El repartidor te llamará al llegar"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input
            label="Calle / Jirón / Avenida"
            placeholder="Ej: Jr. Raymondi, Av. Tito Jaime, Alameda"
            {...register('street')}
            error={errors.street?.message}
          />
        </div>
        <Input
          label="Número / Piso"
          placeholder="Ej: 420, Mz. A Lt. 4, s/n"
          {...register('number')}
          error={errors.number?.message}
        />
      </div>

      <Input
        label="Referencia exacta para el repartidor"
        placeholder="Ej: Portón verde frente al parque, al lado de la botica, a 2 cuadras de la UNAS"
        {...register('reference')}
        error={errors.reference?.message}
        helperText="En Tingo María una buena referencia garantiza que tu comida llegue caliente y a tiempo."
      />

      <div className="flex items-center gap-2.5 pt-1.5">
        <input
          type="checkbox"
          id="isDefault"
          {...register('isDefault')}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
        />
        <label htmlFor="isDefault" className="text-xs sm:text-sm font-semibold text-ink cursor-pointer">
          Establecer como mi dirección principal de entrega
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-[44px] px-4 font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="min-h-[44px] px-5 font-bold shadow-sm"
        >
          {initialData ? 'Actualizar Dirección' : 'Guardar Dirección'}
        </Button>
      </div>
    </form>
  );
};
