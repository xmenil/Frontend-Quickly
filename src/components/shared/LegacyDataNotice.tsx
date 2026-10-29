import React, { useEffect, useState } from 'react';
import { legacyNoticeKey } from '../../lib/legacyStorage';
export function LegacyDataNotice() {
 const pending = () => { try { return localStorage.getItem(legacyNoticeKey) === '1'; } catch { return false; } };
 const [visible, setVisible] = useState(pending);
 useEffect(() => { const refresh = () => setVisible(pending()); window.addEventListener('quickly:legacy-retired', refresh); window.addEventListener('storage', refresh); return () => { window.removeEventListener('quickly:legacy-retired', refresh); window.removeEventListener('storage', refresh); }; }, []);
 if (!visible) return null;
 return <aside role="status" className="fixed inset-x-4 top-4 z-[80] mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-info-border bg-info-soft p-4 text-sm text-info-strong shadow-floating"><p>Los datos locales del prototipo ya no se utilizan. Revisa tu sesión y reconstruye cualquier carrito anterior desde el catálogo. Tu carrito actual se conserva.</p><button type="button" className="min-h-11 shrink-0 px-2 font-semibold" onClick={() => { try { localStorage.removeItem(legacyNoticeKey); } catch {} setVisible(false); }}>Entendido</button></aside>;
}
