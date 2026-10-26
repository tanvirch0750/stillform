import type { Metadata } from 'next';
import CartPage from '../../../components/commerce/CartPage';

export const metadata: Metadata = { title: 'Your Bag — Stillform' };
export default function Page() { return <CartPage />; }
