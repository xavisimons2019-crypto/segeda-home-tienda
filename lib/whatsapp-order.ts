import type {CartItem} from './cart';
export type OrderContact={customerName?:string;customerPhone?:string;customerCity?:string;shipping?:string;checkoutNotes?:string};
const money=(value:number)=>`S/${value.toFixed(2)}`;
export function buildWhatsAppOrder(items:CartItem[],contact:OrderContact={},reference?:string):string{
 const lines=items.map((item,index)=>{
  const description=[`${index+1}. *${item.product.title}*`,`Código: SH-${item.product.id}`,`Cantidad: ${item.quantity} · Precio unitario: ${money(item.unitPrice)}`,`Subtotal: ${money(item.unitPrice*item.quantity)}`];
  if(item.sizeLabel)description.push(`Medida / presentación: ${item.sizeLabel}`);
  if(item.product.measurement?.trim()&&item.product.measurement!==item.sizeLabel)description.push(`Medida general: ${item.product.measurement.trim()}`);
  if(item.product.material?.trim())description.push(`Material: ${item.product.material.trim()}`);
  if(item.personalization?.trim())description.push(`Personalización: ${item.personalization.trim()}`);
  if(item.color?.trim())description.push(`Colores: ${item.color.trim()}`);
  if(item.notes?.trim())description.push(`Notas: ${item.notes.trim()}`);
  return description.join('\n');
 });
 const total=items.reduce((sum,item)=>sum+Math.round(item.unitPrice*item.quantity*100),0)/100;
 const details=[contact.customerName?.trim()&&`Nombre: ${contact.customerName.trim()}`,contact.customerPhone?.trim()&&`WhatsApp: ${contact.customerPhone.trim()}`,contact.customerCity?.trim()&&`Ciudad: ${contact.customerCity.trim()}`,contact.shipping?.trim()&&`Envío: ${contact.shipping.trim()}`,contact.checkoutNotes?.trim()&&`Notas del pedido: ${contact.checkoutNotes.trim()}`].filter(Boolean);
 return ['Hola Segeda Home, quiero coordinar este pedido:',lines.join('\n\n'),`*Total referencial: ${money(total)}*`,reference?`Referencia: ${reference}`:'',details.join('\n'),'Coordinamos por aquí los datos pendientes, la entrega y el pago.'].filter(Boolean).join('\n\n');
}
export function whatsappOrderUrl(items:CartItem[],contact:OrderContact={},reference?:string):string{
 return `https://wa.me/51978642447?text=${encodeURIComponent(buildWhatsAppOrder(items,contact,reference))}`;
}
