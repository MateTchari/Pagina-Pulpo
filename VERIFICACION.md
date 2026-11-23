# Verificación realizada el 3 de noviembre de 2026

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
