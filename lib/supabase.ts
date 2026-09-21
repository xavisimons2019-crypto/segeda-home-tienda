import { createClient } from '@supabase/supabase-js';
import config from '@/data/supabase-public.json';
import type { Category, Product } from '@/lib/catalog';
import {compareProductOrder, sameProductOrder} from '@/lib/product-order';

export { config as supabaseConfig };
export const supabase = createClient(config.url, config.publishableKey, {
  auth: { persistSession: typeof window !== 'undefined', autoRefreshToken: typeof window !== 'undefined', detectSessionInUrl: false },
});

export async function getCatalog(): Promise<{products: Product[]; categories: Category[]}> {
  const readProducts = async () => {
    const rows: Product[] = [];
    for (let offset = 0; ; offset += 1000) {
      const {data, error} = await supabase.from('segeda_products').select('data,sort_order').order('sort_order').order('id').range(offset, offset + 999);
      if (error) throw new Error('No se pudo actualizar el catálogo.');
      rows.push(...data.map(row => ({...row.data as Product, sortOrder: row.sort_order as number})));
      if (data.length < 1000) return rows.sort(compareProductOrder);
    }
  };
  const [products, categories] = await Promise.all([
    readProducts(),
    supabase.from('segeda_categories').select('data,sort_order').order('sort_order').order('id').limit(1000),
  ]);
  if(categories.error) throw new Error('No se pudo actualizar el catálogo.');
  return {products, categories: categories.data.map(row=>({...row.data as Category,sortOrder:row.sort_order as number}))};
}

/** A transaction updates the entire category, with stale-list detection in Postgres. */
export async function saveProductOrder(category: string, ids: string[], expectedIds: string[]): Promise<void> {
  const {error} = await supabase.rpc('segeda_reorder_products', {
    p_category: category, p_ids: ids, p_expected_ids: expectedIds,
  });
  if (!error) return;
  // A lost response can follow a successful commit. Read back before reporting failure.
  try {
    const catalog = await getCatalog();
    const actual = catalog.products.filter(p => p.category === category).map(p => String(p.id));
    if (sameProductOrder(actual, ids)) return;
  } catch { /* Keep the last confirmed UI order when connectivity is unavailable. */ }
  throw new Error(error.code === '40001'
    ? 'La colección cambió en otra sesión. Actualiza la lista y vuelve a ordenar.'
    : 'No se pudo confirmar el nuevo orden. Se restauró la lista anterior; actualízala antes de reintentar.');
}

export async function saveCategoryOrder(ids:string[],expectedIds:string[]):Promise<void>{
  const {error}=await supabase.rpc('segeda_reorder_categories',{p_ids:ids,p_expected_ids:expectedIds});
  if(!error)return;
  try{const catalog=await getCatalog();if(sameProductOrder(catalog.categories.map(c=>c.id),ids))return;}catch{}
  throw new Error(error.code==='40001'?'Las categorías cambiaron en otra sesión. Actualiza la lista.':'No se pudo confirmar el orden. Se restauró la lista anterior; actualízala para continuar.');
}

/** Update open storefronts after a commit, and refresh on return/reconnection. */
export function watchCatalog(onChange: (catalog: Awaited<ReturnType<typeof getCatalog>>) => void) {
  let closed = false, running = false, queued = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = async () => {
    if (closed || document.visibilityState === 'hidden') return;
    if (running) { queued = true; return; }
    running = true;
    try { const data = await getCatalog(); if (!closed) onChange(data); } catch { /* Preserve the currently visible catalog. */ }
    finally { running = false; if (queued && !closed) { queued = false; schedule(); } }
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 180); };
  const channel = supabase.channel(`catalog-order-${crypto.randomUUID()}`)
    .on('postgres_changes', {event:'*', schema:'public', table:'segeda_products'}, schedule)
    .on('postgres_changes', {event:'*', schema:'public', table:'segeda_categories'}, schedule)
    .subscribe(status => { if (status === 'SUBSCRIBED') schedule(); });
  const fallback = setInterval(() => void refresh(), 30000);
  window.addEventListener('focus', schedule);
  window.addEventListener('online', schedule);
  document.addEventListener('visibilitychange', schedule);
  void refresh();
  return () => {
    closed = true; clearTimeout(timer); clearInterval(fallback);
    window.removeEventListener('focus', schedule); window.removeEventListener('online', schedule);
    document.removeEventListener('visibilitychange', schedule);
    void supabase.removeChannel(channel);
  };
}

export async function isAdmin(): Promise<boolean> {
  const {data:{user}, error}=await supabase.auth.getUser();
  if(error || !user)return false;
  const result=await supabase.from('segeda_admins').select('user_id').eq('user_id',user.id).maybeSingle();
  return !result.error && Boolean(result.data);
}

export async function submitOrder(order: unknown): Promise<{id:string; total:number; items: import('@/lib/cart').CartItem[]}> {
  const response=await fetch(`${config.url}/functions/v1/segeda-checkout`, {
    method:'POST', headers:{'Content-Type':'application/json',apikey:config.publishableKey,Authorization:`Bearer ${config.anonKey}`}, body:JSON.stringify(order),
  });
  const data=await response.json() as {id:string;total:number;items:import('@/lib/cart').CartItem[];error?:string};
  if(!response.ok) throw new Error(data.error || 'No se pudo registrar tu pedido. Inténtalo de nuevo.');
  return data;
}

export async function uploadProductImage(file: File): Promise<string> {
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>8000000)throw new Error('Usa una imagen JPG, PNG, WebP o AVIF de hasta 8 MB.');
  const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
  const path=`products/${crypto.randomUUID()}.${extensions[file.type]}`;
  const {error}=await supabase.storage.from(config.bucket).upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw new Error('No se pudo subir la imagen.');
  return supabase.storage.from(config.bucket).getPublicUrl(path).data.publicUrl;
}
