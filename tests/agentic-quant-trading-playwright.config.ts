import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.COURSE17_PORT ?? 3117);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error(`COURSE17_PORT must be an integer from 1024 to 65535; received ${String(process.env.COURSE17_PORT)}`);
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "agentic-quant-trading-ui.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  outputDir: "../.playwright-raw/course17",
  preserveOutput: "always",
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/zh-Hans/agentic-quant-trading/`,
    // Never accept an unrelated Next.js worktree that happens to own the port.
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
