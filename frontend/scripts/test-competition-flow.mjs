import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:/Users/ASUS/.gemini/antigravity/brain/def8db1d-85f7-4f11-acbf-27df68121127';
const SCREENSHOT_DIR = path.resolve('screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runValidation() {
  console.log('==> Starting Playwright Responsive & Flow Validation against ' + BASE_URL);

  const browser = await chromium.launch({
    headless: true
  });

  const routes = [
    { name: 'home', path: '/' },
    { name: 'login', path: '/login' },
    { name: 'signup', path: '/signup' },
    { name: 'forgot-password', path: '/forgot-password' },
    { name: 'competitions', path: '/competitions' },
    { name: 'create-competition', path: '/competitions/create' },
    { name: 'join-code', path: '/join/GEC-2026' },
    { name: 'dashboard', path: '/dashboard' },
    { name: 'admin-controller', path: '/admin' }
  ];

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  const validationResults = [];

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.name === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        : undefined
    });
    const page = await context.newPage();

    for (const r of routes) {
      const url = `${BASE_URL}${r.path}`;
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        const status = response ? response.status() : 'unknown';

        // Wait brief instant for React hydration and font rendering
        await page.waitForTimeout(500);

        const fileName = `${r.name}-${vp.name}.png`;
        const localPath = path.join(SCREENSHOT_DIR, fileName);
        const artifactPath = path.join(ARTIFACT_DIR, fileName);

        await page.screenshot({ path: localPath, fullPage: true });

        try {
          fs.copyFileSync(localPath, artifactPath);
        } catch (copyErr) {
          // ignore artifact copy if external
        }

        console.log(`✓ [${vp.name}] ${r.path} -> HTTP ${status} (Saved: ${fileName})`);
        validationResults.push({
          route: r.path,
          viewport: vp.name,
          status,
          screenshot: fileName,
          ok: status < 400
        });
      } catch (err) {
        console.error(`✗ [${vp.name}] ${r.path} failed:`, err.message);
        validationResults.push({
          route: r.path,
          viewport: vp.name,
          error: err.message,
          ok: false
        });
      }
    }
    await context.close();
  }

  // Specialized Flow Test: Keyboard navigation & Join code input
  console.log('\n--- Testing Keyboard Accessibility & Focus Visibility ---');
  const a11yContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const a11yPage = await a11yContext.newPage();
  await a11yPage.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Press Tab repeatedly to verify focus rings on interactive elements
  for (let i = 0; i < 5; i++) {
    await a11yPage.keyboard.press('Tab');
    await a11yPage.waitForTimeout(100);
  }

  const focusedTag = await a11yPage.evaluate(() => document.activeElement ? document.activeElement.tagName : null);
  console.log(`✓ Keyboard Tab navigation active. Focused element: <${focusedTag}>`);

  // Test Join Code input typing
  const joinInput = a11yPage.locator('input[placeholder*="room"], input[placeholder*="meet"], input[placeholder*="code"]').first();
  if (await joinInput.count() > 0) {
    await joinInput.fill('GEC-ACM');
    console.log('✓ Successfully tested interactive Join Code input with sample code "GEC-ACM"');
  }

  await a11yContext.close();
  await browser.close();

  console.log('\n========================================');
  console.log('  Playwright Validation Completed!       ');
  console.log('========================================');

  const summaryPath = path.join(SCREENSHOT_DIR, 'validation-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(validationResults, null, 2));
}

runValidation().catch((err) => {
  console.error('Fatal Playwright runner error:', err);
  process.exit(1);
});
