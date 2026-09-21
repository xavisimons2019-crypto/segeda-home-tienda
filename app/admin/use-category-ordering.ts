'use client';
import {useRef,useState} from 'react';
import type {Category} from '@/lib/catalog';
import {applyCategoryOrder} from '@/lib/category-order';
type Options={categories:Category[];setCategories:(categories:Category[])=>void;setError:(message:string)=>void;setNotice:(message:string)=>void;persist:(ids:string[],expectedIds:string[])=>Promise<void>};
export function useCategoryOrdering({categories,setCategories,setError,setNotice,persist}:Options){
 const [saving,setSaving]=useState(false),[needsRefresh,setNeedsRefresh]=useState(false);const pending=useRef(false);
 const reorder=async(ids:string[],expectedIds:string[])=>{if(pending.current||needsRefresh)return;const before=categories;pending.current=true;setSaving(true);setError('');setNotice('');try{setCategories(applyCategoryOrder(before,ids));await persist(ids,expectedIds);setNotice('Orden de categorías guardado en la tienda.');}catch(e){setCategories(before);setNeedsRefresh(true);setError(e instanceof Error?e.message:'No se pudo guardar el orden. Actualiza la lista.');}finally{pending.current=false;setSaving(false);}};
 return {saving,needsRefresh,reorder,confirmRefreshed:()=>setNeedsRefresh(false)};
}
