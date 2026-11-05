import {
  buildProductSelectionSearchParams,
  type SelectedOption,
} from "@shopify/hydrogen";
import { createProductComponents } from "@shopify/hydrogen/react";

import type { Route } from "../routes/+types/product";

export type ProductData = Route.ComponentProps["loaderData"]["product"];
export type ProductVariantData = NonNullable<
  ProductData["selectedOrFirstAvailableVariant"]
>;

export function variantUrl(
  product: { handle: string; options: Array<{ name: string }> },
  selectedOptions: SelectedOption[],
  handle = product.handle,
  base: URLSearchParams = new URLSearchParams(),
) {
  const params = buildProductSelectionSearchParams({
    selectedOptions,
    optionNames: product.options.map((option) => option.name),
    base,
  });
  const query = params.toString();
  return `/products/${handle}${query ? `?${query}` : ""}`;
}

export const { ProductProvider, useProductForm } =
  createProductComponents<ProductData>();
