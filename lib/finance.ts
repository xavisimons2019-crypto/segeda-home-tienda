/** All calculations use integer céntimos. Forecasts never create money movements. */
export type FinanceSection = {id:string; name:string; sort_order:number};
export type Allocation = {section_id:string; amount:number};
export type MovementKind = 'income'|'expense'|'refund'|'contribution'|'withdrawal';
export type FinanceTransaction = {id:string; kind:MovementKind; amount:number; occurred_on:string; description:string; method:string; expense_type:string; expense_behavior:string; reference:string; order_id:string|null; bill_id:string|null; voided_at:string|null; void_reason:string|null; created_at:string; allocations:Allocation[]};
export type FinanceBudget = {id:string; month:string; section_id:string; income_target:number; expense_limit:number; notes:string};
export type FinanceBill = {id:string; vendor:string; description:string; section_id:string; amount:number; due_on:string; expense_type:string; expense_behavior:string; cancelled_at:string|null; cancel_reason:string|null};
export type CostPlan = {id:string; month:string; section_id:string; unit_price:number; unit_cost:number; fixed_cost:number; expected_units:number; fee_percent:number; notes:string};
export type OrderTerms = {order_id:string; due_on:string|null; completed_on:string|null};
export type StoreOrder = {id:string; customer_name:string; customer_phone:string; total:number; status:string; created_at:string; payload:{customerCity?:string; shipping?:string; checkoutNotes?:string; items?:{product:{id?:string|number; title:string; category?:string}; quantity:number; sizeLabel:string; personalization?:string; notes?:string; unitPrice:number}[]}};
export const GENERAL='general';
export const methods:Record<string,string>={yape:'Yape',plin:'Plin',efectivo:'Efectivo',transferencia:'Transferencia',tarjeta:'Tarjeta',otro:'Otro'};
export const expenseTypes:Record<string,string>={materiales:'Materiales e insumos',mano_obra:'Mano de obra',envios:'Envíos y movilidad',publicidad:'Publicidad',servicios:'Servicios y alquiler',comisiones:'Comisiones',otros:'Otros gastos'};
export const kindLabels:Record<MovementKind,string>={income:'Cobro',expense:'Gasto',refund:'Devolución',contribution:'Aporte / financiamiento',withdrawal:'Retiro / devolución de capital'};
export const orderStatuses:Record<string,string>={nuevo:'Nuevo',confirmado:'Confirmado',en_preparacion:'En preparación',enviado:'Enviado',completado:'Finalizado',cancelado:'Cancelado'};
export function money(cents:number){return new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(cents/100);}
export function toCents(value:number|string){const n=Number(value);return Number.isFinite(n)?Math.round((n+Number.EPSILON)*100):0;}
export function parseAmount(value:string,allowZero=false){if(!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value.trim()))throw new Error('Escribe un importe válido, con un máximo de dos decimales.');const n=toCents(value.trim().replace(',','.'));if(n<(allowZero?0:1)||n>999999999)throw new Error('Revisa el importe ingresado.');return n;}
export function peruToday(date=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const get=(type:string)=>parts.find(p=>p.type===type)!.value;return `${get('year')}-${get('month')}-${get('day')}`;}
export function monthLabel(month:string){return new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));}
export function stepMonth(month:string,step:number){const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1+step,1)).toISOString().slice(0,7);}
export function dayLabel(day:string){return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`));}
const compareIds=(a:string,b:string)=>a<b?-1:a>b?1:0;
/** Integer weights, exact largest remainders; same tie rule as the database. */
export function splitCents(total:number,weights:Record<string,number>):Record<string,number>{
 const entries=Object.entries(weights).filter(([,n])=>n>0).map(([id,n])=>({id,weight:BigInt(Math.round(n))})).filter(r=>r.weight>BigInt(0));
 const sum=entries.reduce((s,r)=>s+r.weight,BigInt(0));if(!sum)return {[GENERAL]:total};
 const rows=entries.map(r=>({id:r.id,cents:Number(BigInt(total)*r.weight/sum),rem:BigInt(total)*r.weight%sum}));
 let remaining=total-rows.reduce((s,r)=>s+r.cents,0);
 for(const r of [...rows].sort((a,b)=>a.rem>b.rem?-1:a.rem<b.rem?1:compareIds(a.id,b.id))){if(remaining-->0)r.cents++;}
 return Object.fromEntries(rows.map(r=>[r.id,r.cents]));
}
export function orderPaid(orderId:string,transactions:FinanceTransaction[]){return transactions.filter(t=>t.order_id===orderId&&!t.voided_at).reduce((s,t)=>s+(t.kind==='income'?toCents(t.amount):t.kind==='refund'?-toCents(t.amount):0),0);}
export function billPaid(billId:string,transactions:FinanceTransaction[]){return transactions.filter(t=>t.bill_id===billId&&!t.voided_at&&t.kind==='expense').reduce((s,t)=>s+toCents(t.amount),0);}
export function sectionAmount(t:FinanceTransaction,section:string){return section==='all'?toCents(t.amount):t.allocations.filter(a=>a.section_id===section).reduce((s,a)=>s+toCents(a.amount),0);}
const zero=()=>({income:0,refund:0,expense:0,contribution:0,withdrawal:0,net:0,operating:0,cash:0});
export function summarize(transactions:FinanceTransaction[],sections:FinanceSection[],month:string,filter='all'){
 const active=transactions.filter(t=>!t.voided_at&&t.occurred_on.slice(0,7)===month);
 const rows=sections.filter(s=>filter==='all'||s.id===filter).map(s=>({id:s.id,name:s.name,...zero()}));
 const byId=new Map(rows.map(r=>[r.id,r]));
 const count=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
 const days=Array.from({length:count},(_,i)=>({day:String(i+1),...zero()}));
 for(const t of active){let amount=0;for(const a of t.allocations){const row=byId.get(a.section_id);if(row){const cents=toCents(a.amount);row[t.kind]+=cents;amount+=cents;}}const day=days[Number(t.occurred_on.slice(-2))-1];if(day)day[t.kind]+=amount;}
 for(const r of [...rows,...days]){r.net=r.income-r.refund;r.operating=r.net-r.expense;r.cash=r.operating+r.contribution-r.withdrawal;}
 const totals=rows.reduce((s,r)=>Object.fromEntries(Object.keys(s).map(k=>[k,s[k as keyof typeof s]+r[k as keyof typeof s]])) as ReturnType<typeof zero>,zero());
 return {rows,days,totals,active};
}
export function costMetrics(plan:Pick<CostPlan,'unit_price'|'unit_cost'|'fixed_cost'|'fee_percent'|'expected_units'>){
 const price=toCents(plan.unit_price),cost=toCents(plan.unit_cost),fixed=toCents(plan.fixed_cost),fee=Math.round(price*Number(plan.fee_percent)/100),contribution=price-cost-fee;
 return {price,cost,fixed,fee,contribution,margin:price>0?contribution/price*100:null,breakEven:contribution>0?Math.ceil(fixed/contribution):null,forecast:contribution*Number(plan.expected_units)-fixed};
}
export function orderComposition(order:StoreOrder,sections:FinanceSection[]){
 const valid=new Set(sections.map(s=>s.id)),weights:Record<string,number>={},units:Record<string,number>={};
 for(const item of order.payload.items||[]){const id=valid.has(item.product.category||'')?item.product.category!:GENERAL;weights[id]=(weights[id]||0)+toCents(item.unitPrice)*item.quantity;units[id]=(units[id]||0)+item.quantity;}
 return {revenue:splitCents(toCents(order.total),weights),units};
}
/** Management estimate: fulfilled order revenue, estimated unit/fixed costs.
 * Advances do not become sales. Refunds before fulfillment affect the fulfillment
 * month; later refunds affect their own month. Manual cash receipts are separate.
 */
export function profitBySection(orders:StoreOrder[],terms:OrderTerms[],transactions:FinanceTransaction[],sections:FinanceSection[],plans:CostPlan[],month:string){
 const completed=new Map(terms.filter(t=>t.completed_on).map(t=>[t.order_id,t.completed_on!]));
 const rows=sections.map(s=>({id:s.id,name:s.name,revenue:0,refunds:0,units:0,netRevenue:0,variableCost:0,fees:0,fixedCost:0,profit:null as number|null,margin:null as number|null,plan:plans.find(p=>p.section_id===s.id&&p.month.startsWith(month))}));
 const byId=new Map(rows.map(r=>[r.id,r]));
 for(const o of orders){if(completed.get(o.id)?.slice(0,7)!==month)continue;const {revenue,units}=orderComposition(o,sections);for(const [id,value]of Object.entries(revenue)){const r=byId.get(id);if(r){r.revenue+=value;r.units+=units[id]||0;}}}
 for(const t of transactions){if(t.voided_at||t.kind!=='refund'||!t.order_id||!completed.has(t.order_id))continue;const recognized=completed.get(t.order_id)!;const effective=t.occurred_on>recognized?t.occurred_on:recognized;if(!effective.startsWith(month))continue;for(const a of t.allocations){const row=byId.get(a.section_id);if(row)row.refunds+=toCents(a.amount);}}
 for(const r of rows){r.netRevenue=r.revenue-r.refunds;if(r.plan){r.variableCost=toCents(r.plan.unit_cost)*r.units;r.fees=Math.round(r.revenue*Number(r.plan.fee_percent)/100);r.fixedCost=toCents(r.plan.fixed_cost);r.profit=r.netRevenue-r.variableCost-r.fees-r.fixedCost;r.margin=r.netRevenue>0?r.profit/r.netRevenue*100:null;}}
 return rows;
}
export function csvCell(value:string|number){let text=String(value);if(typeof value==='string'&&/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function financeCsv(transactions:FinanceTransaction[],sections:FinanceSection[],month:string,filter='all'){
 const names=new Map(sections.map(s=>[s.id,s.name]));const rows:(string|number)[][]=[['Fecha','Tipo','Sección','Concepto','Cobro (S/)','Gasto (S/)','Devolución (S/)','Aporte (S/)','Retiro (S/)','Medio','Referencia','Pedido','Cuenta por pagar']];
 for(const t of transactions.filter(t=>!t.voided_at&&t.occurred_on.startsWith(month))){for(const a of t.allocations.filter(a=>filter==='all'||a.section_id===filter)){rows.push([t.occurred_on,kindLabels[t.kind],names.get(a.section_id)||a.section_id,t.description,...(['income','expense','refund','contribution','withdrawal'] as const).map(k=>t.kind===k?Number(a.amount):0),methods[t.method]||t.method,t.reference,t.order_id||'',t.bill_id||'']);}}
 return '\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');
}
