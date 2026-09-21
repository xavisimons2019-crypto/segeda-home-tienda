import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCategoryOrder} from '../lib/category-order.ts';
import {buildWhatsAppOrder,whatsappOrderUrl} from '../lib/whatsapp-order.ts';
import {priceOrder} from '../supabase/functions/_shared/pricing.ts';
import type {Category,Product} from '../lib/catalog.ts';
import type {CartItem} from '../lib/cart.ts';
const categories=[{id:'a',short:'A',image:'/a.jpg',sortOrder:1},{id:'b',short:'B',image:'/b.jpg',sortOrder:2},{id:'c',short:'C',image:'/c.jpg',sortOrder:3}] as Category[];
const product:Product={id:'sample',title:'Nombre personalizado',category:'future-category',price:19.9,imageUrl:'/sample.jpg',measurement:'30 × 20 cm',material:'MDF de 3 mm'};

test('category reorder preserves covers, names and independent product data',()=>{
 const next=applyCategoryOrder(categories,['c','a','b']);
 assert.deepEqual(next.map(c=>[c.id,c.sortOrder]),[['c',1],['a',2],['b',3]]);
 assert.equal(next[0].image,categories[2].image);assert.equal(next[0].short,categories[2].short);
 assert.deepEqual(categories.map(c=>c.sortOrder),[1,2,3]);
 assert.throws(()=>applyCategoryOrder(categories,['a','a','c']));
 assert.throws(()=>applyCategoryOrder(categories,['a','b']));
});
test('guest orders require no customer name, phone or city and use server prices',()=>{
 const order=priceOrder({items:[{product:{id:product.id},quantity:2}]},[product]);
 assert.equal(order.customerName,'');assert.equal(order.customerPhone,'');assert.equal(order.customerCity,'');
 assert.equal(order.total,39.8);assert.equal(order.items[0].sizeLabel,'30 × 20 cm');
 const text=buildWhatsAppOrder(order.items as CartItem[]);
 for(const expected of ['Nombre personalizado','Cantidad: 2','Precio unitario: S/19.90','Subtotal: S/39.80','Total referencial: S/39.80','30 × 20 cm','MDF de 3 mm']) assert.ok(text.includes(expected));
 assert.ok(!text.includes('undefined'));assert.ok(!text.includes('Nombre:'));
});
test('optional customer details and notes appear only when supplied',()=>{
 const order=priceOrder({items:[{product:{id:product.id},quantity:1}],customerName:'Ana',customerCity:'Lima'},[product]);
 const url=new URL(whatsappOrderUrl(order.items as CartItem[],{customerName:' Ana ',customerCity:'Lima',checkoutNotes:'Regalo & entrega'},'REF-123'));
 assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/51978642447');
 const text=url.searchParams.get('text')!;assert.ok(text.includes('Nombre: Ana'));assert.ok(text.includes('Ciudad: Lima'));assert.ok(text.includes('Regalo & entrega'));assert.ok(text.includes('Referencia: REF-123'));
 assert.ok(!text.includes('WhatsApp:'));
});
test('guest checkout still rejects invalid quantities, products and nonempty phone numbers',()=>{
 const item={product:{id:product.id},quantity:1};
 assert.throws(()=>priceOrder({items:[item],customerPhone:'abc'},[product]));
 assert.throws(()=>priceOrder({items:[{...item,quantity:-1}]},[product]));
 assert.throws(()=>priceOrder({items:[{...item,product:{id:'missing'}}]},[product]));
 assert.throws(()=>priceOrder({items:[{...item,sizeLabel:'invalid'}]},[{...product,sizes:[{label:'Grande',price:35}]}]));
});
test('existing size prices and Christmas quantity pricing remain unchanged',()=>{
 const variant={...product,id:'variant',sizes:[{label:'Grande',price:35}]};
 const seasonal={...product,id:'seasonal',category:'navidad-temporadas',price:79,sizes:[{label:'1 unidad',price:79},{label:'2 o más',price:69}]};
 const order=priceOrder({items:[{product:{id:'variant'},quantity:2,sizeLabel:'Grande'},{product:{id:'seasonal'},quantity:2}]},[variant,seasonal]);
 assert.equal(order.total,208);assert.equal(order.items[0].unitPrice,35);assert.equal(order.items[1].unitPrice,69);
});
