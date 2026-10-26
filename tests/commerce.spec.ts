import { expect, test, type Page } from '@playwright/test';

const product = '/products/riverfield-hoodie';
const item = 'riverfield-hoodie:M';
const bagKey = 'dripcase:bag:v1';

async function openProduct(page: Page) {
  await page.goto(product);
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeVisible();
}

async function add(page: Page, size = 'M') {
  await page.getByRole('button', { name: `Size ${size}`, exact: true }).click();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function seed(page: Page, items = [{ productId: 'riverfield-hoodie', size: 'M', quantity: 1 }]) {
  await page.goto('/cart');
  await page.evaluate(({ bagKey, items }) => localStorage.setItem(bagKey, JSON.stringify({ version: 1, items, code: null })), { bagKey, items });
  await page.reload();
  await expect(page.locator('[data-bag-item]').first()).toBeVisible();
}

test('sizes, merging, quantities, size edits and persistence work', async ({ page }) => {
  await openProduct(page);
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.locator('.shop-size-error[role="alert"]')).toContainText('Choose your size');
  await add(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText('YOUR BAG (1)');
  await page.getByRole('button', { name: 'Close shopping panel' }).click();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText('YOUR BAG (2)');
  await expect(dialog.locator('[data-bag-item]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close shopping panel' }).click();
  await add(page, 'L');
  await expect(dialog.locator('[data-bag-item]')).toHaveCount(2);
  await dialog.getByRole('link', { name: 'VIEW YOUR BAG', exact: true }).click();
  await page.reload();
  const medium = page.locator(`[data-bag-item="${item}"]`);
  await expect(medium).toContainText('$258.00');
  await medium.getByRole('button', { name: /Increase quantity/ }).click();
  await expect(medium).toContainText('$387.00');
  await medium.getByRole('button', { name: /Decrease quantity/ }).click();
  await medium.getByRole('combobox').selectOption('L');
  await expect(page.locator('[data-bag-item]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'YOUR BAG (3)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Remove RIVERFIELD/ }).click();
  await expect(page.getByRole('heading', { name: 'YOUR NEXT FAVORITE IS OUT THERE.' })).toBeVisible();
});

test('navbar bag is centered alongside logo, keyboard dismisses and focus returns', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Open shopping bag, 0 items' });
  await expect(button).toBeVisible();
  const center = await page.locator('nav a').first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return Math.abs(rect.x + rect.width / 2 - innerWidth / 2);
  });
  expect(center).toBeLessThan(2);
  await button.click();
  await expect(page.getByRole('dialog')).toContainText('ROOM FOR SOMETHING GOOD.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});

test('collection Quick Add requires a size and fit guide invents no measurements', async ({ page }) => {
  await page.goto('/products/hoodies');
  const quick = page.getByRole('button', { name: 'Quick add RIVERFIELD HOODIE', exact: true });
  const card = page.locator('[data-shop-card]').filter({ has: quick });
  await card.hover();
  await quick.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('RIVERFIELD HOODIE');
  await dialog.getByRole('button', { name: 'Size & fit', exact: true }).click();
  await expect(dialog).toContainText('No measurement chart is being invented');
  await dialog.getByRole('button', { name: 'BACK TO SIZE SELECTION' }).click();
  await dialog.getByRole('button', { name: 'Size S', exact: true }).click();
  await dialog.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText('YOUR BAG (1)');
});

test('Buy Now saves the selected variant and goes to demo checkout', async ({ page }) => {
  await openProduct(page);
  await page.getByRole('button', { name: 'Size XL', exact: true }).click();
  await page.getByRole('button', { name: 'BUY NOW', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.locator('[data-bag-item="riverfield-hoodie:XL"]')).toContainText('Size XL');
  await expect(page.locator('.shop-demo-banner')).toContainText('No charges');
});

test('discounts and delivery totals use integer cents and do not stack', async ({ page }) => {
  await seed(page);
  await page.getByRole('textbox', { name: 'DISCOUNT CODE' }).fill('nope');
  await page.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page.locator('#shop-discount-error')).toContainText('Try WINTER50');
  await page.getByRole('textbox', { name: 'DISCOUNT CODE' }).fill(' winter50 ');
  await page.getByRole('button', { name: 'APPLY', exact: true }).click();
  await expect(page.locator('.shop-total')).toContainText('$64.50');
  await page.reload();
  await expect(page.locator('.shop-total')).toContainText('$64.50');
  await page.getByRole('link', { name: 'CONTINUE TO CHECKOUT' }).click();
  await page.getByRole('radio', { name: /Express delivery/ }).check();
  await expect(page.locator('.shop-total')).toContainText('$76.50');
  await page.getByRole('button', { name: 'Remove discount code' }).click();
  await expect(page.locator('.shop-total')).toContainText('$141.00');
});

test('demo validates form, creates sample receipt, clears bag and never sends or saves PII', async ({ page }) => {
  await seed(page);
  await page.goto('/checkout');
  const submissions: string[] = [];
  page.on('request', (request) => { if (request.method() !== 'GET') submissions.push(request.url()); });
  await expect(page.locator('input[autocomplete^="cc-"]')).toHaveCount(0);
  const submit = page.getByRole('button', { name: /PLACE DEMO ORDER/ });
  await submit.click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.locator('input[name=email]')).toBeFocused();
  await page.locator('input[name=email]').fill('private-demo@example.com');
  await page.locator('input[name=firstName]').fill('Sampleperson');
  await page.locator('input[name=lastName]').fill('Demo');
  await page.locator('select[name=country]').selectOption('United States');
  await page.locator('input[name=address]').fill('123 Privacy Avenue');
  await page.locator('input[name=city]').fill('Demo City');
  await page.locator('input[name=postalCode]').fill('10012');
  await submit.click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole('checkbox').check();
  await submit.click();
  await expect(page).toHaveURL(/\/order-confirmation$/);
  await expect(page.locator('.shop-demo-banner')).toContainText('NO PAYMENT TAKEN. NO ORDER CREATED.');
  await expect(page.locator('.shop-receipt')).toContainText('RIVERFIELD HOODIE');
  await expect(page.getByRole('button', { name: 'Open shopping bag, 0 items' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.shop-receipt')).toContainText('$129.00');
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage).not.toContain('private-demo@example.com');
  expect(storage).not.toContain('Privacy Avenue');
  expect(storage).not.toContain('Sampleperson');
  expect(submissions).toEqual([]);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'YOUR NEXT FAVORITE IS OUT THERE.' })).toBeVisible();
});

