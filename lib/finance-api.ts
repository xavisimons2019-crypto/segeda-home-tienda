import {supabase} from '@/lib/supabase';
import type {CostPlan,FinanceBill,FinanceBudget,FinanceSection,FinanceTransaction,OrderTerms,StoreOrder} from '@/lib/finance';
export async function readAll<T>(table:string,select='*',order='id'):Promise<T[]>{
 const result:T[]=[];
 for(let offset=0;;offset+=500){const {data,error}=await supabase.from(table).select(select).order(order).order('id').range(offset,offset+499);if(error)throw new Error('No se pudieron cargar los registros. Revisa tu sesión y vuelve a actualizar.');result.push(...data as T[]);if(data.length<500)return result;}
}
/** One database snapshot keeps order balances and money allocations consistent. */
export async function loadFinance(){
 const {data,error}=await supabase.rpc('segeda_finance_export');
 if(error||!data)throw new Error('No se pudieron cargar las finanzas. Revisa tu sesión y vuelve a actualizar.');
 const snapshot=data as {orders:StoreOrder[];finance:{
  segeda_finance_sections:FinanceSection[];
  segeda_finance_transactions:Omit<FinanceTransaction,'allocations'>[];
  segeda_finance_allocations:{transaction_id:string;section_id:string;amount:number}[];
  segeda_finance_budgets:FinanceBudget[];segeda_finance_bills:FinanceBill[];
  segeda_finance_cost_plans:CostPlan[];segeda_finance_order_terms:OrderTerms[];
 }};
 const f=snapshot.finance,allocations=new Map<string,FinanceTransaction['allocations']>();
 for(const a of f.segeda_finance_allocations){const rows=allocations.get(a.transaction_id)||[];rows.push({section_id:a.section_id,amount:a.amount});allocations.set(a.transaction_id,rows);}
 return {
  sections:[...f.segeda_finance_sections].sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id)),
  transactions:f.segeda_finance_transactions.map(t=>({...t,allocations:allocations.get(t.id)||[]})),
  orders:snapshot.orders,budgets:f.segeda_finance_budgets,bills:f.segeda_finance_bills,
  plans:f.segeda_finance_cost_plans,terms:f.segeda_finance_order_terms,
 };
}

export type FinanceData=Awaited<ReturnType<typeof loadFinance>>;
export async function financeRpc(name:string,params:Record<string,unknown>){const {error}=await supabase.rpc(name,params);if(error)throw new Error(error.code==='P0001'?error.message:'No se pudo guardar. Reintenta con el mismo formulario.');}
export const recordFinance=(params:Record<string,unknown>)=>financeRpc('segeda_finance_record',params);
export const voidFinance=(id:string,reason:string)=>financeRpc('segeda_finance_void',{p_id:id,p_reason:reason});
