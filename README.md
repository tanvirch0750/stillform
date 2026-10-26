# Stillform — Next.js storefront

A local, multi-page recreation of https://dripcase.framer.website/, inspected using **REA MCP**. No Magnific or generated imagery is used.

Customer-facing branding is **Stillform**, with a custom vector wordmark and SF icon. `npm run brand` applies the repeatable text/logo transform, also run automatically before development/build and after a reference sync. Original reference provenance, component identifiers, product URLs, and browser bag storage keys are preserved for compatibility. Contact addresses use the reserved `stillform.example` domain as demo placeholders—not a claimed live domain. Product photographs remain unchanged.

Built with **Next.js 16 App Router, React 19, and TypeScript**. Next.js server-renders the 26 reference pages plus custom cart, checkout, and confirmation pages, and provides metadata, static prerendering, public assets, and branded 404 handling.

To retain the existing animation behavior, an isolated client bootstrap hydrates the original Framer **React/Motion** runtime inside its own DOM boundary after Next hydrates. This preserves the authored 3D hero, entrance timing, scroll effects, sticky stacking, hovers, navigation, accordions, and tickers. It is a real Next.js app, but the animated storefront components remain the published Framer runtime, **not a newly hand-rewritten component library or a Framer editor project**. In-page navigation continues to use that runtime so its existing transitions are retained; deep links are served by Next.js.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. Node 20.9+ is required; Node 24 is recommended.

```sh
npm run build
npm start
npm run typecheck
npm test
npm run compare:reference
```

`npm run build` produces the Next.js production build in `.next/`, with the known routes statically prerendered. Deploy as a Next.js application (for example on Vercel), or run `npm start` on a Node host. `npm run preview` is an alias for the production server on port 3000. This is no longer a Vite app or a `dist/` static-directory deployment. Next.js normalizes trailing slashes and serves unknown routes using `app/not-found.tsx`.

For self-hosting, keep `site/`, `reference-manifest.json`, and `public/` with the application. File tracing is configured to include the snapshot documents. Do not run the development and production servers on port 3000 simultaneously; use `npm start -- --port 3001` for a separate production check.

## Layout

- `app/layout.tsx` — Next.js root document, metadata, icons, and integration styles.
- `app/[[...slug]]/page.tsx` — statically generated App Router pages for all captured routes.
- `app/not-found.tsx` — original branded 404 rendered through Next.js.
- `lib/reference.ts` — allowlisted server-side snapshot loader; separates markup, styles, data, and executable scripts.
- `components/ReferenceDocument.tsx` — server-rendered storefront markup in a separate DOM boundary.
- `components/RuntimeBootstrap.tsx` — client-only, once-per-document runtime initialization, including Strict Mode protection.
- `lib/storefront-hydration.ts` — compatibility gate for the frozen runtime's page-specific hydration boundaries; commerce portals wait for those boundaries instead of mutating still-unhydrated markup.
- `app/(commerce)/` — native Next.js `/cart`, `/checkout`, and `/order-confirmation` routes.
- `components/commerce/` — original-style bag drawer, navbar bag control, Quick Add, product size/purchase controls, fit guidance, cart, checkout, and sample receipt.
- `components/commerce/CommerceRoot.tsx` — isolated portal adapter reconnecting commerce controls after Framer route/breakpoint changes; generated runtime bundles are not edited.
- `lib/catalog.ts` — structured demo catalog, USD-cent prices, variants, quantity limits, input sanitization, and totals.
- `lib/cart-store.ts` — browser bag state, cross-tab synchronization, and non-personal session receipts.
- `site/` — frozen HTML documents with the reference styles and hydration data.
- `public/runtime/` — local published React, Motion, Framer, page and CMS modules.
- `public/assets/` — original images and font files, served locally.
- `public/standalone.js` — local product search, accessible dialog handling, and integration safeguards.
- `public/standalone.css` — styles for standalone dialogs; the reference design is otherwise unchanged.
- `public/commerce.css` — scoped editorial-style commerce UI and locally served fonts.
- `public/storefront-data.json` — product search index.
- `reference-manifest.json` — source URL, captured routes, assets, runtime inventory, and download failures.
- `scripts/sync-reference.mjs` — repeatable snapshot/asset graph importer. `npm run sync:reference` refreshes the frozen reference; custom layout edits in `site/` or runtime edits will be overwritten.
- `tests/` — browser checks for routes, local assets, interactions, and responsive overflow.

