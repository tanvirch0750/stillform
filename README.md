# Stillform — Modern Ecommerce Storefront

Stillform is a fashion-focused ecommerce storefront built to showcase products with a clean, editorial design and an engaging shopping experience. It combines animated product discovery with practical shopping features, giving brands a starting point for presenting their collections online.

## What Stillform offers

- **Product-first design** — spacious layouts, bold imagery, and dedicated product pages put your collection in focus.
- **Responsive browsing** — layouts designed for desktop, tablet, and mobile shoppers.
- **Engaging interactions** — animated sections, hover effects, and smooth storefront transitions.
- **Product discovery** — collection navigation and local product search help shoppers find items.
- **Flexible shopping controls** — size selection, Quick Add, Add to Bag, and Buy Now.
- **Persistent shopping bag** — customers can update quantities, change sizes, and remove items, with their bag retained across refreshes when browser storage is available.
- **Demo checkout journey** — cart, sample checkout, and confirmation pages demonstrate the shopping flow.

## How it can help your ecommerce business

Stillform gives your products a polished place to stand out while making browsing and bag management straightforward. It can help you:

- Present your brand and collections with a consistent visual identity.
- Make products easier to explore across screen sizes.
- Let shoppers add items directly from collections and manage their selections in one place.
- Demonstrate a complete storefront experience before connecting live commerce services.
- Start with an existing storefront foundation rather than building every page from scratch.

It is a starting point for fashion labels, boutiques, and product-led brands looking to develop their online store.

## Want to buy or discuss your store?

**Interested in buying Stillform or having it customized for your ecommerce business? Knock me—send me a message.**

Share what you sell, the style you want, and the features you need so we can discuss pricing, customization, and next steps.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Playwright for browser testing

## Run locally

Use Node.js 20.9 or later; Node.js 24 is recommended.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```sh
npm run build
npm start
```

Deploy as a Next.js application. For self-hosting, include `site/`, `reference-manifest.json`, and `public/` with the application.

### Checks

```sh
npm run typecheck
npm test
```

Browser tests expect the application to be running at `http://127.0.0.1:3000`. Use `TEST_BASE_URL` to test a different address.

## Before launching a live store

**The current checkout is a demo. It does not process payments, place real orders, arrange shipments, or send confirmation emails.** Checkout contact and delivery details are not submitted or saved, and newsletter delivery is not configured.

For production, connect a secure backend and payment provider, verify prices and inventory on the server, and configure shipping, taxes, order emails, and fulfillment. Replace sample contact details and review product information, promotions, privacy policies, and consent requirements. The site currently uses `noindex,nofollow`; review that setting before launch.

Confirm that you have the necessary rights and licenses for all included design elements, imagery, fonts, and third-party software before commercial use or distribution. Purchasing customization work does not automatically transfer third-party asset rights.
