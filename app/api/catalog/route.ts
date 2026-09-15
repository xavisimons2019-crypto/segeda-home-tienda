import {getCatalog} from '@/lib/supabase';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await getCatalog());}catch{return Response.json({error:'No se pudo consultar el catálogo.'},{status:503});}}
