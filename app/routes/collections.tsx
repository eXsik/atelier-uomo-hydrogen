import { Link } from "react-router";

import { CollectionCard } from "~/components/CollectionCard";
import { loadCollectionsPage } from "~/lib/collections";
import { storefrontClientContext } from "~/lib/storefront";
import {
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/collections";

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Collections", shopName) },
    {
      name: "description",
      content: `Browse all ${shopName} collections.`,
    },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return loadCollectionsPage({ storefrontClient, request });
}

type CollectionNode =
  Route.ComponentProps["loaderData"]["collections"]["nodes"][number];

function BreadcrumbJsonLd({ origin }: { origin: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: `${origin}/collections`,
      },
    ],
  };

  return <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>;
}

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-on-surface-secondary">
        <li>
          <Link
            to="/"
            className="rounded-sm py-2 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-safe:transition-colors"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-on-surface-secondary">
          /
        </li>
        <li>
          <span aria-current="page" className="font-medium text-on-surface">
            Collections
          </span>
        </li>
      </ol>
    </nav>
  );
}

function CollectionsGrid({
  collections,
}: {
  collections: readonly CollectionNode[];
}) {
  if (collections.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface-secondary p-8 text-center">
        <h2 className="type-heading-md text-on-surface">
          No collections found
        </h2>
        <p className="mt-2 text-sm text-on-surface-secondary">
          No collections available.
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="sr-only">Browse collections</h2>
      <div>
        <ul
          role="list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {collections.map((collection, index) => (
            <li key={collection.handle}>
              <CollectionCard collection={collection} priority={index === 0} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function CollectionsRoute({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="mx-auto w-full max-w-page px-margin py-8 md:py-12">
        <BreadcrumbJsonLd origin={loaderData.origin} />
        <Breadcrumb />
        <div className="mb-8">
          <h1 className="type-display text-on-surface">Collections</h1>
        </div>
        <CollectionsGrid collections={loaderData.collections.nodes} />
      </div>
    </main>
  );
}
