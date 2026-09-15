import {adminClient} from '@/lib/admin';
export async function POST(request:Request){
 const db=await adminClient(request);if(!db)return Response.json({error:'Acceso no autorizado'},{status:401});
 try{
 const body=await request.json() as {action?:string;id?:string|number;product?:Record<string,unknown>};const item=body.product;const id=String(body.id??item?.id??'');
 if(!id)return Response.json({error:'Falta el identificador.'},{status:400});
 if(body.action==='delete'){const {error}=await db.from('segeda_products').delete().eq('id',id);if(error)throw error;}
 else {if(!item||!String(item.title||'').trim())return Response.json({error:'Falta el nombre.'},{status:400});const {error}=await db.from('segeda_products').upsert({id,category:String(item.category),data:{...item,id},updated_at:new Date().toISOString()});if(error)throw error;}
 return Response.json({ok:true,id});
 }catch{return Response.json({error:'No se pudo guardar el cambio.'},{status:400});}
}
