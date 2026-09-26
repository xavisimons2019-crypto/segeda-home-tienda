-- Run in an administrative SQL session. Every fixture and mutation is rolled back.
-- Deliberately fails if authorization, cent allocation or overpayment checks regress.
begin;
do $$
declare
 admin_id uuid; oid uuid:=gen_random_uuid(); bid uuid:=gen_random_uuid(); request uuid:=gen_random_uuid();
 first_id uuid:=gen_random_uuid(); refund_id uuid:=gen_random_uuid(); expense_id uuid:=gen_random_uuid();
 n numeric; snapshot jsonb; result uuid; today date:=(now() at time zone 'America/Lima')::date;
begin
 select user_id into admin_id from public.segeda_admins limit 1;
 if admin_id is null then raise exception 'An existing administrator is required for this rolled-back test.';end if;
 insert into public.segeda_orders(id,request_id,request_hash,customer_name,customer_phone,payload,total,status)
 values(oid,request,'finance-rollback-test','PRUEBA TRANSACCIONAL','000000000',jsonb_build_object('items',jsonb_build_array(
 jsonb_build_object('product',jsonb_build_object('category','cuadros','title','Prueba A'),'quantity',1,'unitPrice',60),
 jsonb_build_object('product',jsonb_build_object('category','nubes','title','Prueba B'),'quantity',1,'unitPrice',40))),100,'nuevo');
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 execute 'set local role authenticated';
 result:=public.segeda_finance_record(first_id,'income',70,today,'Cobro de prueba','general','yape','',oid,'test',null,'');
 if result<>first_id then raise exception 'Unexpected id';end if;
 result:=public.segeda_finance_record(first_id,'income',70,today,'Cobro de prueba','general','yape','',oid,'test',null,'');
 select count(*) into n from public.segeda_finance_transactions where id=first_id;
 if n<>1 then raise exception 'Duplicate journal row';end if;
 select sum(amount) into n from public.segeda_finance_allocations where transaction_id=first_id;
 if n<>70 then raise exception 'Allocation does not balance';end if;
 select amount into n from public.segeda_finance_allocations where transaction_id=first_id and section_id='cuadros';
 if n<>42 then raise exception 'Wrong section allocation';end if;
 begin
  perform public.segeda_finance_record(first_id,'income',71,today,'Cobro de prueba','general','yape','',oid,'test',null,'');
  raise sqlstate 'XX000' using message='Idempotency hash accepted different data';
 exception when sqlstate 'P0001' then if sqlerrm not like '%otros datos%' then raise;end if;end;
 begin
  perform public.segeda_finance_record(gen_random_uuid(),'income',31,today,'Overpayment test','general','yape','',oid,'',null,'');
  raise sqlstate 'XX000' using message='Overpayment was accepted';
 exception when sqlstate 'P0001' then if sqlerrm not like '%saldo pendiente%' then raise;end if;end;
 perform public.segeda_finance_record(refund_id,'refund',20,today,'Reembolso de prueba','general','yape','',oid,'',null,'');
 select sum(case kind when 'income' then amount when 'refund' then -amount else 0 end) into n from public.segeda_finance_transactions where order_id=oid and voided_at is null;
 if n<>50 then raise exception 'Refund balance incorrect';end if;
 begin
  perform public.segeda_finance_void(first_id,'Error de registro');
  raise sqlstate 'XX000' using message='Invalid void with outstanding refund accepted';
 exception when sqlstate 'P0001' then if sqlerrm not like '%saldo incorrecto%' then raise;end if;end;
 begin
  perform public.segeda_finance_record(gen_random_uuid(),'refund',51,today,'Too large refund','general','yape','',oid,'',null,'');
  raise sqlstate 'XX000' using message='Excess refund accepted';
 exception when sqlstate 'P0001' then if sqlerrm not like '%supera lo cobrado%' then raise;end if;end;
 perform public.segeda_finance_record(gen_random_uuid(),'income',0.01,today,'Small payment','general','yape','',oid,'',null,'');
 perform public.segeda_finance_record(gen_random_uuid(),'income',49.99,today,'Final payment','general','yape','',oid,'',null,'');
 select sum(case t.kind when 'income' then a.amount when 'refund' then -a.amount else 0 end) into n from public.segeda_finance_allocations a join public.segeda_finance_transactions t on t.id=a.transaction_id where t.order_id=oid and a.section_id='cuadros' and t.voided_at is null;
 if n<>60 then raise exception 'Final cents by section do not match order';end if;
 insert into public.segeda_finance_bills(id,vendor,description,section_id,amount,due_on,expense_type,expense_behavior)
 values(bid,'Proveedor de prueba','Prueba de saldo','cuadros',40,today,'materiales','variable');
 perform public.segeda_finance_record(expense_id,'expense',25,today,'Pago parcial','cuadros','efectivo','materiales',null,'',bid,'variable');
 begin
  perform public.segeda_finance_record(gen_random_uuid(),'expense',16,today,'Excess bill payment','cuadros','efectivo','materiales',null,'',bid,'variable');
  raise sqlstate 'XX000' using message='Bill overpayment accepted';
 exception when sqlstate 'P0001' then if sqlerrm not like '%supera el saldo%' then raise;end if;end;
 begin
  perform public.segeda_finance_cancel_bill(bid,'Cuenta incorrecta');
  raise sqlstate 'XX000' using message='Paid bill cancelled';
 exception when sqlstate 'P0001' then if sqlerrm not like '%ya tiene pagos%' then raise;end if;end;
 perform public.segeda_finance_void(expense_id,'Error de medio de pago');
 perform public.segeda_finance_cancel_bill(bid,'Cuenta de prueba anulada');
 begin
  perform public.segeda_finance_record(gen_random_uuid(),'expense',1,today,'Cancelled bill payment','cuadros','efectivo','materiales',null,'',bid,'variable');
  raise sqlstate 'XX000' using message='Cancelled bill paid';
 exception when sqlstate 'P0001' then if sqlerrm not like '%no está disponible%' then raise;end if;end;
 perform public.segeda_finance_order_update(oid,'completado',today,today);
 select count(*) into n from public.segeda_finance_order_terms where order_id=oid and completed_on=today;
 if n<>1 then raise exception 'Order completion not recorded';end if;
 begin
  perform public.segeda_finance_order_update(oid,'cancelado',today,null);
  raise sqlstate 'XX000' using message='Recognition history silently erased';
 exception when sqlstate 'P0001' then if sqlerrm not like '%Conserva la fecha%' then raise;end if;end;
 begin
  update public.segeda_finance_transactions set amount=1 where id=first_id;
  raise sqlstate 'XX000' using message='Direct journal edit allowed';
 exception when insufficient_privilege then null;end;
 snapshot:=public.segeda_finance_export();
 if jsonb_typeof(snapshot->'orders')<>'array' or jsonb_typeof(snapshot->'finance'->'segeda_finance_allocations')<>'array' then raise exception 'Backup missing related records';end if;
 if not exists(select 1 from jsonb_array_elements(snapshot->'finance'->'segeda_finance_transactions') t where t->>'id'=first_id::text) then raise exception 'Journal missing from snapshot';end if;
 -- An authenticated customer sees no financial information and cannot call writes.
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 select count(*) into n from public.segeda_finance_transactions;
 if n<>0 then raise exception 'Non-admin can read journal';end if;
 select count(*) into n from public.segeda_finance_bills;
 if n<>0 then raise exception 'Non-admin can read payables';end if;
 begin
  perform public.segeda_finance_record(gen_random_uuid(),'income',1,today,'Unauthorized','general','yape','',null,'',null,'');
  raise sqlstate 'XX000' using message='Non-admin can record money';
 exception when sqlstate 'P0001' then if sqlerrm not like '%reservado al administrador%' then raise;end if;end;
 begin
  insert into public.segeda_finance_budgets(month,section_id,income_target,expense_limit) values(date_trunc('month',today)::date,'general',1,1);
  raise sqlstate 'XX000' using message='Non-admin can write budgets';
 exception when insufficient_privilege then null;end;
 begin
  perform public.segeda_finance_export();
  raise sqlstate 'XX000' using message='Non-admin can export private data';
 exception when sqlstate 'P0001' then if sqlerrm not like '%reservado al administrador%' then raise;end if;end;
 execute 'set local role anon';
 begin
  select count(*) into n from public.segeda_finance_transactions;
  raise sqlstate 'XX000' using message='Anonymous can read journal';
 exception when insufficient_privilege then null;end;
 begin
  perform public.segeda_finance_void(first_id,'Anonymous void');
  raise sqlstate 'XX000' using message='Anonymous can execute finance RPC';
 exception when insufficient_privilege then null;end;
 execute 'reset role';
end $$;
rollback;
select 'PASS: balances, rounding, idempotency, overpayments, refunds, audit, fulfillment, RLS and grants; fixtures rolled back' as result;
