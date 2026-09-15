import {adminClient} from '@/lib/admin';
export async function POST(request:Request){
 const db=await adminClient(request);if(!db)return Response.json({error:'Acceso no autorizado'},{status:401});
 try{
 const body=await request.json() as {action?:string;id?:string|number;category?:Record<string,unknown>};const item=body.category;const id=String(body.id??item?.id??'');
 if(!id)return Response.json({error:'Falta el identificador.'},{status:400});
 if(body.action==='delete'){const {error}=await db.from('segeda_categories').delete().eq('id',id);if(error)throw error;}
 else {if(!item||!String(item.name||'').trim())return Response.json({error:'Falta el nombre.'},{status:400});const {error}=await db.from('segeda_categories').upsert({id,data:{...item,id},updated_at:new Date().toISOString()});if(error)throw error;}
 return Response.json({ok:true,id});
 }catch{return Response.json({error:'No se pudo guardar el cambio.'},{status:400});}
}
