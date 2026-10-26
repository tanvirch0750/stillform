'use client';

import { useBag } from '../../lib/cart-store';
import BagItems from './BagItems';
import OrderSummary from './OrderSummary';
import { ArrowIcon, BagIcon, LockIcon } from './Icons';

export function EmptyBag({ checkout = false }: { checkout?: boolean }) {
  return <div className="shop-page-empty"><BagIcon width="48" height="48" /><p className="shop-eyebrow">A FRESH START</p><h1>{checkout ? 'FIRST, FIND YOUR FAVORITES.' : 'YOUR NEXT FAVORITE IS OUT THERE.'}</h1><p>Your bag is empty. Discover pieces made for your everyday.</p><a className="shop-button" href="/products/all">EXPLORE THE COLLECTION <ArrowIcon /></a></div>;
}

export default function CartPage() {
  const bag = useBag();
  if (!bag.ready) return <main className="shop-page shop-loading" role="status">Loading your bag…</main>;
  if (!bag.items.length) return <main className="shop-page"><EmptyBag /></main>;
  const count = bag.items.reduce((sum, item) => sum + item.quantity, 0);
  return <main className="shop-page shop-cart-page">
    <div className="shop-page-heading"><div><p className="shop-eyebrow">01 / THE BAG</p><h1>YOUR BAG<span> ({count})</span></h1></div><p>Good choices.<br />Great everyday pieces.</p></div>
    <div className="shop-cart-grid"><section aria-label="Shopping bag items"><div className="shop-list-header"><span>YOUR PIECES</span><span>PRICE</span></div><BagItems items={bag.items} /><a className="shop-continue" href="/products/all"><ArrowIcon /> KEEP EXPLORING</a>{!bag.persistent && <p className="shop-storage-note">Your browser cannot save this bag between visits.</p>}</section>
      <aside className="shop-summary-card"><p className="shop-eyebrow">THE DETAILS</p><h2>ORDER SUMMARY</h2><OrderSummary items={bag.items} code={bag.code} /><a href="/checkout" className="shop-button">CONTINUE TO CHECKOUT <ArrowIcon /></a><p className="shop-assurance"><LockIcon width="15" height="15" /> Demo checkout. No payment required.</p><div className="shop-summary-footnote">A LITTLE EXTRA<br /><span>Try <strong>WINTER50</strong> for 50% off your demo pieces.</span></div></aside>
    </div>
  </main>;
}
