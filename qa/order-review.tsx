import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import ProductOrderTable from '../app/admin/product-order-table';
import {useProductOrdering} from '../app/admin/use-product-ordering';
import {applyProductOrder,compareProductOrder,sameProductOrder} from '../lib/product-order';
import type {Product,Category} from '../lib/catalog';
import '../app/globals.css';import '../app/premium.css';
const initial:Product[]=Array.from({length:30},(_,i)=>({id:`test-${i+1}`,title:`Modelo de prueba ${i+1}`,category:i<25?'coleccion-a':'coleccion-b',sortOrder:i<25?i+1:i-24,price:80,imageUrl:'',estimatedDays:'3 a 5 días'}));
const categories=[{id:'coleccion-a',short:'Colección A'},{id:'coleccion-b',short:'Colección B'}] as Category[];
const read=()=>{try{return JSON.parse(localStorage.getItem('segeda-order-qa')||'null')||initial;}catch{return initial;}};
function Lab(){
 const [products,setProducts]=useState<Product[]>(read),[category,setCategory]=useState('coleccion-a'),[query,setQuery]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[fail,setFail]=useState(false),[dragging,setDragging]=useState(false),[touchResult,setTouchResult]=useState('');
 const persist=async(cat:string,ids:string[],expected:string[])=>{await new Promise(r=>setTimeout(r,400));if(fail)throw new Error('Fallo de guardado simulado. Se restauró el orden anterior.');const saved=read();if(!sameProductOrder(saved.filter((p:Product)=>p.category===cat).sort(compareProductOrder).map((p:Product)=>String(p.id)),expected))throw new Error('Conflicto entre sesiones.');localStorage.setItem('segeda-order-qa',JSON.stringify(applyProductOrder(saved,cat,ids)));};
 const ordering=useProductOrdering({products,category,query,setProducts,setError,setNotice,persist});
 const filtered=products.filter(p=>(category==='all'||p.category===category)&&p.title.toLowerCase().includes(query.toLowerCase())).sort(compareProductOrder);
 const refresh=()=>{setProducts(read());ordering.confirmRefreshed();setError('');setNotice('Lista recargada desde el almacenamiento de prueba.');};
 const simulateTouch=async(far=false)=>{
  const handles=document.querySelectorAll<HTMLButtonElement>('.product-drag-handle');const handle=handles[0],target=handles[2];if(!handle||!target)return;
  handle.scrollIntoView({block:'center'});const r=handle.getBoundingClientRect(),t=target.getBoundingClientRect();
  const touch=(x:number,y:number)=>new Touch({identifier:1,target:handle,clientX:x,clientY:y,pageX:x+scrollX,pageY:y+scrollY,screenX:x,screenY:y});
  const x=r.left+r.width/2,y=r.top+r.height/2;
  const send=(type:string,point:Touch,ended=false)=>handle.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:ended?[]:[point],targetTouches:ended?[]:[point],changedTouches:[point]}));
  send('touchstart',touch(x,y));await new Promise(r=>setTimeout(r,250));
  const ready=Boolean(document.querySelector('.product-drag-preview'));
  for(let step=1;step<=12;step++){send('touchmove',touch(x,y+(t.top+t.height/2-y)*step/12));await new Promise(r=>setTimeout(r,22));}
  const scrollBefore=scrollY; if(far){for(let step=0;step<60;step++){send('touchmove',touch(x,innerHeight-14));await new Promise(r=>setTimeout(r,24));}}
  const indicator=document.querySelector('.product-drag-preview small')?.textContent;
  send('touchend',touch(x,far?innerHeight-14:t.top+t.height/2),true);setTouchResult(`Sensor táctil sintético: ${ready?'activado':'no activado'} · ${indicator||'sin indicador'} · auto-scroll ${scrollY-scrollBefore}px`);
 };
 return <main style={{padding:16,background:'#f8f4f0',minHeight:'100vh'}}><section className="admin-content" style={{padding:0}}><h1 style={{fontSize:26}}>Productos · prueba aislada</h1><p>Datos ficticios. Se usa la tabla y el guardado optimista reales; el almacenamiento de prueba es local.</p><div className="admin-filters"><input aria-label="Buscar por nombre" placeholder="Buscar por nombre" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filtrar categoría" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas las categorías</option>{categories.map(c=><option key={c.id} value={c.id}>{c.short}</option>)}</select></div><div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:12}}><button onClick={refresh}>Actualizar lista</button><button onClick={()=>{localStorage.removeItem('segeda-order-qa');setProducts(initial);ordering.confirmRefreshed();setError('');setNotice('Prueba reiniciada.');}}>Reiniciar prueba</button><label><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/>Simular error de guardado</label><button disabled={ordering.saving||dragging} onClick={()=>void simulateTouch(false)}>Probar sensor táctil</button><button disabled={ordering.saving||dragging} onClick={()=>void simulateTouch(true)}>Probar auto-scroll táctil</button></div>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<p id="touch-result">{touchResult}</p><ProductOrderTable products={filtered} categories={categories} enabled={category!=='all'&&!query.trim()&&!ordering.needsRefresh} saving={ordering.saving} onDraggingChange={setDragging} onReorder={ordering.reorder} onEdit={p=>setNotice(`Editar sigue disponible: ${p.title}`)} onDelete={p=>setNotice(`Eliminar sigue disponible: ${p.title}`)}/><pre id="qa-order">{JSON.stringify({visible:filtered.map(p=>p.id),saved:(read() as Product[]).filter(p=>p.category===category).sort(compareProductOrder).map(p=>p.id),blocked:ordering.needsRefresh,saving:ordering.saving})}</pre></section></main>;
}
createRoot(document.getElementById('root')!).render(<Lab/>);
