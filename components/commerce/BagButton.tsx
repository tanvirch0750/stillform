'use client';

import { openBag, useBag } from '../../lib/cart-store';
import { BagIcon } from './Icons';

export default function BagButton() {
  const { items, ready } = useBag();
  const count = ready ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  return <button type="button" className="shop-bag-button" aria-label={`Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openBag}>
    <BagIcon /><span className="shop-bag-count" aria-hidden="true">{count > 0 ? count : ''}</span>
  </button>;
}
