'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { money, totals } from '../../lib/catalog';
import { createDemoReceipt, useBag } from '../../lib/cart-store';
import BagItems from './BagItems';
import OrderSummary from './OrderSummary';
import { EmptyBag } from './CartPage';
import { ArrowIcon, CheckIcon, LockIcon } from './Icons';

export default function CheckoutPage() {
  const bag = useBag();
  const router = useRouter();
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);
  const shipping = delivery === 'express' ? 1200 : 0;
  const amounts = totals(bag.items, bag.code, shipping);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true); setError('');
    // Browser constraint validation runs first. No FormData, API call, email,
    // address storage, payment SDK, or real order creation happens in this demo.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const receipt = createDemoReceipt(delivery);
    if (receipt) router.push('/order-confirmation');
    else { setError('Your bag is empty. Add a piece before placing a demo order.'); setSubmitting(false); submittingRef.current = false; }
  }

  if (!bag.ready) return <main className="shop-page shop-loading" role="status">Preparing checkout…</main>;
  if (!bag.items.length && !submitting) return <main className="shop-page"><EmptyBag checkout /></main>;
  return <main className="shop-page shop-checkout-page">
    <a className="shop-breadcrumb" href="/cart">BAG <span>/</span> <strong>CHECKOUT</strong></a>
    <div className="shop-page-heading"><div><p className="shop-eyebrow">02 / THE FINAL LAYER</p><h1>CHECKOUT.</h1></div><p>Your next everyday essentials.<br />One final step.</p></div>
    <div className="shop-demo-banner"><LockIcon width="19" height="19" /><div><strong>THIS IS A DEMO CHECKOUT.</strong><span>No charges, no payment details, and no shipment. Use sample contact and address details below.</span></div></div>
    <div className="shop-checkout-grid">
      <form className="shop-checkout-form" onSubmit={submit}>
        <fieldset disabled={submitting}><legend><span>01</span> CONTACT</legend><p className="shop-section-note">For the preview only. Nothing is sent or saved.</p><label className="shop-field">EMAIL ADDRESS<input type="email" name="email" autoComplete="off" placeholder="you@example.com" required maxLength={254} /></label></fieldset>
        <fieldset disabled={submitting}><legend><span>02</span> DELIVERY DETAILS</legend><div className="shop-field-grid">
          <label className="shop-field">FIRST NAME<input name="firstName" autoComplete="off" placeholder="First name" required maxLength={80} pattern=".*\S.*" /></label>
          <label className="shop-field">LAST NAME<input name="lastName" autoComplete="off" placeholder="Last name" required maxLength={80} pattern=".*\S.*" /></label>
          <label className="shop-field shop-field-full">COUNTRY / REGION<select name="country" required defaultValue=""><option value="" disabled>Select a country / region</option>{['United States', 'United Kingdom', 'Canada', 'Australia', 'Bangladesh', 'Other'].map((country) => <option key={country}>{country}</option>)}</select></label>
          <label className="shop-field shop-field-full">STREET ADDRESS<input name="address" autoComplete="off" placeholder="Street address" required maxLength={180} pattern=".*\S.*" /></label>
          <label className="shop-field shop-field-full">APARTMENT, SUITE, ETC. <span>(OPTIONAL)</span><input name="apartment" autoComplete="off" placeholder="Apartment, suite, etc." maxLength={80} /></label>
          <label className="shop-field">CITY<input name="city" autoComplete="off" placeholder="City" required maxLength={80} pattern=".*\S.*" /></label>
          <label className="shop-field">POSTAL CODE<input name="postalCode" autoComplete="off" placeholder="Postal code" required maxLength={20} pattern=".*\S.*" /></label>
          <label className="shop-field shop-field-full">STATE / REGION <span>(OPTIONAL)</span><input name="region" autoComplete="off" placeholder="State / region" maxLength={80} /></label>
        </div><p className="shop-section-note">Demo destinations only. No shipping address is transmitted or stored.</p></fieldset>
        <fieldset disabled={submitting}><legend><span>03</span> DELIVERY METHOD</legend><div className="shop-delivery-options">
          <label className={delivery === 'standard' ? 'is-selected' : ''}><input type="radio" name="delivery" value="standard" checked={delivery === 'standard'} onChange={() => setDelivery('standard')} /><span><strong>Standard delivery</strong><small>Sample option · no shipment created</small></span><strong>FREE</strong></label>
          <label className={delivery === 'express' ? 'is-selected' : ''}><input type="radio" name="delivery" value="express" checked={delivery === 'express'} onChange={() => setDelivery('express')} /><span><strong>Express delivery</strong><small>Sample option · no shipment created</small></span><strong>$12.00</strong></label>
        </div></fieldset>
        <fieldset disabled={submitting}><legend><span>04</span> PAYMENT</legend><div className="shop-demo-payment"><span className="shop-payment-icon"><CheckIcon /></span><div><strong>NO CARD. NO CHARGE.</strong><p>This is a demo payment method. We won’t ask for or collect payment information.</p></div><LockIcon /></div><label className="shop-acknowledge"><input type="checkbox" name="demoAcknowledged" required /><span>I understand this is a demo. No payment will be taken and no order will be fulfilled.</span></label></fieldset>
        {error && <p className="shop-field-error" role="alert">{error}</p>}
        <button className="shop-button shop-place-order" type="submit" disabled={submitting}>{submitting ? 'PREPARING YOUR DEMO ORDER…' : `PLACE DEMO ORDER · ${money(amounts.total)}`} {!submitting && <ArrowIcon />}</button>
        <p className="shop-demo-note shop-checkout-disclaimer">Contact and delivery details stay in this form only. A sample receipt contains products and totals—not your personal details.</p>
      </form>
      <aside className="shop-checkout-summary"><details open className="shop-summary-details"><summary>YOUR ORDER <span>{money(amounts.total)} <span className="shop-summary-chevron">⌄</span></span></summary><div className="shop-summary-content"><div className="shop-summary-edit"><span>{bag.items.reduce((sum, item) => sum + item.quantity, 0)} {bag.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'PIECE' : 'PIECES'}</span><a href="/cart">EDIT BAG</a></div><BagItems items={bag.items} editable={false} compact /><OrderSummary items={bag.items} code={bag.code} shipping={shipping} /><p className="shop-demo-note">All amounts are simulated in USD. No taxes or payments are collected.</p></div></details><p className="shop-assurance"><LockIcon width="15" height="15" /> A preview, not a purchase.</p></aside>
    </div>
  </main>;
}
