'use client';
import {useRef,useState} from 'react';
import type {Product} from '@/lib/catalog';
import {applyProductOrder} from '@/lib/product-order';

type Options={products:Product[];category:string;query:string;setProducts:(products:Product[])=>void;setError:(message:string)=>void;setNotice:(message:string)=>void;persist:(category:string,ids:string[],expectedIds:string[])=>Promise<void>};
/** Keep the last confirmed list and block further moves after an uncertain response. */
export function useProductOrdering({products,category,query,setProducts,setError,setNotice,persist}:Options){
 const [saving,setSaving]=useState(false),[needsRefresh,setNeedsRefresh]=useState(false);
 const pending=useRef(false);
 const reorder=async(ids:string[],expectedIds:string[])=>{
  if(pending.current||category==='all'||query.trim()||needsRefresh)return;
  const before=products;
  pending.current=true;setSaving(true);setError('');setNotice('');
  try{setProducts(applyProductOrder(before,category,ids));await persist(category,ids,expectedIds);setNotice('Orden guardado. Ya se refleja en la tienda.');}
  catch(e){setProducts(before);setNeedsRefresh(true);setError(e instanceof Error?e.message:'No se pudo guardar el orden. Actualiza la lista.');}
  finally{pending.current=false;setSaving(false);}
 };
 return {saving,needsRefresh,reorder,confirmRefreshed:()=>setNeedsRefresh(false)};
}
