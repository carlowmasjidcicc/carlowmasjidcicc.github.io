import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/index.html",
  "/prayer-times.html",
  "/activities.html",
  "/madrasa.html",
  "/projects.html",
  "/contact.html",
  "/about.html",
  "/privacy.html",
  "/404.html",
] as const;

for (const route of routes) {
  test(`${route} is usable and accessible`, async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    const response = await page.goto(route, { waitUntil: "networkidle" });

    expect(response?.ok()).toBe(true);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("a.skip-link")).toHaveAttribute(
      "href",
      "#main-content",
    );

    const failedImages = await page.locator("img").evaluateAll((images) =>
      images
        .filter(
          (image) =>
            (image as HTMLImageElement).currentSrc !== "" &&
            (!(image as HTMLImageElement).complete ||
              (image as HTMLImageElement).naturalWidth === 0),
        )
        .map((image) => (image as HTMLImageElement).currentSrc),
    );
    expect(failedImages).toEqual([]);

    const horizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);

    if (testInfo.project.name === "desktop") {
      const accessibilityScan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(
        accessibilityScan.violations,
        JSON.stringify(accessibilityScan.violations, null, 2),
      ).toEqual([]);
    }
  });
}

test("all internal page links resolve", async ({ page, request }) => {
  const internalLinks = new Set<string>();

  for (const route of routes) {
    await page.goto(route);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href") ?? ""),
    );
    hrefs.forEach((href) => internalLinks.add(href.split("#")[0]));
  }

  for (const href of internalLinks) {
    const response = await request.get(href);
    expect(response.ok(), `${href} returned ${response.status()}`).toBe(true);
  }
});

test("mobile navigation exposes every primary destination", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/index.html");

  const menu = page.locator(".mobile-nav");
  await menu.locator("summary").click();

  for (const route of routes.slice(1, 7)) {
    await expect(menu.locator(`a[href="${route}"]`)).toBeVisible();
  }
});

test("analytics remains off when consent is absent or declined", async ({
  page,
  context,
}) => {
  await page.goto("/index.html");

  expect(await context.cookies()).toEqual([]);
  await expect(page.locator("[data-google-analytics]")).toHaveCount(0);
  await expect(page.locator("[data-analytics-consent]")).toBeVisible();
  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("cicc-analytics-consent-v1"),
    ),
  ).toBeNull();

  await page.locator("[data-analytics-decline]").click();

  await expect(page.locator("[data-analytics-consent]")).toBeHidden();
  await expect(page.locator("[data-google-analytics]")).toHaveCount(0);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("cicc-analytics-consent-v1"),
    ),
  ).toBe("denied");
});

test("analytics loads only after the visitor opts in", async ({ page }) => {
  await page.route(
    /https:\/\/www\.googletagmanager\.com\/gtag\/js.*/,
    async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: "",
      });
    },
  );
  await page.goto("/index.html");

  await page.locator("[data-analytics-allow]").click();

  await expect(page.locator("[data-analytics-consent]")).toBeHidden();
  await expect(page.locator("[data-google-analytics]")).toHaveAttribute(
    "src",
    /googletagmanager\.com\/gtag\/js\?id=G-57NJ9XEM85/,
  );
  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("cicc-analytics-consent-v1"),
    ),
  ).toBe("granted");
});

test("the Google Map loads only after a visitor requests it", async ({
  page,
}) => {
  await page.route(/https:\/\/www\.google\.com\/maps\?.*/, async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Map test</title>",
    });
  });
  await page.goto("/contact.html");

  const frame = page.locator("[data-map-frame]");
  const placeholder = page.locator("[data-map-placeholder]");
  await expect(frame).toBeHidden();
  await expect(placeholder).toBeVisible();
  await expect(frame).not.toHaveAttribute("src", /.+/);

  await page.locator("[data-load-map]").click();

  await expect(frame).toBeVisible();
  await expect(placeholder).toBeHidden();
  await expect(frame).toHaveAttribute(
    "src",
    /^https:\/\/www\.google\.com\/maps\?/,
  );
});

test("the latest confirmed bank details are published", async ({ page }) => {
  await page.goto("/projects.html");

  const bankDetails = page.locator(".bank-details");
  await expect(bankDetails).toContainText("Carlow Islamic Cultural Centre");
  await expect(bankDetails).toContainText("AIB Carlow");
  await expect(bankDetails).toContainText("44097381");
  await expect(bankDetails).toContainText("93-31-04");
  await expect(bankDetails).toContainText("IE82AIBK93310444097381");
  await expect(bankDetails).toContainText("AIBKIE2D");
});

test("the madrasa page does not publish a timetable", async ({ page }) => {
  await page.goto("/madrasa.html");

  await expect(page.getByText("Weekday learning times.")).toHaveCount(0);
  await expect(page.getByText("4:00pm")).toHaveCount(0);
  await expect(page.getByText("5:30pm")).toHaveCount(0);
  await expect(page.getByText("6:45pm")).toHaveCount(0);
});
