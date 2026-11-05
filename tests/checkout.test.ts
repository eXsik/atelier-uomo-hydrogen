import assert from "node:assert/strict";
import test from "node:test";
import { getMockCheckoutUrl } from "../app/lib/checkout.ts";

const id = "gid://shopify/Cart/test-cart?key=test-key";

test("mock checkout receives the full cart ID, preserving existing parameters", () => {
  const result = getMockCheckoutUrl({
    id,
    checkoutUrl:
      "https://demostore.hydrogen.mock.shop/checkout?source=hydrogen",
  });
  assert.ok(result);
  const url = new URL(result);
  assert.equal(url.searchParams.get("cartId"), id);
  assert.equal(url.searchParams.get("source"), "hydrogen");
});

test("an outdated cartId is replaced with the current cart", () => {
  const result = getMockCheckoutUrl({
    id,
    checkoutUrl: "https://mock.shop/checkout?cartId=old",
  });
  assert.ok(result);
  assert.equal(new URL(result).searchParams.get("cartId"), id);
});

test("real Shopify checkout and unrelated domains retain the default handoff", () => {
  for (const checkoutUrl of [
    "https://store.myshopify.com/checkouts/token?key=secret",
    "https://mock.shop.example.com/checkout",
    "https://example.com/checkout",
  ]) {
    assert.equal(getMockCheckoutUrl({ id, checkoutUrl }), undefined);
  }
});

test("missing data, relative URLs and invalid URLs do not produce an override", () => {
  for (const cart of [
    { id: null, checkoutUrl: "https://mock.shop/checkout" },
    { id, checkoutUrl: null },
    { id, checkoutUrl: "/checkout" },
    { id, checkoutUrl: "invalid" },
  ]) {
    assert.equal(getMockCheckoutUrl(cart), undefined);
  }
});
