create schema if not exists segeda_private;
revoke all on schema segeda_private from public, anon;
grant usage on schema segeda_private to authenticated, service_role;

create table public.segeda_finance_sections (
 id text primary key, name text not null check(length(name) between 1 and 150), sort_order integer not null default 0
);
insert into public.segeda_finance_sections(id,name,sort_order)
 select id,coalesce(data->>'short',data->>'name',id),sort_order from public.segeda_categories;
insert into public.segeda_finance_sections values ('general','Gastos generales / sin sección',10000);

create table public.segeda_finance_bills (
 id uuid primary key, vendor text not null check(length(trim(vendor)) between 1 and 150),
 description text not null check(length(trim(description)) between 1 and 250),
 section_id text not null references public.segeda_finance_sections(id) on delete restrict,
 amount numeric(12,2) not null check(amount>0 and amount<=9999999.99), due_on date not null,
 expense_type text not null check(expense_type in ('materiales','mano_obra','envios','publicidad','servicios','comisiones','otros')),
 expense_behavior text not null check(expense_behavior in ('fixed','variable')),
 created_at timestamptz not null default now(), cancelled_at timestamptz, cancel_reason text,
 check((cancelled_at is null and cancel_reason is null) or (cancelled_at is not null and length(trim(cancel_reason)) between 5 and 500))
);
create index segeda_finance_bills_section on public.segeda_finance_bills(section_id);
create index segeda_finance_bills_due on public.segeda_finance_bills(due_on);
create table public.segeda_finance_cost_plans (
 id uuid primary key default gen_random_uuid(), month date not null check(extract(day from month)=1),
 section_id text not null references public.segeda_finance_sections(id) on delete restrict,
 unit_price numeric(12,2) not null check(unit_price between 0 and 9999999.99),
 unit_cost numeric(12,2) not null check(unit_cost between 0 and 9999999.99),
 fixed_cost numeric(12,2) not null check(fixed_cost between 0 and 9999999.99),
 expected_units integer not null check(expected_units between 0 and 1000000),
 fee_percent numeric(5,2) not null check(fee_percent between 0 and 99.99),
 notes text not null default '' check(length(notes)<=500), updated_at timestamptz not null default now(),
 unique(month,section_id)
);
create index segeda_finance_cost_plans_section on public.segeda_finance_cost_plans(section_id);
create table public.segeda_finance_order_terms (
 order_id uuid primary key references public.segeda_orders(id) on delete restrict,
 due_on date, completed_on date, updated_at timestamptz not null default now()
);
create table public.segeda_finance_transactions (
 id uuid primary key, kind text not null check(kind in ('income','expense','refund','contribution','withdrawal')),
 amount numeric(12,2) not null check(amount>0 and amount<=9999999.99),
 occurred_on date not null, description text not null check(length(description) between 1 and 250),
 method text not null check(method in ('yape','plin','efectivo','transferencia','tarjeta','otro')),
 expense_type text not null default '' check(expense_type in ('','materiales','mano_obra','envios','publicidad','servicios','comisiones','otros')),
 reference text not null default '' check(length(reference)<=150),
 order_id uuid references public.segeda_orders(id) on delete restrict,
 bill_id uuid references public.segeda_finance_bills(id) on delete restrict,
 expense_behavior text not null default '' check(expense_behavior in ('','fixed','variable')),
 check(not(order_id is not null and bill_id is not null)),
 check(order_id is null or kind in ('income','refund')),
 check(bill_id is null or kind='expense'),
 check((kind='expense' and expense_behavior<>'') or (kind<>'expense' and expense_behavior='')),
 request_hash text not null, created_at timestamptz not null default now(), created_by uuid,
 voided_at timestamptz, void_reason text, voided_by uuid,
 check((voided_at is null and void_reason is null) or (voided_at is not null and length(void_reason) between 5 and 500)),
 check((kind='expense' and expense_type<>'') or (kind<>'expense' and expense_type=''))
);
create index segeda_finance_transactions_bill on public.segeda_finance_transactions(bill_id) where bill_id is not null;
create index segeda_finance_transactions_date on public.segeda_finance_transactions(occurred_on,id);
create index segeda_finance_transactions_order on public.segeda_finance_transactions(order_id) where order_id is not null;
create table public.segeda_finance_allocations (
 id uuid primary key default gen_random_uuid(),
 transaction_id uuid not null references public.segeda_finance_transactions(id) on delete restrict,
 section_id text not null references public.segeda_finance_sections(id) on delete restrict,
 amount numeric(12,2) not null check(amount>0), unique(transaction_id,section_id)
);
create index segeda_finance_allocations_section on public.segeda_finance_allocations(section_id);
create table public.segeda_finance_budgets (
 id uuid primary key default gen_random_uuid(), month date not null check(extract(day from month)=1),
 section_id text not null references public.segeda_finance_sections(id) on delete restrict,
 income_target numeric(12,2) not null default 0 check(income_target between 0 and 9999999.99),
 expense_limit numeric(12,2) not null default 0 check(expense_limit between 0 and 9999999.99),
 notes text not null default '' check(length(notes)<=500), updated_at timestamptz not null default now(),
 unique(month,section_id)
);
create index segeda_finance_budgets_section on public.segeda_finance_budgets(section_id);

