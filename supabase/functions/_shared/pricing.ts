type Product={id:string|number;title:string;category:string;price:number;sizes?:{label:string;price:number}[];[key:string]:unknown};
type IncomingItem={key?:unknown;product?:{id?:unknown};sizeLabel?:unknown;quantity?:unknown;personalization?:unknown;color?:unknown;notes?:unknown};
type Body={customerName?:unknown;customerPhone?:unknown;customerCity?:unknown;shipping?:unknown;checkoutNotes?:unknown;items?:IncomingItem[]};
const clean=(value:unknown,max:number)=>String(value??'').trim().slice(0,max);

export function priceOrder(body:Body, products:Product[]){
  const customerName=clean(body.customerName,150),customerPhone=clean(body.customerPhone,30),customerCity=clean(body.customerCity,150);
  if(!customerName||!customerCity||!/^[+\d ()-]{6,30}$/.test(customerPhone))throw new Error('Completa tu nombre, WhatsApp y ciudad de entrega.');
  if(!Array.isArray(body.items)||!body.items.length||body.items.length>50)throw new Error('El carrito no es válido.');
  const byId=new Map(products.map(p=>[String(p.id),p]));
  const valid=body.items.map(item=>{
    const product=byId.get(String(item.product?.id??''));
    if(!product)throw new Error('Un producto ya no está disponible. Actualiza el carrito.');
    const quantity=Number(item.quantity);
    if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100)throw new Error('Revisa las cantidades del carrito.');
    return {item,product,quantity};
  });
  const christmasCount=valid.filter(x=>x.product.category==='navidad-temporadas').reduce((sum,x)=>sum+x.quantity,0);
  const items=valid.map(({item,product,quantity})=>{
    const requestedSize=clean(item.sizeLabel,150),notes=clean(item.notes,1000);
    let sizeLabel=requestedSize,unitPrice=Number(product.price);
    if(product.category==='navidad-temporadas'){
      const label=christmasCount>=2?'2 o más':'1 unidad';
      unitPrice=Number(product.sizes?.find(s=>s.label===label)?.price??product.price);sizeLabel='Preventa Navideña';
    }else if(product.sizes?.length){
      const size=product.sizes.find(s=>s.label===requestedSize);
      if(!size)throw new Error(`Selecciona una medida válida para ${product.title}.`);
      unitPrice=Number(size.price);
    }else sizeLabel='Estándar';
    if(product.category==='nubes'&&notes.includes('80 stickers de estrellas'))unitPrice+=25;
    if(!Number.isFinite(unitPrice)||unitPrice<0)throw new Error('Este producto necesita confirmación de precio.');
    return {key:clean(item.key,300),product,sizeLabel,unitPrice,personalization:clean(item.personalization,500),color:clean(item.color,200),notes,quantity};
  });
  const total=Math.round(items.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0)*100)/100;
  return {customerName,customerPhone,customerCity,shipping:clean(body.shipping,100),checkoutNotes:clean(body.checkoutNotes,2000),items,total};
}
