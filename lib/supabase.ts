import { createClient } from '@supabase/supabase-js';
import config from '@/data/supabase-public.json';
import type { Category, Product } from '@/lib/catalog';

export { config as supabaseConfig };
export const supabase = createClient(config.url, config.publishableKey, {
  auth: { persistSession: typeof window !== 'undefined', autoRefreshToken: typeof window !== 'undefined', detectSessionInUrl: false },
});

export async function getCatalog(): Promise<{products: Product[]; categories: Category[]}> {
  const [products, categories] = await Promise.all([
    supabase.from('segeda_products').select('data').order('sort_order').order('id').limit(1000),
    supabase.from('segeda_categories').select('data').order('sort_order').order('id').limit(1000),
  ]);
  if(products.error || categories.error) throw new Error('No se pudo actualizar el catálogo.');
  return {products: products.data.map(row=>row.data as Product), categories: categories.data.map(row=>row.data as Category)};
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
