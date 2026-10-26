'use client';

import { useState } from 'react';
import { money, type Product, type Size } from '../../lib/catalog';
import { addItem, openBag, openFitGuide } from '../../lib/cart-store';
import { ArrowIcon } from './Icons';

export default function ProductPurchase({ product, quick = false }: { product: Product; quick?: boolean }) {
  const [size, setSize] = useState<Size | null>(null);
  const [error, setError] = useState('');
  function purchase(buyNow: boolean) {
    if (!size) { setError('Choose your size to continue.'); return; }
    if (!addItem(product.id, size)) { setError('You can add up to 99 of each size in this demo.'); return; }
    setError('');
    if (buyNow) window.location.assign('/checkout');
    else openBag();
  }
  return <div className="shop-purchase">
    {quick && <><p className="shop-eyebrow">A NEW EVERYDAY ESSENTIAL</p><h3>{product.name}</h3><p className="shop-quick-price">{money(product.price)}</p></>}
    <div className="shop-size-heading"><span>SELECT SIZE{size ? ` / ${size}` : ''}</span><button type="button" className="shop-text-button" onClick={() => openFitGuide(product.id)}>Size & fit</button></div>
    <div className="shop-size-options" role="group" aria-label={`Choose a size for ${product.name}`}>
      {product.sizes.map((value) => <button type="button" key={value} aria-label={`Size ${value}`} aria-pressed={size === value} onClick={() => { setSize(value); setError(''); }}>{value}</button>)}
    </div>
    <p className="shop-field-error shop-size-error" role={error ? 'alert' : undefined}>{error}</p>
    <div className="shop-purchase-buttons"><button type="button" className="shop-button" onClick={() => purchase(false)}>ADD TO BAG <ArrowIcon /></button><button type="button" className="shop-button shop-button-outline" onClick={() => purchase(true)}>BUY NOW</button></div>
    <p className="shop-purchase-note">Complimentary standard delivery <span>·</span> Demo store</p>
  </div>;
}
