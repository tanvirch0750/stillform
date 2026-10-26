'use client';

import { useState } from 'react';
import { money, totals, type BagItem } from '../../lib/catalog';
import { applyCode, removeCode } from '../../lib/cart-store';
import { CheckIcon } from './Icons';

export function DiscountCode({ code }: { code: string | null }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  if (code) return <div className="shop-applied-code"><span><CheckIcon width="16" height="16" /> {code} <small>50% OFF · DEMO</small></span><button type="button" className="shop-text-button" onClick={removeCode} aria-label="Remove discount code">Remove</button></div>;
  return <form className="shop-discount" onSubmit={(event) => { event.preventDefault(); if (applyCode(input)) setError(''); else setError('That code isn’t available. Try WINTER50 in this demo.'); }}>
    <label htmlFor="shop-discount-code">DISCOUNT CODE</label><div><input id="shop-discount-code" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Enter your code" autoComplete="off" aria-describedby={error ? 'shop-discount-error' : undefined} /><button type="submit">APPLY</button></div>
    {error && <p id="shop-discount-error" role="alert" className="shop-field-error">{error}</p>}
  </form>;
}

export default function OrderSummary({ items, code, shipping = 0, discountInput = true }: { items: BagItem[]; code: string | null; shipping?: number; discountInput?: boolean }) {
  const amounts = totals(items, code, shipping);
  return <div className="shop-order-totals">
    {discountInput && <DiscountCode code={code} />}
    <dl><div><dt>Subtotal</dt><dd>{money(amounts.subtotal)}</dd></div>
      {!!amounts.discount && <div><dt>Discount <span className="shop-muted">(WINTER50)</span></dt><dd>−{money(amounts.discount)}</dd></div>}
      <div><dt>Delivery</dt><dd>{shipping ? money(shipping) : 'Complimentary'}</dd></div>
      <div><dt>Taxes</dt><dd className="shop-muted">Not charged in demo</dd></div>
      <div className="shop-total"><dt>Total <small>USD</small></dt><dd>{money(amounts.total)}</dd></div>
    </dl>
  </div>;
}
