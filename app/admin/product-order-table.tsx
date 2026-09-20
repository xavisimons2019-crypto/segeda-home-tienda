'use client';

import {useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type Modifier} from '@dnd-kit/core';
import {SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical, Pencil, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import ProductImage from '@/app/product-image';
import type {Product, Category} from '@/lib/catalog';
import './product-order.css';

type Props = {
  products: Product[];
  categories: Category[];
  enabled: boolean;
  saving: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onReorder: (ids: string[], expectedIds: string[]) => Promise<void>;
  onDraggingChange?: (dragging: boolean) => void;
};
const verticalOnly: Modifier = ({transform}) => ({...transform, x:0});

function ProductRow({product, categoryName, disabled, locked, index, onEdit, onDelete}: {
  product: Product; categoryName: string; disabled: boolean; locked: boolean; index: number;
  onEdit: Props['onEdit']; onDelete: Props['onDelete'];
}) {
  const {setNodeRef,setActivatorNodeRef,attributes,listeners,transform,transition,isDragging} = useSortable({id:String(product.id), disabled});
  const style: CSSProperties = {transform:CSS.Transform.toString(transform), transition};
  return <TableRow ref={setNodeRef} style={style} data-product-id={String(product.id)} className={isDragging?'product-order-row is-dragging':'product-order-row'}>
    <TableCell className="product-order-cell"><button ref={setActivatorNodeRef} type="button" className="product-drag-handle" {...attributes} {...listeners} disabled={disabled} aria-label={`Mover ${product.title}, posición ${product.sortOrder || index+1}`} title="Mantén presionado y arrastra. Con teclado: espacio, flechas y espacio."><GripVertical size={20}/><span>{product.sortOrder || index+1}</span></button></TableCell>
    <TableCell><div className="product-cell"><ProductImage src={product.imageUrl} alt={product.title}/><strong>{product.title}</strong></div></TableCell>
    <TableCell>{categoryName}</TableCell><TableCell>S/{product.price}</TableCell><TableCell>{product.estimatedDays||'—'}</TableCell>
    <TableCell><div className="row-actions"><Button size="icon" variant="ghost" disabled={locked} aria-label={`Editar ${product.title}`} onClick={()=>onEdit(product)}><Pencil/></Button><Button size="icon" variant="ghost" disabled={locked} aria-label={`Eliminar ${product.title}`} onClick={()=>onDelete(product)}><Trash2/></Button></div></TableCell>
  </TableRow>;
}

export default function ProductOrderTable({products,categories,enabled,saving,onEdit,onDelete,onReorder,onDraggingChange}:Props) {
  const [activeId,setActiveId]=useState<string|null>(null),[target,setTarget]=useState(0);
  const sensors=useSensors(
    useSensor(MouseSensor,{activationConstraint:{distance:6}}),
    useSensor(TouchSensor,{activationConstraint:{delay:200,tolerance:8}}),
    useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}),
  );
  const ids=products.map(p=>String(p.id));
  const active=products.find(p=>String(p.id)===activeId);
  const finish=()=>{setActiveId(null);onDraggingChange?.(false);};
  const drop=({active,over}:DragEndEvent)=>{
    finish();
    if(!enabled||saving||!over||active.id===over.id)return;
    const from=ids.indexOf(String(active.id)),to=ids.indexOf(String(over.id));
    if(from<0||to<0)return;
    void onReorder(arrayMove(ids,from,to),ids);
  };
  const position=(id:string|number)=>ids.indexOf(String(id))+1;
  return <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]}
    autoScroll={{threshold:{x:0,y:0.18},acceleration:8}}
    accessibility={{screenReaderInstructions:{draggable:'Pulsa espacio para tomar el producto. Usa las flechas arriba y abajo para moverlo. Pulsa espacio para guardar o Escape para cancelar.'},announcements:{
      onDragStart:({active})=>`Producto tomado. Posición ${position(active.id)} de ${ids.length}.`,
      onDragOver:({over})=>over?`Se colocará en la posición ${position(over.id)} de ${ids.length}.`:undefined,
      onDragEnd:({over})=>over?`Movimiento terminado. Posición ${position(over.id)}. Guardando el orden.`:'Movimiento cancelado.',
      onDragCancel:()=> 'Movimiento cancelado. Se conserva el orden anterior.',
    }}}
    onDragStart={({active})=>{setActiveId(String(active.id));setTarget(position(active.id));onDraggingChange?.(true);}}
    onDragOver={({over})=>{if(over)setTarget(position(over.id));}}
    onDragCancel={finish} onDragEnd={drop}>
    <div className="admin-table product-order-table" aria-busy={saving}>
      <Table><TableHeader><TableRow><TableHead className="product-order-cell">Orden</TableHead><TableHead>Producto</TableHead><TableHead>Categoría</TableHead><TableHead>Precio</TableHead><TableHead>Entrega</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
        <TableBody><SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {products.map((p,index)=><ProductRow key={p.id} product={p} index={index} categoryName={categories.find(c=>c.id===p.category)?.short||p.category} disabled={!enabled||saving} locked={saving||Boolean(activeId)} onEdit={onEdit} onDelete={onDelete}/>)}
        </SortableContext>{!products.length&&<TableRow><TableCell colSpan={6}>No hay productos con estos filtros.</TableCell></TableRow>}</TableBody>
      </Table>
    </div>
    {typeof document!=='undefined'&&createPortal(<DragOverlay dropAnimation={null}>{active&&<div className="product-drag-preview"><GripVertical size={20}/><ProductImage src={active.imageUrl} alt=""/><div><strong>{active.title}</strong><small>Colocar en posición {target} de {ids.length}</small></div></div>}</DragOverlay>,document.body)}
    <p className="product-order-status" role="status" aria-live="polite">{saving?'Guardando el orden…':active?`Moviendo ${active.title} · posición ${target} de ${ids.length}`:''}</p>
  </DndContext>;
}
