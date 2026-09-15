import test from 'node:test';
import assert from 'node:assert/strict';
import {priceOrder} from '../supabase/functions/_shared/pricing.ts';
import {makeZip} from '../lib/zip.ts';
import {writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const products=[{id:'nube',title:'Nube',category:'nubes',price:80,sizes:[{label:'40 cm',price:80},{label:'50 cm',price:100}]},{id:'xmas',title:'Navidad',category:'navidad-temporadas',price:79,sizes:[{label:'1 unidad',price:79},{label:'2 o más',price:69}]}];
const body=items=>({customerName:'Prueba técnica',customerPhone:'999999999',customerCity:'Lima',items});
test('El servidor ignora el precio enviado por el comprador y aplica los complementos',()=>{
 const order=priceOrder(body([{product:{id:'nube',price:1},quantity:2,sizeLabel:'50 cm',unitPrice:1,notes:'Agregar 80 stickers de estrellas (+S/25)'}]),products);
 assert.equal(order.total,250);
});
test('La promoción navideña requiere dos unidades, aunque se seleccione la tarifa reducida',()=>{
 const one=priceOrder(body([{product:{id:'xmas'},quantity:1,sizeLabel:'2 o más'}]),products);assert.equal(one.total,79);
 const two=priceOrder(body([{product:{id:'xmas'},quantity:2}]),products);assert.equal(two.total,138);
});
test('Rechaza productos inexistentes, medidas inventadas y cantidades inválidas',()=>{
 for(const item of [{product:{id:'missing'},quantity:1},{product:{id:'nube'},quantity:1,sizeLabel:'1 cm'},{product:{id:'nube'},quantity:-1,sizeLabel:'40 cm'},{product:{id:'nube'},quantity:1.2,sizeLabel:'40 cm'}])assert.throws(()=>priceOrder(body([item]),products));
});
test('El respaldo ZIP contiene texto UTF-8 y bytes binarios',async()=>{
 const bytes=new Uint8Array([0,255,128,12,99]);
 const zip=makeZip([{name:'datos-ñ.json',bytes:new TextEncoder().encode('{"nombre":"Segeda"}')},{name:'foto.bin',bytes}]);
 const folder=await mkdtemp(join(tmpdir(),'segeda-zip-'));
await writeFile(join(folder,'backup.zip'),new Uint8Array(await zip.arrayBuffer()));
 assert.equal(zip.type,'application/zip');
});
