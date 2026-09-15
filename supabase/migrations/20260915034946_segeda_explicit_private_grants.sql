revoke all on public.segeda_admins, public.segeda_orders, public.segeda_checkout_limits, public.segeda_products, public.segeda_categories from anon, authenticated;
grant select on public.segeda_admins, public.segeda_orders to authenticated;
grant update(status) on public.segeda_orders to authenticated;
grant select on public.segeda_products, public.segeda_categories to anon, authenticated;
grant insert, update, delete on public.segeda_products, public.segeda_categories to authenticated;
