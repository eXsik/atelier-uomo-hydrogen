import { expect, test } from "@playwright/test";

function queryParam(page: import("@playwright/test").Page, name: string) {
  return new URL(page.url()).searchParams.get(name);
}

async function injectFacetFixture(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const root = document.createElement("div");
    root.id = "facet-test-root";
    document.body.append(root);
  });
  await page.addScriptTag({
    type: "module",
    url: "/tests/e2e/fixtures/browse-facets.tsx",
  });

  const fixture = page.getByTestId("browse-facets-fixture");
  await expect(fixture).toBeVisible();
  return fixture;
}

async function mountFacetFixture(page: import("@playwright/test").Page) {
  await page.goto("/search?q=hoodie&utm_campaign=fixture");
  return injectFacetFixture(page);
}

test("facets update browse state, preserve search params, and support chips", async ({
  page,
}) => {
  const fixture = await mountFacetFixture(page);
  const filterPanel = fixture.getByRole("complementary", { name: "Filters" });
  const form = filterPanel.locator("form");
  await expect(form).toHaveAttribute("method", "get");
  await expect(form).toHaveAttribute("action", "/search");
  await expect(form.locator('input[name="q"]')).toHaveValue("hoodie");

  const availability = filterPanel.getByTestId("facet-option");
  const inStock = availability.nth(0);
  const outOfStock = availability.nth(1);
  await inStock.click();

  await expect.poll(() => queryParam(page, "filter.v.availability")).toBe("1");
  await expect.poll(() => queryParam(page, "q")).toBe("hoodie");
  await expect.poll(() => queryParam(page, "utm_campaign")).toBe("fixture");
  await expect(inStock.getByRole("checkbox")).toBeChecked();

  await outOfStock.click();
  await expect.poll(() => queryParam(page, "filter.v.availability")).toBe("0");
  await expect(inStock.getByRole("checkbox")).not.toBeChecked();
  await expect(outOfStock.getByRole("checkbox")).toBeChecked();

  const activeFilters = page.getByRole("region", { name: "Active filters" });
  await activeFilters
    .getByRole("link", { name: "Remove Out of stock filter" })
    .click();
  await expect.poll(() => queryParam(page, "filter.v.availability")).toBeNull();
  await expect.poll(() => queryParam(page, "q")).toBe("hoodie");
  await expect.poll(() => queryParam(page, "utm_campaign")).toBe("fixture");

  await inStock.click();
  await expect.poll(() => queryParam(page, "filter.v.availability")).toBe("1");
  await activeFilters.getByRole("link", { name: "Clear all" }).click();
  await expect.poll(() => queryParam(page, "filter.v.availability")).toBeNull();
});

test("price range inputs apply and persist after reload", async ({ page }) => {
  const fixture = await mountFacetFixture(page);
  const filterPanel = fixture.getByRole("complementary", { name: "Filters" });
  const minimum = filterPanel.getByRole("spinbutton", {
    name: "Minimum price in CAD",
  });
  const maximum = filterPanel.getByRole("spinbutton", {
    name: "Maximum price in CAD",
  });

  await minimum.fill("10.5");
  await expect.poll(() => queryParam(page, "filter.v.price.gte")).toBe("10.5");
  await expect.poll(() => queryParam(page, "utm_campaign")).toBe("fixture");

  await maximum.fill("100");
  await expect.poll(() => queryParam(page, "filter.v.price.lte")).toBe("100");

  await page.reload();
  const reloadedFixture = await injectFacetFixture(page);
  const reloadedFilters = reloadedFixture.getByRole("complementary", {
    name: "Filters",
  });
  await expect(
    reloadedFilters.getByRole("spinbutton", { name: "Minimum price in CAD" }),
  ).toHaveValue("10.5");
  await expect(
    reloadedFilters.getByRole("spinbutton", { name: "Maximum price in CAD" }),
  ).toHaveValue("100");
});

test("live search sorting works as a GET without JavaScript and preserves q", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL as string,
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();
    await page.goto("/search?q=hoodie&utm_campaign=fixture");

    const sort = page.getByRole("combobox", { name: "Sort by" });
    await sort.selectOption({ label: "Price, low to high" });
    await sort
      .locator("xpath=ancestor::form")
      .getByRole("button", {
        name: "Sort",
      })
      .click();

    await expect.poll(() => queryParam(page, "sort_by")).toBeTruthy();
    await expect.poll(() => queryParam(page, "q")).toBe("hoodie");
    await expect.poll(() => queryParam(page, "utm_campaign")).toBe("fixture");
  } finally {
    await context.close();
  }
});
