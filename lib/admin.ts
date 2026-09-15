import {createClient} from '@supabase/supabase-js';
import config from '@/data/supabase-public.json';
export async function adminClient(request:Request){
 const authorization=request.headers.get('Authorization')||'';
 if(!authorization.startsWith('Bearer '))return null;
 const client=createClient(config.url,config.publishableKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await client.auth.getUser(authorization.slice(7));if(error||!user)return null;
 const {data}=await client.from('segeda_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 return data?client:null;
}
