import React from 'react';
import {createRoot} from 'react-dom/client';
import Catalog from '@/app/catalog-client';
import Nubes from '@/app/nubes/nubes-client';
import Navidad from '@/app/navidad/navidad-client';
import Admin from '@/app/admin/admin-client';
import StoreMotion from '@/app/store-motion';
import '@/app/globals.css';
import '@/app/premium.css';

const route=window.location.pathname.replace(/\/$/,'')||'/';
const Page=route==='/admin'?Admin:route==='/nubes'?Nubes:route==='/navidad'?Navidad:Catalog;
createRoot(document.getElementById('root')!).render(<React.StrictMode><StoreMotion/><Page/></React.StrictMode>);
