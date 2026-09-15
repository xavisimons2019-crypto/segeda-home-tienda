// Run only on a private machine. Never put the service key in frontend configuration.
// Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEGEDA_ADMIN_EMAIL, SEGEDA_ADMIN_PASSWORD.
// Optional: SEGEDA_BACKUP_JSON (panel export), SEGEDA_IMAGES_DIR (exported imagenes directory).
// Apply supabase/migrations/*.sql to the NEW project first. Do not run against a populated project.
import {createClient} from '@supabase/supabase-js';
import {readFile,readdir} from 'node:fs/promises';
import {join,extname,relative} from 'node:path';

const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,email=process.env.SEGEDA_ADMIN_EMAIL,password=process.env.SEGEDA_ADMIN_PASSWORD;
if(!url||!key||!email||!password||password.length<12)throw new Error('Configure las cuatro variables privadas. La contraseña debe tener al menos 12 caracteres.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {count,error:check}=await db.from('segeda_products').select('id',{count:'exact',head:true});
if(check)throw check;if(count)throw new Error('El proyecto contiene productos. Use un proyecto vacío para evitar sobrescrituras.');
const data=JSON.parse(await readFile(process.env.SEGEDA_BACKUP_JSON||'data/catalog-supabase-backup.json','utf8'));
const images=process.env.SEGEDA_IMAGES_DIR||'public';
const {error:bucketError}=await db.storage.createBucket('segeda-media',{public:true,fileSizeLimit:8000000});
if(bucketError&&!bucketError.message.toLowerCase().includes('already'))throw bucketError;
const prefix=`${url}/storage/v1/object/public/segeda-media/`;
function rewrite(value){if(Array.isArray(value))return value.map(rewrite);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)]));return typeof value==='string'?value.replace(/^https:\/\/[^/]+\/storage\/v1\/object\/public\/segeda-media\//,prefix):value;}
for(const [table,records] of [['segeda_categories',data.categories],['segeda_products',data.products]]){
 for(let i=0;i<records.length;i+=80){const rows=records.slice(i,i+80).map((row,j)=>({id:String(row.id),data:rewrite(row),sort_order:i+j,...(table==='segeda_products'?{category:row.category}:{})}));const {error}=await db.from(table).insert(rows);if(error)throw error;}
 console.log(`${table}: ${records.length}`);
}
const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.avif':'image/avif','.gif':'image/gif'};
async function upload(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=join(folder,entry.name);if(entry.isDirectory())await upload(path);else if(mime[extname(path).toLowerCase()]){const {error}=await db.storage.from('segeda-media').upload(relative(images,path).replaceAll('\\','/'),await readFile(path),{contentType:mime[extname(path).toLowerCase()],upsert:false});if(error)throw error;}}}
await upload(images);
if(data.orders?.length){for(let i=0;i<data.orders.length;i+=50){const {error}=await db.from('segeda_orders').insert(rewrite(data.orders.slice(i,i+50)));if(error)throw error;}}
const {data:created,error}=await db.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;
const {error:membership}=await db.from('segeda_admins').insert({user_id:created.user.id});if(membership)throw membership;
await db.storage.createBucket('segeda-backups',{public:false,fileSizeLimit:52428800});
console.log('Restauración terminada. Configure las claves públicas y despliegue la función de pedidos.');
