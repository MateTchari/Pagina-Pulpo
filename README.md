# Tienda online + gestión integral

Next.js App Router, TypeScript, Tailwind, componentes reutilizables con Radix (patrón shadcn/ui), PostgreSQL, Prisma, Better Auth, Zod y Recharts. Sin servicios pagos ni código Android de la referencia.

## Inicio rápido

Requiere Node.js 22.12+ o 24 LTS y npm. Desde esta carpeta:

```powershell
npm ci
npm run setup
npm run db:local
```

Dejá esa terminal abierta. PostgreSQL escucha en `127.0.0.1:54329` y persiste en `.local/postgres`. En otra terminal:

```powershell
npm run db:migrate
npm run db:generate
npm run admin:create
npm run dev
```

Abrí http://localhost:3000 y http://localhost:3000/admin/login. El alta administrativa pide email, nombre y contraseña **oculta**, de 12 a 128 caracteres. No hay credenciales fijas ni registro público. Ejecutá el comando otra vez para otro administrador. La recuperación de contraseña requiere mantenimiento autorizado; no hay emails de recuperación automáticos.

`setup` genera `.env` con secretos aleatorios y conserva un archivo existente. No compartas `.env`, `.local/` ni `uploads/` públicamente. No uses PostgreSQL embebido en producción.

## PostgreSQL propio o Docker

Copiá `.env.example` a `.env` y completá URL PostgreSQL, secreto aleatorio largo y URL exacta de la aplicación. Para generar un secreto: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Con Docker, definí también `POSTGRES_PASSWORD` en `.env` y ejecutá `docker compose up -d db`. Docker usa puerto 5432; ajustá `DATABASE_URL`. Luego aplicá migraciones y creá el administrador. No iniciar `db:local` si usás base externa.

## Circuito solicitado

1. Ingresá a administración y configurá nombre, moneda, logo y color. Aceptá explícitamente habilitar pedidos con coordinación manual.
2. Creá una remera con slug, descripción, fotos, color, talle, SKU único, costo y precio. Marcala publicada y, opcionalmente, destacada.
3. En Inventario cargá **10** unidades e indicá el motivo.
4. En la tienda seleccioná esa variante y agregá **2** al carrito.
5. Creá el pedido con nombre y email. Conservá su enlace privado de seguimiento.
6. En Pedidos abrí el detalle y pulsá **Confirmar y descontar stock**.
7. Verificá **8** unidades, movimiento **VENTA −2**, disponibilidad pública y estadísticas.
8. Cancelar reintegra dos unidades una sola vez. Completado es un estado terminal.

## Reglas del negocio

- No se reserva stock. Pendiente no garantiza disponibilidad. Crear valida precio y existencia en servidor; confirmar vuelve a validar stock y publicación.
- Precio y costo se congelan **al crear el pedido**. Cambios posteriores no alteran esos importes.
- Confirmar descuenta todas las líneas en una transacción serializable, con reintentos acotados y actualizaciones condicionales. Un error revierte todo.
- Confirmaciones y cancelaciones repetidas no duplican movimientos. Checkout guarda UUID de idempotencia en sessionStorage para reintentos; un contenido distinto usa otra clave. Reutilizar una clave con otro contenido se rechaza.
- Pendiente → confirmado/cancelado. Confirmado → preparando/cancelado. Preparando → completado/cancelado. Cancelado y completado son terminales.
- Ninguna confirmación acredita un pago. Pago y entrega se coordinan manualmente; cobros, pasarela y facturación fiscal quedan pendientes.
- Estadísticas excluyen pendientes y cancelados, usan fecha de confirmación en Argentina (UTC−3) e importes históricos. Cancelaciones reexpresan el período original.
- Ganancia bruta no es ganancia neta: no incluye impuestos, comisiones, envío ni gastos operativos.
- La moneda es configurable antes del primer pedido; después queda bloqueada para evitar mezclar monedas sin conversión.
- Productos y variantes se desactivan, conservando ventas e historial. Stock inicial se carga mediante un movimiento auditado.

## Seguridad y archivos

Better Auth usa contraseñas scrypt, sesiones persistentes, cookies HttpOnly/SameSite y límite de login almacenado en PostgreSQL. El rol se consulta en servidor para cada acceso y escritura administrativa. No hay alta pública. Las escrituras validan origen.

Checkout limita globalmente a 60 solicitudes/minuto en PostgreSQL sin confiar en cabeceras IP arbitrarias. Ajustar al tráfico o añadir un proxy de confianza antes de exposición pública.

Subidas administrativas: JPG/PNG/WebP hasta 5 MB, decodificación real, límite de píxeles, recodificación WebP sin metadatos y nombres aleatorios. Archivos en `uploads/`; se necesita disco persistente. Los descartados pueden quedar huérfanos: definir limpieza periódica. Respaldar archivos junto a PostgreSQL.

Seguimiento por enlace de 256 bits aleatorios: quien lo posee ve productos y estados, sin nombre, email ni notas del comprador. No se envían emails.

## Verificación

```powershell
npm test
npm run test:integration
npx playwright install chromium
npm run test:browser
npm run typecheck
npm run build
npm audit
```

Integración requiere PostgreSQL activo y `TEST_DATABASE_URL` en una base exclusiva llamada `tienda_test`. Aplica migraciones y **elimina sus registros** antes y después; nunca usar datos reales. Prueba alta/edición, variantes, precios históricos, movimientos, pedidos, idempotencia, concurrencia, cancelaciones, rollback, estadísticas, autenticación, logout, registro bloqueado, rate limit y persistencia entre conexiones. Ejecutar antes de `test:browser`, que reutiliza esa base y verifica los formularios reales, carga de foto, carrito persistente, vista móvil, venta, cancelación, acceso no autorizado y protección de origen. No ejecutar ambas suites simultáneamente. El navegador usa un servidor de pruebas en puerto 3001 y captura pantallas en `test-results/`.

Seed opcional: `npm run seed:demo -- --demo`. Crea un producto identificado como demostración con diez unidades; no crea ventas ni administradores y no habilita pedidos. Instalación normal vacía.

## Despliegue propio

Servidor Node y PostgreSQL. Configurá `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` con el dominio HTTPS definitivo. Ejecutá `npm ci`, `npm run db:migrate`, `npm run build` y `npm start`. Usá volumen persistente para `uploads/`, proxy HTTPS con límite de cuerpo de 6 MB y copias de seguridad. Cookies Secure en producción; para HTTP local usá `npm run dev`. No usar export estático ni disco efímero. No se publicó ningún sitio.

## Pendiente de definición

Ver `DECISIONES_PENDIENTES.md`. Sin pasarela, cobros, impuestos, emails, envío ni editor gráfico de personalización. Listados tienen límites visibles y filtros; para volúmenes grandes agregar paginación. Se aplicaron los logos originales SANTOS en tienda y administración. La portada y los productos sin fotografía utilizan un mockup de remeras identificado como imagen provisoria; las fotografías cargadas por el administrador tienen prioridad. Assets y brief: `docs/IDENTIDAD_SANTOS.md`.

## Referencias

- [Next.js instalación](https://nextjs.org/learn/react-foundations/installation)
- [Prisma transacciones](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)
- [Better Auth y Prisma](https://better-auth.com/docs/adapters/prisma)
- [Better Auth email/contraseña](https://better-auth.com/docs/authentication/email-password)
- [PostgreSQL local embebido](https://github.com/leinelissen/embedded-postgres)
