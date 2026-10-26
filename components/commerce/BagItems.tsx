'use client';

import { getProduct, itemKey, MAX_QUANTITY, money, SIZES, type BagItem, type Size } from '../../lib/catalog';
import { changeSize, removeItem, setQuantity } from '../../lib/cart-store';

export default function BagItems({ items, editable = true, compact = false }: { items: BagItem[]; editable?: boolean; compact?: boolean }) {
  return <ul className={`shop-items ${compact ? 'shop-items-compact' : ''}`}>
    {items.map((item) => {
      const product = getProduct(item.productId)!;
      const key = itemKey(item);
      return <li key={key} className="shop-item" data-bag-item={key}>
        <a href={product.route} className="shop-item-image" tabIndex={editable ? 0 : -1}><img src={product.image} alt={product.name} width="160" height="200" /></a>
        <div className="shop-item-info">
          <a href={product.route} className="shop-item-name">{product.name}</a>
          {editable ? <label className="shop-size-edit">Size <select aria-label={`Size for ${product.name}`} value={item.size} onChange={(event) => changeSize(key, event.target.value as Size)}>{SIZES.map((size) => <option key={size}>{size}</option>)}</select></label> : <p className="shop-muted">Size {item.size} <span aria-hidden="true">/</span> Qty {item.quantity}</p>}
          {editable && <div className="shop-item-controls"><div className="shop-quantity" aria-label={`Quantity for ${product.name}, size ${item.size}`}>
            <button type="button" aria-label={`Decrease quantity of ${product.name}, size ${item.size}`} disabled={item.quantity <= 1} onClick={() => setQuantity(key, item.quantity - 1)}>−</button>
            <span aria-live="polite">{item.quantity}</span>
            <button type="button" aria-label={`Increase quantity of ${product.name}, size ${item.size}`} disabled={item.quantity >= MAX_QUANTITY} onClick={() => setQuantity(key, item.quantity + 1)}>+</button>
          </div><button type="button" className="shop-text-button shop-remove" aria-label={`Remove ${product.name}, size ${item.size}`} onClick={() => removeItem(key)}>Remove</button></div>}
        </div>
        <div className="shop-item-price">{money(product.price * item.quantity)}{editable && item.quantity > 1 && <small>{money(product.price)} each</small>}</div>
      </li>;
    })}
  </ul>;
}
