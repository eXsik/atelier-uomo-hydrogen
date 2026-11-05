import { test, expect } from "@playwright/test";

test("customer can browse from home to a product", async ({ page }) => {
  await page.goto("/");

  const main = page.getByRole("main");

  await expect(
    main.getByRole("heading", {
      name: "Less, but with feeling.",
      level: 1,
    }),
  ).toBeVisible();

  await main
    .getByRole("link", { name: "Discover the collection", exact: true })
    .click();

  await expect(page).toHaveURL(/\/collections\/?$/);

  const collection = main.getByTestId("collection-card").first();

  await expect(collection).toBeVisible();
  await collection.click();

  await expect(page).toHaveURL(/\/collections\/[^/?]+/);

  const product = main
    .getByTestId("product-card")
    .first()
    .getByRole("link");

  await expect(product).toBeVisible();
  const productName = (await product.innerText()).trim();

  await product.click();

  await expect(page).toHaveURL(/\/products\/[^/?]+/);
  await expect(
    main.getByRole("heading", { name: productName, level: 1, exact: true }),
  ).toBeVisible();
});

test("customer can update, persist and remove a cart item", async ({ page }) => {
  await page.goto("/products/hoodie");

  await page
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();

  const drawer = page.getByRole("dialog", { name: "Cart", exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("textbox", { name: "Quantity", exact: true }))
    .toHaveValue("1");

  const [updateResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/cart" &&
        response.request().method() === "POST",
    ),
    drawer
      .getByRole("button", { name: /^Increase quantity for / })
      .click(),
  ]);

  expect(updateResponse.ok()).toBeTruthy();

  // Confirm the saved server state, not just the optimistic UI.
  await expect
    .poll(async () => {
      const response = await page.request.get("/api/cart");
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      return data.cart?.totalQuantity;
    }, {
      message: "Server should persist two cart items",
      timeout: 10_000,
    })
    .toBe(2);

  await expect(drawer.getByRole("textbox", { name: "Quantity", exact: true }))
    .toHaveValue("2");

  await expect(
    page.getByRole("link", { name: "Cart (2 items)", exact: true }),
  ).toBeVisible();

  await drawer.getByRole("button", { name: "Close", exact: true }).click();

  // A full reload verifies that the server restores the cart from its cookie.
  await page.reload();
  await page.getByTestId("cart-trigger").click();

  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("textbox", { name: "Quantity", exact: true }))
    .toHaveValue("2");

  // Verify the checkout handoff without navigating to a third-party website.
  const checkout = drawer.getByRole("link", {
    name: "Checkout",
    exact: true,
  });

  await expect(checkout).toHaveAttribute("href", /[?&]cartId=/);

  const [removeResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/cart" &&
        response.request().method() === "POST",
    ),
    drawer.getByRole("button", { name: /^Remove / }).click(),
  ]);

  expect(removeResponse.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const response = await page.request.get("/api/cart");
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      return data.cart?.totalQuantity;
    }, {
      message: "Server should persist an empty cart",
      timeout: 10_000,
    })
    .toBe(0);

  await expect(
    drawer.getByText("Your cart is empty.", { exact: true }),
  ).toBeVisible();
});

test("customer can search for a product", async ({ page }) => {
  await page.goto("/search?q=hoodie");

  const main = page.getByRole("main");
  const product = main.getByTestId("product-card").first();

  await expect(product).toBeVisible();

  const link = product.getByRole("link");
  const productName = (await link.innerText()).trim();

  await link.click();

  await expect(page).toHaveURL(/\/products\/[^/?]+/);
  await expect(
    main.getByRole("heading", {
      name: productName,
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
});

test("mobile menu navigates to collections", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", {
    name: "Menu",
    exact: true,
  });

  await menuButton.click();

  const menu = page.getByTestId("mobile-nav");
  await expect(menu).toBeVisible();

  await menu
    .getByRole("link", { name: "The collection", exact: true })
    .click();

  await expect(page).toHaveURL(/\/collections\/?$/);
  await expect(menu).not.toBeVisible();
  await expect(
    page.getByRole("main").getByTestId("collection-card").first(),
  ).toBeVisible();
});