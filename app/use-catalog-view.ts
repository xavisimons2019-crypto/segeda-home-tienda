"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CATALOG_BATCH_SIZE, readCatalogView, withCatalogView, type CatalogView, type SavedCatalogView } from '@/lib/catalog-view';

/** Save each listing on its own history entry, including full-page departures. */
export function useCatalogView<Filters extends Record<string, string>>(scope: string, defaults: Filters, defaultsFromUrl?: () => Filters) {
  const [view, setView] = useState<CatalogView<Filters>>({ filters: defaults, visible: CATALOG_BATCH_SIZE });
  const [restoring, setRestoring] = useState(true);
  const latest = useRef(view);
  const initial = useRef({ defaults, defaultsFromUrl });
  const pending = useRef<{ view: CatalogView<Filters>; scrollY: number } | null>(null);
  const ready = useRef(false);

  const remember = useCallback(() => {
    const snapshot: SavedCatalogView<Filters> = { scope, ...latest.current, scrollY: window.scrollY };
    if (ready.current && !pending.current) history.replaceState(withCatalogView(history.state, snapshot), '');
    return snapshot;
  }, [scope]);

  useLayoutEffect(() => {
    const restore = () => {
      const fallback = initial.current.defaultsFromUrl?.() ?? initial.current.defaults;
      const saved = readCatalogView(history.state, scope, fallback);
      // Native anchor links in Nubes create a history entry without custom state.
      // Keep the active filters and let the browser reach that anchor normally.
      if (!saved && ready.current && !initial.current.defaultsFromUrl) {
        requestAnimationFrame(remember);
        return;
      }
      const next = saved ? { filters: saved.filters, visible: saved.visible } : { filters: fallback, visible: CATALOG_BATCH_SIZE };
      pending.current = { view: next, scrollY: saved?.scrollY ?? window.scrollY };
      setRestoring(true);
      setView(next);
      ready.current = true;
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => { ready.current = false; window.removeEventListener('popstate', restore); };
  }, [scope, remember]);

  useLayoutEffect(() => {
    latest.current = view;
    const target = pending.current;
    if (!target || target.view !== view) return;
    // Remote catalog entries can arrive after the initial render. Do not replace a
    // saved position with a clipped one while the document is still too short.
    let frame = 0;
    let finished = false;
    const finish = (scroll: boolean) => {
      if (finished) return;
      finished = true;
      if (scroll) window.scrollTo({ top: target.scrollY, behavior: 'instant' });
      pending.current = null;
      setRestoring(false);
      remember();
    };
    const tryRestore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const available = document.documentElement.scrollHeight - window.innerHeight;
        if (available >= target.scrollY - 1) finish(true);
      });
    };
    const cancelForInput = () => finish(false);
    const cancelForKey = (event: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) finish(false);
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(tryRestore);
    observer?.observe(document.body);
    tryRestore();
    const timeout = setTimeout(() => finish(true), 5000);
    window.addEventListener('wheel', cancelForInput, { passive: true });
    window.addEventListener('touchstart', cancelForInput, { passive: true });
    window.addEventListener('pointerdown', cancelForInput, { passive: true });
    window.addEventListener('keydown', cancelForKey);
    return () => {
      cancelAnimationFrame(frame); clearTimeout(timeout); observer?.disconnect();
      window.removeEventListener('wheel', cancelForInput);
      window.removeEventListener('touchstart', cancelForInput);
      window.removeEventListener('pointerdown', cancelForInput);
      window.removeEventListener('keydown', cancelForKey);
    };
  }, [view, remember]);

  useEffect(() => { remember(); }, [view, remember]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => { clearTimeout(timer); timer = setTimeout(remember, 150); };
    const onLeave = () => { clearTimeout(timer); remember(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onLeave);
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); window.removeEventListener('pagehide', onLeave); };
  }, [remember]);

  const updateFilters = useCallback((patch: Partial<Filters>) => {
    pending.current = null;
    setRestoring(false);
    setView(current => ({ filters: { ...current.filters, ...patch }, visible: CATALOG_BATCH_SIZE }));
  }, []);
  const setVisible = useCallback((visible: number) => {
    setView(current => ({ ...current, visible }));
  }, []);

  return { ...view, updateFilters, setVisible, remember, restoring };
}
