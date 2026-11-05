import {
  AnalyticsEvent,
  canAddToCart,
  getSelectedProductOptions,
  gql,
} from "@shopify/hydrogen";
import { ShopPayButton } from "@shopify/hydrogen/react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { ProductCard, PRODUCT_CARD_FRAGMENT } from "~/components/ProductCard";
import { ProductGallery } from "~/components/product/ProductGallery";
import { ProductVariantOptions } from "~/components/product/ProductVariantOptions";
import { openCartDrawer } from "~/lib/cart-drawer";
import { formatPrice, salePercent } from "~/lib/money";
import {
  ProductProvider,
  useProductForm,
  type ProductData,
  type ProductVariantData,
  variantUrl,
} from "~/lib/product";
import { storefrontClientContext } from "~/lib/storefront";
import {
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/product";

const PRODUCT_VARIANT_FRAGMENT = gql(`
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    product {
      title
      handle
    }
    sku
  }
`);

const PRODUCT_QUERY = gql(
  `
    query ProductPage($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        description
        descriptionHtml
        requiresSellingPlan
        encodedVariantExistence
        encodedVariantAvailability
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 8) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        options {
          name
          optionValues {
            name
            firstSelectableVariant {
              ...ProductVariantFields
            }
            swatch {
              color
              image {
                previewImage {
                  url
                }
              }
            }
          }
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
        adjacentVariants(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
      }
      products(first: 5) {
        nodes {
          ...ProductCard
        }
      }
    }
  `,
  [PRODUCT_VARIANT_FRAGMENT, PRODUCT_CARD_FRAGMENT],
);

export function meta({ data, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const product = data?.product;

  return [
    { title: formatPageTitle(product?.title ?? "Product", shopName) },
    {
      name: "description",
      content:
        product?.description.trim() ||
        `Discover the collection at ${shopName}.`,
    },
  ];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response("Not Found", { status: 404 });

  const storefrontClient = context.get(storefrontClientContext);
  const selectedOptions = getSelectedProductOptions({
    searchParams: new URL(request.url).searchParams,
  });
  const { data } = await storefrontClient.graphql(PRODUCT_QUERY, {
    variables: { handle, selectedOptions },
  });

  if (!data?.product) throw new Response("Not Found", { status: 404 });

  return {
    product: data.product,
    relatedProducts: data.products.nodes
      .filter((product) => product.handle !== data.product?.handle)
      .slice(0, 4),
  };
}

type RelatedProduct =
  Route.ComponentProps["loaderData"]["relatedProducts"][number];

function ProductViewedTracker({ product }: { product: ProductData }) {
  useEffect(() => {
    const selectedVariant = product.selectedOrFirstAvailableVariant;
    window.Shopify?.analytics?.publish(AnalyticsEvent.PRODUCT_VIEWED, {
      products: [
        {
          id: product.id,
          title: product.title,
          price: selectedVariant?.price ?? product.priceRange.minVariantPrice,
          vendor: product.vendor ?? "",
          variantId: selectedVariant?.id ?? product.id,
          variantTitle: selectedVariant?.title ?? product.title,
          quantity: 1,
          sku: selectedVariant?.sku,
        },
      ],
    });
  }, [product]);

  return null;
}

function PriceBlock({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariantData | null;
}) {
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = selectedVariant?.compareAtPrice;
  const percent = salePercent(price, compareAt);

  return (
    <div className="mt-4" data-product-price>
      <div className="inline-flex flex-wrap items-baseline gap-2">
        {compareAt && percent ? (
          <>
            <span className="font-medium text-sale">
              <span className="sr-only">Sale price: </span>
              {formatPrice(price)}
            </span>
            <s className="text-sm text-compare">
              <span className="sr-only">Regular price: </span>
              {formatPrice(compareAt)}
            </s>
            <span
              className="text-sm font-medium text-sale"
              aria-label={`Save ${percent}%`}
            >
              (-{percent}%)
            </span>
          </>
        ) : (
          <span className="font-medium text-on-surface">
            <span className="sr-only">Price: </span>
            {formatPrice(price)}
          </span>
        )}
      </div>
    </div>
  );
}

function InventoryHint({
  selectedVariant,
}: {
  selectedVariant: ProductVariantData | null;
}) {
  if (!selectedVariant) return null;
  if (!selectedVariant.availableForSale) {
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 text-sm" data-product-inventory>
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-critical"
            aria-hidden="true"
          />
          <span className="font-medium text-critical">Out of stock</span>
        </div>
      </div>
    );
  }

  const quantity = selectedVariant.quantityAvailable;
  if (quantity == null || quantity > 5) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 text-sm" data-product-inventory>
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full bg-warning"
          aria-hidden="true"
        />
        <span className="font-medium text-warning">
          Only {quantity} left in stock
        </span>
      </div>
    </div>
  );
}

function QuantitySelector({
  quantity,
  setQuantity,
}: {
  quantity: number;
  setQuantity: (quantity: number) => void;
}) {
  const { register } = useProductForm();
  const clamp = (value: number) => Math.min(99, Math.max(1, value));

  return (
    <div className="shrink-0">
      <label
        className="mb-2 block text-sm font-medium text-on-surface"
        htmlFor="quantity"
      >
        Quantity
      </label>
      <div
        className="quantity-selector-outlined inline-flex items-center rounded-input"
        data-testid="quantity-stepper"
      >
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center text-on-surface-secondary hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,transform] motion-safe:active:scale-[0.90]"
          aria-label="Decrease quantity"
          onClick={() => setQuantity(clamp(quantity - 1))}
          disabled={quantity <= 1}
        >
          <img
            src="/icons/icon-minus.svg"
            alt=""
            className="size-4"
            aria-hidden="true"
          />
        </button>
        <input
          type="number"
          id="quantity"
          {...register("quantity", { value: quantity })}
          min={1}
          max={99}
          step={1}
          className="number-reset h-11 w-12 rounded-none border-0 bg-transparent p-0 text-center text-sm text-on-surface"
          aria-label="Quantity"
          onChange={(event) =>
            setQuantity(
              clamp(Number.parseInt(event.currentTarget.value, 10) || 1),
            )
          }
        />
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center text-on-surface-secondary hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,transform] motion-safe:active:scale-[0.90]"
          aria-label="Increase quantity"
          onClick={() => setQuantity(clamp(quantity + 1))}
          disabled={quantity >= 99}
        >
          <img
            src="/icons/icon-plus.svg"
            alt=""
            className="size-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

