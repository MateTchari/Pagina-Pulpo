import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('prisma/migrations');
const migrations = readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
  const sql = readFileSync(path.join(root, e.name, 'migration.sql'), 'utf8');
  return { name: e.name, sql, checksum: createHash('sha256').update(sql).digest('hex'), id: randomUUID() };
}).sort((a, b) => a.name.localeCompare(b.name));
const quote = value => "'" + value.replaceAll("'", "''") + "'";
const names = ['User', 'Session', 'Account', 'Verification', 'RateLimit', 'Product', 'ProductImage', 'Variant', 'PriceHistory', 'Order', 'OrderItem', 'OrderHistory', 'StockMovement', 'Settings'];
const expected = migrations.map(m => `(${quote(m.name)}, ${quote(m.checksum)})`).join(',\n      ');
const ledger = `CREATE TABLE public."_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL PRIMARY KEY,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);`;
const steps = migrations.map(m => `-- Migración ${m.name}
IF NOT EXISTS (SELECT 1 FROM public."_prisma_migrations" WHERE migration_name = ${quote(m.name)}) THEN
${m.sql}
INSERT INTO public."_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES (${quote(m.id)}, ${quote(m.checksum)}, now(), ${quote(m.name)}, 1);
END IF;`).join('\n\n');
const bootstrap = `-- SANTOS: instalar en Supabase > SQL Editor > New query > Run.
-- Generado desde prisma/migrations; no contiene claves ni usuarios con contraseña.
-- Puede ejecutarse otra vez si esta instalación ya está completa.
-- Ante tablas parciales o un historial distinto se detiene sin borrar datos.
-- Usar el rol postgres del SQL Editor. No modificar auth.* ni storage.*.
BEGIN;
SET LOCAL search_path = public;
SELECT pg_advisory_xact_lock(hashtext('santos_database_install'));

DO $santos_install$
DECLARE
  existing_tables integer;
  valid_migrations integer;
  recorded_migrations integer;
BEGIN
  SELECT count(*) INTO existing_tables
  FROM pg_tables WHERE schemaname = 'public' AND tablename IN (${names.map(quote).join(', ')});

  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    SELECT count(DISTINCT expected.name) INTO valid_migrations
    FROM (VALUES
      ${expected}
    ) AS expected(name, checksum)
    JOIN public."_prisma_migrations" m ON m.migration_name = expected.name
      AND m.checksum = expected.checksum AND m.finished_at IS NOT NULL AND m.rolled_back_at IS NULL;
    SELECT count(*) INTO recorded_migrations FROM public."_prisma_migrations";
    IF recorded_migrations <> valid_migrations OR
       (existing_tables > 0 AND (existing_tables <> ${names.length} OR NOT EXISTS (
         SELECT 1 FROM public."_prisma_migrations" WHERE migration_name = ${quote(migrations[0].name)}
       ))) OR (existing_tables = 0 AND valid_migrations > 0) THEN
      RAISE EXCEPTION 'Historial Prisma diferente o instalación parcial. No se modificaron datos. Revisar con prisma migrate status antes de continuar.';
    END IF;
  ELSE
    IF existing_tables > 0 OR to_regtype('public."OrderStatus"') IS NOT NULL THEN
      RAISE EXCEPTION 'Ya existen tablas SANTOS sin historial completo. No se modificaron datos. No ejecutar un reset; revisar la instalación existente.';
    END IF;
    ${ledger}
  END IF;

${steps}
END;
$santos_install$;

-- Configuración inicial, sin productos, ventas, stock ni credenciales ficticias.
INSERT INTO public."Settings" (id, name, "logoUrl", "updatedAt")
VALUES ('business', 'SANTOS', '/brand/santos-logo-black.png', now())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Resultado esperado: 14 tablas de aplicación + 1 tabla de migraciones, todas con RLS.
SELECT tablename AS tabla, rowsecurity AS rls_activado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (${[...names, '_prisma_migrations'].map(quote).join(', ')})
ORDER BY tablename;
`;
mkdirSync('supabase', { recursive: true });
writeFileSync('supabase/setup.sql', bootstrap, 'utf8');
console.log(`supabase/setup.sql generado: ${migrations.length} migraciones, ${names.length} tablas de aplicación y registro Prisma.`);
