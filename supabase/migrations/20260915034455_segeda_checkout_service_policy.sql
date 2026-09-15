create policy checkout_service_only on public.segeda_checkout_limits for all to service_role using (true) with check (true);