test('empty checkout, absent receipt, corrupt storage and unknown variants are handled', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'FIRST, FIND YOUR FAVORITES.' })).toBeVisible();
  await page.goto('/order-confirmation');
  await expect(page.locator('main')).toContainText('No demo receipt was found');
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), bagKey);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'YOUR NEXT FAVORITE IS OUT THERE.' })).toBeVisible();
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ version: 1, items: [{ productId: 'missing', size: 'M', quantity: 2 }, { productId: 'riverfield-hoodie', size: 'NOPE', quantity: 1 }, { productId: 'riverfield-hoodie', size: 'M', quantity: -1 }, { productId: 'riverfield-hoodie', size: 'L', quantity: 999 }], code: 'FREE' })), bagKey);
  await page.reload();
  await expect(page.locator('[data-bag-item]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'YOUR BAG (99)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Increase quantity/ })).toBeDisabled();
  await expect(page.locator('.shop-total')).toContainText('$12,771.00');
});

test('bag synchronizes between tabs', async ({ page, context }) => {
  await seed(page);
  const other = await context.newPage();
  await other.goto('/cart');
  await expect(other.locator('[data-bag-item]')).toHaveCount(1);
  await page.getByRole('button', { name: /Increase quantity/ }).click();
  await expect(other.getByRole('heading', { name: 'YOUR BAG (2)', exact: true })).toBeVisible();
  await other.close();
});

test('blocked storage still allows an in-memory bag with an honest warning', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Storage disabled', 'SecurityError'); };
  });
  await openProduct(page);
  await add(page);
  await expect(page.getByRole('dialog')).toContainText('Your bag is saved for this visit only');
  await expect(page.getByRole('dialog').locator('[data-bag-item]')).toHaveCount(1);
});

test('navbar commerce reconnects after storefront navigation and viewport changes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open shopping bag, 0 items' })).toBeVisible();
  await page.locator('a[href="./products/silent-horizon-shirt"]').first().click();
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open shopping bag, 0 items' })).toHaveCount(1);
  await page.setViewportSize({ width: 820, height: 1000 });
  await expect(page.getByRole('button', { name: 'Open shopping bag, 0 items' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ADD TO BAG', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Size M', exact: true }).click();
  await page.getByRole('button', { name: 'ADD TO BAG', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('SILENT HORIZON SHIRT');
});

test('cart and checkout fit the viewport and use the Stillform wordmark', async ({ page }) => {
  await seed(page);
  for (const route of ['/cart', '/checkout']) {
    await page.goto(route);
    await expect(page.locator('.shop-brand img')).toHaveAttribute('src', '/brand/stillform-wordmark.svg');
    await expect(page.locator('[data-bag-item]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const summary = page.locator('.shop-summary-details');
    if (route === '/checkout') {
      await summary.locator('summary').click();
      await expect(summary).not.toHaveAttribute('open', '');
      await summary.locator('summary').click();
      await expect(summary).toHaveAttribute('open', '');
    }
  }
});
