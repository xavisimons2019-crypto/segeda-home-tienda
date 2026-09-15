# Segeda Home Tienda

> **Carga del código pendiente.** La transferencia se interrumpió porque el entorno de trabajo se desconectó. Por ahora, la rama `main` contiene esta guía; todavía no constituye una copia ejecutable del proyecto. La copia completa se conserva en el respaldo privado de Supabase y en los ZIP de la entrega.

Tienda con catálogo, categorías, personalización, carrito, pedidos por WhatsApp y panel de administración.

## Estado de la migración — 15 de septiembre de 2026

- Supabase: proyecto `segeda-home-tienda`, referencia `hzvvawjohdplenohpcnd`, organización `xavisimons2019-crypto’s Org`.
- Administrador creado: `jimeneznath1501@gmail.com`. La contraseña se entrega por separado; no está en este proyecto.
- Copiados: 683 productos, 15 categorías y 751 imágenes/recursos gráficos. Al comenzar la migración no había pedidos ni cambios administrativos en la base anterior.
- El acceso administrativo utiliza Supabase Auth y permisos asociados al identificador del administrador. Los datos privados están protegidos con RLS.
- El código puede generar una web estática independiente con `build:portable`. Esa versión usa Supabase directamente y no requiere ChatGPT, D1 ni R2.
- GitHub: repositorio privado [xavisimons2019-crypto/segeda-home-tienda](https://github.com/xavisimons2019-crypto/segeda-home-tienda). La incorporación del código y los recursos está pendiente de completar la transferencia.
- Alojamiento externo: pendiente de conectar una cuenta del propietario y publicar. La dirección actual de ChatGPT Sites sigue dependiendo de esta cuenta hasta ese último paso.

## Publicar sin ChatGPT

El archivo `Segeda-web-lista-para-publicar.zip` de la entrega contiene la web ya compilada. Sus archivos deben quedar en la raíz del alojamiento. Incluye páginas para `/catalogo`, `/nubes`, `/navidad` y `/admin`.

Una opción compatible es Cloudflare Pages. En el panel de Cloudflare abre **Workers & Pages**, crea una aplicación Pages y utiliza la carga directa del sitio compilado. Se puede publicar con una dirección `pages.dev` antes de comprar un dominio. La conexión con GitHub es otra modalidad; conviene elegirla al crear el proyecto si se desea publicar automáticamente al actualizar el código. Los proyectos de carga directa y los de integración Git tienen limitaciones distintas para cambiar de modalidad.

Documentación: [Carga directa](https://developers.cloudflare.com/pages/get-started/direct-upload/) y [despliegue de Vite](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/).

Si se conecta un repositorio a un alojamiento compatible:

- Node.js 22.13 o superior.
- Instalar con `pnpm install --frozen-lockfile`.
- Compilar con `pnpm run build:portable`.
- Publicar la carpeta `dist-portable`.
- Las claves públicas del proyecto están en `data/supabase-public.json`; están diseñadas para usarse en el navegador. No se incluye ninguna clave de servicio.

Después del despliegue, abre `/admin` en la nueva dirección, inicia sesión y prueba las imágenes, un pedido de prueba y una descarga. Solo después cambia el dominio y deja de depender de la dirección de ChatGPT.

## Administración y respaldos

El panel permite editar productos, medidas, precios, imágenes y categorías, consultar pedidos, cambiar su estado y actualizar la contraseña.

En **Respaldo y acceso**:

- **Descargar proyecto**: código y guía guardados de forma privada en Supabase Storage (`segeda-backups/segeda-proyecto.zip`). Es una instantánea del código de esta migración; debe actualizarse cuando cambie el código.
- **Descargar respaldo completo**: datos y pedidos actuales con las imágenes en un ZIP. La descarga contiene datos de clientes y debe guardarse de forma privada.
- **Solo datos**: JSON con catálogo, categorías y pedidos actuales.

La cuenta de Supabase, la de GitHub, el alojamiento y el registrador del dominio deben quedar bajo control del propietario. Conservar este ZIP permite recuperar el código, pero no sustituye una copia periódica de pedidos nuevos.

Cuando termine la carga, GitHub conservará el código; los cambios de productos, imágenes y pedidos realizados desde el panel se guardan en Supabase y no se copian automáticamente a GitHub. Por ahora, descarga el proyecto desde **Respaldo y acceso → Descargar proyecto** en el [panel publicado](https://segeda-home-tienda-recreada.lollix36.chatgpt.site/admin). **Code → Download ZIP** de este repositorio aún no incluye la aplicación.

## Recuperar en otro proyecto de Supabase

1. Crear un proyecto propio y aplicar, en orden, los SQL de `supabase/migrations`.
2. Ejecutar `scripts/restore-supabase.mjs` desde un equipo privado con las variables indicadas dentro del script. La clave de servicio solo se usa en ese equipo.
3. Desplegar `supabase/functions/segeda-checkout` con sus archivos compartidos. Mantener la verificación JWT activada.
4. Sustituir URL y claves públicas en `data/supabase-public.json`; reconstruir la web.
5. Subir una copia actual del código en ZIP al bucket privado `segeda-backups`, con el nombre `segeda-proyecto.zip`, para habilitar **Descargar proyecto** en el panel restaurado.
6. Verificar acceso y permisos antes de atender pedidos. La cuenta administrativa se vuelve a crear: los respaldos no contienen sesiones ni contraseñas.

El JSON `data/catalog-supabase-backup.json` y `public/` conservan el catálogo y los archivos de esta migración. Para pedidos posteriores usa el respaldo descargado desde el panel.

## Comprobaciones y límites

Se comprobó la compilación de la versión independiente y la versión de Sites, los cálculos de precios, la promoción de Navidad, el rechazo de cantidades inválidas y el formato ZIP del respaldo. Las comprobaciones de Supabase revisan lectura pública del catálogo, bloqueo de datos privados y permisos del administrador.

La colección Hogar no tenía productos ni una imagen recuperable; se conserva sin inventar contenido. La recuperación inicial también dejó una imagen secundaria no disponible en el producto 667. No se certificó acceso ni equivalencia exacta con el administrador original perdido.

Las compras se coordinan por WhatsApp; no se cobran tarjetas desde esta aplicación. El formulario guarda el pedido antes de abrir WhatsApp. La sección de nubes conserva su consulta directa por WhatsApp; esa consulta no se registra como pedido del carrito.

El plan gratuito de Supabase tiene límites de almacenamiento, transferencia y disponibilidad; revisarlos en su panel. El asesor de Supabase informa que la comprobación de contraseñas filtradas está desactivada: [configuración de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Las contraseñas iniciales se generan aleatoriamente y el panel permite cambiarlas.

## Desarrollo

```sh
pnpm install --frozen-lockfile
pnpm run dev:portable
pnpm run build:portable
node --experimental-strip-types --test tests/pricing.test.mjs
```

`pnpm run build` conserva el despliegue anterior de Sites mientras se completa el traslado. La carpeta `.openai` solo corresponde a ese alojamiento anterior y no interviene en `build:portable`.
