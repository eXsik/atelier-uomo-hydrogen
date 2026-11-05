import { CollectionProvider } from "@shopify/hydrogen/react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router";

import {
  ActiveFilterChips,
  SEARCH_SORT_OPTIONS,
  Toolbar,
} from "../../../app/components/CollectionBrowse";
import {
  FacetForm,
  FilterDrawer,
} from "../../../app/components/CollectionFacets";

// The mock.shop catalog has no enabled facets, so provide stable data to the real UI.
const availableFilters = [
  {
    id: "availability",
    label: "Availability",
    type: "BOOLEAN",
    values: [
      {
        id: "in-stock",
        label: "In stock",
        count: 3,
        input: JSON.stringify({ available: true }),
      },
      {
        id: "out-of-stock",
        label: "Out of stock",
        count: 1,
        input: JSON.stringify({ available: false }),
      },
    ],
  },
  {
    id: "price",
    label: "Price",
    type: "PRICE_RANGE",
    values: [],
  },
];

function BrowseFacetsFixture() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("q") ?? "hoodie";
  for (const name of [...searchParams.keys()]) {
    if (
      name.startsWith("filter.") ||
      ["after", "before", "sort_by"].includes(name)
    ) {
      searchParams.delete(name);
    }
  }
  const preservedPath = `${location.pathname}?${searchParams.toString()}`;
  const extraHiddenInputs = <input type="hidden" name="q" value={searchTerm} />;

  return (
    <CollectionProvider
      data={{ handle: "fixture", dataSearch: "fixture-data" }}
      urlSearch={location.search}
      onChange={(search) => {
        const nextSearch = search.startsWith("?") ? search.slice(1) : search;
        void navigate(
          {
            pathname: location.pathname,
            search: nextSearch ? `?${nextSearch}` : "",
          },
          { replace: true, preventScrollReset: true },
        );
      }}
    >
      <section
        data-testid="browse-facets-fixture"
        className="mx-auto max-w-lg p-8"
      >
        <aside aria-label="Filters">
          <FacetForm
            availableFilters={availableFilters}
            currencyCode="CAD"
            extraHiddenInputs={extraHiddenInputs}
          />
        </aside>
        <Toolbar
          countText="3 products"
          defaultSortValue={SEARCH_SORT_OPTIONS[0].value}
          sortOptions={SEARCH_SORT_OPTIONS}
          extraHiddenInputs={extraHiddenInputs}
        />
        <ActiveFilterChips
          basePath={preservedPath}
          clearAllTo={preservedPath}
          currencyCode="CAD"
        />
        <FilterDrawer
          availableFilters={availableFilters}
          currencyCode="CAD"
          extraHiddenInputs={extraHiddenInputs}
        />
      </section>
    </CollectionProvider>
  );
}

createRoot(document.getElementById("facet-test-root")!).render(
  <BrowserRouter>
    <BrowseFacetsFixture />
  </BrowserRouter>,
);
