import {adminClient} from '@/lib/admin';
import config from '@/data/supabase-public.json';
export async function POST(request:Request){
 const db=await adminClient(request);if(!db)return Response.json({error:'Acceso no autorizado'},{status:401});
 const file=(await request.formData()).get('file');
 if(!(file instanceof File)||!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>8000000)return Response.json({error:'Usa una imagen de hasta 8 MB.'},{status:400});
 const key=`products/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
 const {error}=await db.storage.from(config.bucket).upload(key,file,{contentType:file.type});
 if(error)return Response.json({error:'No se pudo guardar la imagen.'},{status:503});
 return Response.json({url:db.storage.from(config.bucket).getPublicUrl(key).data.publicUrl});
}
