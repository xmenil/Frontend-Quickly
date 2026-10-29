import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { engagementApi } from '../../services/api/engagementApi';
import { useAuthStore } from '../../store/authStore';

type Kind = 'product' | 'store';
interface FavoritesState {
  owner?: string;
  loaded: boolean;
  loading: boolean;
  ids: Set<string>;
  pending: Set<string>;
  error?: string;
}
const useFavorites = create<FavoritesState>(() => ({ loaded: false, loading: false, ids: new Set(), pending: new Set() }));
let generation = 0;
const keyFor = (kind: Kind, id: string) => `${kind}:${id}`;

async function load(owner: string) {
  const version = generation;
  const current = useFavorites.getState();
  if (current.owner === owner && (current.loaded || current.loading)) return;
  useFavorites.setState({ owner, loaded: false, loading: true, ids: new Set(), pending: new Set(), error: undefined });
  try {
    const ids = new Set<string>();
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = await engagementApi.favorites(cursor);
      page.items.forEach(item => ids.add(keyFor(item.kind, item.id)));
      cursor = page.nextCursor || undefined;
      if (cursor && cursors.has(cursor)) throw new Error('No se pudieron cargar todos los favoritos.');
      if (cursor) cursors.add(cursor);
    } while (cursor);
    if (generation === version && useAuthStore.getState().currentUser?.id === owner) useFavorites.setState({ ids, loaded: true, loading: false });
  } catch (error) {
    if (generation === version && useAuthStore.getState().currentUser?.id === owner) useFavorites.setState({ loading: false, error: error instanceof Error ? error.message : 'No se pudieron cargar los favoritos.' });
  }
}

// Discard private cache on every identity change, including logout and a later login by the same person.
useAuthStore.subscribe((state, previous) => {
  if (state.currentUser?.id !== previous.currentUser?.id) { generation++; useFavorites.setState({ owner: undefined, ids: new Set(), pending: new Set(), loaded: false, loading: false, error: undefined }); }
});

window.addEventListener('quickly:favorites-changed', () => { const owner = useAuthStore.getState().currentUser?.id; if (owner) { useFavorites.setState({ loaded: false }); void load(owner); } });

export function useCatalogFavorite(kind: Kind, id: string) {
  const owner = useAuthStore(state => state.currentUser?.id);
  const state = useFavorites();
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const key = keyFor(kind, id);
  const isFavorite = state.owner === owner && state.ids.has(key);
  useEffect(() => { setActionError(''); if (owner) void load(owner); }, [owner, id]);
  async function toggle() {
    if (!owner) { navigate('/login', { state: { from: location.pathname + location.search } }); return; }
    const current = useFavorites.getState();
    if (current.pending.has(key)) return;
    if (!current.loaded) { await load(owner); return; }
    const version = generation;
    const enabled = !current.ids.has(key);
    useFavorites.setState({ pending: new Set([...current.pending, key]) });
    setActionError('');
    try {
      await engagementApi.favorite(kind, id, enabled);
      if (generation !== version || useAuthStore.getState().currentUser?.id !== owner) return;
      useFavorites.setState({ loaded: false });
      await load(owner);
      if (generation !== version || useAuthStore.getState().currentUser?.id !== owner) return;
      const confirmed = useFavorites.getState();
      if (confirmed.loaded && confirmed.ids.has(key) !== enabled) {
        setActionError('El servidor todavía no confirma el cambio del favorito. Revisa su estado antes de repetir la acción.');
      }
    } catch (error) {
      if (generation === version && useAuthStore.getState().currentUser?.id === owner) setActionError(error instanceof Error ? error.message : 'No se pudo guardar el favorito.');
    } finally {
      if (generation === version && useFavorites.getState().owner === owner) {
        const pending = new Set(useFavorites.getState().pending); pending.delete(key); useFavorites.setState({ pending });
      }
    }
  }
  return { isFavorite, toggle, busy: !!owner && (state.loading || state.pending.has(key)), error: actionError || (state.owner === owner ? state.error : undefined) };
}
