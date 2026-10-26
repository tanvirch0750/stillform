'use client';

import { useEffect, useState } from 'react';
import { readDemoReceipt, type DemoReceipt } from '../../lib/cart-store';
import BagItems from './BagItems';
import OrderSummary from './OrderSummary';
import { ArrowIcon, CheckIcon } from './Icons';

export default function ConfirmationPage() {
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReceipt(readDemoReceipt()); setReady(true); }, []);
  if (!ready) return <main className="shop-page shop-loading" role="status">Preparing your sample receipt…</main>;
  if (!receipt) return <main className="shop-page"><div className="shop-page-empty"><p className="shop-eyebrow">THE DEMO EDIT</p><h1>YOUR STORY STARTS WITH A PIECE.</h1><p>No demo receipt was found in this session. Explore the collection and try checkout.</p><a className="shop-button" href="/products/all">EXPLORE THE COLLECTION <ArrowIcon /></a></div></main>;
  return <main className="shop-page shop-confirmation"><div className="shop-confirmation-heading"><span className="shop-confirmation-check"><CheckIcon width="30" height="30" /></span><p className="shop-eyebrow">03 / ALL SET — DEMO COMPLETE</p><h1>GOOD CHOICES.<br />GREAT EVERYDAY.</h1><p>Your demo checkout is complete.</p><div className="shop-demo-banner"><strong>NO PAYMENT TAKEN. NO ORDER CREATED.</strong><span>This is a sample receipt only. Nothing will ship, and no confirmation email has been sent.</span></div></div><section className="shop-receipt"><div className="shop-receipt-heading"><h2>YOUR DEMO RECEIPT</h2><span>{receipt.id}</span></div><BagItems items={receipt.items} editable={false} /><OrderSummary items={receipt.items} code={receipt.code} shipping={receipt.delivery === 'express' ? 1200 : 0} discountInput={false} /><p className="shop-demo-note">Only product selections and simulated totals are kept for this browser session. Contact, delivery, and payment details are not stored.</p></section><a className="shop-button" href="/products/all">BACK TO THE COLLECTION <ArrowIcon /></a></main>;
}
