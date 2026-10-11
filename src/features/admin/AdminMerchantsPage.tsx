import React, { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCents } from '../../lib/currency';
import { Power, Store, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdminMerchantsPage: React.FC = () => {
  const { merchants, updateMerchantProfile } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [failedLogos, setFailedLogos] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const filteredMerchants = merchants.filter((merchant) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || [merchant.name, merchant.category, merchant.address].some((value) => value.toLowerCase().includes(query));
  });

  const toggleMerchant = (id: string, name: string, isOpen: boolean) => {
    setNotice('');
    setError('');
    try {
      updateMerchantProfile(id, { isOpen: !isOpen });
      const updated = useDataStore.getState().merchants.find((merchant) => merchant.id === id);
      if (!updated || updated.isOpen !== !isOpen) {
        setError('No se pudo cambiar la disponibilidad. Revisa el comercio e inténtalo nuevamente.');
        return;
      }
      setNotice(isOpen ? `Comercio pausado: ${name}.` : `Comercio abierto: ${name}.`);
    } catch {
      setError('No se pudo completar la acción. Revisa el estado del comercio antes de volver a intentarlo.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Comercios afiliados</h1>
        <p className="text-sm text-ink-light">Consulta sus datos y controla su disponibilidad en Tingo María.</p>
      </header>

      <section aria-label="Búsqueda de comercios" className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input id="admin-merchant-search" label="Buscar comercios" type="search" className="md:text-sm"
              placeholder="Nombre, categoría o dirección" value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              leftIcon={<Search className="h-5 w-5" aria-hidden="true" />} />
          </div>
          {searchQuery && <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')}>Limpiar búsqueda</Button>}
        </div>
      </section>

      {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-selva-border bg-selva-soft p-4 text-sm text-selva-strong"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{notice}</p></div>}
      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-sm text-destructive-strong"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}

      <section aria-labelledby="admin-merchants-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="admin-merchants-heading" className="text-base font-semibold text-ink">Comercios registrados</h2>
          <p role="status" className="text-sm tabular-nums text-ink-muted">{filteredMerchants.length} {filteredMerchants.length === 1 ? 'comercio' : 'comercios'}</p>
        </div>
        {filteredMerchants.length === 0 ? (
          <EmptyState icon={<Store className="h-8 w-8" aria-hidden="true" />}
            title={merchants.length === 0 ? 'Aún no hay comercios registrados' : 'No encontramos comercios con esta búsqueda'}
            description={merchants.length === 0 ? 'Los comercios aparecerán aquí cuando se registren en Quickly.' : 'Prueba con otro nombre, categoría o dirección, o limpia la búsqueda.'}
            actionText={searchQuery ? 'Limpiar búsqueda' : undefined} onAction={searchQuery ? () => setSearchQuery('') : undefined} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface shadow-subtle">
            <table className="block w-full text-left text-sm xl:table xl:table-fixed">
              <caption className="sr-only">Comercios registrados: datos, disponibilidad, tarifa de envío, preparación y acciones.</caption>
              <thead className="sr-only bg-surface-subtle text-xs text-ink-light xl:not-sr-only xl:table-header-group">
                <tr>
                  <th scope="col" className="w-1/3 rounded-tl-2xl px-4 py-3 font-semibold">Comercio</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Disponibilidad</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Envío</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Preparación</th>
                  <th scope="col" className="w-1/5 rounded-tr-2xl px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="block divide-y divide-border xl:table-row-group">
                {filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="block p-4 xl:table-row xl:p-0">
                    <th scope="row" className="block pb-3 font-normal xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                      <div className="flex min-w-0 items-start gap-3">
                        {failedLogos.includes(merchant.id) || !merchant.logoUrl ? (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-subtle text-ink-muted"><Store className="h-5 w-5" aria-hidden="true" /></span>
                        ) : (
                          <img src={merchant.logoUrl} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-xl border border-border object-cover"
                            onError={() => setFailedLogos((ids) => ids.includes(merchant.id) ? ids : [...ids, merchant.id])} />
                        )}
                        <div className="min-w-0 space-y-1">
                          <h3 className="break-words text-sm font-semibold text-ink">{merchant.name}</h3>
                          <p className="text-xs text-ink-light">{merchant.category}</p>
                          <p className="break-words text-xs text-ink-muted">{merchant.address}</p>
                          <p className="text-xs tabular-nums text-ink-light"><span aria-hidden="true">★ </span>Calificación: {merchant.rating.toFixed(1)}</p>
                        </div>
                      </div>
                    </th>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Disponibilidad</span>
                      <Badge variant={merchant.isOpen ? 'success' : 'danger'}>{merchant.isOpen ? 'Abierto' : 'Cerrado'}</Badge>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:text-right xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Tarifa de envío</span>
                      <span className="font-medium tabular-nums text-ink">{formatCents(merchant.deliveryFeeCents)}</span>
                    </td>
                    <td className="flex items-center justify-between gap-3 py-2 xl:table-cell xl:px-3 xl:py-3 xl:text-right xl:align-middle">
                      <span className="text-xs text-ink-muted xl:hidden">Preparación</span>
                      <span className="tabular-nums text-ink-light">{merchant.prepTimeMinutes} min</span>
                    </td>
                    <td className="block pt-3 xl:table-cell xl:px-4 xl:py-3 xl:align-middle">
                      <Button type="button" variant="outline" size="sm" className="w-full gap-2"
                        aria-label={`${merchant.isOpen ? 'Pausar' : 'Abrir'} comercio: ${merchant.name}`}
                        onClick={() => toggleMerchant(merchant.id, merchant.name, merchant.isOpen)}>
                        <Power className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {merchant.isOpen ? 'Pausar comercio' : 'Abrir comercio'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
