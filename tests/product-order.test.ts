import test from 'node:test';
import assert from 'node:assert/strict';
import {applyProductOrder,compareProductOrder,sameProductOrder} from '../lib/product-order.ts';
import type {Product} from '../lib/catalog.ts';
const product=(id:string,category:string,sortOrder?:number,featured=false):Product=>({id,category,sortOrder,featured,title:`Producto ${id}`,price:80,imageUrl:`/${id}.jpg`});

test('manual positions take priority over title, id and featured flag',()=>{
 const rows=[product('A','one',3,true),product('Z','one',1),product('B','one',2)];
 assert.deepEqual(rows.sort(compareProductOrder).map(p=>p.id),['Z','B','A']);
});
test('moving a product changes only positions in its own category',()=>{
 const rows=[product('A','one',1),product('B','one',2),product('C','one',3),product('D','two',1)];
 const reordered=applyProductOrder(rows,'one',['C','A','B']);
 assert.deepEqual(reordered.filter(p=>p.category==='one').map(p=>[p.id,p.sortOrder]),[['C',1],['A',2],['B',3]]);
 assert.equal(reordered.find(p=>p.id==='D'),rows[3]);
 assert.deepEqual(rows.map(p=>p.sortOrder),[1,2,3,1]);
 for(const row of rows){const next=reordered.find(p=>p.id===row.id)!;assert.equal(next.title,row.title);assert.equal(next.price,row.price);assert.equal(next.imageUrl,row.imageUrl);}
});
test('partial, duplicate, foreign or stale lists are rejected',()=>{
 const rows=[product('A','one',1),product('B','one',2),product('C','two',1)];
 for(const ids of [['A'],['A','A'],['A','C'],['A','B','missing']]) assert.throws(()=>applyProductOrder(rows,'one',ids));
});
test('legacy entries without positions stay stable after positioned items',()=>{
 const rows=[product('C','one'),product('Z','one',2),product('B','one',0),product('A','one',1)];
 assert.deepEqual(rows.sort(compareProductOrder).map(p=>p.id),['A','Z','C','B']);
});
test('response-loss reconciliation requires the exact complete order',()=>{
 assert.equal(sameProductOrder(['a','b'],['a','b']),true);
 assert.equal(sameProductOrder(['a','b'],['b','a']),false);
 assert.equal(sameProductOrder(['a','b'],['a']),false);
});
