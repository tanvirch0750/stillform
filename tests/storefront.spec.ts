import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../reference-manifest.json', import.meta.url), 'utf8')) as { routes: string[]; failures: unknown[] };

async function openStorefront(page: Page, route = '/') {
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true', { timeout: 20_000 });
}

test('all captured routes are available', async ({ request }) => {
  expect(manifest.failures).toEqual([]);
  for (const route of manifest.routes) {
    const response = await request.get(route);
    // Next reserves /404 in production; its branded document correctly uses
    // HTTP 404 there, while the development catch-all can return HTTP 200.
    if (route === '/404') expect([200, 404], route).toContain(response.status());
    else expect(response.ok(), route).toBeTruthy();
    const html = await response.text();
    expect(html, route).toContain('/_next/');
    const expected = readFileSync(new URL(`../site${route === '/' ? '' : route}/index.html`, import.meta.url), 'utf8');
    expect(html.match(/data-framer-hydrate-v2="([^"]+)"/)?.[1], route).toBe(expected.match(/data-framer-hydrate-v2="([^"]+)"/)?.[1]);
  }
});

test('Next.js server-renders the product before JavaScript runs', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/products/riverfield-hoodie`);
  await expect(page.locator('[data-reference-document]')).toHaveAttribute('data-reference-document', '/products/riverfield-hoodie');
  await expect(page.getByRole('heading', { name: 'RIVERFIELD HOODIE', exact: true }).first()).toBeVisible();
  await expect(page.locator('a[href="#checkout"]')).toBeVisible();
  await context.close();
});

test('homepage loads images and animations without remote services', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://**/*', (route) => route.abort());
  await openStorefront(page);
  await expect(page.getByRole('heading', { name: 'Latest arrivals', exact: true })).toBeVisible();
  const card = page.locator('[data-framer-name="3DContainer"]');
  await expect(card).toBeVisible();
  await expect.poll(async () => card.getAttribute('style')).toContain('rotateY');
  const initialTransform = await card.getAttribute('style');
  await expect.poll(async () => card.getAttribute('style')).not.toBe(initialTransform);
  await page.evaluate(() => Promise.all([...document.images].filter((image) => !image.loading || image.loading !== 'lazy').map((image) => image.decode().catch(() => undefined))));
  const broken = await page.locator('img').evaluateAll((images) => images.filter((image): image is HTMLImageElement => image instanceof HTMLImageElement).filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test('navigation opens and a collection works', async ({ page }) => {
  await openStorefront(page);
  await expect.poll(async () => page.locator('[data-framer-name="3DContainer"]').getAttribute('style')).toContain('rotateY');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  const hoodies = page.locator('nav').getByRole('link', { name: 'HOODIES', exact: true });
  await expect(hoodies).toBeVisible();
  await hoodies.click();
  await expect(page).toHaveURL(/\/products\/hoodies\/?$/);
  await expect(page.getByRole('heading', { name: 'RIVERFIELD HOODIE', exact: true }).first()).toBeVisible();
});

test('client transitions and browser Back preserve a single animation runtime', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openStorefront(page);
  await page.locator('a[href="./products/silent-horizon-shirt"]').first().click();
  await expect(page).toHaveURL(/\/products\/silent-horizon-shirt$/);
  await expect(page.getByRole('heading', { name: 'SILENT HORIZON SHIRT', exact: true }).first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect(page.getByRole('heading', { name: 'Latest arrivals', exact: true })).toBeVisible();
  await expect(page.locator('script[data-framer-bundle="main"]')).toHaveCount(1);
  await expect(page.locator('#main')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('local search filters products and closes with Escape', async ({ page }) => {
  await openStorefront(page);
  await page.getByRole('button', { name: 'Search Icon' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search products' }).fill('riverfield');
  await expect(dialog.locator('.dc-result')).toHaveCount(1);
  await expect(dialog.getByRole('link', { name: 'RIVERFIELD HOODIE' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('purchase requires size and opens the local shopping bag', async ({ page }) => {
  await openStorefront(page, '/products/riverfield-hoodie');
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.locator('.shop-size-error[role="alert"]')).toContainText('Choose your size');
  await page.getByRole('button', { name: 'Size M', exact: true }).click();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('YOUR BAG (1)');
  await expect(page.getByRole('dialog')).toContainText('no real charges');
  await expect(page).toHaveURL(/\/products\/riverfield-hoodie\/?$/);
});

test('newsletter is explicit about unconfigured delivery', async ({ page }) => {
  const externalPosts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).origin !== new URL(page.url()).origin) externalPosts.push(request.url());
  });
  await openStorefront(page);
  const input = page.locator('input[type="email"]').first();
  await input.fill('test@example.com');
  await input.locator('xpath=ancestor::form').getByRole('button').click();
  await expect(page.getByRole('dialog')).toContainText('Your email has not been submitted or stored');
  expect(externalPosts).toEqual([]);
});

test('no horizontal page overflow', async ({ page }) => {
  for (const route of ['/', '/products/all', '/products/riverfield-hoodie', '/aboutus', '/contactus', '/faq']) {
    await openStorefront(page, route);
    const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(dimensions.content, route).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});

test('FAQ expands and collapses with the reference animation', async ({ page }) => {
  await openStorefront(page);
  await expect.poll(async () => page.locator('[data-framer-name="3DContainer"]').getAttribute('style')).toContain('rotateY');
  const question = page.getByRole('heading', { name: 'How do I place an order?', exact: true });
  const item = question.locator('xpath=ancestor::*[@tabindex="0"][1]');
  const closedHeight = (await item.boundingBox())!.height;
  await question.click();
  await expect.poll(async () => (await item.boundingBox())!.height).toBeGreaterThan(closedHeight + 20);
  await question.click();
  await expect.poll(async () => (await item.boundingBox())!.height).toBeLessThanOrEqual(closedHeight + 1);
});

test('directory URLs normalize before relative navigation', async ({ page }) => {
  await openStorefront(page, '/products/riverfield-hoodie/');
  await expect(page).toHaveURL(/\/products\/riverfield-hoodie$/);
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeVisible();
});

test('unknown routes display the branded 404', async ({ page }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('body')).toContainText('404');
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true', { timeout: 20_000 });
});
