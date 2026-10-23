"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nextCatalogBatch } from '@/lib/catalog-view';

export function useInfiniteCatalog({ total, visible, setVisible, filterKey, paused = false }: {
  total: number; visible: number; setVisible: (visible: number) => void; filterKey: string; paused?: boolean;
}) {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const context = useMemo(() => ({ filterKey, paused }), [filterKey, paused]);
  const [pendingLoad, setPendingLoad] = useState<typeof context | null>(null);
  const loading = pendingLoad === context;
  const locked = useRef(false);
  const frames = useRef<number[]>([]);
  const hasMore = visible < total;

  const loadMore = useCallback(() => {
    if (locked.current || paused || !hasMore) return;
    locked.current = true;
    setPendingLoad(context);
    // Yield a frame so the status is painted before adding the next twelve cards.
    frames.current.push(requestAnimationFrame(() => {
      frames.current.push(requestAnimationFrame(() => {
        setVisible(nextCatalogBatch(visible, total));
        locked.current = false;
        setPendingLoad(null);
        frames.current = [];
      }));
    }));
  }, [context, hasMore, paused, setVisible, total, visible]);

  useEffect(() => {
    return () => { frames.current.forEach(cancelAnimationFrame); frames.current = []; locked.current = false; };
  }, [filterKey, paused]);

  useEffect(() => {
    if (!sentinel || paused || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMore();
    }, { rootMargin: '240px 0px', threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, paused, loadMore]);

  return { sentinelRef: setSentinel, loading, hasMore, loadMore };
}
