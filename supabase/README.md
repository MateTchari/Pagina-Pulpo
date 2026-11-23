# Instalar SANTOS en Supabase

## 1. Crear tablas

En el proyecto de Supabase abrí **SQL Editor → New query**. Copiá **todo** el contenido de `supabase/setup.sql` y ejecutá **Run** usando el rol `postgres` del editor.

Al terminar, la consulta devuelve **15 filas**: 14 tablas de la aplicación y `_prisma_migrations`. La columna `rls_activado` debe ser `true` para todas.

Incluye:

- Administración: `User`, `Session`, `Account`, `Verification`, `RateLimit`.
- Catálogo: `Product`, `ProductImage`, `Variant`, `PriceHistory`.
- Operaciones: `Order`, `OrderItem`, `OrderHistory`, `StockMovement`.
- Negocio: `Settings`, con identidad inicial SANTOS y recepción de pedidos deshabilitada.
- Índices, claves foráneas, restricciones monetarias y protección contra stock negativo.
- Registro de las migraciones para que `prisma migrate deploy` reconozca las tablas y no las vuelva a crear.

Se ejecuta dentro de una transacción. Puede repetirse si la instalación está completa, sin borrar ni reemplazar datos. También aplica migraciones faltantes de este proyecto si el historial previo coincide. Si encuentra tablas parciales o migraciones ajenas/modificadas, se detiene; no uses un reset para resolverlo. No modifica los esquemas `auth` ni `storage` de Supabase.

## 2. Revisar la conexión de Vercel

En Supabase usá **Connect**, copiando las cadenas completas que muestra tu proyecto. No inventes el host a partir de la región.

- `DATABASE_URL`: conexión **Transaction pooler**, puerto **6543**, con la contraseña PostgreSQL del proyecto. Usada por Prisma desde las funciones de Vercel.
- `DIRECT_URL`: conexión **Session pooler**, puerto **5432**, para las migraciones. La conexión directa también sirve si el entorno tiene acceso IPv6, o IPv4 cuando esté disponible.
- Agregá `sslmode=require` a la cadena si no está presente, conservando cualquier otro parámetro que entregue el proveedor. Los caracteres especiales de la contraseña deben estar codificados para URL.
- `BETTER_AUTH_SECRET`: secreto aleatorio largo.
- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL`: el dominio HTTPS de la tienda.

Usá las credenciales PostgreSQL del usuario `postgres`/`postgres.REFERENCIA` que muestra Connect. Si elegís un rol PostgreSQL personalizado, necesitás configurar sus permisos y BYPASSRLS para el acceso desde el backend. No uses la clave `anon`, `publishable`, `service_role`, ni la URL `https://...supabase.co` como `DATABASE_URL`: este proyecto utiliza Prisma y PostgreSQL directamente.

La autenticación del panel sigue siendo **Better Auth**, independiente de Supabase Auth. No hace falta crear usuarios en Authentication de Supabase. Las tablas tienen RLS sin políticas públicas y permisos revocados para `anon`/`authenticated`; la tienda obtiene sus datos mediante el backend autorizado. No desactives RLS para solucionar un error de permisos.

Después de configurar las variables y subir los cambios del proyecto, ejecutá **Redeploy** en Vercel. El build usa `npm run build:vercel`. Si ya ejecutaste `setup.sql`, Prisma debe indicar que no hay migraciones pendientes.

## 3. Crear tu administrador

En la carpeta del proyecto creá un archivo **`.env.production.local`** con una sola variable:

```dotenv
DATABASE_URL="PEGAR_ACA_LA_CONEXION_SESSION_POOLER_DE_SUPABASE"
```

Este archivo está ignorado por Git. No lo subas ni compartas su contenido. En la terminal del proyecto ejecutá:

```powershell
npm run admin:create:production
```

Ingresá email, nombre y una contraseña propia de 12 a 128 caracteres; la contraseña se escribe oculta. El comando crea el usuario en la base online indicada y conserva la configuración local de desarrollo. No hay credenciales predeterminadas ni registro público.

Abrí `https://TU-DOMINIO/admin/login`, ingresá y revisá Configuración para elegir moneda y habilitar pedidos. Después creá tus productos y cargá existencias desde Inventario.

## Qué no hace este SQL

No copia los productos de tu PC, no inventa stock ni ventas, no crea contraseñas y no integra pagos. La subida de fotos desde Vercel todavía requiere adaptar la aplicación a almacenamiento persistente, como un bucket de Supabase Storage; crear las tablas no modifica el código de subida actual.

## Mantener el instalador

La fuente del esquema sigue siendo `prisma/migrations`. Para regenerar el SQL con las migraciones del repositorio:

```powershell
npm run db:export-supabase
```

No edites los checksums de `_prisma_migrations`. No ejecutes `migrate reset` ni `db push --force-reset` en producción.

Referencias: [Prisma con Supabase](https://supabase.com/docs/guides/database/prisma), [conexiones PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
