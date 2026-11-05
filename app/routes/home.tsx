import { gql } from "@shopify/hydrogen";
import { Link } from "react-router";

import { COLLECTION_CARD_FRAGMENT, type CollectionCardData } from "~/components/CollectionCard";
import { HomeHero } from "~/components/HomeHero";
import { ProductCard, PRODUCT_CARD_FRAGMENT, type ProductCardData } from "~/components/ProductCard";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/home";

const HOME_QUERY = gql(
  `
    query Home {
      products(first: 8, sortKey: CREATED_AT, reverse: true) {
        nodes {
          ...ProductCard
        }
      }
      collections(first: 3) {
        nodes {
          ...CollectionCard
        }
      }
      heroCollections: collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          title
          handle
          description
          image {
            url
            altText
          }
          products(first: 1) {
            nodes {
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT, COLLECTION_CARD_FRAGMENT],
);

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Home", shopName) },
    {
      name: "description",
      content: `Shop new arrivals and featured categories at ${shopName}.`,
    },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(HOME_QUERY);

  // New arrivals: the most recently created products (by creation date, not
  // publication date), newest first, in the order the Storefront API returns.
  const featuredProducts: ProductCardData[] = data?.products.nodes ?? [];
  const featuredCollections: CollectionCardData[] = data?.collections.nodes ?? [];
  // The hero features the most recently updated collection, independent of the
  // category list above.
  const heroCollections = data?.heroCollections.nodes ?? [];

  return {
    featuredProducts,
    featuredCollections,
    heroCollections,
  };
}

function NewArrivals({ products }: { products: readonly ProductCardData[] }) {
  return (
    <section
      className="current-edit page-shell"
      id="the-edit"
      aria-labelledby="new-arrivals-heading"
    >
      <div className="edit-heading">
        <h2 id="new-arrivals-heading" className="editorial-heading">
          The current edit
        </h2>
        <Link
          to="/collections"
          className="min-h-touch-target text-on-surface focus-visible:outline-accent inline-flex items-center gap-1 rounded-sm text-sm font-normal no-underline hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-opacity"
        >
          <span>Explore all collections</span>
          <span
            className="inline-flex size-4 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="edit-products">
          <ul role="list" className="edit-product-grid">
            {products.slice(0, 4).map((product) => (
              <li key={product.handle}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CollectionIndex({ collections }: { collections: readonly CollectionCardData[] }) {
  if (!collections.length) return null;
  return (
    <section className="collection-index page-shell" aria-labelledby="category-heading">
      <div className="collection-intro">
        <p className="editorial-kicker">Find your perspective</p>
        <h2 id="category-heading" className="editorial-heading">
          A wardrobe,
          <br />
          your way.
        </h2>
        <p>Start with a collection. Make it your own.</p>
      </div>
      <div className="collection-list">
        {collections.map((collection) => (
          <Link
            key={collection.handle}
            to={`/collections/${collection.handle}`}
            className="collection-list-link"
          >
            <span>{collection.title}</span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
        <Link to="/collections" className="editorial-link">
          All collections <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <HomeHero />
      <NewArrivals products={loaderData.featuredProducts} />
      <section className="atelier-manifesto" aria-labelledby="manifesto-heading">
        <div className="page-shell manifesto-layout">
          <p className="editorial-kicker">The Atelier perspective</p>
          <h2 id="manifesto-heading">
            Style is personal.
            <br />
            Keep it that way.
          </h2>
          <p>
            Familiar pieces. Unexpected combinations. We see a wardrobe as something to live in,
            rather than something to follow.
          </p>
        </div>
      </section>
      <CollectionIndex collections={loaderData.featuredCollections} />
    </main>
  );
}
