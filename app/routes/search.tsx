import {
  AnalyticsEvent,
  createPredictiveSearchFormRegister,
  getSortByValue,
} from "@shopify/hydrogen";
import { CollectionProvider } from "@shopify/hydrogen/react";
import { useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router";

import {
  ActiveFilterChips,
  SEARCH_SORT_OPTIONS,
  Toolbar,
} from "~/components/CollectionBrowse";
import { FacetForm, FilterDrawer } from "~/components/CollectionFacets";
import { LoadMore, useLoadMore } from "~/components/CollectionPagination";
import { ProductCard } from "~/components/ProductCard";
import { loadSearchPage, type SearchPageData } from "~/lib/search";
import { storefrontClientContext } from "~/lib/storefront";
import {
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/search";

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Search", shopName) },
    {
      name: "description",
      content: `Search products at ${shopName}.`,
    },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return loadSearchPage({ storefrontClient, request });
}

type PerformedSearchData = Extract<SearchPageData, { performed: true }>;
type ProductNode = PerformedSearchData["products"][number];

function SearchViewedTracker({
  searchTerm,
  totalCount,
}: {
  searchTerm: string;
  totalCount: number;
}) {
  useEffect(() => {
    if (!searchTerm) return;

    window.Shopify?.analytics?.publish(AnalyticsEvent.SEARCH_VIEWED, {
      searchTerm,
      searchResults: { totalCount },
    });
  }, [searchTerm, totalCount]);

  return null;
}

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
        name: "Search",
        item: `${origin}/search`,
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
            Search
          </span>
        </li>
      </ol>
    </nav>
  );
}

const registerSearchForm = createPredictiveSearchFormRegister();

function SearchHeader({ term }: { term: string }) {
  return (
    <div className="mb-8">
      <h1 className="type-display mb-6 text-on-surface">Search</h1>
      <form
        action="/search"
        method="get"
        role="search"
        aria-label="Search"
        className="mb-8 max-w-lg"
      >
        <label
          htmlFor="search-q"
          className="mb-1.5 block text-sm font-medium text-on-surface"
        >
          Search
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute start-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-on-surface-secondary"
            aria-hidden="true"
          >
            <img src="/icons/icon-search.svg" alt="" className="size-5" />
          </span>
          <input
            key={term}
            {...registerSearchForm("query")}
            id="search-q"
            defaultValue={term}
            placeholder="Search"
            className="peer h-11 w-full ps-10 pe-14"
          />
          {term ? (
            <Link
              to="/search"
              aria-label="Clear search"
              className="absolute end-1 top-1/2 inline-flex min-h-touch-target min-w-touch-target -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-on-surface-secondary hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-colors"
            >
              <img
                src="/icons/icon-x.svg"
                alt=""
                className="size-4"
                aria-hidden="true"
              />
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function searchTermHiddenInput(term: string) {
  return <input type="hidden" name="q" value={term} />;
}

function ProductGrid({ products }: { products: readonly ProductNode[] }) {
  return (
    <div className="px-1 contain-paint">
      <ul
        id="product-grid"
        data-testid="product-grid"
        role="list"
        className="grid grid-cols-2 gap-x-1 gap-y-10 lg:grid-cols-3"
      >
        {products.map((product, index) => (
          <li key={`${product.handle}-${index}`}>
            <ProductCard product={product} priority={index < 3} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoResults({ term }: { term: string }) {
  return (
    <div aria-live="polite">
      <p className="type-body text-on-surface-secondary">
        No results for “{term}”
      </p>
      <p className="mt-2 text-sm text-on-surface-secondary">
        Check your spelling or try a more general term.
      </p>
    </div>
  );
}

function SearchResults({ loaderData }: { loaderData: PerformedSearchData }) {
  const location = useLocation();
  const navigation = useNavigation();
  const isUpdating =
    navigation.state === "loading" &&
    navigation.location?.pathname === location.pathname &&
    navigation.location.search !== location.search;
  const { nodes, pageInfo, isLoading, loadMore } = useLoadMore(
    loaderData.products,
    loaderData.pageInfo,
    loaderData.dataSearch,
  );
  const defaultSortValue = getSortByValue("RELEVANCE", false);
  const countText = `${nodes.length} results found for “${loaderData.searchTerm}”`;
  const searchPath = `/search?q=${encodeURIComponent(loaderData.searchTerm)}`;
  const hiddenQuery = searchTermHiddenInput(loaderData.searchTerm);

  if (nodes.length === 0) return <NoResults term={loaderData.searchTerm} />;

  return (
    <>
      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-8">
            <h2 className="type-heading-sm mb-2 text-on-surface">Filters</h2>
            <FacetForm
              availableFilters={loaderData.availableFilters}
              currencyCode={loaderData.currencyCode}
              extraHiddenInputs={searchTermHiddenInput(loaderData.searchTerm)}
            />
          </div>
        </aside>
        <div>
          <Toolbar
            countText={countText}
            sortOptions={SEARCH_SORT_OPTIONS}
            defaultSortValue={defaultSortValue}
            extraHiddenInputs={hiddenQuery}
          />
          <ActiveFilterChips
            basePath={searchPath}
            clearAllTo={searchPath}
            currencyCode={loaderData.currencyCode}
          />
          <h2 className="sr-only">Search results</h2>
          <div
            aria-busy={isUpdating}
            className={`motion-safe:transition-opacity motion-safe:duration-150 ${isUpdating ? "opacity-60" : "opacity-100"}`}
          >
            <ProductGrid products={nodes} />
          </div>
          <LoadMore
            pageInfo={pageInfo}
            loadedCount={nodes.length}
            countLabel={`Showing ${nodes.length} of ${loaderData.totalCount} results`}
            isLoading={isLoading}
            onLoad={loadMore}
          />
        </div>
      </div>
      <FilterDrawer
        availableFilters={loaderData.availableFilters}
        currencyCode={loaderData.currencyCode}
        extraHiddenInputs={searchTermHiddenInput(loaderData.searchTerm)}
      />
    </>
  );
}

export default function SearchRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <CollectionProvider
      data={{
        handle: `search:${loaderData.searchTerm}`,
        dataSearch: loaderData.dataSearch,
      }}
      urlSearch={searchParams.toString()}
      onChange={(search) => {
        const nextParams = new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : search,
        );
        if (loaderData.searchTerm && !nextParams.has("q"))
          nextParams.set("q", loaderData.searchTerm);
        nextParams.delete("after");
        const nextSearch = nextParams.toString();
        void navigate(
          { search: nextSearch ? `?${nextSearch}` : "" },
          {
            replace: searchParams.size > 0,
            preventScrollReset: true,
          },
        );
      }}
    >
      {loaderData.performed ? (
        <SearchViewedTracker
          searchTerm={loaderData.searchTerm}
          totalCount={loaderData.totalCount}
        />
      ) : null}
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <div className="mx-auto w-full max-w-page px-margin py-8 md:py-12">
          <BreadcrumbJsonLd origin={loaderData.origin} />
          <Breadcrumb />
          <SearchHeader term={loaderData.searchTerm} />
          {loaderData.performed ? (
            <SearchResults loaderData={loaderData} />
          ) : null}
        </div>
      </main>
    </CollectionProvider>
  );
}
