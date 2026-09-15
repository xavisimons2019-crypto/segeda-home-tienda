import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {priceOrder} from '../_shared/pricing.ts';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:cors});
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'Método no permitido.'},405);
  try{
    const text=await req.text();
    if(text.length>100000)return reply({error:'El pedido es demasiado grande.'},413);
    const body=JSON.parse(text);
    if(typeof body.requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId))return reply({error:'Vuelve a intentar el pedido.'},400);
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
    // The gateway checks the signed JWT. Rate limits protect this intentionally public checkout.
    const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    const requestHash=await digest(JSON.stringify(body));
    const {data:previous,error:pe}=await db.from('segeda_orders').select('id,request_hash,total,payload').eq('request_id',body.requestId).maybeSingle();
    if(pe)throw new Error('database');
    if(previous){
      if(previous.request_hash!==requestHash)return reply({error:'Este intento ya pertenece a otro pedido. Vuelve a abrir el carrito.'},409);
      return reply({id:previous.id,total:previous.total,items:previous.payload.items});
    }
    const {data:allowed,error:le}=await db.rpc('segeda_allow_checkout',{client_key:await digest(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`)});
    if(le)throw new Error('database');
    if(!allowed)return reply({error:'Se enviaron varios pedidos. Espera un momento o escríbenos por WhatsApp.'},429);
    if(!Array.isArray(body.items)||body.items.length<1||body.items.length>50)return reply({error:'Revisa los productos de tu carrito.'},400);
    const ids=[...new Set(body.items.map((item:{product?:{id?:unknown}})=>String(item.product?.id??'')))];
    const {data:rows,error}=await db.from('segeda_products').select('data').in('id',ids);
    if(error)throw new Error('database');
    let order;
    try{order=priceOrder(body,rows.map(row=>row.data));}catch(e){return reply({error:e instanceof Error?e.message:'Revisa los datos del pedido.'},400);}
    const {data:created,error:saveError}=await db.from('segeda_orders').insert({request_id:body.requestId,request_hash:requestHash,customer_name:order.customerName,customer_phone:order.customerPhone,payload:{items:order.items,customerCity:order.customerCity,shipping:order.shipping,checkoutNotes:order.checkoutNotes},total:order.total}).select('id,total').single();
    if(saveError){
      if(saveError.code==='23505'){
        const {data:existing}=await db.from('segeda_orders').select('id,total,payload,request_hash').eq('request_id',body.requestId).single();
        if(existing?.request_hash===requestHash)return reply({id:existing.id,total:existing.total,items:existing.payload.items});
      }
      throw new Error('database');
    }
    return reply({id:created.id,total:created.total,items:order.items});
  }catch{return reply({error:'No se pudo registrar tu pedido. Inténtalo de nuevo.'},503);}
});
