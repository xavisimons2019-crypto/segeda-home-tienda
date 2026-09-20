-- Normalize legacy public display positions without changing product data.
-- This one-time snapshot references only imported design IDs, never generated IDs.
-- Runtime ordering and all future categories use the same category-scoped functions.
lock table public.segeda_products in share row exclusive mode;
with legacy as (
  select key as id, value::text::integer as position from jsonb_each('{"9001":2,"9002":3,"9003":4,"9004":5,"9005":6,"9006":7,"9007":8,"9008":9,"9009":10,"1":1,"3":2,"4":3,"5":4,"6":5,"7":6,"9":7,"11":8,"12":9,"13":10,"14":11,"15":12,"16":13,"17":14,"18":15,"19":16,"20":17,"21":18,"22":19,"23":20,"24":21,"25":22,"26":23,"27":24,"28":25,"29":26,"30":27,"31":28,"33":29,"34":30,"35":31,"38":32,"39":33,"40":34,"41":35,"44":36,"45":37,"46":38,"47":39,"48":40,"49":41,"50":42,"51":43,"52":44,"53":45,"54":46,"55":47,"56":48,"57":49,"58":50,"59":51,"60":52,"61":53,"62":54,"63":55,"64":56,"65":57,"66":58,"67":59,"68":60,"69":61,"71":62,"72":63,"73":64,"74":65,"75":66,"76":67,"77":68,"78":69,"79":70,"80":71,"81":72,"82":73,"83":74,"84":75,"86":76,"87":77,"88":78,"89":79,"90":80,"91":81,"92":82,"93":83,"94":84,"95":85,"97":86,"98":87,"99":88,"101":89,"102":90,"103":91,"104":92,"105":93,"106":94,"107":95,"108":96,"109":97,"110":98,"112":99,"113":100,"114":101,"115":102,"116":103,"117":104,"118":105,"119":106,"120":107,"121":108,"122":109,"123":110,"124":111,"125":112,"126":113,"127":114,"128":115,"129":116,"130":117,"131":118,"132":119,"133":120,"134":121,"135":122,"136":123,"137":124,"138":125,"139":126,"140":127,"141":128,"142":129,"143":130,"144":131,"145":132,"146":133,"147":134,"148":135,"149":136,"150":137,"151":138,"152":139,"153":140,"154":141,"155":142,"156":143,"157":144,"158":145,"159":146,"160":147,"161":148,"162":149,"163":150,"164":151,"165":152,"166":153,"167":154,"168":155,"169":156,"170":157,"171":158,"172":159,"173":160,"174":161,"175":162,"176":163,"177":164,"178":165,"179":166,"180":167,"181":168,"182":169,"183":170,"184":171,"185":172,"186":173,"187":174,"188":175,"189":176,"190":177,"191":178,"192":179,"193":180,"194":181,"195":182,"196":183,"197":184,"198":185,"199":186,"200":187,"201":188,"202":189,"203":190,"204":191,"205":192,"206":193,"207":194,"208":195,"209":196,"210":197,"683":198,"684":199,"685":200,"686":201,"687":202,"688":203,"689":204,"690":205,"691":206,"692":207,"693":208,"694":209,"695":210,"696":211,"697":212,"698":213,"212":1,"213":2,"214":3,"215":4,"216":5,"217":6,"218":7,"219":8,"220":9,"221":10,"222":11,"223":12,"224":13,"225":14,"226":15,"227":16,"228":17,"229":18,"230":19,"231":20,"232":21,"233":22,"234":23,"235":24,"236":25,"237":26,"238":27,"239":28,"240":29,"241":30,"242":31,"243":32,"244":1,"245":2,"246":3,"247":4,"248":5,"249":6,"250":7,"251":8,"252":9,"253":10,"254":11,"255":12,"256":13,"257":14,"258":15,"259":16,"260":17,"261":18,"262":19,"263":20,"264":21,"265":22,"266":23,"267":24,"268":25,"269":26,"270":27,"271":28,"272":29,"273":30,"274":31,"275":32,"276":33,"277":34,"278":35,"279":36,"280":37,"281":38,"282":39,"283":40,"284":41,"285":42,"286":43,"287":44,"288":45,"289":46,"290":47,"291":48,"292":49,"293":50,"294":51,"295":52,"296":53,"297":54,"298":55,"299":56,"300":57,"301":58,"302":59,"303":60,"304":61,"305":62,"306":63,"307":64,"308":65,"309":66,"310":67,"311":68,"312":69,"313":70,"314":71,"315":72,"316":73,"317":74,"318":75,"319":76,"320":77,"321":78,"322":79,"323":80,"324":81,"325":82,"326":83,"327":84,"328":85,"329":86,"330":87,"331":88,"332":89,"333":90,"334":91,"335":92,"336":93,"337":94,"338":95,"339":96,"340":97,"341":98,"342":99,"343":100,"344":101,"345":102,"346":103,"347":104,"348":105,"349":106,"350":107,"351":108,"352":109,"353":110,"354":111,"355":112,"356":113,"357":114,"358":115,"359":116,"360":117,"361":118,"362":119,"363":120,"364":121,"365":122,"366":123,"367":124,"368":125,"369":126,"370":127,"371":128,"372":129,"373":130,"374":131,"375":132,"376":133,"377":134,"378":135,"379":136,"380":137,"381":138,"382":139,"383":140,"384":141,"385":142,"386":143,"387":144,"388":145,"389":146,"390":147,"391":148,"392":149,"393":150,"394":151,"395":152,"396":153,"397":154,"398":155,"399":156,"400":157,"401":158,"402":159,"403":160,"404":161,"405":162,"406":163,"407":164,"408":165,"409":166,"410":167,"411":168,"412":169,"413":170,"414":1,"415":2,"416":3,"417":4,"418":5,"419":6,"420":7,"421":8,"422":9,"423":10,"424":11,"425":12,"426":13,"427":14,"428":15,"429":16,"430":17,"431":18,"432":19,"433":20,"434":21,"435":22,"436":23,"437":24,"438":25,"439":26,"440":27,"441":28,"442":29,"443":30,"444":31,"445":32,"446":33,"447":34,"448":35,"449":36,"450":37,"451":38,"452":39,"453":40,"454":41,"455":42,"456":43,"457":44,"458":45,"459":46,"460":47,"461":48,"462":49,"463":50,"464":51,"465":52,"466":53,"467":54,"468":55,"469":56,"470":57,"471":58,"472":59,"473":60,"474":61,"475":62,"476":63,"477":64,"478":65,"479":66,"480":67,"481":68,"482":69,"483":70,"484":71,"485":72,"486":73,"487":74,"488":75,"489":76,"490":77,"491":78,"492":79,"493":80,"494":81,"495":82,"678":1,"507":2,"498":3,"499":4,"500":5,"501":6,"502":7,"503":8,"505":9,"506":10,"508":11,"509":12,"510":13,"511":14,"512":15,"514":16,"515":17,"516":18,"517":19,"518":20,"519":21,"520":22,"521":23,"523":24,"525":1,"524":2,"528":3,"531":4,"529":5,"530":6,"532":7,"533":8,"534":9,"535":10,"536":11,"537":12,"538":13,"539":14,"540":15,"541":16,"542":17,"543":18,"544":19,"545":20,"546":21,"547":22,"548":23,"549":24,"550":25,"551":26,"553":1,"554":2,"555":3,"556":4,"557":5,"558":6,"559":7,"560":8,"561":9,"562":10,"564":1,"565":2,"566":3,"567":4,"568":5,"569":6,"570":7,"571":8,"572":9,"573":10,"574":11,"575":12,"576":13,"577":14,"578":15,"579":16,"580":17,"581":18,"582":19,"583":20,"584":21,"585":22,"586":23,"587":24,"677":25,"588":26,"589":27,"590":28,"591":29,"592":1,"593":2,"598":3,"596":4,"597":5,"594":6,"600":7,"599":8,"601":9,"602":10,"603":11,"595":12,"604":13,"605":14,"606":15,"607":16,"608":17,"609":18,"610":19,"611":20,"612":21,"613":22,"614":23,"615":24,"616":25,"617":26,"618":27,"619":28,"620":29,"621":30,"622":31,"623":32,"624":33,"625":34,"626":35,"627":36,"628":37,"629":38,"630":39,"631":40,"632":41,"633":42,"634":43,"635":44,"636":45,"637":46,"638":47,"639":48,"640":49,"641":50,"642":51,"643":52,"644":53,"645":54,"646":55,"647":56,"648":57,"649":58,"650":59,"651":60,"652":61,"653":62,"654":63,"655":64,"656":65,"657":1,"658":2,"659":3,"660":4,"661":5,"662":6,"663":7,"664":8,"665":9,"666":10,"667":11,"668":12,"669":13,"670":14,"676":1,"672":2,"673":3,"674":4,"675":5,"679":1,"680":1,"681":2,"682":3}'::jsonb)
), previous as (
  select p.id,p.category,row_number() over(partition by p.category order by p.sort_order,p.id) as position
  from public.segeda_products p
), ranked as (
  select p.id,row_number() over(partition by p.category order by coalesce(l.position,p.position),p.position,p.id)::integer as position
  from previous p left join legacy l on l.id=p.id
)
update public.segeda_products p set sort_order=r.position from ranked r where p.id=r.id;

