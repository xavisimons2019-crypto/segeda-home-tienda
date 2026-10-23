export const CATALOG_BATCH_SIZE = 12;
export const CATALOG_VIEW_KEY = '__segedaCatalogView';

export type CatalogView<Filters> = { filters: Filters; visible: number };
export type SavedCatalogView<Filters> = CatalogView<Filters> & { scope: string; scrollY: number };

export function nextCatalogBatch(visible: number, total: number) {
  return Math.min(visible + CATALOG_BATCH_SIZE, total);
}

/** History entries belong to the browser/router too; keep their other fields intact. */
export function withCatalogView<Filters>(historyState: unknown, snapshot: SavedCatalogView<Filters>): Record<string, unknown> & { [CATALOG_VIEW_KEY]: SavedCatalogView<Filters> } {
  return { ...(historyState && typeof historyState === 'object' ? historyState : {}), [CATALOG_VIEW_KEY]: snapshot };
}

export function readCatalogView<Filters extends Record<string, string>>(historyState: unknown, scope: string, defaults: Filters): SavedCatalogView<Filters> | null {
  if (!historyState || typeof historyState !== 'object') return null;
  const saved = (historyState as Record<string, unknown>)[CATALOG_VIEW_KEY] as SavedCatalogView<Filters> | undefined;
  if (!saved || saved.scope !== scope || !saved.filters || typeof saved.filters !== 'object' ||
    !Number.isInteger(saved.visible) || saved.visible < CATALOG_BATCH_SIZE ||
    !Number.isFinite(saved.scrollY) || saved.scrollY < 0) return null;
  const filters = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Filters)[]) {
    if (typeof saved.filters[key] !== 'string') return null;
    filters[key] = saved.filters[key];
  }
  return { scope, filters, visible: saved.visible, scrollY: saved.scrollY };
}
