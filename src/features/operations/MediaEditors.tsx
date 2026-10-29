import React, { useId, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mediaApi, mediaUrl } from '../../services/api/mediaApi';
import { prepareImage } from '../../services/media/prepareImage';
import { Feedback, RemoteState, useRemote } from './shared';

function ImageEditor({label,url,save,remove,saved}: {label:string;url:string|null;save:(content:string)=>Promise<unknown>;remove:()=>Promise<unknown>;saved:()=>void}) {
  const id=useId(); const [busy,setBusy]=useState(false); const [error,setError]=useState('');const [success,setSuccess]=useState('');
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget;const file=new FormData(form).get('file');setBusy(true);setError('');setSuccess('');
    try {if (!(file instanceof File) || !file.size) throw new Error('Selecciona una imagen.');await save(await prepareImage(file));form.reset();saved();setSuccess(`${label} guardado correctamente.`);}
    catch(error){setError(error instanceof Error ? error.message : 'No se pudo guardar la imagen.');}finally{setBusy(false);}
  }
  async function discard(){setBusy(true);setError('');setSuccess('');try{await remove();saved();setSuccess(`${label} eliminado correctamente.`);}catch(error){setError(error instanceof Error ? error.message : 'No se pudo quitar la imagen.');}finally{setBusy(false);}}
  return <section className="space-y-4"><h3 className="text-lg font-bold">{label}</h3>
    {url ? <img src={mediaUrl(url)} alt={label} className={`w-full max-h-56 object-contain rounded-xl ${label === 'Avatar' ? 'max-w-40' : ''}`} /> : <p className="text-sm text-ink-muted">Todavía no hay una imagen.</p>}
    <form onSubmit={upload} aria-label={`Cambiar ${label.toLowerCase()}`}><fieldset disabled={busy} className="space-y-3"><Input id={id} label={`Archivo para ${label.toLowerCase()}`} type="file" name="file" accept="image/png,image/jpeg,image/webp" required helperText="PNG, JPEG o WebP de hasta 10 MB. Se prepara una imagen de hasta 1600 × 1600 y 2 MB." />
      <div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy}>Guardar {label.toLowerCase()}</Button>{url && <Button type="button" variant="outline" disabled={busy} onClick={() => void discard()}>Quitar {label.toLowerCase()}</Button>}</div></fieldset></form><Feedback error={error} success={success} />
  </section>;
}
export function AvatarEditor(){
  const resource=useRemote('my-avatar',(signal)=>mediaApi.avatar(signal));
  return <section className="border-t border-border pt-6 space-y-4"><h2 className="text-xl font-bold">Foto de perfil</h2><p className="text-sm text-ink-light">Tu foto solo es visible dentro de tu cuenta.</p><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/>
    {!resource.error && resource.data && <ImageEditor label="Avatar" url={resource.data.url} save={mediaApi.saveAvatar} remove={mediaApi.removeAvatar} saved={resource.reload}/>}</section>;
}
export function StoreBrandingEditor({storeId}:{storeId:string}){
  const resource=useRemote(`store-branding:${storeId}`,(signal)=>mediaApi.branding(storeId,signal));
  return <section className="space-y-6"><h2 className="text-xl font-bold">Imágenes de la tienda</h2><p className="text-sm text-ink-light">El logo y el banner se mostrarán a los clientes cuando la tienda esté aprobada y su zona esté habilitada.</p><RemoteState loading={resource.loading} error={resource.error} retry={resource.reload}/>
    {!resource.error && resource.data && <><ImageEditor label="Logo" url={resource.data.logoUrl} save={(content)=>mediaApi.saveBranding(storeId,'logo',content)} remove={()=>mediaApi.removeBranding(storeId,'logo')} saved={resource.reload}/>
      <ImageEditor label="Banner" url={resource.data.bannerUrl} save={(content)=>mediaApi.saveBranding(storeId,'banner',content)} remove={()=>mediaApi.removeBranding(storeId,'banner')} saved={resource.reload}/></>}
  </section>;
}
