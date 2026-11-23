# Verificación realizada el 3 de noviembre de 2026

## Modo demo — 23 de noviembre de 2026

### Panel administrativo interactivo

`/admin/demo` disponible sin contraseña solo en modo demo. Productos, fotos locales, variantes, inventario, pedidos, estadísticas, costos, configuración y restablecimiento comparten un estado de prueba en el navegador. La tienda muestra los productos publicados y su stock actualizado. El checkout crea pedidos simulados sin enviar los datos personales ingresados al servidor.

- `npm run test:demo`: 8 pruebas aprobadas, incluidas confirmación, cancelación sin duplicados, 10 → 8 → 10 unidades, snapshots monetarios, rechazo de stock insuficiente y validación de variantes.
- `npm run test:demo:browser`: 4 pruebas aprobadas. Alta con imagen local, ingreso de stock, consulta pública del producto nuevo, pedido simulado, confirmación, edición posterior del precio, estadísticas históricas, cancelación, persistencia al recargar y restablecimiento. Ninguna solicitud POST durante el circuito interactivo.
- Las siete secciones del panel se recorrieron a 390 px sin desbordamiento horizontal de página. Las tablas extensas tienen su propio desplazamiento.
- Build de producción sin variables PostgreSQL ni claves correcto. Las escrituras del backend real siguen bloqueadas en demo; el panel usa solo datos locales.
- Capturas: `test-results/demo-admin-dashboard.png` y `test-results/demo-admin-mobile.png`.

- Build de Vercel ejecutado con `APP_MODE=demo` y `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` vacíos: compilación correcta, sin migraciones ni conexión PostgreSQL.
- `npm run test:demo`: 3 pruebas aprobadas; catálogo, filtros, configuración y cálculo de finalización con PostgreSQL deliberadamente inaccesible.
- `npm run test:demo:browser`: 2 pruebas aprobadas sobre el servidor compilado de producción sin variables de base ni autenticación. Recorrido móvil, carrito persistente, finalización sin solicitudes POST, filtros y pantallas administrativas de información.
- Escrituras de pedidos, productos, inventario, configuración y subidas; login y consulta de sesión: bloqueadas con HTTP 503 en demo.
- `npm test`: 5 pruebas unitarias aprobadas. TypeScript sin errores.
- La demostración no guarda compradores, pedidos, ventas ni stock en una base real. El panel incorporado guarda sus operaciones simuladas solo en el navegador. Modo real conservado y seleccionable con `APP_MODE=live`; las suites de integración PostgreSQL anteriores no se repitieron para este cambio.

## Actualización de identidad SANTOS

Logos originales incorporados en cabecera, pie, panel, login e iconos; nombre persistido en PostgreSQL. Mockup provisorio de remeras generado y guardado en `public/brand/santos-shirts-v2.webp`. Verificación de navegador sobre el servidor local: HTTP 200, todas las imágenes cargadas y ausencia de desbordamiento a 390 px. TypeScript y build correctos tras integrar la identidad. Capturas: `test-results/santos-desktop.png`, `test-results/santos-mobile.png` y `test-results/santos-login-mobile.png`. Las suites completas de abajo corresponden a la verificación funcional previa; no se repitieron por este cambio visual.

## Entorno

Windows, Node 24.15.0, npm 11.12.1. PostgreSQL real ejecutado localmente con `embedded-postgres`, en puerto 54329. Migración SQL aplicada a la base `tienda`; tests aislados en `tienda_test` y limpiados después. No hay ventas de prueba en la base de trabajo.

## Resultados ejecutados

| Comando | Resultado |
| --- | --- |
| `npm run db:generate` | Prisma Client generado |
| `npm run db:migrate` | Migración aplicada a PostgreSQL |
| `npm test` | 5 pruebas aprobadas |
| `npm run test:integration` | 6 pruebas aprobadas |
| `npm run test:browser` | 2 pruebas aprobadas en Chromium |
| `npm run typecheck` | Sin errores |
| `npm run build` | Compilación de producción correcta |
| `npm audit` | 0 vulnerabilidades conocidas |

## Casos comprobados

- Alta y edición de productos y variantes, historial de precios y costos.
- Carrito que agrupa por variante, valida cantidades y persiste al recargar.
- Checkout: datos inválidos, stock insuficiente, productos inactivos, importes calculados en servidor y solicitudes repetidas.
- Ingreso de 10 unidades, pedido de 2 sin reserva, confirmación que deja 8.
- Dos confirmaciones simultáneas del mismo pedido: un solo movimiento.
- Dos ventas compitiendo por la última unidad: solo una confirma.
- Pedido de varias variantes: stock insuficiente en una revierte la transacción completa.
- Cancelaciones repetidas: un solo reintegro; estados terminales y transiciones inválidas rechazados.
- Ingresos, costos y ganancia bruta según precios/costos históricos; exclusión de cancelados.
- Restricción PostgreSQL que impide stock negativo; persistencia entre conexiones independientes.
- Login válido e inválido, sesiones persistentes, logout, registro público bloqueado y rate limit.
- Rutas privadas redirigen al login; escrituras sin sesión responden 401; origen ajeno responde 403.
- Flujo completo por UI: configuración, subida real PNG→WebP, producto, inventario, tienda, carrito, checkout, confirmación, dashboard, estadísticas, cancelación y logout.
- Portada sin desbordamiento horizontal a 390 px. Capturas en `test-results/store-mobile.png` y `test-results/dashboard.png`; datos identificados como pruebas y eliminados al terminar.

## Límites

Se probó Chromium de escritorio con viewport móvil; no dispositivos físicos, Safari ni Firefox. No se ejecutó una prueba exhaustiva de accesibilidad, carga o penetración. El despliegue Docker/HTTPS no fue ejecutado; se documenta como preparación. No hay integración de pago ni entrega y ninguna prueba acredita cobros. No se creó un administrador permanente: corresponde hacerlo con el comando interactivo y una contraseña propia.
