import {
  getFilterRemovalUrl,
  getSortByValue,
  serializeCollectionParams,
  type CollectionState,
  type ProductFilter,
} from "@shopify/hydrogen";
import { useCollection, useCollectionForm } from "@shopify/hydrogen/react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

import { formatPrice } from "~/lib/money";
import {
  currentSortValue,
  FILTER_DRAWER_ID,
  money,
  openDialogFallback,
  preservedBrowseParams,
  requestFormSubmit,
} from "./CollectionBrowseUtils";

export type SortOption = {
  label: string;
  value: string;
};

export const COLLECTION_SORT_OPTIONS: SortOption[] = [
  { label: "Featured", value: getSortByValue("COLLECTION_DEFAULT", false) },
  { label: "Best selling", value: getSortByValue("BEST_SELLING", false) },
  { label: "Alphabetically, A–Z", value: getSortByValue("TITLE", false) },
  { label: "Alphabetically, Z–A", value: getSortByValue("TITLE", true) },
  { label: "Price, low to high", value: getSortByValue("PRICE", false) },
  { label: "Price, high to low", value: getSortByValue("PRICE", true) },
  { label: "Date, old to new", value: getSortByValue("CREATED", false) },
  { label: "Date, new to old", value: getSortByValue("CREATED", true) },
];

export const SEARCH_SORT_OPTIONS: SortOption[] = [
  { label: "Relevance", value: getSortByValue("RELEVANCE", false) },
  { label: "Price, low to high", value: getSortByValue("PRICE", false) },
  { label: "Price, high to low", value: getSortByValue("PRICE", true) },
];

function hiddenInputsFromParams(
  params: URLSearchParams,
  exclude = new Set<string>(),
) {
  return Array.from(params).flatMap(([name, value], index) => {
    if (exclude.has(name)) return [];
    return (
      <input
        key={`${name}-${value}-${index}`}
        type="hidden"
        name={name}
        value={value}
      />
    );
  });
}

function activeFilterParams(state: CollectionState) {
  return serializeCollectionParams({
    filters: state.filters,
    sortKey: undefined,
    reverse: false,
  });
}

function buildPathWithRemoval(basePath: string, removal: string): string {
  if (removal === "?") return basePath;

  const [pathname, existingSearch = ""] = basePath.split("?");
  const params = new URLSearchParams(existingSearch);
  const removalParams = new URLSearchParams(
    removal.startsWith("?") ? removal.slice(1) : removal,
  );

  for (const [name, value] of removalParams) params.append(name, value);

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function describeFilter(filter: ProductFilter, currencyCode: string): string {
  if (filter.available != null)
    return filter.available ? "In stock" : "Out of stock";
  if (filter.productType) return filter.productType;
  if (filter.productVendor) return filter.productVendor;
  if (filter.tag) return filter.tag;
  if (filter.variantOption)
    return filter.variantOption.value ?? filter.variantOption.name;
  if (filter.productMetafield)
    return filter.productMetafield.value ?? filter.productMetafield.key;
  if (filter.variantMetafield)
    return filter.variantMetafield.value ?? filter.variantMetafield.key;
  if (filter.taxonomyMetafield) return filter.taxonomyMetafield.value;
  if (filter.category) return filter.category.id;
  if (filter.price) {
    const min = filter.price.min;
    const max = filter.price.max;
    if (min != null && max != null) {
      return `${formatPrice(money(min, currencyCode))} – ${formatPrice(money(max, currencyCode))}`;
    }
    if (min != null) return `From ${formatPrice(money(min, currencyCode))}`;
    if (max != null) return `Up to ${formatPrice(money(max, currencyCode))}`;
  }
  return "Filter";
}

export function Toolbar({
  countText,
  defaultSortValue,
  sortOptions,
  extraHiddenInputs,
  filterDrawerId = FILTER_DRAWER_ID,
}: {
  countText: string;
  defaultSortValue: string;
  sortOptions: SortOption[];
  extraHiddenInputs?: ReactNode;
  filterDrawerId?: string;
}) {
  const state: CollectionState = useCollection();
  const { formProps } = useCollectionForm();
  const location = useLocation();
  const resolvedSortValue = currentSortValue(state) ?? defaultSortValue;
  const hiddenParams = activeFilterParams(state);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <button
          type="button"
          commandfor={filterDrawerId}
          command="show-modal"
          className="button-outline inline-flex min-h-touch-target cursor-pointer items-center gap-2 rounded-button px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97] lg:hidden"
          aria-controls={filterDrawerId}
          aria-haspopup="dialog"
          onClick={() => openDialogFallback(filterDrawerId)}
        >
          <span
            className="inline-flex size-5 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <img src="/icons/icon-filter.svg" alt="" className="size-5" />
          </span>
          Filters
        </button>
        <span
          className="min-w-0 text-sm break-words text-on-surface-secondary"
          aria-live="polite"
        >
          {countText}
        </span>
      </div>
      <form
        {...formProps()}
        method="get"
        action={location.pathname}
        className="flex min-w-0 items-center gap-2"
      >
        {hiddenInputsFromParams(hiddenParams)}
        {preservedBrowseParams(location.search).map(([name, value], index) => (
          <input
            key={`preserved-${name}-${value}-${index}`}
            type="hidden"
            name={name}
            value={value}
          />
        ))}
        {extraHiddenInputs}
        <label
          htmlFor="sort-by"
          className="shrink-0 text-sm whitespace-nowrap text-on-surface-secondary"
        >
          Sort by
        </label>
        <select
          id="sort-by"
          name="sort_by"
          value={resolvedSortValue}
          className="w-auto max-w-full cursor-pointer font-medium"
          onChange={requestFormSubmit}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <noscript>
          <button
            type="submit"
            className="button-outline inline-flex min-h-touch-target shrink-0 cursor-pointer items-center justify-center rounded-button px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Sort
          </button>
        </noscript>
      </form>
    </div>
  );
}

export function ActiveFilterChips({
  basePath,
  clearAllTo,
  currencyCode,
}: {
  basePath: string;
  clearAllTo: string;
  currencyCode: string;
}) {
  const state: CollectionState = useCollection();
  if (state.filters.length === 0) return null;

  const currentParams = serializeCollectionParams(state);

  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-2"
      role="region"
      aria-label="Active filters"
    >
      {state.filters.map((filter, index) => {
        const label = describeFilter(filter, currencyCode);
        const removal = getFilterRemovalUrl(currentParams, filter);
        const to = buildPathWithRemoval(basePath, removal);

        return (
          <Link
            key={`${label}-${index}-${removal}`}
            to={to}
            preventScrollReset
            className="chip-filled inline-flex min-h-touch-target items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm no-underline hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
            aria-label={`Remove ${label} filter`}
          >
            {label}
            <span
              className="inline-flex size-4 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              <img src="/icons/icon-x.svg" alt="" className="size-4" />
            </span>
          </Link>
        );
      })}
      <Link
        to={clearAllTo}
        preventScrollReset
        className="text-sm text-accent hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
