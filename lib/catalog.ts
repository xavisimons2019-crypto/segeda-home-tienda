import config from "@/data/supabase-public.json";
import raw from "@/data/catalog.json";
import assetMapRaw from "@/data/asset-map.json";

export type SizeOption = { label: string; price: number };
export type Product = { id:number|string; title:string; category:string; sortOrder?:number; description?:string; measurement?:string; material?:string; price:number; compareAtPrice?:number; sizes?:SizeOption[]; tags?:string; audience?:string; themeGroup?:string; estimatedDays?:string; featured?:boolean; imageUrl:string; galleryUrls?:string[] };
export type Category = { id:string; sortOrder?:number; name:string; short:string; image:string; description:string; defaultPrice:number; featured:boolean; count:number };
export const SOURCE_ORIGIN = "https://segeda-home-tienda.mad-elynnlevon7.chatgpt.site";
export const baseCategories = raw.categories as Category[];
export const baseProducts = raw.products as Product[];
export const christmas = raw.staticChristmas as typeof raw.staticChristmas;
const assetMap=assetMapRaw as Record<string,string>;
export function assetUrl(value?:string){
  if(!value)return "";
  const full=value.startsWith("http")?value:`${SOURCE_ORIGIN}${value}`;
  const mapped=assetMap[full]||value;
  if(mapped.startsWith("/api/")||mapped.includes(".chatgpt.site"))return "";
  if(mapped.startsWith("/"))return `${config.url}/storage/v1/object/public/${config.bucket}${mapped}`;
  return mapped.startsWith("https://")?mapped:"";
}
export function mergeChanges<T extends {id:string|number}>(base:T[], changes:{id:string;action:string;data:string}[]):T[]{const map=new Map(base.map((item)=>[String(item.id),item]));for(const change of changes){if(change.action==="delete")map.delete(change.id);else{try{map.set(change.id,JSON.parse(change.data) as T)}catch{}}}return [...map.values()]}
