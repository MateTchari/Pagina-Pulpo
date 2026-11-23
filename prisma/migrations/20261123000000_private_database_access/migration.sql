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
