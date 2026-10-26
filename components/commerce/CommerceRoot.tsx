'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getProduct, getProductByRoute, money, totals, type Product } from '../../lib/catalog';
import { closePanel, initializeBag, openBag, openQuickAdd, useBag } from '../../lib/cart-store';
import BagButton from './BagButton';
import BagItems from './BagItems';
import ProductPurchase from './ProductPurchase';
import { ArrowIcon, BagIcon, CloseIcon } from './Icons';
import { isStorefrontHydrated } from '../../lib/storefront-hydration';

interface ProductSlot { element: HTMLElement; product: Product }
interface Slots { nav: HTMLElement | null; purchase: ProductSlot | null; quick: ProductSlot[] }

/** The only bridge into the frozen storefront. Never changes generated bundles. */
function StorefrontBridge() {
  const [slots, setSlots] = useState<Slots>({ nav: null, purchase: null, quick: [] });
  useEffect(() => {
    let frame = 0;
    const mounts = new Set<HTMLElement>();
    const modified = new Set<HTMLElement>();
    const visible = (element: Element) => element.getBoundingClientRect().width > 0;
    function mount(parent: HTMLElement, name: string, before?: Element) {
      let element = [...parent.children].find((child) => child.getAttribute('data-shop-slot') === name) as HTMLElement | undefined;
      if (!element) {
        element = document.createElement('div');
        element.dataset.shopSlot = name;
        element.className = `shop-slot shop-slot-${name}`;
        if (before) parent.insertBefore(element, before); else parent.append(element);
        mounts.add(element);
      }
      return element;
    }
    function mark(element: HTMLElement, name: string) { element.setAttribute(name, ''); modified.add(element); }
    function scan() {
      frame = 0;
      if (document.documentElement.dataset.storefrontReady !== 'true') return;
      // Check the actual product/card boundaries as well as the navbar before
      // modifying the second React tree, on initial load AND client navigation.
      if (!isStorefrontHydrated()) {
        if (document.getElementById('main')) frame = requestAnimationFrame(scan);
        return;
      }
      const nav = [...document.querySelectorAll<HTMLElement>('#main nav [data-framer-name="IconsWrap"]')].find(visible);
      let navMount: HTMLElement | null = null;
      if (nav) {
        navMount = mount(nav, 'bag');
        const header = nav.closest<HTMLElement>('[data-framer-name="Logo+Icons"]');
        if (header) {
          mark(header, 'data-shop-nav');
          const logo = header.querySelector('a')?.parentElement;
          if (logo && logo !== header) mark(logo, 'data-shop-logo');
        }
        mark(nav, 'data-shop-nav-icons');
      }
      const product = getProductByRoute(window.location.pathname);
      const size = [...document.querySelectorAll<HTMLElement>('#main [data-framer-name="Size"]')].find((element) => visible(element) || (element.hasAttribute('data-shop-legacy') && !!element.parentElement && visible(element.parentElement)));
      let purchase: ProductSlot | null = null;
      if (product && size?.parentElement) {
        const heading = size.parentElement.querySelector('h2');
        if (heading?.textContent?.trim() === product.name) {
          purchase = { element: mount(size.parentElement, 'purchase', size), product };
          mark(size, 'data-shop-legacy');
          const buttons = size.nextElementSibling;
          if (buttons instanceof HTMLElement && buttons.getAttribute('data-framer-name') === 'Buttons') mark(buttons, 'data-shop-legacy');
        }
      }
      const quick: ProductSlot[] = [];
      for (const anchor of document.querySelectorAll<HTMLAnchorElement>('#main a[href]')) {
        const url = new URL(anchor.getAttribute('href')!, window.location.href);
        const candidate = getProductByRoute(url.pathname);
        // Named Hover/Front layers identify product image cards, not hero/text links.
        if (!candidate || !visible(anchor) || !anchor.querySelector('[data-framer-name="Hover"]') || !anchor.parentElement) continue;
        mark(anchor.parentElement, 'data-shop-card');
        const element = mount(anchor.parentElement, `quick-${candidate.id}-${quick.length}`);
        const rect = anchor.getBoundingClientRect();
        const parentRect = anchor.parentElement.getBoundingClientRect();
        element.style.left = `${rect.right - parentRect.left - 48}px`;
        element.style.top = `${rect.top - parentRect.top + 12}px`;
        quick.push({ element, product: candidate });
      }
      for (const element of mounts) if (element.dataset.shopSlot?.startsWith('quick-') && !quick.some((slot) => slot.element === element)) { element.remove(); mounts.delete(element); }
      document.documentElement.dataset.commerceMounted = 'true';
      setSlots((previous) => {
        if (previous.nav === navMount && previous.purchase?.element === purchase?.element && previous.purchase?.product.id === purchase?.product.id && previous.quick.length === quick.length && previous.quick.every((slot, index) => slot.element === quick[index].element && slot.product.id === quick[index].product.id)) return previous;
        return { nav: navMount, purchase, quick };
      });
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(scan); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    const readiness = new MutationObserver(schedule);
    readiness.observe(document.documentElement, { attributes: true, attributeFilter: ['data-storefront-ready'] });
    const legacyBuy = () => {
      const product = getProductByRoute(window.location.pathname);
      if (product) openQuickAdd(product.id); else openBag();
    };
    document.documentElement.dataset.commerceReady = 'true';
    window.addEventListener('dripcase:buy-now', legacyBuy);
    window.addEventListener('popstate', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('framer:pageview', schedule);
    schedule();
    return () => {
      observer.disconnect(); readiness.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('dripcase:buy-now', legacyBuy);
      window.removeEventListener('popstate', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('framer:pageview', schedule);
      delete document.documentElement.dataset.commerceReady;
      delete document.documentElement.dataset.commerceMounted;
      // Portals can be removed by Framer during a route/breakpoint change. The
      // observer reconnects them without resetting the bag or animation app.
      mounts.forEach((element) => element.remove());
      modified.forEach((element) => ['data-shop-legacy', 'data-shop-nav', 'data-shop-logo', 'data-shop-nav-icons', 'data-shop-card'].forEach((name) => element.removeAttribute(name)));
    };
  }, []);

  return <>
    {slots.nav && createPortal(<BagButton />, slots.nav)}
    {slots.purchase && createPortal(<ProductPurchase key={slots.purchase.product.id} product={slots.purchase.product} />, slots.purchase.element)}
    {slots.quick.map((slot) => createPortal(<button type="button" className="shop-quick-add" aria-label={`Quick add ${slot.product.name}`} onClick={() => openQuickAdd(slot.product.id)}><span aria-hidden="true">+</span><span className="shop-quick-add-label">QUICK ADD</span></button>, slot.element, slot.element.dataset.shopSlot))}
  </>;
}

export default function CommerceRoot() {
  const bag = useBag();
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const isOpen = !!bag.panel;
  useEffect(initializeBag, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!isOpen) { if (element.open) element.close(); return; }
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
    };
  }, [isOpen]);
  useEffect(() => { if (isOpen) dialog.current?.querySelector<HTMLButtonElement>('.shop-dialog-close')?.focus(); }, [bag.panel, isOpen]);

  const count = bag.items.reduce((sum, item) => sum + item.quantity, 0);
  const product = bag.panel && 'productId' in bag.panel ? getProduct(bag.panel.productId) : undefined;
  const title = bag.panel?.kind === 'bag' ? `YOUR BAG (${count})` : bag.panel?.kind === 'guide' ? 'SIZE & FIT' : 'A CLOSER LOOK';

  return <>
    <StorefrontBridge />
    <dialog ref={dialog} className={`shop-dialog ${bag.panel?.kind === 'bag' ? 'shop-bag-dialog' : 'shop-product-dialog'}`} aria-labelledby="shop-dialog-title" onCancel={(event) => { event.preventDefault(); closePanel(); }} onClose={closePanel} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePanel();
    }}>
      <div className="shop-dialog-header"><h2 id="shop-dialog-title">{title}</h2><button type="button" className="shop-icon-button shop-dialog-close" aria-label="Close shopping panel" onClick={closePanel}><CloseIcon /></button></div>
      {bag.panel?.kind === 'bag' && <>
        <div className="shop-drawer-body">{bag.items.length ? <BagItems items={bag.items} compact /> : <div className="shop-empty"><BagIcon width="42" height="42" /><h3>ROOM FOR SOMETHING GOOD.</h3><p>Your everyday essentials are waiting.</p><a className="shop-button" href="/products/all">EXPLORE THE COLLECTION <ArrowIcon /></a></div>}</div>
        {bag.items.length > 0 && <div className="shop-drawer-footer"><div className="shop-drawer-subtotal"><span>SUBTOTAL</span><strong>{money(totals(bag.items, null).subtotal)}</strong></div><p>Complimentary standard delivery. Discounts applied at checkout.</p><a href="/checkout" className="shop-button">CHECKOUT <ArrowIcon /></a><a href="/cart" className="shop-view-bag">VIEW YOUR BAG</a><span className="shop-demo-note">Demo store — no real charges.</span></div>}
        {!bag.persistent && <p className="shop-storage-note" role="status">Browser storage is unavailable. Your bag is saved for this visit only. Refreshing or leaving this page will clear it; enable browser storage to continue to checkout.</p>}
      </>}
      {bag.panel?.kind === 'quick' && product && <div className="shop-quick-content"><img className="shop-quick-image" src={product.image} alt={product.name} width="480" height="600" /><ProductPurchase key={product.id} product={product} quick /></div>}
      {bag.panel?.kind === 'guide' && <div className="shop-fit-guide"><p className="shop-eyebrow">A LITTLE GUIDANCE. A BETTER FIT.</p><h3>MAKE IT YOUR OWN.</h3><p>Fit is personal. Start with the product’s description, then think about how you like to wear your layers.</p><ol><li><strong>Check the silhouette.</strong> Review the fit and details on the product page.</li><li><strong>Consider your layers.</strong> Leave room for the pieces you wear underneath.</li><li><strong>Compare a favorite.</strong> Use an item you already own as a reference.</li></ol><p className="shop-demo-note">Garment measurements and live size availability have not been provided for this demo. No measurement chart is being invented.</p>{product && <button className="shop-button" type="button" onClick={() => openQuickAdd(product.id)}>BACK TO SIZE SELECTION <ArrowIcon /></button>}</div>}
    </dialog>
  </>;
}