alter table public.segeda_finance_bills enable row level security;
alter table public.segeda_finance_cost_plans enable row level security;
alter table public.segeda_finance_order_terms enable row level security;
revoke all on public.segeda_finance_bills,public.segeda_finance_cost_plans,public.segeda_finance_order_terms from anon,authenticated;
grant select on public.segeda_finance_bills,public.segeda_finance_cost_plans,public.segeda_finance_order_terms to authenticated;
grant insert on public.segeda_finance_bills to authenticated;
grant insert,update,delete on public.segeda_finance_cost_plans to authenticated;
grant all on public.segeda_finance_bills,public.segeda_finance_cost_plans,public.segeda_finance_order_terms to service_role;
create policy finance_bills_admin_read on public.segeda_finance_bills for select to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins));
create policy finance_bills_admin_insert on public.segeda_finance_bills for insert to authenticated with check((select auth.uid()) in (select user_id from public.segeda_admins) and cancelled_at is null and cancel_reason is null);
create policy finance_plans_admin on public.segeda_finance_cost_plans for all to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins)) with check((select auth.uid()) in (select user_id from public.segeda_admins));
create policy finance_order_terms_admin_read on public.segeda_finance_order_terms for select to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins));
alter table public.segeda_finance_sections enable row level security;
alter table public.segeda_finance_transactions enable row level security;
alter table public.segeda_finance_allocations enable row level security;
alter table public.segeda_finance_budgets enable row level security;
revoke all on public.segeda_finance_sections,public.segeda_finance_transactions,public.segeda_finance_allocations,public.segeda_finance_budgets from anon,authenticated;
grant select on public.segeda_finance_sections,public.segeda_finance_transactions,public.segeda_finance_allocations,public.segeda_finance_budgets to authenticated;
grant insert,update,delete on public.segeda_finance_budgets to authenticated;
grant all on public.segeda_finance_sections,public.segeda_finance_transactions,public.segeda_finance_allocations,public.segeda_finance_budgets to service_role;
create policy finance_sections_admin_read on public.segeda_finance_sections for select to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins));
create policy finance_transactions_admin_read on public.segeda_finance_transactions for select to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins));
create policy finance_allocations_admin_read on public.segeda_finance_allocations for select to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins));
create policy finance_budgets_admin on public.segeda_finance_budgets for all to authenticated using((select auth.uid()) in (select user_id from public.segeda_admins)) with check((select auth.uid()) in (select user_id from public.segeda_admins));

