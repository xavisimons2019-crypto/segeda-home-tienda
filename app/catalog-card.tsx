"use client";

import type {MouseEventHandler, ReactNode} from 'react';
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
  actionLabel?:string;
  actionAriaLabel?:string;
  actionHasPopup?:'dialog';
  onChoose:MouseEventHandler<HTMLButtonElement>;
  children?:ReactNode;
};

/** Shared presentation for every product, independent of category and data source.
 * Callers keep their existing selection, pricing and cart handlers.
 */
export default function CatalogCard({title,imageUrl,imageAlt,category,code,price,description,offer,selected=false,loading='lazy',heading:Heading='strong',actionLabel,actionAriaLabel,actionHasPopup,onChoose,children}:CatalogCardProps){
  const content=<>
    <span className="catalog-card__media">
      <ProductImage src={imageUrl} alt={imageAlt||title} fit="cover" loading={loading}/>
      {offer&&<span className="catalog-card__offer">Oferta</span>}
      <span className="catalog-card__choose">{actionLabel||(selected?'✓ Elegido':'Elegir')}</span>
    </span>
    <small className="catalog-card__meta">{category} · <span className="catalog-card__code">{code}</span></small>
    <Heading className="catalog-card__title">{title}</Heading>
    {description&&<span className="catalog-card__description" title={description}>{description}</span>}
    <span className="catalog-card__price">{price}</span>
  </>;
  const className=`catalog-card${selected?' is-selected':''}`;
  return children?<article className={className}>
    <button type="button" className="catalog-card__choice" aria-label={actionAriaLabel} aria-haspopup={actionHasPopup} onClick={onChoose}>{content}</button>
    <div className="catalog-card__extras">{children}</div>
  </article>:<button type="button" className={className} aria-label={actionAriaLabel} aria-haspopup={actionHasPopup} onClick={onChoose}>{content}</button>;
}
