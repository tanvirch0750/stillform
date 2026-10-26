import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../reference-manifest.json', import.meta.url), 'utf8')) as { routes: string[] };

test('every reference and commerce page has Stillform server metadata', async ({ request }) => {
  for (const route of [...manifest.routes, '/cart', '/checkout', '/order-confirmation']) {
    const response = await request.get(route);
    const html = await response.text();
    expect(html.match(/<title>(.*?)<\/title>/)?.[1], route).toContain('Stillform');
    const visibleMarkup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
    expect(visibleMarkup, route).not.toMatch(/\b(?:Dripcase|DripCase|DRIPCASE|DRPCASE)\b/);
    expect(html, route).toContain('/brand/stillform-icon.svg');
  }
});

test('brand survives hydration and navigation, including the renamed sweatshirt', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true', { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Stillform home' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latest arrivals', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/\b(?:DripCase|Dripcase|DRIPCASE|DRPCASE)\b/);
  await page.locator('a[href="./products/drpcase-sweatshirt"]').first().click();
  await expect(page).toHaveURL(/\/products\/drpcase-sweatshirt$/);
  await expect(page.getByRole('heading', { name: 'STILLFORM SWEATSHIRT', exact: true }).first()).toBeVisible();
  await expect(page).toHaveTitle(/Stillform/);
  await page.getByRole('button', { name: 'Size M', exact: true }).click();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('STILLFORM SWEATSHIRT');
  expect(errors).toEqual([]);
});

test('search and native commerce use the Stillform identity', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true', { timeout: 20_000 });
  await page.getByRole('button', { name: 'Search Icon' }).click();
  await expect(page.getByRole('dialog')).toContainText('SEARCH STILLFORM');
  await page.getByRole('searchbox', { name: 'Search products' }).fill('stillform');
  await expect(page.getByRole('dialog').getByRole('link', { name: 'STILLFORM SWEATSHIRT' })).toBeVisible();
  await page.goto('/cart');
  await expect(page.getByRole('link', { name: 'Stillform home' })).toBeVisible();
  await expect(page.locator('.shop-brand img')).toHaveAttribute('src', '/brand/stillform-wordmark.svg');
  await expect(page.locator('footer')).toContainText('STILLFORM');
});

test('fresh CMS records fetched after an informational page stay rebranded', async ({ page }) => {
  await page.goto('/contactus');
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true', { timeout: 20_000 });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.locator('nav').getByRole('link', { name: 'SWEATSHIRTS', exact: true }).click();
  await expect(page).toHaveURL(/\/products\/sweatshirts$/);
  await page.locator('a[href="./drpcase-sweatshirt"]').first().click();
  await expect(page.getByRole('heading', { name: 'STILLFORM SWEATSHIRT', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('DRPCASE');
});
