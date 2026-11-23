import { defineConfig } from "@playwright/test";
const demoEnvironment = {
  APP_MODE: "demo",
  DATABASE_URL: "",
  DIRECT_URL: "",
  BETTER_AUTH_SECRET: "",
  BETTER_AUTH_URL: "",
  NEXT_PUBLIC_APP_URL: "",
};
export default defineConfig({
  testDir: "./tests/demo-browser",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:3002",
    headless: true,
    screenshot: "only-on-failure",
    actionTimeout: 10000,
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: false,
    env: demoEnvironment,
    timeout: 60000,
  },
});
