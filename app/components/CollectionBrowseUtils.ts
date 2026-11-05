import {
  getSortByValue,
  isFilterInputActive,
  serializeCollectionParams,
  type CollectionState,
  type MoneyV2,
  type ProductFilter,
} from "@shopify/hydrogen";

export type BrowseFilter = {
  id: string;
  label: string;
  type?: string | null;
  presentation?: string | null;
  values: readonly BrowseFilterValue[];
};

type BrowseFilterValue = {
  id: string;
  label: string;
  count: number;
  input?: string | null;
  swatch?: {
    color?: string | null;
    image?: {
      previewImage?: {
        url?: string | null;
        altText?: string | null;
      } | null;
    } | null;
  } | null;
};

export const FILTER_DRAWER_ID = "collection-filter-drawer";
export const PRICE_MIN_PARAM = "filter.v.price.gte";
export const PRICE_MAX_PARAM = "filter.v.price.lte";

const NON_PRESERVED_BROWSE_PARAMS = new Set([
  "after",
  "before",
  "q",
  "sort_by",
]);

export function requestFormSubmit(
  event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
) {
  event.currentTarget.form?.requestSubmit();
}

export function currentSortValue(state: CollectionState): string | undefined {
  return state.sortKey
    ? getSortByValue(state.sortKey, state.reverse)
    : undefined;
}

export function filterValueInputParamEntries(
  input: string,
): Array<{ name: string; value: string }> {
  let filter: ProductFilter;
  try {
    filter = JSON.parse(input) as ProductFilter;
  } catch {
    return [];
  }

  return Array.from(
    serializeCollectionParams({
      filters: [filter],
      sortKey: undefined,
      reverse: false,
    }),
    ([name, value]) => ({ name, value }),
  );
}

export function priceFilter(state: CollectionState) {
  return state.filters.find((filter) => filter.price != null)?.price;
}

export function money(amount: number, currencyCode: string): MoneyV2 {
  return { amount: String(amount), currencyCode };
}

export function activeValueCount(
  filter: BrowseFilter,
  state: CollectionState,
): number {
  if (filter.type === "PRICE_RANGE") return priceFilter(state) ? 1 : 0;
  return filter.values.filter(
    (value) => value.input && isFilterInputActive(state.filters, value.input),
  ).length;
}

export function isSwatchFilter(filter: BrowseFilter): boolean {
  return (
    filter.presentation === "SWATCH" ||
    filter.values.some(
      (value) => value.swatch?.color || value.swatch?.image?.previewImage?.url,
    )
  );
}

export function isMutuallyExclusive(
  filter: BrowseFilter,
  inputName: string,
): boolean {
  return filter.type === "BOOLEAN" || inputName === "filter.v.availability";
}

export function uncheckSiblings(input: HTMLInputElement) {
  const form = input.form;
  if (!form) return;
  for (const candidate of form.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"]',
  )) {
    if (candidate !== input && candidate.name === input.name)
      candidate.checked = false;
  }
}

export function openDialogFallback(id: string): void {
  if (supportsDialogCommands() || typeof document === "undefined") return;
  const dialog = document.getElementById(id);
  if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
}

export function closeDialog(id: string): void {
  if (typeof document === "undefined") return;
  const dialog = document.getElementById(id);
  if (dialog instanceof HTMLDialogElement) dialog.close();
}

export function preservedBrowseParams(search: string) {
  return Array.from(new URLSearchParams(search)).filter(
    ([name]) =>
      !name.startsWith("filter.") && !NON_PRESERVED_BROWSE_PARAMS.has(name),
  );
}

function supportsDialogCommands(): boolean {
  if (typeof HTMLButtonElement === "undefined") return false;
  return (
    "command" in HTMLButtonElement.prototype &&
    "commandForElement" in HTMLButtonElement.prototype
  );
}
