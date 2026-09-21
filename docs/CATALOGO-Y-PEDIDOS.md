# Catálogo y pedidos

En **Productos** se muestran primero las categorías. Pulsa **Ver productos** para trabajar solo con esa colección. Usa **Volver a categorías** para regresar.

- Arrastra el control **⋮⋮** de una categoría o producto. En teléfono, mantén presionado el control antes de moverlo. Al soltar se guarda automáticamente.
- El orden de las categorías y el orden de los productos se guardan por separado en Supabase. La tienda los utiliza como orden predeterminado.
- Si falla el guardado, se restaura la lista anterior. **Actualizar lista** permite recuperar el orden confirmado antes de volver a mover elementos.
- **Cambiar portada** permite subir una foto o indicar su dirección HTTPS. Se mantiene la posición de la categoría.
- **Nuevo producto** dentro de una categoría selecciona esa categoría automáticamente y agrega el producto al final. Se mantienen las acciones de editar y eliminar.
- **Medida general** y **Material** son campos opcionales. Las presentaciones con su propio precio siguen disponibles. No se completan datos de productos existentes por suposición.
- El carrito permite **Enviar pedido por WhatsApp** con nombre, teléfono y ciudad vacíos. Los datos de entrega son opcionales. El mensaje incluye productos, cantidades, precio unitario, subtotal, total y referencia del pedido registrado.

## Despliegue y recuperación

Las migraciones `20260920124036_segeda_product_manual_order.sql` y `20260920193740_segeda_category_order_and_guest_orders.sql` contienen posiciones, transacciones, controles de acceso y compatibilidad con pedidos sin datos de contacto. La función `segeda-checkout` usa el archivo compartido `supabase/functions/_shared/pricing.ts` y mantiene la validación JWT existente. Los precios se validan de nuevo en el servidor.

Los respaldos de datos conservan `sortOrder`, las portadas y los campos de medida/material. El script `scripts/restore-supabase.mjs` respeta ese orden.

## Comprobaciones realizadas

Pruebas de lógica y transacciones con reversión: posiciones consecutivas, aislamiento entre categorías, conflictos entre sesiones, reintentos, permisos, altas y edición de portada sin perder el orden. Se comprobó un pedido real de prueba sin datos de cliente y se retiró después, sin enviar mensajes.

La interfaz se revisó con mouse y anchos de 360, 390, 412 y 430 px, con datos aislados del catálogo real. La prueba táctil del control de productos fue sintética. No equivale a una prueba física en Android o iPhone; el navegador de pruebas tampoco abre la aplicación de WhatsApp.
