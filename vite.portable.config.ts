import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';

export default defineConfig({
  plugins:[react()],
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  build:{rollupOptions:{input:{main:'index.html',orderLab:'order-lab.html'}},outDir:'dist-portable',emptyOutDir:true},
});
