'use client';
import {useState} from 'react';
import {createPortal} from 'react-dom';
import {DndContext,DragOverlay,MouseSensor,TouchSensor,KeyboardSensor,closestCenter,useSensor,useSensors,type DragEndEvent} from '@dnd-kit/core';
import {SortableContext,useSortable,sortableKeyboardCoordinates,rectSortingStrategy,arrayMove} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical,ImagePlus,ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ProductImage from '@/app/product-image';
import type {Category} from '@/lib/catalog';
import './category-order.css';

type Props={categories:Category[];counts:Record<string,number>;saving:boolean;blocked:boolean;onOpen:(category:Category)=>void;onEdit:(category:Category)=>void;onReorder:(ids:string[],expectedIds:string[])=>Promise<void>;onDraggingChange:(dragging:boolean)=>void};
function CategoryTile({category,index,count,disabled,onOpen,onEdit}:{category:Category;index:number;count:number;disabled:boolean;onOpen:Props['onOpen'];onEdit:Props['onEdit']}){
 const {setNodeRef,setActivatorNodeRef,attributes,listeners,transform,transition,isDragging}=useSortable({id:category.id,disabled});
 return <article ref={setNodeRef} data-category-id={category.id} className={`admin-collection-card${isDragging?' is-dragging':''}`} style={{transform:CSS.Transform.toString(transform),transition}}>
  <div className="admin-collection-toolbar"><button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} className="category-drag-handle" disabled={disabled} aria-label={`Mover categoría ${category.short}, posición ${index+1}`}><GripVertical size={20}/><span>{index+1}</span></button><small>{count} {count===1?'producto':'productos'}</small></div>
  <button type="button" className="admin-collection-open" disabled={disabled} onClick={()=>onOpen(category)} aria-label={`Ver productos de ${category.short}`}><ProductImage src={category.image} alt={category.name} fit="cover"/><strong>{category.short}</strong><span>Ver productos <ArrowRight size={15}/></span></button>
  <Button variant="outline" disabled={disabled} onClick={()=>onEdit(category)} aria-label={`Cambiar portada de ${category.short}`}><ImagePlus size={16}/>Cambiar portada</Button>
 </article>;
}
export default function CategoryOrderGrid({categories,counts,saving,blocked,onOpen,onEdit,onReorder,onDraggingChange}:Props){
 const [activeId,setActiveId]=useState<string|null>(null),[target,setTarget]=useState(0);
 const sensors=useSensors(useSensor(MouseSensor,{activationConstraint:{distance:6}}),useSensor(TouchSensor,{activationConstraint:{delay:200,tolerance:8}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
 const ids=categories.map(c=>c.id),active=categories.find(c=>c.id===activeId);
 const finish=()=>{setActiveId(null);onDraggingChange(false);};
 const drop=({active,over}:DragEndEvent)=>{finish();if(saving||blocked||!over||active.id===over.id)return;const from=ids.indexOf(String(active.id)),to=ids.indexOf(String(over.id));if(from>=0&&to>=0)void onReorder(arrayMove(ids,from,to),ids);};
 const position=(id:string|number)=>ids.indexOf(String(id))+1;
 return <DndContext sensors={sensors} collisionDetection={closestCenter} autoScroll={{threshold:{x:.12,y:.18},acceleration:8}} accessibility={{screenReaderInstructions:{draggable:'Pulsa espacio para tomar la categoría, flechas para moverla, espacio para guardar o Escape para cancelar.'},announcements:{onDragStart:({active})=>`Categoría tomada. Posición ${position(active.id)}.`,onDragOver:({over})=>over?`Posición ${position(over.id)} de ${ids.length}.`:undefined,onDragEnd:({over})=>over?'Guardando el orden de categorías.':'Movimiento cancelado.',onDragCancel:()=> 'Movimiento cancelado.'}}} onDragStart={({active})=>{setActiveId(String(active.id));setTarget(position(active.id));onDraggingChange(true);}} onDragOver={({over})=>{if(over)setTarget(position(over.id));}} onDragCancel={finish} onDragEnd={drop}>
  <div className="admin-collection-grid" aria-busy={saving}><SortableContext items={ids} strategy={rectSortingStrategy}>{categories.map((c,index)=><CategoryTile key={c.id} category={c} index={index} count={counts[c.id]||0} disabled={saving||blocked} onOpen={onOpen} onEdit={onEdit}/>)}</SortableContext></div>
  {typeof document!=='undefined'&&createPortal(<DragOverlay dropAnimation={null}>{active&&<div className="category-drag-preview"><ProductImage src={active.image} alt="" fit="cover"/><div><strong>{active.short}</strong><small>Colocar en posición {target} de {ids.length}</small></div></div>}</DragOverlay>,document.body)}
  <p role="status" className="product-order-status">{saving?'Guardando categorías…':active?`Moviendo ${active.short} · posición ${target}`:''}</p>
 </DndContext>;
}
