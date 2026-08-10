import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Pas de dépendance dotenv dans le projet : parseur minimal, suffisant pour
// des lignes KEY=VALUE simples comme dans .env.test.example.
function loadEnvFile(fileName: string) {
  const fullPath = path.resolve(__dirname, fileName);
  if (!fs.existsSync(fullPath)) return;
  for (const line of fs.readFileSync(fullPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.test");

const baseURL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/tests",
  globalSetup: "./e2e/global-setup.ts",
  // Suite volontairement petite qui partage une seule base wraithguild_test :
  // exécution série pour éviter que deux specs se marchent dessus sur les
  // mêmes tables (voir e2e/README.md).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
