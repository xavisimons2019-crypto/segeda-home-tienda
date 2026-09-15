create table public.segeda_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.segeda_admins enable row level security;
grant select on public.segeda_admins to authenticated;
grant all on public.segeda_admins to service_role;
create policy admin_own_membership on public.segeda_admins for select to authenticated using (user_id = (select auth.uid()));

create table public.segeda_categories (
  id text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create table public.segeda_products (
  id text primary key,
  category text not null references public.segeda_categories(id),
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id and data->>'category' = category and (data->>'price')::numeric >= 0),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create index segeda_products_category_idx on public.segeda_products(category);
create index segeda_products_sort_idx on public.segeda_products(sort_order, id);
alter table public.segeda_categories enable row level security;
alter table public.segeda_products enable row level security;
grant select on public.segeda_categories, public.segeda_products to anon, authenticated;
grant insert, update, delete on public.segeda_categories, public.segeda_products to authenticated;
grant all on public.segeda_categories, public.segeda_products to service_role;
create policy categories_public_read on public.segeda_categories for select to anon, authenticated using (true);
create policy categories_admin_insert on public.segeda_categories for insert to authenticated with check ((select auth.uid()) in (select user_id from public.segeda_admins));
create policy categories_admin_update on public.segeda_categories for update to authenticated using ((select auth.uid()) in (select user_id from public.segeda_admins)) with check ((select auth.uid()) in (select user_id from public.segeda_admins));
create policy categories_admin_delete on public.segeda_categories for delete to authenticated using ((select auth.uid()) in (select user_id from public.segeda_admins));
create policy products_public_read on public.segeda_products for select to anon, authenticated using (true);
create policy products_admin_insert on public.segeda_products for insert to authenticated with check ((select auth.uid()) in (select user_id from public.segeda_admins));
create policy products_admin_update on public.segeda_products for update to authenticated using ((select auth.uid()) in (select user_id from public.segeda_admins)) with check ((select auth.uid()) in (select user_id from public.segeda_admins));
create policy products_admin_delete on public.segeda_products for delete to authenticated using ((select auth.uid()) in (select user_id from public.segeda_admins));

create table public.segeda_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  request_hash text not null,
  customer_name text not null check (length(customer_name) between 1 and 150),
  customer_phone text not null check (length(customer_phone) between 6 and 30),
  payload jsonb not null,
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'nuevo' check (status in ('nuevo','confirmado','en_preparacion','enviado','completado','cancelado')),
  created_at timestamptz not null default now()
);
create index segeda_orders_created_idx on public.segeda_orders(created_at desc);
alter table public.segeda_orders enable row level security;
grant select on public.segeda_orders to authenticated;
grant update(status) on public.segeda_orders to authenticated;
grant all on public.segeda_orders to service_role;
create policy orders_admin_read on public.segeda_orders for select to authenticated using ((select auth.uid()) in (select user_id from public.segeda_admins));
create policy orders_admin_update on public.segeda_orders for update to authenticated using ((select auth.uid()) in (select user_id from public.segeda_admins)) with check ((select auth.uid()) in (select user_id from public.segeda_admins));

create table public.segeda_checkout_limits (
  key text primary key,
  bucket timestamptz not null,
  hits integer not null
);
alter table public.segeda_checkout_limits enable row level security;
grant all on public.segeda_checkout_limits to service_role;
create function public.segeda_allow_checkout(client_key text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare current_bucket timestamptz := date_trunc('hour', now()); current_hits integer;
begin
  insert into public.segeda_checkout_limits as limits(key, bucket, hits)
  values (client_key, current_bucket, 1)
  on conflict (key) do update set
    hits = case when limits.bucket = current_bucket then limits.hits + 1 else 1 end,
    bucket = current_bucket
  returning hits into current_hits;
  return current_hits <= 15;
end;
$$;
revoke all on function public.segeda_allow_checkout(text) from public, anon, authenticated;
grant execute on function public.segeda_allow_checkout(text) to service_role;

create policy segeda_media_admin_insert on storage.objects for insert to authenticated with check (bucket_id='segeda-media' and (select auth.uid()) in (select user_id from public.segeda_admins));
create policy segeda_media_admin_read on storage.objects for select to authenticated using (bucket_id='segeda-media' and (select auth.uid()) in (select user_id from public.segeda_admins));
create policy segeda_media_admin_update on storage.objects for update to authenticated using (bucket_id='segeda-media' and (select auth.uid()) in (select user_id from public.segeda_admins)) with check (bucket_id='segeda-media' and (select auth.uid()) in (select user_id from public.segeda_admins));
create policy segeda_media_admin_delete on storage.objects for delete to authenticated using (bucket_id='segeda-media' and (select auth.uid()) in (select user_id from public.segeda_admins));
