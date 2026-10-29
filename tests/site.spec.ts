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

test("the site sets no visitor cookies", async ({ page, context }) => {
  await page.goto("/index.html");
  expect(await context.cookies()).toEqual([]);
});
