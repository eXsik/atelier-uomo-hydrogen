# Atelier Uomo

A menswear storefront portfolio project built with React, TypeScript, React Router SSR, Shopify Hydrogen 2026.10, and Tailwind CSS 4.

The catalog, availability, prices, collections, search, and cart use the public mock.shop Storefront API. Product data is demonstrative; checkout does not take real payments or create real orders. Customer Account login requires a real Shopify store and is unavailable with mock.shop.

## Local development

Use Node.js 24 (`nvm use` reads `.nvmrc`) and npm.

```bash
npm ci
npm run dev
```

Open the address printed by Vite. The default mock.shop catalog requires no account, token, or `.env` file. Optional configuration is documented in `.env.example`. Never commit real credentials; `.env` and its local variants are ignored.

## Checks

```bash
npm run typecheck
npm run build
npm run preview
```

Typecheck runs React Router type generation, TypeScript, and Hydrogen GraphQL validation. Preview builds and serves the production bundle locally. There is no automated browser test suite yet; a passing build does not prove cart interactions.

## Code map

- `app/root.tsx`: request middleware, shared layout, cart initialization, and storefront identity.
- `app/routes/`: server loaders and page components for home, products, collections, search, cart, and account.
- `app/components/`: shared UI, product cards, dialogs, header, footer, and editorial hero.
- `app/lib/storefront.ts`: request-scoped Storefront API client.
- `app/lib/shop.ts`: demo/real-store detection and Shopify runtime configuration.
- `app/lib/cart*.ts`: cart state, handlers, and drawer helpers.
- `app/lib/home-hero.ts`: picks an actual API collection and its image for the hero.
- `app/tokens.css`: shared colors, type, spacing, and UI tokens.
- `app/app.css`: application styling and responsive Atelier Uomo hero.
- `server.ts`: Oxygen Worker entry point.
- `vite.config.ts`: Vite, Tailwind, React Router, and MiniOxygen integration.

Atelier Uomo owns the displayed brand identity. Product titles, prices, availability, images, and collection links continue to come from Shopify data. The default demo catalog contains multiple categories, including women's clothing; it is not yet a curated menswear catalog. Currency follows the API rather than being relabeled as PLN or EUR.

## Development stages

1. Establish the starter, Git baseline, and TypeScript/GraphQL checks.
2. Introduce Atelier Uomo identity and a responsive homepage.
3. Curate an appropriate demo menswear catalog and collection navigation.
4. Verify product variants, add-to-cart, quantity updates, removal, and persistence in the browser.
5. Improve collection/search browsing, empty states, and mobile accessibility.
6. Add focused Playwright coverage for the core shopping flow and prepare metadata/social previews.
7. Review dependency advisories, publish the GitHub repository, and deploy a verified demo.

## Security and deployment

Run `npm audit` to inspect the current dependency tree. Do not use `npm audit fix --force` indiscriminately: npm may propose a breaking MiniOxygen downgrade. Review runtime and development dependencies separately with `npm audit --omit=dev`.

The current React Router dependency emits an `envFile` deprecation warning during development and checks. Updating the React Router 7 packages to 7.18.5 was attempted but npm reported a peer dependency resolution conflict; no dependency or lockfile changes were retained. The original 13 audit findings remain unresolved.

The starter includes a MiniOxygen compatibility-date workaround in `vite.config.ts`. Reassess it when updating the runtime. Do not deploy publicly before reviewing unresolved advisories and checking the production preview.

A real Shopify store can be connected later with Shopify CLI. Customer Accounts additionally require HTTPS and the environment variables described in `.env.example`. Nothing is deployed or linked automatically by these local changes.

## Attribution

Based on Shopify's Hydrogen React Router template. MIT license; see `LICENSE`.
