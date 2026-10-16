import type {RefObject} from "react";

export default function CatalogProgress({visible,total,loading,hasMore,sentinelRef}:{
  visible:number;total:number;loading:boolean;hasMore:boolean;sentinelRef:RefObject<HTMLDivElement|null>;
}) {
  if (!total) return null;
  return <div className="catalog-progress" ref={sentinelRef} role="status" aria-live="polite" aria-atomic="true" aria-busy={loading}>
    {loading ? <><span className="catalog-progress__spinner" aria-hidden="true"/> Cargando diseños…</> :
      <span>{hasMore ? `Mostrando ${visible} de ${total} diseños` : `Has visto los ${total} diseños`}</span>}
  </div>;
}
