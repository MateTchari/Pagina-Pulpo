# Plan de implementación

Aplicación local nueva: Next.js App Router + TypeScript, Tailwind, PostgreSQL y Prisma. Sin publicación automática ni código de InventAS.

1. Verificar Node y dependencias; preparar scripts, configuración y documentación.
2. Modelar productos, variantes, imágenes, pedidos, instantáneas monetarias, movimientos, estados, configuración y autenticación; migraciones con restricciones SQL.
3. Autenticación Better Auth con sesiones persistentes, alta administrativa por CLI, sin registro público y límite de intentos.
4. CRUD de productos y variantes, carga validada de imágenes, precios y costos históricos.
5. Inventario por variante y ajustes auditados.
6. Inicio, catálogo con filtros, detalle y disponibilidad de variantes.
7. Carrito persistente y checkout con validación de precios en servidor e idempotencia.
8. Confirmación manual transaccional; descuento condicional de stock, protección ante concurrencia y reintegro por cancelación.
9. Dashboard, ventas, costos y estadísticas derivadas de ventas confirmadas, con fechas.
10. Formularios accesibles, estados vacíos, seguridad y pruebas unitarias e integración PostgreSQL.
11. Build, documentación local/despliegue y límites verificados.

## Criterios del flujo

No se reserva stock en pedidos pendientes. Al confirmar se descuentan todas las variantes en una transacción serializable. Si falta stock, no se confirma. Cancelar una venta confirmada reintegra exactamente una vez. Un pedido pendiente no garantiza disponibilidad. No se afirma ningún pago: cobros quedan fuera hasta definir integración.

## Entorno inicial

Node 24.15.0 y npm 11.12.1. Workspace vacío. Sin PostgreSQL/Docker en PATH. Se proveerá PostgreSQL local embebido opcional para desarrollo y Docker Compose para despliegues convencionales. No se requiere un servicio pago.

## Estado final

- Fases 1–11 implementadas dentro del alcance definido y documentado.
- PostgreSQL 18 local real inicializado y migración aplicada. Base de trabajo vacía; pruebas aisladas en `tienda_test`.
- Dependencias finales: Next 16.4.5, Prisma 7.10.1 con adaptador PostgreSQL, Better Auth, Tailwind 4, Recharts 3 y Zod 4. Se actualizó Prisma y Sharp tras auditoría para eliminar las vulnerabilidades detectadas inicialmente.
- Cinco pruebas unitarias, seis de integración PostgreSQL y dos pruebas de navegador pasaron. El flujo de aceptación se ejecutó mediante formularios reales.
- TypeScript y compilación verificados; resultado detallado en `VERIFICACION.md`.
- No se publicó ni se crearon credenciales administrativas fijas. Alta segura por CLI documentada.
- Decisiones de pago, entrega, fiscalidad e identidad definitiva siguen en `DECISIONES_PENDIENTES.md`.
