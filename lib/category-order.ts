import type {Category} from './catalog';
export function applyCategoryOrder(categories:Category[],ids:string[]):Category[]{
 const byId=new Map(categories.map(c=>[c.id,c]));
 if(ids.length!==categories.length||new Set(ids).size!==ids.length||ids.some(id=>!byId.has(id)))throw new Error('La lista de categorías cambió. Actualízala antes de ordenar.');
 return ids.map((id,index)=>({...byId.get(id)!,sortOrder:index+1}));
}
