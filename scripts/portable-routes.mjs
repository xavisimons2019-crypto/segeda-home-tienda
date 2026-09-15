import {mkdir,readFile,writeFile} from 'node:fs/promises';
const html=await readFile('dist-portable/index.html','utf8');
for(const route of ['catalogo','nubes','navidad','admin']){
  await mkdir(`dist-portable/${route}`,{recursive:true});
  await writeFile(`dist-portable/${route}/index.html`,html);
}
