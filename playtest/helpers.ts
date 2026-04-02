import type { Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getScreenshotDir(testInfo: { project: { metadata?: { screenshotDir?: string } } }): string {
  const dir = testInfo.project.metadata?.screenshotDir
    ?? path.resolve(__dirname, 'screenshots', 'unknown');
  return dir;
}

export async function takeScreenshot(
  page: Page,
  testInfo: { project: { metadata?: { screenshotDir?: string } } },
  scenario: string,
  name: string,
): Promise<string> {
  const dir = path.join(getScreenshotDir(testInfo), scenario);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

export async function takeSequentialScreenshots(
  page: Page,
  testInfo: { project: { metadata?: { screenshotDir?: string } } },
  scenario: string,
  baseName: string,
  count: number,
  delayMs: number,
): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) await page.waitForTimeout(delayMs);
    const p = await takeScreenshot(page, testInfo, scenario, `${baseName}-${i + 1}`);
    paths.push(p);
  }
  return paths;
}

export async function navigateToGame(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByText('Start Training').click();
  await page.getByText('$25').waitFor({ state: 'visible', timeout: 5000 });
}

export async function placeBetAndDeal(page: Page, chipValue: '$5' | '$25' | '$100' | '$500' = '$25'): Promise<void> {
  await page.getByText(chipValue, { exact: true }).click();
  await page.getByText('Deal', { exact: true }).click();
  await page.waitForTimeout(800);
}

export async function waitForPhase(
  page: Page,
  phase: 'betting' | 'player_turn' | 'dealer_turn' | 'complete',
  timeout = 15_000,
): Promise<void> {
  switch (phase) {
    case 'betting':
      await page.getByText('Deal', { exact: true }).waitFor({ state: 'visible', timeout });
      break;
    case 'player_turn':
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout });
      break;
    case 'dealer_turn':
      await page.getByText('Dealer playing', { exact: false }).waitFor({ state: 'visible', timeout });
      break;
    case 'complete':
      await page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout });
      break;
  }
}

export async function dismissStrategyModal(page: Page): Promise<void> {
  try {
    const playAnyways = page.getByText('Play Anyways');
    await playAnyways.waitFor({ state: 'visible', timeout: 800 });
    await playAnyways.click();
    await page.waitForTimeout(300);
    return;
  } catch { /* not in block mode or no modal */ }
  try {
    const gotIt = page.getByText('Got It');
    await gotIt.waitFor({ state: 'visible', timeout: 800 });
    await gotIt.click();
    await page.waitForTimeout(300);
  } catch { /* no modal */ }
}

export async function playQuickHand(page: Page): Promise<void> {
  await placeBetAndDeal(page);
  try {
    await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 3000 });
    await page.getByText('Stand', { exact: true }).click();
    await page.waitForTimeout(300);
    await dismissStrategyModal(page);
  } catch {
    // Might have gone straight to complete (natural)
  }
  await waitForPhase(page, 'complete');
  await page.getByText('Next Hand', { exact: true }).click();
  await waitForPhase(page, 'betting');
}

export async function dealUntilCondition(
  page: Page,
  conditionFn: (page: Page) => Promise<boolean>,
  maxAttempts = 50,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await placeBetAndDeal(page);

    await Promise.race([
      page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.getByText('Next Hand', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(300);

    const matched = await conditionFn(page);
    if (matched) return true;

    try {
      await page.getByText('Hit', { exact: true }).waitFor({ state: 'visible', timeout: 1000 });
      await page.getByText('Stand', { exact: true }).click();
      await page.waitForTimeout(300);
      await dismissStrategyModal(page);
    } catch {
      // Already complete
    }
    await waitForPhase(page, 'complete');
    await page.getByText('Next Hand', { exact: true }).click();
    await waitForPhase(page, 'betting');
  }
  return false;
}

export async function openSettings(page: Page): Promise<void> {
  await page.getByText('Settings').click();
  await page.waitForTimeout(300);
}

export async function closeSettings(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
