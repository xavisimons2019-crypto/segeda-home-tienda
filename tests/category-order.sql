begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.segeda_admins limit 1),true);
set local role authenticated;
do $$
declare original text[]; moved text[]; actual text[]; saved_hash text; products_hash text; new_id text; old_position integer; amount integer;
begin
 select array_agg(id order by sort_order,id),md5(string_agg(data::text,'|' order by id)),count(*) into original,saved_hash,amount from public.segeda_categories;
 select md5(string_agg(data::text||':'||sort_order,'|' order by id)) into products_hash from public.segeda_products;
 moved:=array[original[cardinality(original)]]||original[1:cardinality(original)-1];
 perform * from public.segeda_reorder_categories(moved,original);
 select array_agg(id order by sort_order,id) into actual from public.segeda_categories;
 assert actual=moved,'Order not saved';
 assert (select min(sort_order)=1 and max(sort_order)=count(*) and count(distinct sort_order)=count(*) from public.segeda_categories),'Positions invalid';
 perform * from public.segeda_reorder_categories(moved,original);
 begin
  perform * from public.segeda_reorder_categories(original,original);
  raise exception 'Stale order accepted';
 exception when serialization_failure then null;end;
 begin
  perform * from public.segeda_reorder_categories(array[original[1],original[1]],moved);
  raise exception 'Duplicate IDs accepted';
 exception when invalid_parameter_value then null;end;
 begin
  perform * from public.segeda_reorder_categories(array_append(moved,'missing'),moved);
  raise exception 'Foreign ID accepted';
 exception when invalid_parameter_value then null;end;
 perform * from public.segeda_reorder_categories(original,moved);
 assert saved_hash=(select md5(string_agg(data::text,'|' order by id)) from public.segeda_categories),'Category data changed';
 select sort_order into old_position from public.segeda_categories where id=original[2];
 insert into public.segeda_categories(id,data)
  select id,jsonb_set(data,'{image}','"https://example.com/qa-cover.jpg"'::jsonb) from public.segeda_categories where id=original[2]
  on conflict(id) do update set data=excluded.data;
 assert (select sort_order from public.segeda_categories where id=original[2])=old_position,'Cover edit reset position';
 assert (select data->>'image' from public.segeda_categories where id=original[2])='https://example.com/qa-cover.jpg','Cover not saved';
 new_id:='qa-category-'||gen_random_uuid()::text;
 insert into public.segeda_categories(id,data) values(new_id,jsonb_build_object('id',new_id,'short','Prueba transaccional','name','Prueba'));
 assert (select sort_order from public.segeda_categories where id=new_id)=amount+1,'Category not appended';
 delete from public.segeda_categories where id=new_id;
 assert (select max(sort_order)=count(*) from public.segeda_categories),'Delete left a gap';
 assert products_hash=(select md5(string_agg(data::text||':'||sort_order,'|' order by id)) from public.segeda_products),'Product data or order changed';
end $$;
set constraints all immediate;
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ begin
 begin
  perform * from public.segeda_reorder_categories(array['any'],array['any']);
  raise exception 'Non-admin accepted';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform * from public.segeda_reorder_categories(array['any'],array['any']);
  raise exception 'Anonymous accepted';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: category order, sequential positions, retry, stale conflict, invalid IDs, cover preservation, append, delete, product isolation, access controls. All changes rolled back.' as result;
