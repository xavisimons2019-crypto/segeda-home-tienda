# Verificación de la versión financiera

Revisión cerrada el 26 de septiembre de 2026. La integración está preparada para aprobación; este informe no afirma que se haya publicado en la tienda principal.

## Alcance

El componente existente de administración incorpora ocho vistas financieras y conserva categorías, productos, portadas, orden manual, edición y carrito. Se corrigió además una regla heredada que ocultaba todo el menú administrativo en pantallas de hasta 1050 px.

## Pruebas realizadas

- TypeScript sin errores y compilación portable correcta. Los gráficos se cargan al entrar en Pedidos.
- 19 pruebas de cálculos financieros, orden de productos, categorías y checkout superadas.
- Transacciones de prueba en Supabase, revertidas al finalizar: permisos del administrador, bloqueo anónimo, importes, reparto de céntimos, límites de cobro/devolución/pago, reintentos, anulaciones e instantánea de respaldo.
- En la interfaz real con almacenamiento aislado: gasto de S/15 tras un error de guardado, reintento sin duplicados y confirmación del nuevo total; cuenta de S/90 con pago de S/30 y saldo S/60; cambio de costo variable de S/28 a S/30 con aporte unitario S/40 y proyección S/460; presupuesto de S/20 con gastos S/35 y aviso de exceso S/15, conservado al recargar.
- Pedido ficticio sin nombre ni teléfono: total S/80, cobro parcial S/20 y saldo S/60; se muestra Cliente por confirmar.
- Las ocho vistas se recorrieron a 360, 390, 412 y 430 px. Ninguna desbordó horizontalmente. El navegador reserva 15 px para la barra de desplazamiento, por lo que el área interior fue 345, 375, 397 y 415 px.
- El menú móvil permite abrir Productos, Categorías, Pedidos y Respaldo y acceso.

Los registros de interfaz anteriores son ficticios y están aislados de Supabase. No representan ventas, costos ni movimientos del negocio. Las pruebas de la base real no conservaron esos registros.

## Límites de la revisión

Las pruebas responsivas y táctiles sintéticas anteriores no equivalen a pruebas físicas en Android y iPhone. No se inició sesión real del administrador desde el navegador de prueba ni se enviaron mensajes por WhatsApp. El acceso privado se verificó mediante permisos de la base y la pantalla de inicio de sesión; los formularios se ejercitaron en la versión aislada.

La utilidad es una estimación basada en los costos que introduzca el administrador; no se han supuesto costos cero ni completado fechas históricas. La guía `FINANZAS.md` explica el tratamiento de caja, adelantos, devoluciones y costos compartidos.
