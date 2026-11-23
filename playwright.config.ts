import "dotenv/config";
import { defineConfig } from "@playwright/test";
process.env.APP_MODE = "live";
const originalDatabase =
  process.env.PLAYWRIGHT_ORIGINAL_DATABASE_URL ?? process.env.DATABASE_URL;
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("/tienda_test") ||
  process.env.TEST_DATABASE_URL === originalDatabase
)
  throw new Error("TEST_DATABASE_URL debe ser una base exclusiva tienda_test.");
process.env.PLAYWRIGHT_ORIGINAL_DATABASE_URL = originalDatabase;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    screenshot: "only-on-failure",
    actionTimeout: 15000,
  },
  webServer: {
    command: "npx next dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      APP_MODE: "live",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      BETTER_AUTH_URL: "http://localhost:3001",
      NEXT_PUBLIC_APP_URL: "http://localhost:3001",
    },
  },
});
