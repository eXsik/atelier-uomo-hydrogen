import {
  formatMoney,
  isFilterInputActive,
  parseCollectionParams,
  type CollectionState,
  type ProductFilter,
} from "@shopify/hydrogen";
import { useCollection, useCollectionForm } from "@shopify/hydrogen/react";
import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";

import {
  activeValueCount,
  closeDialog,
  currentSortValue,
  filterValueInputParamEntries,
  FILTER_DRAWER_ID,
  isMutuallyExclusive,
  isSwatchFilter,
  preservedBrowseParams,
  priceFilter,
  requestFormSubmit,
  uncheckSiblings,
  PRICE_MAX_PARAM,
  PRICE_MIN_PARAM,
  type BrowseFilter,
} from "./CollectionBrowseUtils";
import { DEFAULT_MONEY_LOCALE } from "~/lib/money";

function CheckIcon() {
  return (
    <svg
      className="filter-check-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FacetGroup({
  filter,
  state,
  currencyCode,
}: {
  filter: BrowseFilter;
  state: CollectionState;
  currencyCode: string;
}) {
  const selectedCount = activeValueCount(filter, state);
  const labelId = useId();

  return (
    <details className="group block" open>
      <summary className="marker-hidden flex w-full cursor-pointer items-center justify-between py-4 text-sm font-medium text-on-surface motion-safe:transition motion-safe:active:scale-[0.97]">
        <span className="inline-flex items-center gap-1.5" aria-hidden="true">
          <span id={labelId} aria-hidden="true">
            {filter.label}
          </span>
          {selectedCount > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-interactive px-1 text-xs font-medium text-interactive-text"
              aria-hidden="true"
            >
              {selectedCount}
            </span>
          ) : null}
        </span>
        <span className="sr-only">
          {selectedCount > 0
            ? `${filter.label}, ${selectedCount} selected`
            : filter.label}
        </span>
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
          aria-hidden="true"
        >
          <img src="/icons/icon-chevron-down.svg" alt="" className="size-4" />
        </span>
      </summary>
      <div className="pb-4">
        <FacetBody
          filter={filter}
          state={state}
          labelId={labelId}
          currencyCode={currencyCode}
        />
      </div>
    </details>
  );
}

function ListFacet({
  filter,
  state,
  labelId,
}: {
  filter: BrowseFilter;
  state: CollectionState;
  labelId: string;
}) {
  const id = useId();
  const values = filter.values.flatMap((value) => {
    if (!value.input) return [];
    const entries = filterValueInputParamEntries(value.input);
    if (entries.length !== 1) return [];
    const [{ name, value: paramValue }] = entries;
    const isActive = isFilterInputActive(state.filters, value.input);
    const valueId = `${id}-${encodeURIComponent(value.id)}`;

    return (
      <li key={value.id}>
        <label
          data-testid="facet-option"
          className="flex min-h-touch-target cursor-pointer items-center gap-2 py-1 text-sm text-on-surface motion-safe:transition-transform motion-safe:active:scale-[0.97]"
        >
          <input
            type="checkbox"
            name={name}
            value={paramValue}
            checked={isActive}
            aria-labelledby={`${valueId}-label`}
            aria-describedby={`${valueId}-count`}
            className="sr-only"
            onChange={(event) => {
              if (
                event.currentTarget.checked &&
                isMutuallyExclusive(filter, name)
              ) {
                uncheckSiblings(event.currentTarget);
              }
              requestFormSubmit(event);
            }}
          />
          <span className="filter-checkbox shrink-0">
            <CheckIcon />
          </span>
          <span id={`${valueId}-label`} className="flex-1">
            {value.label}
          </span>
          <span
            className="text-xs text-on-surface-secondary"
            aria-hidden="true"
          >
            ({value.count})
          </span>
          <span id={`${valueId}-count`} className="sr-only" aria-hidden="true">
            {`${value.count} ${value.count === 1 ? "product" : "products"}`}
          </span>
        </label>
      </li>
    );
  });

  if (values.length === 0) return null;

  return (
    <fieldset className="m-0 border-0 p-0" aria-labelledby={labelId}>
      <ul className="space-y-1 pt-2">{values}</ul>
    </fieldset>
  );
}

