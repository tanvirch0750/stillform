import type { Metadata } from 'next';
import CheckoutPage from '../../../components/commerce/CheckoutPage';

export const metadata: Metadata = { title: 'Demo Checkout — Stillform' };
export default function Page() { return <CheckoutPage />; }
