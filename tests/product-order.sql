begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.segeda_admins limit 1),true);
set local role authenticated;
do $$
declare c record; original text[]; moved text[]; actual text[]; other_hash text; original_data_hash text; cat text; new_id text; total integer; position integer; first_id text; second_cat text;
begin
  select md5(string_agg(data::text,'|' order by id)) into original_data_hash from public.segeda_products;
  for c in select category,count(*) as amount from public.segeda_products group by category having count(*)>1 loop
    select array_agg(id order by sort_order,id) into original from public.segeda_products where category=c.category;
    select md5(string_agg(id||':'||sort_order,'|' order by id)) into other_hash from public.segeda_products where category<>c.category;
    moved := array[original[cardinality(original)]] || original[1:cardinality(original)-1];
    perform * from public.segeda_reorder_products(c.category,moved,original);
    select array_agg(id order by sort_order,id) into actual from public.segeda_products where category=c.category;
    assert actual=moved,'Reorder failed';
    assert other_hash=(select md5(string_agg(id||':'||sort_order,'|' order by id)) from public.segeda_products where category<>c.category),'Other category changed';
    assert (select min(sort_order)=1 and max(sort_order)=count(*) and count(distinct sort_order)=count(*) from public.segeda_products where category=c.category),'Invalid positions';
    perform * from public.segeda_reorder_products(c.category,moved,original); -- response-loss retry
    begin
      perform * from public.segeda_reorder_products(c.category,original,original);
      raise exception 'Stale order was accepted';
    exception when serialization_failure then null; end;
    begin
      perform * from public.segeda_reorder_products(c.category,array[original[1],original[1]],moved);
      raise exception 'Duplicate IDs were accepted';
    exception when invalid_parameter_value then null; end;
    begin
      perform * from public.segeda_reorder_products(c.category,array_append(moved,'missing-product'),moved);
      raise exception 'Foreign/missing ID was accepted';
    exception when invalid_parameter_value then null; end;
    perform * from public.segeda_reorder_products(c.category,original,moved);
  end loop;
  assert original_data_hash=(select md5(string_agg(data::text,'|' order by id)) from public.segeda_products),'Product data changed';
  select category into cat from public.segeda_products group by category order by count(*) limit 1;
  select category into second_cat from public.segeda_products where category<>cat limit 1;
  select count(*),min(id) into total,first_id from public.segeda_products where category=cat;
  new_id:='order-test-'||gen_random_uuid()::text;
  insert into public.segeda_products(id,category,data) values(new_id,cat,jsonb_build_object('id',new_id,'category',cat,'title','Prueba transaccional','price',1));
  assert (select sort_order from public.segeda_products where id=new_id)=total+1,'New product was not appended';
  select sort_order into position from public.segeda_products where id=first_id;
  insert into public.segeda_products(id,category,data)
    select id,category,data from public.segeda_products where id=first_id
    on conflict(id) do update set data=excluded.data,category=excluded.category;
  assert (select sort_order from public.segeda_products where id=first_id)=position,'Edit reset position';
  update public.segeda_products set category=second_cat,data=jsonb_set(data,'{category}',to_jsonb(second_cat)) where id=new_id;
  assert (select sort_order from public.segeda_products where id=new_id)=(select count(*) from public.segeda_products where category=second_cat),'Category move was not appended';
  delete from public.segeda_products where id=new_id;
  assert (select max(sort_order)=count(*) from public.segeda_products where category=second_cat),'Delete left a gap';
  assert (select max(sort_order)=count(*) from public.segeda_products where category=cat),'Move left a gap';
end;
$$;
set constraints all immediate;
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ begin
  begin
    perform * from public.segeda_reorder_products('any',array['1'],array['1']);
    raise exception 'Non-admin accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.segeda_reorder_products('any',array['1'],array['1']);
    raise exception 'Anonymous accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: reorder + persistence within transaction, isolation, idempotent retry, stale detection, invalid IDs, append, upsert, category move, delete compaction, non-admin and anonymous rejection; all test writes rolled back.' as result;