-- Pure deterministic cent allocation: the sum always equals the requested total.
create function segeda_private.finance_split(p_total bigint,p_weights jsonb)
returns table(section_id text,cents bigint) language sql immutable security invoker set search_path='' as $$
 with weights as(select key as sid,value::numeric as weight from jsonb_each_text(p_weights) where value::numeric>0),
 raw as(select sid,p_total*weight/sum(weight) over() as exact from weights),
 ranked as(select sid,floor(exact)::bigint as base,row_number() over(order by exact-floor(exact) desc,sid collate "C") as rank,
 p_total-sum(floor(exact)) over() as remainder from raw)
 select sid,base+case when rank<=remainder then 1 else 0 end from ranked
$$;
revoke all on function segeda_private.finance_split(bigint,jsonb) from public,anon,authenticated;

-- Only guarded, atomic functions may write the immutable money journal. Direct
-- authenticated writes are intentionally not granted; the definer is private.
create function segeda_private.finance_record(p_id uuid,p_kind text,p_amount numeric,p_date date,p_description text,p_section text,p_method text,p_expense_type text,p_order uuid,p_reference text,p_bill uuid,p_behavior text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid:=auth.uid();v_hash text;v_existing text;v_total bigint;v_amount bigint;v_paid bigint;
 v_bill public.segeda_finance_bills%rowtype;v_order public.segeda_orders%rowtype;v_weights jsonb;v_targets jsonb;v_paid_sections jsonb;v_split record;v_sum bigint:=0;
begin
 if v_uid is null or not exists(select 1 from public.segeda_admins where user_id=v_uid) then raise exception 'Acceso reservado al administrador.';end if;
 if p_id is null or p_kind is null or p_kind not in ('income','expense','refund','contribution','withdrawal') then raise exception 'El tipo de movimiento no es válido.';end if;
 if p_amount is null or p_amount<=0 or p_amount>9999999.99 or p_amount*100<>round(p_amount*100) then raise exception 'Ingresa un importe positivo con un máximo de dos decimales.';end if;
 if p_date is null or p_date<'1900-01-01' or p_date>(now() at time zone 'America/Lima')::date then raise exception 'La fecha debe corresponder a un movimiento ya realizado.';end if;
 if p_description is null or length(trim(p_description)) not between 1 and 250 then raise exception 'Escribe un concepto de hasta 250 caracteres.';end if;
 if p_method is null or p_method not in ('yape','plin','efectivo','transferencia','tarjeta','otro') then raise exception 'Selecciona un medio de pago válido.';end if;
 if p_reference is null or length(p_reference)>150 then raise exception 'La referencia admite hasta 150 caracteres.';end if;
 if p_kind='expense' and (p_expense_type is null or p_expense_type not in ('materiales','mano_obra','envios','publicidad','servicios','comisiones','otros')) then raise exception 'Selecciona el tipo de gasto.';end if;
 if p_kind<>'expense' and coalesce(p_expense_type,'')<>'' then raise exception 'Este movimiento no es un gasto.';end if;
 if p_kind not in ('income','refund') and p_order is not null then raise exception 'Registra el gasto asignando su sección.';end if;
 if p_bill is not null and (p_order is not null or p_kind<>'expense') then raise exception 'La cuenta por pagar solo admite gastos.';end if;
 if p_kind='expense' and (p_behavior is null or p_behavior not in ('fixed','variable')) then raise exception 'Indica si el gasto es fijo o variable.';end if;
 if p_kind<>'expense' and coalesce(p_behavior,'')<>'' then raise exception 'Este movimiento no es un gasto.';end if;
 if p_kind='refund' and p_order is null then raise exception 'Vincula la devolución al pedido original.';end if;
 if p_kind in ('contribution','withdrawal') and p_section<>'general' then raise exception 'Los aportes y retiros se registran en General.';end if;
 v_amount:=round(p_amount*100)::bigint;
 v_hash:=md5(jsonb_build_array(p_kind,v_amount,p_date,trim(p_description),p_section,p_method,p_expense_type,p_order,p_reference,p_bill,p_behavior)::text);
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select request_hash into v_existing from public.segeda_finance_transactions where id=p_id;
 if found then if v_existing<>v_hash then raise exception 'Este envío ya fue registrado con otros datos. Abre un nuevo formulario.';end if;return p_id;end if;
 if p_bill is not null then
  select * into v_bill from public.segeda_finance_bills where id=p_bill for update;
  if not found or v_bill.cancelled_at is not null then raise exception 'La cuenta por pagar no está disponible.';end if;
  if p_section<>v_bill.section_id or p_expense_type<>v_bill.expense_type or p_behavior<>v_bill.expense_behavior then raise exception 'La clasificación debe coincidir con la cuenta por pagar.';end if;
  select coalesce(sum(amount)*100,0)::bigint into v_paid from public.segeda_finance_transactions where bill_id=p_bill and voided_at is null;
  if v_paid+v_amount>round(v_bill.amount*100) then raise exception 'El pago supera el saldo pendiente de esta cuenta.';end if;
 end if;
 if p_order is null then
  if p_section is null or not exists(select 1 from public.segeda_finance_sections where id=p_section) then raise exception 'Selecciona una sección válida.';end if;
  v_weights:=jsonb_build_object(p_section,1);
 else
  select * into v_order from public.segeda_orders where id=p_order for update;
  if not found then raise exception 'El pedido ya no está disponible.';end if;
  if p_kind='income' and v_order.status='cancelado' then raise exception 'No puedes registrar cobros en un pedido cancelado.';end if;
  v_total:=round(v_order.total*100)::bigint;
  select coalesce(sum(case kind when 'income' then amount when 'refund' then -amount else 0 end)*100,0)::bigint into v_paid from public.segeda_finance_transactions where order_id=p_order and voided_at is null;
  if p_kind='income' and v_paid+v_amount>v_total then raise exception 'El importe supera el saldo pendiente del pedido.';end if;
  if p_kind='refund' and v_amount>v_paid then raise exception 'La devolución supera lo cobrado en este pedido.';end if;
  select coalesce(jsonb_object_agg(section_id,paid),'{}'::jsonb) into v_paid_sections from (
   select a.section_id,sum(case t.kind when 'income' then a.amount when 'refund' then -a.amount else 0 end)*100 as paid
   from public.segeda_finance_transactions t join public.segeda_finance_allocations a on a.transaction_id=t.id where t.order_id=p_order and t.voided_at is null group by a.section_id
  ) p;
  if p_kind='refund' then v_weights:=v_paid_sections;
  else
   select coalesce(jsonb_object_agg(sid,weight),'{}'::jsonb) into v_weights from (
    select case when exists(select 1 from public.segeda_finance_sections s where s.id=item->'product'->>'category') then item->'product'->>'category' else 'general' end as sid,
      sum((item->>'unitPrice')::numeric*(item->>'quantity')::numeric) as weight
    from jsonb_array_elements(coalesce(v_order.payload->'items','[]'::jsonb)) item group by 1
   ) w where weight>0;
   if v_weights='{}'::jsonb then v_weights:='{"general":1}'::jsonb;end if;
   select jsonb_object_agg(section_id,cents) into v_targets from segeda_private.finance_split(v_total,v_weights);
   select jsonb_object_agg(key,greatest(value::numeric-coalesce((v_paid_sections->>key)::numeric,0),0)) into v_weights from jsonb_each_text(v_targets);
  end if;
 end if;
 insert into public.segeda_finance_transactions(id,kind,amount,occurred_on,description,method,expense_type,reference,order_id,bill_id,expense_behavior,request_hash,created_by)
 values(p_id,p_kind,p_amount,p_date,trim(p_description),p_method,coalesce(p_expense_type,''),p_reference,p_order,p_bill,coalesce(p_behavior,''),v_hash,v_uid);
 for v_split in select * from segeda_private.finance_split(v_amount,v_weights) where cents>0 loop
  insert into public.segeda_finance_allocations(transaction_id,section_id,amount) values(p_id,v_split.section_id,v_split.cents/100.0);
  v_sum:=v_sum+v_split.cents;
 end loop;
 if v_sum<>v_amount then raise exception 'No se pudo distribuir el movimiento entre las secciones.';end if;
 return p_id;
end;
$$;
revoke all on function segeda_private.finance_record(uuid,text,numeric,date,text,text,text,text,uuid,text,uuid,text) from public,anon;
grant execute on function segeda_private.finance_record(uuid,text,numeric,date,text,text,text,text,uuid,text,uuid,text) to authenticated;
create function public.segeda_finance_record(p_id uuid,p_kind text,p_amount numeric,p_date date,p_description text,p_section text,p_method text,p_expense_type text,p_order uuid,p_reference text,p_bill uuid,p_behavior text)
returns uuid language sql security invoker set search_path='' as $$select segeda_private.finance_record(p_id,p_kind,p_amount,p_date,p_description,p_section,p_method,p_expense_type,p_order,p_reference,p_bill,p_behavior)$$;
revoke all on function public.segeda_finance_record(uuid,text,numeric,date,text,text,text,text,uuid,text,uuid,text) from public,anon;
grant execute on function public.segeda_finance_record(uuid,text,numeric,date,text,text,text,text,uuid,text,uuid,text) to authenticated;

create function segeda_private.finance_void(p_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_row public.segeda_finance_transactions%rowtype;v_paid numeric;v_total numeric;v_order uuid;v_bill uuid;
begin
 if v_uid is null or not exists(select 1 from public.segeda_admins where user_id=v_uid) then raise exception 'Acceso reservado al administrador.';end if;
 if p_reason is null or length(trim(p_reason)) not between 5 and 500 then raise exception 'Indica un motivo de anulación de al menos 5 caracteres.';end if;
 select order_id,bill_id into v_order,v_bill from public.segeda_finance_transactions where id=p_id;
 -- All changes to an order balance take the same order lock first.
 if v_order is not null then select total into v_total from public.segeda_orders where id=v_order for update;end if;
 if v_bill is not null then perform 1 from public.segeda_finance_bills where id=v_bill for update;end if;
 select * into v_row from public.segeda_finance_transactions where id=p_id for update;
 if not found then raise exception 'El movimiento no existe.';end if;
 if v_row.voided_at is not null then return;end if;
 if v_row.order_id is not null then
  select coalesce(sum(case kind when 'income' then amount when 'refund' then -amount else 0 end),0) into v_paid from public.segeda_finance_transactions where order_id=v_row.order_id and voided_at is null and id<>p_id;
  if v_paid<0 or v_paid>v_total then raise exception 'La anulación dejaría un saldo incorrecto. Revisa primero los cobros y devoluciones relacionados.';end if;
  if exists(select 1 from public.segeda_finance_allocations a join public.segeda_finance_transactions t on t.id=a.transaction_id where t.order_id=v_row.order_id and t.voided_at is null and t.id<>p_id group by a.section_id having sum(case t.kind when 'income' then a.amount when 'refund' then -a.amount else 0 end)<0) then raise exception 'Anula primero la devolución relacionada para mantener el saldo de cada sección.';end if;
 end if;
 update public.segeda_finance_transactions set voided_at=now(),void_reason=trim(p_reason),voided_by=v_uid where id=p_id;
end;
$$;
revoke all on function segeda_private.finance_void(uuid,text) from public,anon;
grant execute on function segeda_private.finance_void(uuid,text) to authenticated;
create function public.segeda_finance_void(p_id uuid,p_reason text) returns void language sql security invoker set search_path='' as $$select segeda_private.finance_void(p_id,p_reason)$$;
revoke all on function public.segeda_finance_void(uuid,text) from public,anon;
grant execute on function public.segeda_finance_void(uuid,text) to authenticated;

-- Receivable due dates and fulfillment date are maintained atomically with status.
create function segeda_private.finance_order_update(p_id uuid,p_status text,p_due date,p_completed date)
returns void language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_previous date;
begin
 if v_uid is null or not exists(select 1 from public.segeda_admins where user_id=v_uid) then raise exception 'Acceso reservado al administrador.';end if;
 if p_status is null or p_status not in ('nuevo','confirmado','en_preparacion','enviado','completado','cancelado') then raise exception 'Selecciona un estado válido.';end if;
 if p_completed is not null and (p_completed<'1900-01-01' or p_completed>(now() at time zone 'America/Lima')::date) then raise exception 'La finalización debe ser una fecha ya transcurrida.';end if;
 if p_due is not null and p_due<'1900-01-01' then raise exception 'La fecha de vencimiento no es válida.';end if;
 perform 1 from public.segeda_orders where id=p_id for update;
 if not found then raise exception 'El pedido no existe.';end if;
 select completed_on into v_previous from public.segeda_finance_order_terms where order_id=p_id;
 -- Keep recognition history even if the order is later cancelled/refunded.
 if v_previous is not null and p_completed is null then raise exception 'Conserva la fecha de finalización; registra una devolución si corresponde.';end if;
 if p_status='completado' and p_completed is null then raise exception 'Indica la fecha de finalización del pedido.';end if;
 update public.segeda_orders set status=p_status where id=p_id;
 insert into public.segeda_finance_order_terms(order_id,due_on,completed_on) values(p_id,p_due,p_completed)
 on conflict(order_id) do update set due_on=excluded.due_on,completed_on=excluded.completed_on,updated_at=now();
end;$$;
revoke all on function segeda_private.finance_order_update(uuid,text,date,date) from public,anon;
grant execute on function segeda_private.finance_order_update(uuid,text,date,date) to authenticated;
create function public.segeda_finance_order_update(p_id uuid,p_status text,p_due date,p_completed date)
returns void language sql security invoker set search_path='' as $$select segeda_private.finance_order_update(p_id,p_status,p_due,p_completed)$$;
revoke all on function public.segeda_finance_order_update(uuid,text,date,date) from public,anon;
grant execute on function public.segeda_finance_order_update(uuid,text,date,date) to authenticated;

create function segeda_private.finance_cancel_bill(p_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.segeda_admins where user_id=(select auth.uid())) then raise exception 'Acceso reservado al administrador.';end if;
 if p_reason is null or length(trim(p_reason)) not between 5 and 500 then raise exception 'Indica un motivo de al menos 5 caracteres.';end if;
 perform 1 from public.segeda_finance_bills where id=p_id for update;
 if not found then raise exception 'La cuenta por pagar no existe.';end if;
 if exists(select 1 from public.segeda_finance_transactions where bill_id=p_id and voided_at is null) then raise exception 'Esta cuenta ya tiene pagos. Revisa sus movimientos antes de anularla.';end if;
 update public.segeda_finance_bills set cancelled_at=now(),cancel_reason=trim(p_reason) where id=p_id and cancelled_at is null;
end;$$;
revoke all on function segeda_private.finance_cancel_bill(uuid,text) from public,anon;
grant execute on function segeda_private.finance_cancel_bill(uuid,text) to authenticated;
create function public.segeda_finance_cancel_bill(p_id uuid,p_reason text)
returns void language sql security invoker set search_path='' as $$select segeda_private.finance_cancel_bill(p_id,p_reason)$$;
revoke all on function public.segeda_finance_cancel_bill(uuid,text) from public,anon;
grant execute on function public.segeda_finance_cancel_bill(uuid,text) to authenticated;

-- Keep finance section labels aligned with the catalog; historical sections survive deletion.
create function segeda_private.finance_category_sync() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.segeda_finance_sections(id,name,sort_order) values(new.id,coalesce(new.data->>'short',new.data->>'name',new.id),new.sort_order)
 on conflict(id) do update set name=excluded.name,sort_order=excluded.sort_order;
 return new;
end;$$;
revoke all on function segeda_private.finance_category_sync() from public,anon,authenticated;
create trigger finance_category_sync after insert or update on public.segeda_categories for each row execute function segeda_private.finance_category_sync();
notify pgrst,'reload schema';