function PriceRangeFacet({
  state,
  currencyCode,
}: {
  state: CollectionState;
  currencyCode: string;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minInput = useRef<HTMLInputElement>(null);
  const maxInput = useRef<HTMLInputElement>(null);
  const idPrefix = useId();
  const minId = `${idPrefix}-price-gte`;
  const maxId = `${idPrefix}-price-lte`;
  const activePrice = priceFilter(state);
  const min = activePrice?.min ?? "";
  const max = activePrice?.max ?? "";
  const currencySymbol = formatMoney(
    { amount: "0", currencyCode },
    { locale: DEFAULT_MONEY_LOCALE },
  ).currencyNarrowSymbol;

  useEffect(() => {
    for (const [input, value] of [
      [minInput.current, min],
      [maxInput.current, max],
    ] as const) {
      if (!input) continue;
      const matches =
        value === ""
          ? input.value === ""
          : input.value !== "" && Number(input.value) === value;
      if (!matches) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        input.value = String(value);
      }
    }
  }, [min, max]);

  useEffect(() => {
    function restoreHistoryPrice() {
      // Cancel the draft before the history loader settles, even when the price is unchanged.
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const { filters } = parseCollectionParams(
        new URLSearchParams(window.location.search),
      );
      const price = filters.find((filter) => filter.price != null)?.price;
      if (minInput.current) minInput.current.value = String(price?.min ?? "");
      if (maxInput.current) maxInput.current.value = String(price?.max ?? "");
    }

    window.addEventListener("popstate", restoreHistoryPrice);
    return () => {
      window.removeEventListener("popstate", restoreHistoryPrice);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function submitAfterTyping(event: React.ChangeEvent<HTMLInputElement>) {
    if (timer.current) clearTimeout(timer.current);
    const form = event.currentTarget.form;
    timer.current = setTimeout(() => form?.requestSubmit(), 350);
  }

  return (
    <div className="min-w-0 pt-2">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <label
          htmlFor={minId}
          className="flex min-w-0 items-center gap-1 rounded-input border border-border bg-surface px-2 py-2 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-interactive"
        >
          <span
            className="shrink-0 text-sm text-on-surface-secondary"
            aria-hidden="true"
          >
            {currencySymbol}
          </span>
          <input
            type="number"
            ref={minInput}
            id={minId}
            aria-label={`Minimum price in ${currencyCode}`}
            name={PRICE_MIN_PARAM}
            min="0"
            step="any"
            placeholder="Min"
            defaultValue={min}
            className="w-full min-w-0 flex-1 rounded-none border-0 bg-surface p-0 text-sm text-on-surface focus-visible:outline-none"
            onChange={submitAfterTyping}
          />
        </label>
        <span className="text-center text-sm text-on-surface-secondary">
          to
        </span>
        <label
          htmlFor={maxId}
          className="flex min-w-0 items-center gap-1 rounded-input border border-border bg-surface px-2 py-2 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-interactive"
        >
          <span
            className="shrink-0 text-sm text-on-surface-secondary"
            aria-hidden="true"
          >
            {currencySymbol}
          </span>
          <input
            type="number"
            ref={maxInput}
            id={maxId}
            aria-label={`Maximum price in ${currencyCode}`}
            name={PRICE_MAX_PARAM}
            min="0"
            step="any"
            placeholder="Max"
            defaultValue={max}
            className="w-full min-w-0 flex-1 rounded-none border-0 bg-surface p-0 text-sm text-on-surface focus-visible:outline-none"
            onChange={submitAfterTyping}
          />
        </label>
      </div>
    </div>
  );
}

function ColorSwatchFacet({
  filter,
  state,
  labelId,
}: {
  filter: BrowseFilter;
  state: CollectionState;
  labelId: string;
}) {
  const id = useId();
  const values = filter.values.flatMap((value) => {
    if (!value.input) return [];
    const entries = filterValueInputParamEntries(value.input);
    if (entries.length !== 1) return [];
    const [{ name, value: paramValue }] = entries;
    const swatch = value.swatch;
    const imageUrl = swatch?.image?.previewImage?.url;
    const color = swatch?.color;
    const style = {
      ...(color ? { "--filter-swatch-color": color } : {}),
      ...(imageUrl ? { backgroundImage: `url("${imageUrl}")` } : {}),
    } as CSSProperties;
    const countId = `${id}-${encodeURIComponent(value.id)}-count`;

    return (
      <li key={value.id}>
        <label
          data-testid="facet-option"
          className="relative inline-flex min-h-touch-target min-w-touch-target cursor-pointer items-center justify-center motion-safe:transition-transform motion-safe:active:scale-[0.93]"
          title={`${value.label} (${value.count})`}
        >
          <input
            type="checkbox"
            name={name}
            value={paramValue}
            checked={isFilterInputActive(state.filters, value.input)}
            aria-label={value.label}
            aria-describedby={countId}
            className="sr-only"
            onChange={requestFormSubmit}
          />
          <span className="filter-swatch shrink-0" style={style}>
            <CheckIcon />
          </span>
          <span id={countId} className="sr-only" aria-hidden="true">
            {`${value.count} ${value.count === 1 ? "product" : "products"}`}
          </span>
        </label>
      </li>
    );
  });

  if (values.length === 0) return null;

  return (
    <fieldset className="m-0 border-0 p-0" aria-labelledby={labelId}>
      <ul className="flex flex-wrap gap-2.5 pt-2">{values}</ul>
    </fieldset>
  );
}

function FacetBody({
  filter,
  state,
  labelId,
  currencyCode,
}: {
  filter: BrowseFilter;
  state: CollectionState;
  labelId: string;
  currencyCode: string;
}) {
  if (filter.type === "PRICE_RANGE")
    return <PriceRangeFacet state={state} currencyCode={currencyCode} />;
  if (isSwatchFilter(filter))
    return <ColorSwatchFacet filter={filter} state={state} labelId={labelId} />;
  return <ListFacet filter={filter} state={state} labelId={labelId} />;
}

export function FacetForm({
  availableFilters,
  currencyCode,
  extraHiddenInputs,
}: {
  availableFilters: readonly BrowseFilter[];
  currencyCode: string;
  extraHiddenInputs?: ReactNode;
}) {
  const state: CollectionState = useCollection();
  const { formProps } = useCollectionForm();
  const location = useLocation();
  const sort = currentSortValue(state);

  return (
    <form {...formProps()} method="get" action={location.pathname}>
      {preservedBrowseParams(location.search).map(([name, value], index) => (
        <input
          key={`preserved-${name}-${value}-${index}`}
          type="hidden"
          name={name}
          value={value}
        />
      ))}
      {sort ? <input type="hidden" name="sort_by" value={sort} /> : null}
      {extraHiddenInputs}
      <div key={state.handle} className="divide-y divide-border">
        {availableFilters.map((filter) => (
          <FacetGroup
            key={filter.id}
            filter={filter}
            state={state}
            currencyCode={currencyCode}
          />
        ))}
      </div>
      <noscript>
        <button
          type="submit"
          className="button-primary mt-4 inline-flex h-11 items-center justify-center rounded-button px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Apply filters
        </button>
      </noscript>
    </form>
  );
}

export function FilterDrawer({
  availableFilters,
  currencyCode,
  extraHiddenInputs,
  id = FILTER_DRAWER_ID,
}: {
  availableFilters: readonly BrowseFilter[];
  currencyCode: string;
  extraHiddenInputs?: ReactNode;
  id?: string;
}) {
  // The browser may open this native dialog before React hydrates.
  return (
    <dialog
      id={id}
      className="drawer-left bg-surface text-on-surface"
      aria-labelledby="filter-drawer-title"
      closedby="any"
      suppressHydrationWarning
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center py-2 ps-4">
          <h2
            id="filter-drawer-title"
            className="flex-1 text-lg font-medium text-on-surface"
          >
            Filters
          </h2>
          <button
            type="button"
            commandfor={id}
            command="close"
            className="button-icon inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
            aria-label="Close"
            onClick={() => closeDialog(id)}
          >
            <img
              src="/icons/icon-x.svg"
              alt=""
              className="size-5"
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FacetForm
            availableFilters={availableFilters}
            currencyCode={currencyCode}
            extraHiddenInputs={extraHiddenInputs}
          />
        </div>
      </div>
    </dialog>
  );
}