`compare:reference` requires the dev server and internet access. It checks 11 stable homepage section boxes against the live reference at desktop, tablet, and mobile widths and writes `artifacts/visual-parity.json`. This is a geometry comparison, not a guarantee of pixel-identical animated frames.

The browser suite defaults to http://127.0.0.1:3000. To exercise a running production server instead, use `TEST_BASE_URL=http://127.0.0.1:3001 npm test`.

The checks cover all captured route documents, no-JavaScript product SSR, a running hero animation, menu/collection navigation, client transitions and browser Back, single runtime initialization, local search, FAQ animation, integration safeguards, responsive overflow, and branded 404 behavior. The production `/404` URL correctly responds with HTTP 404.

## Deliberate integration differences

- Product pages now require a size and offer **Add to Bag** and **Buy Now**. Collection cards have a discrete **Quick Add** control. The centered logo is preserved, with a bag icon next to search.
- The bag drawer and `/cart` support quantities, removal, variant changes/merging, and refresh persistence. Maximum quantity is 99 per product/size. Only product IDs, sizes, quantities, and an approved coupon code are persisted in `dripcase:bag:v1`; browser storage is untrusted and validated on read. No account or inventory reservation is implied.
- **Demo checkout only:** `/checkout` validates sample contact/delivery fields but never submits them, calls a payment provider, creates a real order, or collects card details. Completing it clears the bag and shows `/order-confirmation` with explicit “no payment / no order / no shipment / no email” messaging.
- A non-personal demo receipt (product IDs, sizes, quantities, coupon, delivery option, random demo reference and timestamp) is saved in sessionStorage, not contact/address/payment data. If storage is blocked, in-memory state works for the current document; full document navigation/refresh cannot retain a bag without storage.
- All totals are simulated **USD**. Demo `WINTER50` gives 50% off the current displayed item subtotal once; it does not stack or discount shipping. Standard delivery is complimentary, express is a sample $12, and taxes are not charged in this demo. These are demo rules, not live shipping/tax guarantees.
- Prices preserve the reference, including the unusual $199 Ashfield overshirt. Its inconsistent $120 comparison price is not used in calculations. Review real pricing, size charts, inventory, shipping, tax rules, and promotional terms before launch. Fit guidance intentionally does not invent garment measurements.
- Commerce links use full-document navigation when entering/leaving the preserved storefront so Next and Framer never compete for ownership of the same DOM. Existing in-storefront transitions and animation definitions remain intact.
- To go live, replace demo completion with a server-validated order/payment flow, trusted inventory and price verification, payment webhooks, transactional email, privacy/consent rules, and real fulfillment. Never trust browser totals for charges.
- Newsletter submission **does not transmit or save customer information**. It explains that email delivery is not configured. Wire your own newsletter service before collecting subscribers.
- Search uses a local product index and needs no Framer search service.
- Hosted analytics, on-page editing, and the Framer promotional badge are disabled/hidden.
- The recreation is marked `noindex,nofollow` to avoid competing with the original site.

This preserves the visual reference, including its existing copy, sample contact details, and pricing. Review these before production. The reference's published code is compiled, so deep content/design changes are less convenient than in an original source project. Obtain the original Framer project if editor-level customization is required.

## Asset rights

Original design, imagery, brand assets, and published runtime remain subject to their respective owners' licenses. Confirm permission/template licensing before publicly deploying this recreation. The build does not grant ownership of third-party assets.
