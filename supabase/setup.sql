-- SANTOS: instalar en Supabase > SQL Editor > New query > Run.
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
  FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('User', 'Session', 'Account', 'Verification', 'RateLimit', 'Product', 'ProductImage', 'Variant', 'PriceHistory', 'Order', 'OrderItem', 'OrderHistory', 'StockMovement', 'Settings');

  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    SELECT count(DISTINCT expected.name) INTO valid_migrations
    FROM (VALUES
      ('20261103000000_initial', 'cc087fd3099f4cc755506c785203ae646795d736012b97c82d091150b20584f2'),
      ('20261103010000_santos_brand', '3a3a8b7498871f38605c9773e2ef53fe3996d23a537e1c1bddd485462148d51f'),
      ('20261123000000_private_database_access', 'bb5ce9cb93555eef753f4fb9bb91182e54ddbae274d5ee287ef8f208a3f0a10f')
    ) AS expected(name, checksum)
    JOIN public."_prisma_migrations" m ON m.migration_name = expected.name
      AND m.checksum = expected.checksum AND m.finished_at IS NOT NULL AND m.rolled_back_at IS NULL;
    SELECT count(*) INTO recorded_migrations FROM public."_prisma_migrations";
    IF recorded_migrations <> valid_migrations OR
       (existing_tables > 0 AND (existing_tables <> 14 OR NOT EXISTS (
         SELECT 1 FROM public."_prisma_migrations" WHERE migration_name = '20261103000000_initial'
       ))) OR (existing_tables = 0 AND valid_migrations > 0) THEN
      RAISE EXCEPTION 'Historial Prisma diferente o instalación parcial. No se modificaron datos. Revisar con prisma migrate status antes de continuar.';
    END IF;
  ELSE
    IF existing_tables > 0 OR to_regtype('public."OrderStatus"') IS NOT NULL THEN
      RAISE EXCEPTION 'Ya existen tablas SANTOS sin historial completo. No se modificaron datos. No ejecutar un reset; revisar la instalación existente.';
    END IF;
    CREATE TABLE public."_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL PRIMARY KEY,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
  END IF;

-- Migración 20261103000000_initial
IF NOT EXISTS (SELECT 1 FROM public."_prisma_migrations" WHERE migration_name = '20261103000000_initial') THEN
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "cost" DECIMAL(14,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "cost" DECIMAL(14,2) NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "note" TEXT,
    "currency" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL(14,2) NOT NULL,
    "stockDeducted" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'business',
    "name" TEXT NOT NULL DEFAULT 'Tu tienda',
    "description" TEXT NOT NULL DEFAULT 'Remeras con tu identidad. Diseños para todos los días.',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "accent" TEXT NOT NULL DEFAULT '#c45135',
    "logoUrl" TEXT,
    "ordersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_active_createdAt_idx" ON "Product"("active", "createdAt");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");

-- CreateIndex
CREATE INDEX "Variant_productId_active_idx" ON "Variant"("productId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_productId_color_size_key" ON "Variant"("productId", "color", "size");

-- CreateIndex
CREATE INDEX "PriceHistory_variantId_createdAt_idx" ON "PriceHistory"("variantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_confirmedAt_idx" ON "Order"("confirmedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderHistory_orderId_createdAt_idx" ON "OrderHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_orderId_variantId_reason_key" ON "StockMovement"("orderId", "variantId", "reason");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderHistory" ADD CONSTRAINT "OrderHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business integrity enforced independently from the application.
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_prices_nonnegative" CHECK ("price" >= 0 AND "cost" >= 0 AND "minStock" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_valid_amounts" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "unitCost" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_nonnegative" CHECK ("total" >= 0);
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_nonzero" CHECK ("quantity" <> 0);
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_nonnegative" CHECK ("price" >= 0 AND "cost" >= 0);

INSERT INTO public."_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES ('73b39441-aa7a-4f1e-a304-fc4c0421614a', 'cc087fd3099f4cc755506c785203ae646795d736012b97c82d091150b20584f2', now(), '20261103000000_initial', 1);
END IF;

-- Migración 20261103010000_santos_brand
IF NOT EXISTS (SELECT 1 FROM public."_prisma_migrations" WHERE migration_name = '20261103010000_santos_brand') THEN
ALTER TABLE "Settings" ALTER COLUMN "name" SET DEFAULT 'SANTOS';

INSERT INTO public."_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES ('b2e3cf61-dc51-4831-b56e-a9b99e187bec', '3a3a8b7498871f38605c9773e2ef53fe3996d23a537e1c1bddd485462148d51f', now(), '20261103010000_santos_brand', 1);
END IF;

-- Migración 20261123000000_private_database_access
IF NOT EXISTS (SELECT 1 FROM public."_prisma_migrations" WHERE migration_name = '20261123000000_private_database_access') THEN
-- The application uses PostgreSQL from the server with an owner/BYPASSRLS role.
-- Its Better Auth sessions are independent from Supabase Auth.
-- No application tables should be accessible through Supabase's public Data API.
DO $privacy$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'User', 'Session', 'Account', 'Verification', 'RateLimit',
    'Product', 'ProductImage', 'Variant', 'PriceHistory',
    'Order', 'OrderItem', 'OrderHistory', 'StockMovement', 'Settings',
    '_prisma_migrations'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
      FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, api_role);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$privacy$;

INSERT INTO public."_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES ('30b835ce-657d-4113-bcb4-829fce4cfefc', 'bb5ce9cb93555eef753f4fb9bb91182e54ddbae274d5ee287ef8f208a3f0a10f', now(), '20261123000000_private_database_access', 1);
END IF;
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
  AND tablename IN ('User', 'Session', 'Account', 'Verification', 'RateLimit', 'Product', 'ProductImage', 'Variant', 'PriceHistory', 'Order', 'OrderItem', 'OrderHistory', 'StockMovement', 'Settings', '_prisma_migrations')
ORDER BY tablename;
