# Segeda Home Tienda

Tienda con catálogo, categorías, personalización, carrito, pedidos por WhatsApp y panel de administración.

## Estado del proyecto — 26 de septiembre de 2026

- Supabase: proyecto `segeda-home-tienda`, referencia `hzvvawjohdplenohpcnd`, organización `xavisimons2019-crypto’s Org`.
- Administrador creado: `jimeneznath1501@gmail.com`. La contraseña se entrega por separado; no está en este proyecto.
- Migración inicial: 683 productos, 15 categorías y 751 imágenes/recursos gráficos. El catálogo actual puede haber crecido desde entonces. Al comenzar la migración no había pedidos ni cambios administrativos en la base anterior.
- El acceso administrativo utiliza Supabase Auth y permisos asociados al identificador del administrador. Los datos privados están protegidos con RLS.
- El código puede generar una web estática independiente con `build:portable`. Esa versión usa Supabase directamente y no requiere ChatGPT, D1 ni R2.
- GitHub: repositorio privado [xavisimons2019-crypto/segeda-home-tienda](https://github.com/xavisimons2019-crypto/segeda-home-tienda). Contiene el código y los recursos de esta migración.
- La recuperación inicial de los recursos está incorporada al repositorio. **Restore verified media** conserva la herramienta de comprobación de esa copia original.
- La tienda está publicada en Cloudflare Pages, conectada a `main`, con dominio `https://segedahome.com`. El catálogo, acceso y pedidos utilizan el Supabase del propietario. Esta publicación no necesita una sesión ni una cuenta de ChatGPT.

## Publicar sin ChatGPT

La publicación actual se actualiza desde GitHub. Para migrar de alojamiento, descarga el código actual y compílalo; no uses un ZIP antiguo como si contuviera las últimas funciones.

Si se conecta un repositorio a un alojamiento compatible:

- Node.js 22.13 o superior.
- Instalar con `pnpm install --frozen-lockfile`.
- Compilar con `pnpm run build:portable`.
- Publicar la carpeta `dist-portable`.
- Las claves públicas del proyecto están en `data/supabase-public.json`; están diseñadas para usarse en el navegador. No se incluye ninguna clave de servicio.

En cualquier nuevo alojamiento, abre `/admin`, verifica tu acceso y comprueba catálogo, pedidos y respaldos antes de dirigir el dominio a ese destino.

## Administración y respaldos

El panel organiza primero las categorías, permite arrastrar categorías y productos, cambiar portadas, editar medidas y materiales y gestionar pedidos. **Pedidos** incluye ingresos, gastos, cuentas por pagar, presupuestos, costos y utilidad estimada por sección.

Guías: [Catálogo y pedidos](docs/CATALOGO-Y-PEDIDOS.md), [Pedidos y finanzas](docs/FINANZAS.md) y [Verificación de la versión financiera](docs/VERIFICACION-FINANZAS.md).

La ampliación financiera se entrega primero en una versión de revisión con acceso administrativo protegido. La publicación en la tienda principal requiere aprobación del propietario.

En **Respaldo y acceso**:

- **Código actualizado en GitHub**: abre el repositorio privado; **Code → Download ZIP** descarga la versión actual.
- **Descargar copia inicial**: instantánea privada de la migración original en Supabase Storage (`segeda-backups/segeda-proyecto.zip`). No contiene necesariamente los cambios posteriores.
- **Descargar respaldo completo**: catálogo, pedidos y finanzas actuales con las imágenes en un ZIP. La descarga contiene datos de clientes y debe guardarse de forma privada.
- **Solo datos**: JSON con catálogo, categorías, pedidos y finanzas actuales.

La cuenta de Supabase, la de GitHub, el alojamiento y el registrador del dominio deben quedar bajo control del propietario. Conservar este ZIP permite recuperar el código, pero no sustituye una copia periódica de pedidos nuevos.

GitHub conserva el código; los cambios de productos, imágenes y pedidos realizados desde el panel se guardan en Supabase. No se copian automáticamente a GitHub. Para descargar el código actual desde GitHub, abre **Code → Download ZIP**; para guardar los datos actuales, usa **Respaldo y acceso** en el panel.

El flujo **Restore verified media** recupera los 751 recursos originales desde el almacenamiento público de Supabase y comprueba su tamaño y SHA-256 antes de guardarlos en GitHub. No necesita credenciales de Supabase. Se puede repetir desde **Actions → Restore verified media → Run workflow** en `main`; deja el resultado y los identificadores de cada archivo en `data/media-verification.json`. Para comprobar una copia local sin descargar ni modificar archivos: `python3 scripts/restore-media.py --verify-only`.

## Recuperar en otro proyecto de Supabase

1. Crear un proyecto propio y aplicar, en orden, los SQL de `supabase/migrations`.
2. Ejecutar `scripts/restore-supabase.mjs` desde un equipo privado con las variables indicadas dentro del script. La clave de servicio solo se usa en ese equipo.
3. Desplegar `supabase/functions/segeda-checkout` con sus archivos compartidos. Mantener la verificación JWT activada.
4. Sustituir URL y claves públicas en `data/supabase-public.json`; reconstruir la web.
5. Si deseas conservar también una copia inicial privada, sube su ZIP al bucket `segeda-backups` como `segeda-proyecto.zip`. El script crea el bucket, pero no sube ese archivo. Para el código actualizado, usa siempre el repositorio de GitHub.
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
node --experimental-strip-types --test tests/pricing.test.mjs tests/finance.test.mjs tests/product-order.test.ts tests/category-and-checkout.test.ts
```

`pnpm run build` conserva la compatibilidad con el alojamiento anterior de Sites. La carpeta `.openai` solo corresponde a ese alojamiento anterior y no interviene en `build:portable`.
