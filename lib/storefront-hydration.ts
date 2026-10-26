'use client';

/** Compatibility boundary for the frozen React root. A hydrated header alone
 * does not mean the page's Suspense boundaries have committed. Inserting portal
 * nodes into those boundaries early causes recovery/remounts and dropped clicks.
 */
export function isStorefrontHydrated() {
  const main = document.getElementById('main');
  if (!main) return false;
  const hasFiber = (element: Element) => Object.keys(element).some((key) => key.startsWith('__reactFiber$'));
  const visible = (element: Element) => element.getBoundingClientRect().width > 0;
  const menu = [...main.querySelectorAll('nav [data-framer-name="Menu"][tabindex="0"]')].find(visible);
  if (!menu || !hasFiber(menu)) return false;
  const targets = [...main.querySelectorAll('[data-framer-name="Size"], [data-framer-name="ProductDetails"], [data-highlight][tabindex], a[data-framer-name]')];
  for (const anchor of main.querySelectorAll('a')) {
    if (anchor.querySelector('[data-framer-name="Hover"]')) targets.push(anchor);
  }
  return targets.filter(visible).every(hasFiber);
}