alter table public.segeda_products
  add constraint segeda_products_positive_position check (sort_order > 0),
  add constraint segeda_products_category_position_key unique (category, sort_order) deferrable initially deferred;

-- Serialize brief catalog writes before any row locks (including legacy upserts/deletes).
-- Positions are independent per category; the lock prevents insert/reorder races.
create function public.segeda_products_lock_write() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('segeda_products_order', 0));
  return null;
end;
$$;
create trigger segeda_products_write_lock before insert or update or delete
on public.segeda_products for each statement execute function public.segeda_products_lock_write();

create function public.segeda_products_assign_position() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare previous_category text; previous_position integer;
begin
  if tg_op = 'INSERT' then
    select p.category, p.sort_order into previous_category, previous_position
    from public.segeda_products p where p.id = new.id;
    if found then
      -- ON CONFLICT updates must not send an edited product to the end.
      if previous_category = new.category then new.sort_order := previous_position;
      else select coalesce(max(p.sort_order),0)+1 into new.sort_order from public.segeda_products p where p.category = new.category;
      end if;
    elsif new.sort_order is null or new.sort_order <= 0 then
      select coalesce(max(p.sort_order),0)+1 into new.sort_order from public.segeda_products p where p.category = new.category;
    end if;
  elsif new.category is distinct from old.category then
    select coalesce(max(p.sort_order),0)+1 into new.sort_order from public.segeda_products p where p.category = new.category;
  end if;
  return new;
