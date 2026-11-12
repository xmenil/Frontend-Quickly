import React, { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Address } from '../../domain/types';
import { operationsApi } from '../../services/api/operationsApi';
import { useAuthStore } from '../../store/authStore';
import { addressForView, useCustomerAddresses } from '../../features/customer/customerAddressModel';
import { RemoteState } from '../../features/operations/shared';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { formatCents } from '../../lib/currency';
import { MapPin, Navigation, Compass, Loader2 } from 'lucide-react';

const addressSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(3, 'Ingresa el nombre de quien recibirá el pedido.')
    .max(120, 'Máximo 120 caracteres.'),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ''))
    .transform((value) => (value.startsWith('+51') ? value.slice(3) : value))
    .refine((value) => /^9\d{8}$/.test(value), 'Ingresa un celular válido de 9 dígitos (ej. 962 123 456).'),
  zoneId: z.string().min(1, 'Selecciona una zona de cobertura.'),
  street: z
    .string()
    .trim()
    .min(3, 'Indica la calle, jirón o lugar general (ej. Jr. Amazonas o cerca a UNAS).')
    .max(180, 'Máximo 180 caracteres.'),
  number: z
    .string()
    .trim()
    .default('s/n'),
  reference: z
    .string()
    .trim()
    .default('Coordinar por llamada'),
  label: z.string().trim().default('Casa'),
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
  const resource = useCustomerAddresses();
  const zones = resource.data?.zones || [];
  const formId = useId();
  const savingRef = useRef(false);
  const { currentUser } = useAuthStore();

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData
      ? { ...initialData, phone: initialData.phone.replace(/^\+51/, '') }
      : {
          recipientName: '',
          phone: '',
          zoneId: '',
          street: '',
          number: '',
          reference: '',
          label: 'Casa',
          isDefault: false,
        },
  });

  const selectedZoneId = watch('zoneId');
  const activeZone = zones.find((zone) => zone.id === selectedZoneId);
  const hasCoverage = zones.some((zone) => zone.isAvailable);

  const handleGpsFill = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Tu navegador no soporta GPS.');
      return;
    }
    setGpsLoading(true);
    setGpsMessage('Detectando ubicación GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let matched = zones.find((z) => z.isAvailable);
        if (longitude < -75.998) {
          matched =
            zones.find((z) => z.name.toLowerCase().includes('castillo')) || matched;
        } else if (latitude > -9.290) {
          matched =
            zones.find((z) => z.name.toLowerCase().includes('norte')) || matched;
        } else if (latitude < -9.304) {
          matched =
            zones.find((z) => z.name.toLowerCase().includes('sur')) || matched;
        } else {
          matched =
            zones.find((z) => z.name.toLowerCase().includes('centro')) || matched;
        }

        if (matched) {
          setValue('zoneId', matched.id);
        }
        setValue('street', 'Ubicación GPS Tingo María');
        setValue('number', 's/n');
        setValue('reference', 'Coordinar con repartidor por celular al llegar');
        if (!watch('recipientName') && currentUser?.name) {
          setValue('recipientName', currentUser.name);
        }
        if (!watch('phone') && currentUser?.phone) {
          setValue('phone', currentUser.phone.replace(/^\+51/, ''));
        }
        setGpsLoading(false);
        setGpsMessage('¡Dirección rellenada con tu GPS!');
        setTimeout(() => setGpsMessage(''), 3000);
      },
      () => {
        setGpsLoading(false);
        setGpsMessage('No se pudo acceder al GPS. Llena los datos generales abajo.');
        setTimeout(() => setGpsMessage(''), 3500);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const onSubmit = async (data: AddressFormData) => {
    if (savingRef.current) return;
    clearErrors('root');
    if (!zones.some((zone) => zone.id === data.zoneId && zone.isAvailable)) {
      setError('zoneId', {
        type: 'validate',
        message: 'Esta zona no tiene cobertura. Selecciona otra zona.',
      });
      setFocus('zoneId');
      return;
    }
    if (!userId || useAuthStore.getState().currentUser?.id !== userId) {
      setError('root', {
        message: 'Tu sesión cambió. Inicia sesión para guardar la dirección.',
      });
      return;
    }
    savingRef.current = true;

    const normalizedStreetNumber = data.number?.trim() || 's/n';
    const normalizedReference =
      data.reference?.trim() || 'Coordinar entrega al llegar por celular';
    const normalizedLabel = data.label?.trim() || 'Casa';

    try {
      const saved = await operationsApi.saveAddress(
        {
          label: normalizedLabel,
          recipientName: data.recipientName,
          phone: '+51' + data.phone,
          zoneId: data.zoneId,
          street: data.street,
          streetNumber: normalizedStreetNumber,
          reference: normalizedReference,
          isDefault: data.isDefault,
        },
        initialData?.id
      );
      if (useAuthStore.getState().currentUser?.id !== userId) return;
      onSuccess(addressForView(saved, userId));
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la dirección. Conservamos tus datos para reintentar.',
      });
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <RemoteState loading={resource.loading} error={resource.error} retry={resource.reload} />

      {/* Botón Simple GPS Automático */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-900">Rellenar automático con mi GPS</p>
            <p className="text-[11px] text-gray-600">Autocompleta tu lugar actual en Tingo María</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGpsFill}
          disabled={gpsLoading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
        >
          {gpsLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detectando...</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5" />
              <span>Llenar con mi GPS</span>
            </>
          )}
        </button>
      </div>

      {gpsMessage && (
        <p className="text-xs font-medium text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg">
          {gpsMessage}
        </p>
      )}

      <fieldset
        disabled={isSubmitting || resource.loading || !!resource.error}
        className="min-w-0 space-y-4"
      >
        <legend className="sr-only">Datos de la dirección</legend>

        {/* Quién recibe (Para que el repartidor se comunique) */}
        <section aria-labelledby={`${formId}-contact-title`} className="space-y-3">
          <h3 id={`${formId}-contact-title`} className="text-sm font-semibold text-ink">
            Contacto para entrega
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id={`${formId}-name`}
              label="Nombre del destinatario"
              placeholder="Nombre y apellido"
              autoComplete="name"
              required
              {...register('recipientName')}
              error={errors.recipientName?.message}
            />
            <Input
              id={`${formId}-phone`}
              label="Celular de contacto"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              maxLength={15}
              placeholder="Ej. 962 123 456"
              required
              {...register('phone')}
              error={errors.phone?.message}
              helperText="El repartidor te llamará para coordinar la entrega."
            />
          </div>
        </section>

        {/* Dónde entregaremos (Zona y Dirección general) */}
        <section
          aria-labelledby={`${formId}-location-title`}
          className="space-y-3 border-t border-border pt-4"
        >
          <h3 id={`${formId}-location-title`} className="text-sm font-semibold text-ink">
            Lugar de entrega en Tingo María
          </h3>
          <Select
            id={`${formId}-zone`}
            label="Zona de cobertura"
            required
            {...register('zoneId')}
            error={errors.zoneId?.message}
          >
            <option value="">Selecciona tu zona o sector</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id} disabled={!zone.isAvailable}>
                {zone.name}
                {!zone.isAvailable ? ' — Sin cobertura' : ''}
              </option>
            ))}
          </Select>
          {!hasCoverage && (
            <p
              role="status"
              className="rounded-xl border border-warning-border bg-warning-soft p-3 text-sm text-warning-strong"
            >
              No hay zonas disponibles para entrega por ahora.
            </p>
          )}
          {activeZone?.isAvailable && (
            <div className="space-y-1 rounded-xl border border-info-border bg-info-soft p-2.5 text-xs text-info-strong">
              <p className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="min-w-0 break-words">{activeZone.description}</span>
              </p>
              <p className="flex flex-wrap justify-between gap-2 tabular-nums font-semibold">
                <span>Tarifa de envío: {formatCents(activeZone.baseFeeCents)}</span>
                <span>Tiempo: ~{activeZone.estimatedMinutes} min</span>
              </p>
            </div>
          )}

          <Input
            id={`${formId}-street`}
            label="Calle, jirón o avenida"
            placeholder="Ej. Jr. Amazonas o cerca a la plaza"
            autoComplete="address-line1"
            required
            {...register('street')}
            error={errors.street?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id={`${formId}-number`}
              label="Número, manzana o lote"
              placeholder="Ej. 123, Mz. A Lt. 4 o s/n"
              autoComplete="address-line2"
              {...register('number')}
              error={errors.number?.message}
              helperText="Si no tienes número, déjalo vacío o pon s/n."
            />
            <Input
              id={`${formId}-reference`}
              label="Referencia para el repartidor"
              placeholder="Ej. Frente al parque, portón verde"
              {...register('reference')}
              error={errors.reference?.message}
              helperText="Punto visible para ubicar tu entrada."
            />
          </div>
        </section>

        <section aria-labelledby={`${formId}-save-title`} className="space-y-3 border-t border-border pt-4">
          <Input
            id={`${formId}-label`}
            label="Nombre de la dirección"
            placeholder="Ej. Casa o Trabajo"
            {...register('label')}
            error={errors.label?.message}
          />
          <label
            htmlFor={`${formId}-default`}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl text-sm text-ink-light"
          >
            <input
              id={`${formId}-default`}
              type="checkbox"
              {...register('isDefault')}
              className="h-5 w-5 shrink-0 accent-primary"
            />
            Usar como mi dirección principal
          </label>
        </section>
      </fieldset>

      {errors.root?.message && (
        <p
          role="alert"
          className="rounded-xl border border-destructive-border bg-destructive-soft p-3 text-sm text-destructive-strong"
        >
          {errors.root.message}
        </p>
      )}

      <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t border-border bg-surface py-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!hasCoverage || resource.loading || !!resource.error}
        >
          {initialData ? 'Actualizar dirección' : 'Guardar dirección'}
        </Button>
      </footer>
    </form>
  );
};
