import type { ReactNode } from 'react';
import BagButton from './BagButton';
import { ArrowIcon, LockIcon } from './Icons';

export default async function CommerceFrame({ children }: { children: ReactNode }) {
  return <div className="shop-native">
    <div className="shop-native-announcement">THE DEMO EDIT <span>—</span> NO REAL PAYMENTS. JUST GOOD DESIGN.</div>
    <header className="shop-native-header"><a className="shop-back-link" href="/products/all" aria-label="Continue shopping"><ArrowIcon /><span aria-hidden="true">CONTINUE SHOPPING</span></a><a className="shop-brand" href="/" aria-label="Stillform home"><img src="/brand/stillform-wordmark.svg" alt="Stillform" width="104" height="33" /></a><div className="shop-header-right"><span className="shop-native-secure"><LockIcon width="15" height="15" /> DEMO STORE</span><BagButton /></div></header>
    {children}
    <footer className="shop-native-footer"><div><strong>GOOD PIECES. EVERY DAY.</strong><p>A wardrobe that moves with you.</p></div><div><a href="/faq">FAQ</a><a href="/terms">TERMS</a><a href="/contactus">CONTACT</a></div><p>© {new Date().getFullYear()} STILLFORM <span> / </span> DEMO EXPERIENCE — NO ORDERS FULFILLED.</p></footer>
  </div>;
}
