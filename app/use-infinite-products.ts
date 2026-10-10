"use client";

import {useCallback, useEffect, useRef, useState} from "react";

const PAGE_SIZE = 12;

/** Reveal the existing, ordered catalog in small batches. No extra data requests. */
export function useInfiniteProducts(total:number, scope:string, paused=false) {
  const [page, setPage] = useState({scope, count:PAGE_SIZE});
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visible = Math.min(page.scope === scope ? page.count : PAGE_SIZE, total);
  const hasMore = visible < total;
  const restoreVisible = useCallback((count:number, savedScope:string) => {
    setPage({scope:savedScope, count:Math.max(PAGE_SIZE, Number.isFinite(count) ? count : PAGE_SIZE)});
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    setLoading(false);
    if (!sentinel || paused || !hasMore) return;
    // Older browsers still get every product, without a non-working load button.
    if (!("IntersectionObserver" in window)) {
      setPage({scope, count:total});
      return;
    }
    let scheduled = false;
    let cancelled = false;
    let frame = 0;
    let paintFrame = 0;
    const observer = new IntersectionObserver(entries => {
      if (cancelled || scheduled || !entries.some(entry => entry.isIntersecting)) return;
      scheduled = true;
      observer.disconnect();
      setLoading(true);
      // Paint the small indicator before adding the next batch; only one can run.
      frame = requestAnimationFrame(() => {
        paintFrame = requestAnimationFrame(() => {
          if (cancelled) return;
          setPage({scope, count:Math.min(visible + PAGE_SIZE, total)});
          setLoading(false);
        });
      });
    }, {rootMargin:"160px 0px", threshold:0});
    observer.observe(sentinel);
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(paintFrame);
    };
  }, [scope, visible, total, hasMore, paused]);

  return {visible, loading, hasMore, sentinelRef, restoreVisible};
}