function AddToCart({
  product,
  quantity,
  setQuantity,
  selectedVariant,
}: {
  product: ProductData;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedVariant: ProductVariantData | null;
}) {
  const { options, register, formProps, errors, pending } = useProductForm();
  const addable = canAddToCart(product, options);
  const buttonText = addable
    ? "Add to cart"
    : selectedVariant
      ? "Sold out"
      : "Select options";

  return (
    <>
      <form {...formProps({ afterSubmit: openCartDrawer })}>
        <div className="mt-6 mb-10 flex items-center gap-4">
          <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        </div>
        <input type="hidden" {...register("merchandiseId", {})} />
        <button
          {...register("addToCart", {})}
          className="button-primary inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-button px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
          disabled={!addable || pending}
          data-testid="add-to-cart"
        >
          {buttonText}
        </button>
      </form>
      {selectedVariant ? (
        <div className="mt-3">
          <ShopPayButton
            variants={[{ id: selectedVariant.id, quantity }]}
            disabled={!addable || pending}
            width="100%"
            borderRadius="8px"
          />
        </div>
      ) : null}
      {[...errors.userErrors, ...errors.warnings, ...errors.networkErrors]
        .length ? (
        <div className="mt-3 grid gap-1 text-sm" role="alert">
          {errors.userErrors.map((error) => (
            <p key={error.message} className="text-critical">
              {error.message}
            </p>
          ))}
          {errors.warnings.map((warning) => (
            <p key={warning.message} className="text-warning">
              {warning.message}
            </p>
          ))}
          {errors.networkErrors.map((error) => (
            <p key={error.message} className="text-critical">
              {error.message}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}

function ProductInfo({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariantData | null;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-6 md:sticky md:top-8 md:self-start">
      <div className="pt-4 md:pt-8">
        {product.vendor ? (
          <p className="type-body-sm mb-4 tracking-wide text-on-surface-secondary uppercase">
            {product.vendor}
          </p>
        ) : null}
        <h1 className="type-display text-on-surface">{product.title}</h1>
        <PriceBlock product={product} selectedVariant={selectedVariant} />
        <InventoryHint selectedVariant={selectedVariant} />
      </div>

      <span className="sr-only" aria-live="polite" id="inventory-status" />

      {product.description ? (
        <div className="type-body-sm leading-relaxed text-on-surface-secondary">
          {product.description}
        </div>
      ) : null}

      <div data-product-form>
        <span className="sr-only" aria-live="polite" data-add-to-cart-status />
        <ProductVariantOptions product={product} />
        <AddToCart
          product={product}
          quantity={quantity}
          setQuantity={setQuantity}
          selectedVariant={selectedVariant}
        />
      </div>

      <h2 className="sr-only">Product details</h2>
      <details
        className="group border-t border-b border-border"
        name="product-details"
        open
      >
        <summary className="marker-hidden flex cursor-pointer items-center justify-between px-1 py-4 text-sm font-medium text-on-surface hover:text-on-surface-secondary">
          <span className="text-sm font-medium">Description</span>
          <span
            className="ms-4 size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
            aria-hidden="true"
          >
            <img src="/icons/icon-chevron-down.svg" alt="" className="size-4" />
          </span>
        </summary>
        <div className="richtext px-1 pb-4 text-sm text-on-surface-secondary">
          {product.descriptionHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : (
            <p>{product.description}</p>
          )}
        </div>
      </details>
    </div>
  );
}

function ProductPageContent({ product }: { product: ProductData }) {
  const { selectedVariant } = useProductForm();

  return (
    <section className="mx-auto w-full max-w-page px-margin pb-4">
      <div className="product-grid mb-16 grid grid-cols-1 gap-6 md:gap-12">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        <ProductInfo product={product} selectedVariant={selectedVariant} />
      </div>
    </section>
  );
}

function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-4" aria-labelledby="related-products-heading">
      <div className="border-t border-border pt-12">
        <h2
          id="related-products-heading"
          className="type-heading-xl mx-auto mb-8 max-w-page px-margin"
        >
          More products
        </h2>
        <div className="mx-auto max-w-page px-margin contain-paint">
          <ul role="list" className="related-products-grid">
            {products.map((product) => (
              <li key={product.handle}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ProductRoute({ loaderData }: Route.ComponentProps) {
  const { product, relatedProducts } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const url = variantUrl(
          product,
          result.selectedOptions,
          result.selectedVariant?.product?.handle,
          new URLSearchParams(location.search),
        );
        void navigate(url, {
          replace: true,
          preventScrollReset: true,
          ...(result.status === "resolved"
            ? { defaultShouldRevalidate: false }
            : {}),
        });
      }}
    >
      <ProductViewedTracker product={product} />
      <main className="product-page flex-1" id="main-content" tabIndex={-1}>
        <ProductPageContent product={product} />
        <RelatedProducts products={relatedProducts} />
      </main>
    </ProductProvider>
  );
}
