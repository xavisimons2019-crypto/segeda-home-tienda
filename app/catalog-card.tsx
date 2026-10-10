"use client";

import type {MouseEvent, ReactNode} from 'react';
import ProductImage from './product-image';

type CatalogCardProps = {
  title:string;
  imageUrl?:string;
  imageAlt?:string;
  category:ReactNode;
  code:string;
  price:ReactNode;
  description?:string;
  offer?:boolean;
  selected?:boolean;
  loading?:'eager'|'lazy';
  heading?:'h2'|'h3'|'strong';
  onChoose?:()=>void;
  onPreview?:(event:MouseEvent<HTMLButtonElement>)=>void;
  children?:ReactNode;
};

/** Shared presentation for every product, independent of category and data source.
 * Callers keep their existing selection, pricing and cart handlers.
 */
export default function CatalogCard({title,imageUrl,imageAlt,category,code,price,description,offer,selected=false,loading='lazy',heading:Heading='strong',onChoose,onPreview,children}:CatalogCardProps){
  const media=<span className="catalog-card__media">
      <ProductImage src={imageUrl} alt={imageAlt||title} fit="cover" loading={loading}/>
      {offer&&<span className="catalog-card__offer">Oferta</span>}
      <span className="catalog-card__choose">{onPreview?'Ver foto':selected?'✓ Elegido':'Elegir'}</span>
    </span>;
  const information=<>
    <small className="catalog-card__meta">{category} · <span className="catalog-card__code">{code}</span></small>
    <Heading className="catalog-card__title">{title}</Heading>
    {description&&<span className="catalog-card__description" title={description}>{description}</span>}
    <span className="catalog-card__price">{price}</span>
  </>;
  const content=<>{media}{information}</>;
  const className=`catalog-card${selected?' is-selected':''}`;
  // Photo preview is a separate control, never a nested add-to-cart button.
  if(onPreview)return <article className={className}>
    <button type="button" className="catalog-card__preview" aria-label={`Ampliar imagen de ${title}`} onClick={event=>{event.stopPropagation();onPreview(event)}}>{media}</button>
    {information}
    {children&&<div className="catalog-card__extras">{children}</div>}
  </article>;
  return children?<article className={className}>
    <button type="button" className="catalog-card__choice" onClick={onChoose}>{content}</button>
    <div className="catalog-card__extras">{children}</div>
  </article>:<button type="button" className={className} onClick={onChoose}>{content}</button>;
}
