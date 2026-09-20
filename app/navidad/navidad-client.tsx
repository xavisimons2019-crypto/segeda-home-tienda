"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {getCatalog} from "@/lib/supabase";
import {ShoppingBag} from "lucide-react";
import ProductImage from "@/app/product-image";
import CatalogCard from "@/app/catalog-card";
import CatalogBack from "@/app/catalog-back";
import {scrollToSection} from "@/lib/motion";
import { christmas, type Product } from "@/lib/catalog";
import { readCart, saveCart, type CartItem } from "@/lib/cart";

const initialModels=christmas.products.map((product,index)=>({...product,id:String(9001+index),index:index+1}));

export default function NavidadClient(){
  const [models,setModels]=useState(initialModels);
  useEffect(()=>{getCatalog().then(data=>setModels(data.products.filter(p=>p.category==="navidad-temporadas").map((p,index)=>({id:String(p.id),title:p.title,description:p.description||"",imageUrl:p.imageUrl,index:index+1})))).catch(()=>{});},[]);
  const [quantities,setQuantities]=useState<Record<string,number>>({});
  const [surname,setSurname]=useState("");
  const [notice,setNotice]=useState("");
  const quantitiesRef=useRef<Record<string,number>>({});
  const surnameRef=useRef("");
  const count=Object.values(quantities).reduce((sum,value)=>sum+value,0);
  const unitPrice=count>=christmas.multipleMinimumQuantity?christmas.multipleUnitPrice:christmas.singlePrice;
  const total=count*unitPrice;
  const description=useMemo(()=>models.map((model)=>quantities[model.id]?`${model.title} × ${quantities[model.id]}`:"").filter(Boolean).join(" + "),[quantities]);

  useEffect(()=>{queueMicrotask(()=>{const items=readCart().filter((item)=>item.product.category==="navidad-temporadas");const next:Record<string,number>={};let savedSurname="";for(const item of items){const index=String(item.product.id);next[index]=(next[index]||0)+item.quantity;if(item.personalization&&item.personalization!=="Apellido por confirmar")savedSurname=item.personalization}if(savedSurname)setSurname(savedSurname);surnameRef.current=savedSurname;quantitiesRef.current=next;setQuantities(next)})},[]);
  const sync=(next:Record<string,number>,family=surnameRef.current)=>{const quantity=Object.values(next).reduce((sum,value)=>sum+value,0);const price=quantity>=2?christmas.multipleUnitPrice:christmas.singlePrice;const other=readCart().filter((item)=>item.product.category!=="navidad-temporadas");const navidad:CartItem[]=models.flatMap((model)=>{const amount=next[model.id]||0;if(!amount)return [];const product:Product={id:model.id,title:model.title,category:"navidad-temporadas",description:model.description,price,compareAtPrice:christmas.regularPrice,sizes:[],tags:"navidad letrero familia preventa",audience:"unisex",themeGroup:"navidad",estimatedDays:christmas.estimatedDays,featured:true,imageUrl:model.imageUrl,galleryUrls:[model.imageUrl]};return [{key:`navidad-${model.index}-${family||"pendiente"}`,product,sizeLabel:"Preventa Navideña",unitPrice:price,personalization:family||"Apellido por confirmar",color:"",notes:"Reserva con 50%",quantity:amount}]});saveCart([...other,...navidad])};
  const change=(index:string,delta:number)=>{const next={...quantitiesRef.current,[index]:Math.max(0,(quantitiesRef.current[index]||0)+delta)};if(!next[index])delete next[index];quantitiesRef.current=next;setQuantities(next);sync(next);setNotice(delta>0?"Modelo agregado al carrito":"Se quitó un modelo");setTimeout(()=>setNotice(""),1500)};
  const updateSurname=(value:string)=>{surnameRef.current=value;setSurname(value);sync(quantitiesRef.current,value)};
  const checkout=()=>{if(!count){scrollToSection("modelos-navidad");setNotice("Elige al menos un modelo navideño");setTimeout(()=>setNotice(""),2200);return}sync(quantities);location.assign("/catalogo?carrito=1")};

  return <main className="christmas-standalone"><header className="christmas-header"><a href="/catalogo" aria-label="Volver a Segeda Home"><ProductImage src="/segeda-logo.jpg" alt="Segeda Home" loading="eager" fit="cover"/><span><b>Segeda Home</b><small>Preventa Navideña</small></span></a><div><button onClick={()=>scrollToSection("modelos-navidad")}>Ver modelos</button><button className="christmas-cart" onClick={checkout} aria-label="Abrir el carrito principal"><ShoppingBag aria-hidden="true"/>{count>0&&<b>{count}</b>}</button></div></header>
    <CatalogBack/>
    <section className="christmas-preorder"><div className="christmas-particles" aria-hidden="true">{Array.from({length:28},(_,index)=><span key={index} className={index%4===0?"sparkle":"snow"} style={{left:`${(index*37+7)%100}%`,animationDelay:`-${(index*.73)%9}s`,animationDuration:`${7+(index%6)*1.4}s`,fontSize:`${8+(index%5)*3}px`}}>{index%4===0?"✦":index%3===0?"·":"❄"}</span>)}</div><div className="christmas-hero"><span>✦ Colección especial 2026 ✦</span><h1>Preventa Navideña</h1><p>Letreros personalizados con el apellido de tu familia. Elige uno, combina varios o repite tu modelo favorito.</p><div className="christmas-offers"><div><small>1 letrero</small><del>Regular S/109</del><strong>S/79</strong><span>Precio de preventa</span></div><div className="featured"><small>Desde 2 letreros</small><del>Regular S/109 c/u</del><strong>S/69 c/u</strong><span>2 por S/138</span></div></div><div className="christmas-trust"><span>♡ Personalizado con apellido</span><span>✦ 9 modelos disponibles</span><span>◷ Preparación de 5 a 7 días</span><span>✓ Reserva con 50%</span><span>🚚 Envíos a todo el Perú</span></div></div>
      <div className="christmas-models catalog-products-section" id="modelos-navidad"><div className="christmas-heading"><span>✦ Compra fácil y rápida</span><h2>Elige tus modelos favoritos</h2><p>Usa + para seleccionar. Puedes escoger modelos diferentes o pedir dos iguales.</p></div><label className="christmas-surname">Apellido de la familia <input value={surname} onChange={(event)=>updateSurname(event.target.value)} placeholder="Ejemplo: Familia Jiménez"/><small>También puedes confirmarlo después por WhatsApp.</small></label><div className="catalog-grid">{models.map((model)=><CatalogCard key={model.id} title={model.title} imageUrl={model.imageUrl} imageAlt={`Letrero navideño ${model.title}`} category="Preventa navideña" code={`SH-${model.id}`} heading="h3" description={model.description} loading={model.index<=4?"eager":"lazy"} selected={Boolean(quantities[model.id])} price={<>Personalizable desde <b>S/{unitPrice}</b></>} onChoose={()=>change(model.id,1)}><div className="catalog-card__quantity"><button type="button" disabled={!quantities[model.id]} aria-label={`Quitar ${model.title}`} onClick={()=>change(model.id,-1)}>−</button><span><b>{quantities[model.id]||0}</b><small>elegidos</small></span><button type="button" aria-label={`Seleccionar ${model.title}`} onClick={()=>change(model.id,1)}>+</button></div></CatalogCard>)}</div></div>
      <div className="christmas-summary"><div><span>{count} {count===1?"producto navideño":"productos navideños"} en el carrito</span><strong>{description||"Elige tu modelo favorito"}</strong></div><div><small>Total preventa</small><b>S/{total}</b></div><button onClick={checkout}><ShoppingBag aria-hidden="true"/> {count?"Ir al carrito":"Elegir modelos"}</button></div>
    </section><footer className="christmas-footer"><b>Segeda Home</b><span>Diseños personalizados en MDF · Envíos a todo el Perú</span><a href="/catalogo">Volver a la tienda principal</a></footer>{notice&&<div className="christmas-notice">{notice}</div>}</main>;
}
