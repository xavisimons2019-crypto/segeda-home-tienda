-- Preserve the current storefront sequence (the seasonal tile previously appeared first).
lock table public.segeda_categories in share row exclusive mode;
with ranked as (
 select id,row_number() over(order by (id='navidad-temporadas') desc,sort_order,id)::integer as position
 from public.segeda_categories
)
update public.segeda_categories c set sort_order=r.position from ranked r where c.id=r.id;
alter table public.segeda_categories
 add constraint segeda_categories_positive_position check(sort_order>0),
 add constraint segeda_categories_position_key unique(sort_order) deferrable initially deferred;

create function public.segeda_categories_lock_write() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('segeda_categories_order',0));
 return null;
end $$;
create trigger segeda_categories_write_lock before insert or update or delete on public.segeda_categories
 for each statement execute function public.segeda_categories_lock_write();

create function public.segeda_categories_assign_position() returns trigger
language plpgsql security invoker set search_path='' as $$
declare existing_position integer;
begin
 select sort_order into existing_position from public.segeda_categories where id=new.id;
 if found then new.sort_order:=existing_position;
 elsif new.sort_order is null or new.sort_order<=0 then
  select coalesce(max(sort_order),0)+1 into new.sort_order from public.segeda_categories;
 end if;
 return new;
end $$;
create trigger segeda_categories_assign_position before insert on public.segeda_categories
 for each row execute function public.segeda_categories_assign_position();

create function public.segeda_categories_close_gap() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 with ranked as(select id,row_number() over(order by sort_order,id)::integer as position from public.segeda_categories)
 update public.segeda_categories c set sort_order=r.position from ranked r where c.id=r.id and c.sort_order<>r.position;
 return null;
end $$;
create trigger segeda_categories_close_gap after delete on public.segeda_categories
 for each statement execute function public.segeda_categories_close_gap();

create function public.segeda_reorder_categories(p_ids text[],p_expected_ids text[])
returns table(id text,sort_order integer)
language plpgsql security invoker set search_path='' as $$
declare current_ids text[]; changed_count integer;
begin
 if auth.uid() is null or not exists(select 1 from public.segeda_admins a where a.user_id=auth.uid()) then
  raise exception 'Acceso de administrador requerido.' using errcode='42501';
 end if;
 if p_ids is null or p_expected_ids is null then raise exception 'Lista completa requerida.' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('segeda_categories_order',0));
 select coalesce(array_agg(c.id order by c.sort_order,c.id),array[]::text[]) into current_ids from public.segeda_categories c;
 if cardinality(p_ids)=0 or cardinality(p_ids)<>cardinality(current_ids)
    or cardinality(p_ids)<>(select count(distinct item) from unnest(p_ids) item)
    or not (p_ids @> current_ids and p_ids <@ current_ids) then
  raise exception 'La lista debe incluir todas las categorías.' using errcode='22023';
 end if;
 if p_ids is distinct from current_ids then
  if p_expected_ids is distinct from current_ids then raise exception 'Las categorías cambiaron en otra sesión.' using errcode='40001'; end if;
  update public.segeda_categories c set sort_order=desired.position::integer,updated_at=now()
   from unnest(p_ids) with ordinality as desired(category_id,position) where c.id=desired.category_id;
  get diagnostics changed_count=row_count;
  if changed_count<>cardinality(p_ids) then raise exception 'No se pudo guardar el orden completo.' using errcode='42501'; end if;
 end if;
 return query select c.id,c.sort_order from public.segeda_categories c order by c.sort_order,c.id;
end $$;
revoke all on function public.segeda_reorder_categories(text[],text[]) from public,anon;
grant execute on function public.segeda_reorder_categories(text[],text[]) to authenticated;
revoke all on function public.segeda_categories_lock_write(),public.segeda_categories_assign_position(),public.segeda_categories_close_gap() from public,anon;
grant execute on function public.segeda_categories_lock_write(),public.segeda_categories_assign_position(),public.segeda_categories_close_gap() to authenticated,service_role;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
 and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='segeda_categories') then
  alter publication supabase_realtime add table public.segeda_categories;
 end if;
end $$;

-- Guest inquiries may omit contact details. Existing order data remains unchanged.
alter table public.segeda_orders drop constraint segeda_orders_customer_name_check,
 add constraint segeda_orders_customer_name_check check(length(customer_name) between 0 and 150),
 drop constraint segeda_orders_customer_phone_check,
 add constraint segeda_orders_customer_phone_check check(customer_phone='' or length(customer_phone) between 6 and 30);
