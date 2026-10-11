import React, { useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Address } from '../../domain/types';
import { useDataStore } from '../../store/dataStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { formatCents } from '../../lib/currency';
import { MapPin } from 'lucide-react';

const addressSchema = z.object({
  recipientName: z.string().trim().min(2, 'Ingresa el nombre de quien recibirá el pedido.'),
  phone: z.string().trim().transform((value) => value.replace(/[\s-]/g, ''))
    .refine((value) => /^9\d{8}$/.test(value), 'Ingresa un celular válido de 9 dígitos (ej. 962 123 456).'),
  zoneId: z.string().min(1, 'Selecciona una zona de cobertura.'),
  street: z.string().trim().min(3, 'Indica la calle, jirón o avenida (ej. Jr. Amazonas).'),
  number: z.string().trim().min(1, 'Indica el número o escribe s/n.'),
  reference: z.string().trim().min(4, 'Indica una referencia (ej. frente al parque, portón verde).'),
  label: z.string().trim().min(2, 'Ponle un nombre a la dirección (ej. Casa o Trabajo).'),
  isDefault: z.boolean().default(false),
});
type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: Address;
  userId: string;
  onSuccess: (address: Address) => void;
  onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ initialData, userId, onSuccess, onCancel }) => {
  const { zones, addresses, addAddress, updateAddress } = useDataStore();
  const formId = useId();
  const savingRef = useRef(false);
  const { register, handleSubmit, watch, setError, clearErrors, setFocus,
    formState: { errors, isSubmitting } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData ? { ...initialData } : {
      recipientName: '', phone: '', zoneId: '', street: '', number: '', reference: '',
      label: 'Casa', isDefault: !addresses.some((address) => address.userId === userId),
    },
  });
  const selectedZoneId = watch('zoneId');
  const activeZone = zones.find((zone) => zone.id === selectedZoneId);
  const hasCoverage = zones.some((zone) => zone.isAvailable);

  const onSubmit = (data: AddressFormData) => {
    if (savingRef.current) return;
    clearErrors('root');
    const current = useDataStore.getState();
    const zone = current.zones.find((entry) => entry.id === data.zoneId);
    if (!zone?.isAvailable) {
      setError('zoneId', { type: 'validate', message: 'Esta zona no tiene cobertura. Selecciona otra zona.' });
      setFocus('zoneId');
      return;
    }
    if (!userId || initialData && !current.addresses.some((address) => address.id === initialData.id && address.userId === userId)) {
      setError('root', { message: 'No se pudo guardar esta dirección en tu cuenta. Revisa tus direcciones.' });
      return;
    }
    savingRef.current = true;
    const previousIds = new Set(current.addresses.map((address) => address.id));
    try {
      if (initialData) updateAddress(initialData.id, data);
      else addAddress({ ...data, userId });
      const saved = useDataStore.getState().addresses.find((address) => address.userId === userId &&
        (initialData ? address.id === initialData.id : !previousIds.has(address.id)));
      if (!saved || Object.entries(data).some(([key, value]) => saved[key as keyof Address] !== value)) {
        setError('root', { message: 'No se pudo guardar la dirección. Conservamos tus datos para que puedas intentarlo nuevamente.' });
        return;
      }
      onSuccess(saved);
    } catch {
      setError('root', { message: 'No se pudo guardar la dirección. Revisa tus direcciones antes de volver a intentarlo.' });
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-6">
        <legend className="sr-only">Datos de la dirección</legend>
        <section aria-labelledby={`${formId}-contact-title`} className="space-y-3">
          <h3 id={`${formId}-contact-title`} className="text-sm font-semibold text-ink">Quién recibirá el pedido</h3>
          <Input id={`${formId}-name`} label="Nombre del destinatario" placeholder="Nombre y apellido" autoComplete="name" required {...register('recipientName')} error={errors.recipientName?.message} />
          <Input id={`${formId}-phone`} label="Celular de contacto" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={15} placeholder="Ej. 962 123 456" required {...register('phone')} error={errors.phone?.message} helperText="Lo usaremos para coordinar la entrega." />
        </section>

        <section aria-labelledby={`${formId}-location-title`} className="space-y-3 border-t border-border pt-4">
          <h3 id={`${formId}-location-title`} className="text-sm font-semibold text-ink">Dónde entregaremos el pedido</h3>
          <Select id={`${formId}-zone`} label="Zona de cobertura" required {...register('zoneId')} error={errors.zoneId?.message}>
            <option value="">Selecciona una zona</option>
            {zones.map((zone) => <option key={zone.id} value={zone.id} disabled={!zone.isAvailable}>{zone.name}{!zone.isAvailable ? ' — Sin cobertura' : ''}</option>)}
          </Select>
          {!hasCoverage && <p role="status" className="rounded-xl border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong">No hay zonas disponibles para entrega por ahora.</p>}
          {activeZone?.isAvailable && <div className="space-y-2 rounded-xl border border-info-border bg-info-soft p-3 text-xs text-info-strong">
            <p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{activeZone.description}</span></p>
            <p className="flex flex-wrap justify-between gap-2 tabular-nums"><span>Tarifa base: <strong>{formatCents(activeZone.baseFeeCents)}</strong></span><span>Tiempo estimado: {activeZone.estimatedMinutes} min</span></p>
          </div>}
          <Input id={`${formId}-street`} label="Calle, jirón o avenida" placeholder="Ej. Jr. Amazonas" autoComplete="address-line1" required {...register('street')} error={errors.street?.message} />
          <Input id={`${formId}-number`} label="Número, manzana o lote" placeholder="Ej. 123, Mz. A Lt. 4 o s/n" autoComplete="address-line2" required {...register('number')} error={errors.number?.message} />
          <Input id={`${formId}-reference`} label="Referencia para el repartidor" placeholder="Ej. Frente al parque, portón verde" required {...register('reference')} error={errors.reference?.message} helperText="Describe un punto visible que ayude a ubicar la entrada." />
        </section>

        <section aria-labelledby={`${formId}-save-title`} className="space-y-3 border-t border-border pt-4">
          <h3 id={`${formId}-save-title`} className="text-sm font-semibold text-ink">Guardar esta dirección</h3>
          <Input id={`${formId}-label`} label="Nombre de la dirección" placeholder="Ej. Casa o Trabajo" required {...register('label')} error={errors.label?.message} />
          <label htmlFor={`${formId}-default`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl text-sm text-ink-light">
            <input id={`${formId}-default`} type="checkbox" {...register('isDefault')} className="h-5 w-5 shrink-0 accent-primary" />
            Usar como mi dirección principal
          </label>
        </section>
      </fieldset>
      {errors.root?.message && <p role="alert" className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong">{errors.root.message}</p>}
      <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t border-border bg-surface py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!hasCoverage}>{initialData ? 'Actualizar dirección' : 'Guardar dirección'}</Button>
      </footer>
    </form>
  );
};
