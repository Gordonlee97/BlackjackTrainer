import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_BASE = path.resolve(__dirname, 'screenshots');

export default defineConfig({
  testDir: './scenarios',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173/BlackjackTrainer/',
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'large-desktop',
      use: { viewport: { width: 2560, height: 1440 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'large-desktop-2560x1440') },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'desktop-1920x1080') },
    },
    {
      name: 'laptop',
      use: { viewport: { width: 1366, height: 768 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'laptop-1366x768') },
    },
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 } },
      metadata: { screenshotDir: path.join(SCREENSHOT_BASE, 'phone-390x844') },
    },
  ],
});
