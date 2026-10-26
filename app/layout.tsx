import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CommerceRoot from '../components/commerce/CommerceRoot';

export const metadata: Metadata = {
  title: 'Stillform - Streetwear Clothing Brand',
  applicationName: 'Stillform',
  robots: { index: false, follow: false },
  icons: {
    icon: '/brand/stillform-icon.svg',
    apple: '/brand/stillform-icon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" dir="ltr" data-redirect-timezone="1">
    <head><link rel="stylesheet" href="/standalone.css" /><link rel="stylesheet" href="/commerce.css" /></head>
    <body>{children}<CommerceRoot /></body>
  </html>;
}
