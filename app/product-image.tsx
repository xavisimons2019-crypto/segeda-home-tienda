"use client";

import { useState } from "react";
import { assetUrl } from "@/lib/catalog";

type ProductImageProps={
  src?:string;
  alt:string;
  className?:string;
  loading?:"eager"|"lazy";
  fit?:"contain"|"cover";
};

export default function ProductImage({src,alt,className="",loading="lazy",fit="contain"}:ProductImageProps){
  const resolved=assetUrl(src);
  return <span className={`safe-image ${className}`} data-fit={fit}>
    <ResolvedImage key={resolved} resolved={resolved} alt={alt} loading={loading}/>
  </span>;
}

function ResolvedImage({resolved,alt,loading}:{resolved:string;alt:string;loading:"eager"|"lazy"}){
  const [failed,setFailed]=useState(!resolved);
  // The original catalog contains mixed remote and local product media, so a plain img is intentional here.
  // eslint-disable-next-line @next/next/no-img-element
  return !failed?<img src={resolved} alt={alt} loading={loading} onError={()=>setFailed(true)}/>:<span className="image-unavailable" role="img" aria-label={`${alt}. Imagen no disponible`}><b>◇</b><small>Imagen no disponible</small></span>;
}
