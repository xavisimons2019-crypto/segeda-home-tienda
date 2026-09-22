-- One statement snapshots orders and all related financial tables together.
-- Financial records never go into the public catalog or the source repository.
create function segeda_private.finance_export() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.segeda_admins where user_id=(select auth.uid())) then raise exception 'Acceso reservado al administrador.';end if;
 return (select jsonb_build_object(
  'orders',coalesce((select jsonb_agg(o order by o.created_at,o.id) from public.segeda_orders o),'[]'::jsonb),
  'finance',jsonb_build_object(
   'segeda_finance_sections',coalesce((select jsonb_agg(t order by t.id) from public.segeda_finance_sections t),'[]'::jsonb),
   'segeda_finance_bills',coalesce((select jsonb_agg(t order by t.id) from public.segeda_finance_bills t),'[]'::jsonb),
   'segeda_finance_transactions',coalesce((select jsonb_agg(t order by t.id) from public.segeda_finance_transactions t),'[]'::jsonb),
   'segeda_finance_allocations',coalesce((select jsonb_agg(t order by t.id) from public.segeda_finance_allocations t),'[]'::jsonb),
   'segeda_finance_budgets',coalesce((select jsonb_agg(t order by t.id) from public.segeda_finance_budgets t),'[]'::jsonb),
   'segeda_finance_cost_plans',coalesce((select jsonb_agg(t order by t.id) from public.segeda_finance_cost_plans t),'[]'::jsonb),
   'segeda_finance_order_terms',coalesce((select jsonb_agg(t order by t.order_id) from public.segeda_finance_order_terms t),'[]'::jsonb)
  )));
end;$$;
revoke all on function segeda_private.finance_export() from public,anon;
grant execute on function segeda_private.finance_export() to authenticated;
create function public.segeda_finance_export() returns jsonb language sql security invoker set search_path='' as $$select segeda_private.finance_export()$$;
revoke all on function public.segeda_finance_export() from public,anon;
grant execute on function public.segeda_finance_export() to authenticated;
notify pgrst,'reload schema';
