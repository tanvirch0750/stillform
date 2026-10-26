/** Compare stable layout geometry; moving animation frames are not pixel-equality claims. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
const sections = ['HeroSection', 'Latest', 'Banner', 'Overshirts', 'Hoodies', 'AboutDripCase', 'Sweatshirts', 'CustomerReviews', "FAQ's", 'USP', 'Footer'];
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1000, height: 900 }, { width: 390, height: 844 }]) {
    const captures = [];
    for (const url of ['https://dripcase.framer.website/', process.env.LOCAL_URL || 'http://localhost:3000/']) {
      const page = await browser.newPage({ viewport });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2500);
      captures.push(await page.evaluate((names) => names.map((name) => {
        const element = [...document.querySelectorAll('[data-framer-name]')].find((element) => element.getAttribute('data-framer-name') === name && element.getBoundingClientRect().width > 0);
        if (!element) return { name, missing: true };
        const rect = element.getBoundingClientRect();
        return { name, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }), sections));
      await page.close();
    }
    const comparisons = captures[0].map((reference, index) => {
      const local = captures[1][index];
      if (reference.missing || local.missing) return { section: reference.name, missing: true, passed: false };
      const maxDelta = Math.max(...['x', 'y', 'width', 'height'].map((key) => Math.abs(reference[key] - local[key])));
      return { section: reference.name, maxDelta, passed: maxDelta <= 1 };
    });
    results.push({ viewport, comparisons });
  }
} finally { await browser.close(); }
const passed = results.every((result) => result.comparisons.every((comparison) => comparison.passed));
const report = { checkedAt: new Date().toISOString(), scope: 'Stable homepage section geometry, not full animation/pixel equality', passed, results };
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/visual-parity.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
