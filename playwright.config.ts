import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests for navigation and the student-portal auth journeys.
 * Run against a production build: `npm run build`, then `npm run test:e2e`.
 * Needs the Supabase keys in .env.local (test accounts are created with the
 * service-role key, without sending email, and deleted afterwards).
 */
const PORT = 3123;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  // Sign-in and sign-out round-trip to Supabase; allow for network latency.
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: { command: `npx next start -p ${PORT}`, port: PORT, reuseExistingServer: false, timeout: 120_000 },
});
