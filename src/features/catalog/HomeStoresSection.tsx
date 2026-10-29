import React from 'react';
import {Link} from 'react-router-dom';
import {Building2, ArrowRight} from 'lucide-react';
import {catalogApi, imageUrl} from '../../services/api/catalogApi';
import {operationsApi} from '../../services/api/operationsApi';
import {formatCents} from '../../lib/currency';
import {FavoriteButton} from '../engagement/RealEngagementPages';
import {RemoteState, useRemote} from '../operations/shared';

export function HomeStoresSection() {
  const stores = useRemote('home-stores', signal=>catalogApi.stores(signal));
  return <section aria-labelledby="home-stores-title" className="border-y border-border py-6 sm:py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="home-stores-title" className="text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-primary-dark"/>Comercios en Quickly</h2>
        <Link to="/negocios" className="min-h-11 inline-flex items-center gap-2 text-primary-dark font-bold">Ver todos <ArrowRight className="w-4 h-4"/></Link>
      </div>
      <RemoteState loading={stores.loading} error={stores.error} retry={stores.reload}/>
      {!stores.loading && !stores.error && stores.data && <>
        {!stores.data.length && <p className="rounded-2xl bg-surface-subtle p-6">Todavía no hay comercios disponibles.</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{stores.data.map(store=><article key={store.id} className="rounded-2xl border border-border shadow-sm overflow-hidden bg-white min-w-0">
          <Link to={`/negocios/${store.id}`} className="block">
            {store.bannerUrl ? <img src={imageUrl(store.bannerUrl)} alt={`Banner de ${store.name}`} loading="lazy" className="w-full aspect-video object-cover"/> : <div className="aspect-video bg-primary-50 flex items-center justify-center"><Building2 aria-hidden className="w-12 h-12 text-primary-dark"/></div>}
            <div className="p-4 space-y-2">
              {store.logoUrl && <img src={imageUrl(store.logoUrl)} alt={`Logo de ${store.name}`} className="w-12 h-12 rounded-xl object-contain"/>}
              <h3 className="font-bold break-words">{store.name}</h3><p className="text-sm text-ink-light">{store.zone_name}</p>
              <p className={`text-sm font-semibold ${store.isOpen?'text-selva':'text-ink-light'}`}>{store.isOpen?'Abierto · Recibiendo pedidos':'Cerrado en este momento'}</p>
              <span className="min-h-11 inline-flex items-center text-primary-dark font-semibold">Ver productos</span>
            </div>
          </Link>
          <div className="px-4 pb-4"><FavoriteButton kind="store" id={store.id}/></div>
        </article>)}</div>
      </>}
    </div>
  </section>;
}

export function CoverageSection() {
  const zones = useRemote('home-coverage', signal=>operationsApi.zones(signal));
  return <section aria-label="Cobertura y tarifas" className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-3 min-w-0">
    <h2 className="font-bold">Cobertura y tarifas</h2>
    <RemoteState loading={zones.loading} error={zones.error} retry={zones.reload}/>
    {!zones.loading && !zones.error && zones.data && <>
      {!zones.data.length && <p className="text-sm text-ink-light">Todavía no hay zonas de reparto disponibles.</p>}
      <ul className="space-y-2">{zones.data.map(zone=><li key={zone.id} className="text-sm flex flex-wrap justify-between gap-2 border-b border-border pb-2"><span>{zone.name}</span><span className="font-bold tabular-nums">{formatCents(zone.baseFeeCents)} · {zone.estimatedMinutes} min estimados</span></li>)}</ul>
      <p className="text-sm text-ink-light">Estimaciones configuradas por zona. Revisa el total y el envío de cada tienda al cotizar.</p>
    </>}
  </section>;
}
