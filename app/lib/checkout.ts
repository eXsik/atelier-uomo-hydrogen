type CheckoutCart = {
  id: string | null;
  checkoutUrl: string | null;
};

/** Extra checkout handoff needed by the mock.shop browser demo. */
export function getMockCheckoutUrl(cart: CheckoutCart): string | undefined {
  if (!cart.id || !cart.checkoutUrl) return undefined;

  try {
    const url = new URL(cart.checkoutUrl);
    const isMockShop =
      url.hostname === "mock.shop" || url.hostname.endsWith(".mock.shop");
    if (!isMockShop || url.protocol !== "https:") return undefined;

    // The demo's generic /checkout URL cannot read the storefront's cart cookie
    // across domains. Hydrogen accepts cartId to explicitly load the same cart.
    url.searchParams.set("cartId", cart.id);
    return url.toString();
  } catch {
    return undefined;
  }
}
