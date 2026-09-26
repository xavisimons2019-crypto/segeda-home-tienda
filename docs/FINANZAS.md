# Pedidos y finanzas

Entra en `/admin`, inicia sesión y abre **Pedidos**. El panel ofrece ocho vistas: Resumen, Pedidos y cobros, Ingresos, Gastos, Por pagar, Presupuestos, Utilidad por sección y Costos y precios.

## Primeros pasos

1. En **Costos y precios**, elige el mes y completa el costo variable promedio por unidad, los costos fijos, la comisión y las unidades previstas de cada sección. Incluye material, trabajo, empaque y merma. Registra los costos compartidos una sola vez en **General**. Si no existen, configura cero explícitamente.
2. En **Pedidos y cobros**, registra cada adelanto o saldo cuando realmente recibas el dinero. En **Estado y fechas**, indica cuándo finalizaste el pedido. Cambiar el estado no registra dinero automáticamente.
3. En **Gastos**, registra pagos efectivamente realizados. Si todavía debes a un proveedor, crea una cuenta en **Por pagar** y registra después sus pagos, incluso parciales.
4. En **Presupuestos**, fija la meta de cobros y el límite de gastos de cada sección y mes. El panel compara esos objetivos con los movimientos guardados.

No se han inventado costos, cobros, gastos ni fechas de finalización para los pedidos existentes. Los pedidos sin datos de contacto se muestran como **Cliente por confirmar**.

## Qué significan los resultados

| Indicador | Cálculo y alcance |
| --- | --- |
| Cobros netos | Dinero recibido menos devoluciones del mes. Incluye adelantos. |
| Gastos pagados | Pagos operativos registrados, incluidos pagos parciales a proveedores. |
| Flujo operativo | Cobros netos menos gastos pagados. |
| Variación de caja | Flujo operativo más aportes menos retiros de capital. No es el saldo de tu banco. |
| Utilidad estimada | Ventas de pedidos finalizados menos devoluciones, costos variables por unidad, comisiones estimadas y costos fijos del plan mensual. |
| Punto de equilibrio | Unidades necesarias para cubrir los costos fijos con el aporte por unidad; se redondea hacia arriba. |
| Utilidad prevista | Unidades previstas por aporte unitario, menos costos fijos. Es una proyección, no un movimiento real. |

La utilidad estimada no suma adelantos ni cobros sin pedido. Estos últimos aparecen en caja. Los gastos de inventario se muestran al pagarlos; para estimar utilidad se utiliza el costo de las unidades finalizadas, evitando descontar la misma compra dos veces. Las comisiones se estiman sobre las ventas antes de devoluciones. No se calculan impuestos, depreciación ni ajustes de inventario.

Cada sección tiene su comparación de ventas, caja, gastos y margen. **General** conserva los costos compartidos y los descuenta una sola vez del total; no los reparte automáticamente entre secciones. Si faltan costos, el panel lo indica en vez de asumir que son cero.

El mes usa la zona horaria de Lima. **Pedidos y cobros** y **Por pagar** muestran saldos actuales de todas las fechas. Al filtrar una sección, el saldo por cobrar corresponde al pedido completo que la incluye; los movimientos de caja y las ventas sí se reparten entre secciones conservando todos los céntimos.

## Cobros, devoluciones y correcciones

- Un pedido admite varios cobros hasta su total, y devoluciones hasta lo cobrado neto. Cancelarlo no devuelve dinero automáticamente.
- Una cuenta por pagar admite abonos hasta el saldo restante. **Pagar** registra el egreso; crear la cuenta no lo duplica.
- Para corregir un movimiento, usa **Anular**, indica el motivo y registra el correcto. El historial se conserva. La base bloquea anulaciones que dejarían saldos inconsistentes.
- Los reintentos del mismo formulario conservan un identificador único para evitar duplicar cobros o pagos.
- Aportes y retiros modifican la caja y se muestran separados de las ventas y gastos operativos.
- **Actualizar** consulta de nuevo los registros guardados en Supabase. No hay sincronización con bancos ni envío automático de dinero.

## Exportaciones y recuperación

**Exportar movimientos** genera un CSV de los movimientos vigentes del mes y sección elegidos. Los movimientos anulados permanecen visibles en el panel al activar **Incluir anulados**.

En **Respaldo y acceso**, **Solo datos** y **Descargar respaldo completo** incluyen los pedidos y las siete tablas financieras, además del catálogo. El respaldo completo añade las imágenes. Los registros financieros se leen en una sola instantánea para conservar las relaciones entre pagos y saldos. Guarda esas copias de forma privada.

El código actualizado se descarga del repositorio privado de GitHub. **Descargar copia inicial** identifica expresamente la instantánea de la migración original: no sustituye el código actual.

Para recuperar en un proyecto nuevo, aplica todas las migraciones y usa `scripts/restore-supabase.mjs`. El script conserva el orden de productos y categorías y restaura pedidos, cuentas, movimientos, distribución por secciones, presupuestos, costos y fechas. Rechaza proyectos con productos, pedidos o movimientos existentes. No contiene contraseñas ni sesiones.

## Validación técnica

`tests/finance.test.mjs` comprueba céntimos, pagos parciales, devoluciones, anulaciones, capital, fechas, punto de equilibrio, reconocimiento de ventas, costos pendientes y exportación CSV. `tests/finance-security.sql` comprueba en una transacción con reversión los límites de saldos, reintentos, permisos, historial y respaldo privado. No se mantienen datos ficticios en el proyecto de producción.

La revisión visual usa el componente real del panel con un almacenamiento aislado y datos ficticios. Complementa las pruebas de la base real, sin requerir la contraseña del administrador. Los anchos móviles comprobados no equivalen a una prueba física en Android o iPhone.