end;
$$;
create trigger segeda_products_assign_position before insert or update
on public.segeda_products for each row execute function public.segeda_products_assign_position();

create function public.segeda_products_close_position_gap() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.category is not distinct from old.category then return null; end if;
  with ranked as (
    select p.id, row_number() over(order by p.sort_order,p.id)::integer as position
    from public.segeda_products p where p.category = old.category
  )
  update public.segeda_products p set sort_order = r.position
  from ranked r where p.id = r.id and p.sort_order is distinct from r.position;
  return null;
end;
$$;
create trigger segeda_products_close_position_gap after delete or update of category
on public.segeda_products for each row execute function public.segeda_products_close_position_gap();

create function public.segeda_reorder_products(p_category text, p_ids text[], p_expected_ids text[])
returns table(id text, sort_order integer)
language plpgsql security invoker set search_path = '' as $$
declare current_ids text[]; changed_count integer;
begin
  if auth.uid() is null or not exists(select 1 from public.segeda_admins a where a.user_id = auth.uid()) then
    raise exception 'Acceso de administrador requerido.' using errcode = '42501';
  end if;
  if p_category is null or p_ids is null or p_expected_ids is null then
    raise exception 'Categoría y lista completa requeridas.' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('segeda_products_order', 0));
  select coalesce(array_agg(p.id order by p.sort_order,p.id), array[]::text[]) into current_ids
  from public.segeda_products p where p.category = p_category;
  if cardinality(p_ids) = 0 or cardinality(p_ids) <> cardinality(current_ids)
     or cardinality(p_ids) <> (select count(distinct item) from unnest(p_ids) item)
     or not (p_ids @> current_ids and p_ids <@ current_ids) then
    raise exception 'La lista debe contener exactamente los productos de esta categoría.' using errcode = '22023';
  end if;
  -- Safe retry when the first request committed but its response was lost.
  if p_ids is distinct from current_ids then
    if p_expected_ids is distinct from current_ids then
      raise exception 'La colección cambió en otra sesión. Actualiza la lista.' using errcode = '40001';
    end if;
    update public.segeda_products p
      set sort_order = desired.position::integer, updated_at = now()
      from unnest(p_ids) with ordinality as desired(product_id, position)
      where p.id = desired.product_id and p.category = p_category;
    get diagnostics changed_count = row_count;
    if changed_count <> cardinality(p_ids) then
      raise exception 'No se pudo guardar la lista completa.' using errcode = '42501';
    end if;
  end if;
  return query select p.id,p.sort_order from public.segeda_products p
    where p.category = p_category order by p.sort_order,p.id;
end;
$$;
revoke all on function public.segeda_reorder_products(text,text[],text[]) from public,anon;
grant execute on function public.segeda_reorder_products(text,text[],text[]) to authenticated;
revoke all on function public.segeda_products_lock_write(),public.segeda_products_assign_position(),public.segeda_products_close_position_gap() from public,anon;
grant execute on function public.segeda_products_lock_write(),public.segeda_products_assign_position(),public.segeda_products_close_position_gap() to authenticated,service_role;

-- Public catalog data already has SELECT policies. Publish committed changes for open storefronts.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='segeda_products') then
    alter publication supabase_realtime add table public.segeda_products;
  end if;
end;
$$;
