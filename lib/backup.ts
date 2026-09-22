import {makeZip} from '@/lib/zip';
import {getCatalog,supabase,supabaseConfig} from '@/lib/supabase';
import manifest from '@/data/media-manifest.json';

export function downloadBlob(blob:Blob,name:string){
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

export async function exportData(){
  const catalog=await getCatalog();
  const {data,error}=await supabase.rpc('segeda_finance_export');
  if(error||!data)throw new Error('No se pudieron exportar los pedidos y las finanzas. Revisa tu sesión.');
  return {format:'segeda-backup-v2',exportedAt:new Date().toISOString(),...catalog,orders:data.orders,finance:data.finance};
}

/** Private snapshot from the initial migration. Current source is kept in GitHub. */
export async function downloadSource(){
 const {data,error}=await supabase.storage.from('segeda-backups').download('segeda-proyecto.zip');
 if(error||!data)throw new Error('No se pudo descargar la copia inicial. Puedes obtener el código actualizado desde GitHub.');
 downloadBlob(data,'Segeda-proyecto-inicial.zip');
}


export async function downloadFullBackup(progress:(message:string)=>void){
  progress('Preparando catálogo, pedidos y finanzas…');
  const data=await exportData();
  const files=[{name:'datos-segeda.json',bytes:new TextEncoder().encode(JSON.stringify(data,null,2))}];
  const paths=new Set(manifest.map(file=>file.path));
  // Include images uploaded after the original migration too.
  async function walk(prefix:string){
    for(let offset=0;;offset+=100){
      const {data:objects,error}=await supabase.storage.from(supabaseConfig.bucket).list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
      if(error)throw new Error('No se pudieron listar las imágenes.');
      for(const object of objects){const path=prefix?`${prefix}/${object.name}`:object.name;if(object.id)paths.add(path);else await walk(path);}
      if(objects.length<100)break;
    }
  }
  await walk('');
  let completed=0;const pending=[...paths];
  await Promise.all(Array.from({length:4},async()=>{
    while(pending.length){const path=pending.shift()!;
      const {data:blob,error}=await supabase.storage.from(supabaseConfig.bucket).download(path);
      if(error||!blob)throw new Error(`No se pudo descargar ${path}. Vuelve a intentar el respaldo.`);
      files.push({name:`imagenes/${path}`,bytes:new Uint8Array(await blob.arrayBuffer())});progress(`Imágenes ${++completed} de ${paths.size}…`);
    }
  }));
  progress('Preparando el archivo ZIP…');
  downloadBlob(makeZip(files),`Segeda-datos-e-imagenes-${new Date().toISOString().slice(0,10)}.zip`);
}
