import {christmas, type Product} from "@/lib/catalog";

export const CART_KEY="segeda-cart-v1";

export type CartItem={
  key:string;
  product:Product;
  sizeLabel:string;
  unitPrice:number;
  personalization:string;
  color:string;
  notes:string;
  quantity:number;
};

export function readCart():CartItem[]{
  if(typeof window==="undefined")return [];
  try{
    const parsed=JSON.parse(localStorage.getItem(CART_KEY)||"[]") as unknown;
    if(!Array.isArray(parsed))return [];
    return parsed.flatMap((entry,index)=>{
      if(!entry||typeof entry!=="object")return [];
      const value=entry as Record<string,unknown>;
      const rawProduct=(value.product&&typeof value.product==="object"?value.product:{}) as Record<string,unknown>;
      const id=rawProduct.id??`legacy-${index}`;
      const title=String(rawProduct.title||rawProduct.theme||rawProduct.name||"Producto Segeda Home");
      const category=String(rawProduct.category||rawProduct.categoryId||"");
      const imageUrl=String(rawProduct.imageUrl||rawProduct.image||"");
      const unitPrice=Math.max(0,Number(value.unitPrice??value.price??rawProduct.price)||0);
      const sizeLabel=String(value.sizeLabel||value.size||"Estándar");
      const personalization=String(value.personalization||value.name||"");
      const color=String(value.color||"");
      const notes=String(value.notes||"");
      const quantity=Math.max(1,Number(value.quantity)||1);
      const product:Product={
        id:id as string|number,
        title,
        category,
        description:String(rawProduct.description||""),
        price:Math.max(0,Number(rawProduct.price)||unitPrice),
        compareAtPrice:Math.max(0,Number(rawProduct.compareAtPrice)||0),
        sizes:Array.isArray(rawProduct.sizes)?rawProduct.sizes as Product["sizes"]:[],
        tags:String(rawProduct.tags||""),
        audience:String(rawProduct.audience||""),
        themeGroup:String(rawProduct.themeGroup||""),
        estimatedDays:String(rawProduct.estimatedDays||""),
        featured:Boolean(rawProduct.featured),
        imageUrl,
        galleryUrls:Array.isArray(rawProduct.galleryUrls)?rawProduct.galleryUrls as string[]:Array.isArray(rawProduct.gallery)?rawProduct.gallery as string[]:[imageUrl],
      };
      return [{
        key:String(value.key||`${id}-${sizeLabel}-${personalization}-${index}`),
        product,sizeLabel,unitPrice,personalization,color,notes,quantity,
      }];
    });
  }catch{return []}
}

export function saveCart(items:CartItem[]){
  if(typeof window!=="undefined")localStorage.setItem(CART_KEY,JSON.stringify(items));
}

export function normalizeCart(items:CartItem[]):CartItem[]{
 const count=items.filter(item=>item.product.category==="navidad-temporadas").reduce((sum,item)=>sum+item.quantity,0);
 return items.map(item=>item.product.category==="navidad-temporadas"?{...item,unitPrice:count>=christmas.multipleMinimumQuantity?christmas.multipleUnitPrice:christmas.singlePrice}:item);
}
