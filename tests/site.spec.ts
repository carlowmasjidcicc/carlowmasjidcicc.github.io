import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  addDays,
  prayerTimetable,
  prayerTimetableMeta,
  timetableColumns,
  timetableMonths,
} from "../src/data/prayer-times";
import { getPrayerState } from "../src/utils/prayer-time";

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

test("the verified prayer dataset is complete and unchanged", () => {
  expect(prayerTimetable).toHaveLength(123);
  expect(
    createHash("sha256")
      .update(JSON.stringify(prayerTimetable))
      .digest("hex"),
  ).toBe("6f61e6e44eda1109991aff6ef1c68bcaa4f7b1ccaba01db18947f3fd177bbdd6");

  const monthCounts = prayerTimetable.reduce<Record<string, number>>(
    (counts, day) => {
      const month = day.date.slice(0, 7);
      counts[month] = (counts[month] ?? 0) + 1;
      return counts;
    },
    {},
  );
  expect(monthCounts).toEqual({
    "2026-10": 31,
    "2026-11": 30,
    "2026-12": 31,
    "2027-01": 31,
  });

  prayerTimetable.forEach((day, index) => {
    expect(day.date).toBe(addDays(prayerTimetableMeta.coverageStart, index));
    const minutes = timetableColumns.map((name) => {
      const [hours, minute] = day[name].split(":").map(Number);
      return hours * 60 + minute;
    });
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  });

  expect(prayerTimetable[28]).toEqual({
    date: "2026-10-29",
    fajr: "05:32",
    sunrise: "07:14",
    dhuhr: "12:13",
    asr: "14:37",
    maghrib: "17:08",
    isha: "18:44",
  });
  expect(prayerTimetable.at(-1)).toEqual({
    date: "2027-01-31",
    fajr: "06:24",
    sunrise: "08:10",
    dhuhr: "12:43",
    asr: "14:46",
    maghrib: "17:11",
    isha: "18:51",
  });
});

test("current and next prayer use Europe/Dublin wall-clock time", () => {
  const evening = getPrayerState(new Date("2026-10-29T18:19:00Z"));
  expect(evening?.current).toMatchObject({
    date: "2026-10-29",
    name: "maghrib",
    time: "17:08",
  });
  expect(evening?.next).toMatchObject({
    date: "2026-10-29",
    name: "isha",
    time: "18:44",
  });

  const afterIsha = getPrayerState(new Date("2026-10-29T19:00:00Z"));
  expect(afterIsha?.current).toMatchObject({
    date: "2026-10-29",
    name: "isha",
    time: "18:44",
  });
  expect(afterIsha?.next).toMatchObject({
    date: "2026-10-30",
    name: "fajr",
    time: "05:34",
  });

  const acrossClockChange = getPrayerState(
    new Date("2026-10-24T20:30:00Z"),
  );
  expect(acrossClockChange?.next).toMatchObject({
    date: "2026-10-25",
    name: "fajr",
    time: "05:26",
    epoch: Date.parse("2026-10-25T05:26:00Z"),
  });
  expect(getPrayerState(new Date("2027-02-01T12:00:00Z"))).toBeNull();
});

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

test("homepage shows current, next and sunrise from the verified day", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-29T18:19:00Z"));
  await page.goto("/index.html");

  const panel = page.locator("[data-prayer-panel]");
  await expect(panel.locator("[data-prayer-date]")).toHaveText(
    "Thursday 29 October 2026",
  );
  await expect(panel.locator("[data-current-name]")).toHaveText("Maghrib");
  await expect(panel.locator("[data-current-time]")).toHaveText("17:08");
  await expect(panel.locator("[data-next-name]")).toHaveText("Isha");
  await expect(panel.locator("[data-next-time]")).toHaveText("18:44");
  await expect(panel.locator("[data-next-countdown]")).toContainText("25 min");
  await expect(panel.locator("[data-sunrise-time]")).toHaveText("07:14");
});

test("prayer timetable switches between day, week and month", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-29T18:19:00Z"));
  await page.goto("/prayer-times.html");

  const explorer = page.locator("[data-timetable-explorer]");
  await expect(explorer.locator("[data-day-heading]")).toHaveText(
    "Thursday 29 October 2026",
  );
  await expect(explorer.locator('[data-day-card="fajr"]')).toContainText(
    "05:32",
  );
  await expect(explorer.locator('[data-day-card="sunrise"]')).toContainText(
    "07:14",
  );

  await explorer.locator('[data-view-button="week"]').click();
  await expect(explorer.locator("[data-week-body] tr")).toHaveCount(7);
  await expect(explorer.locator("[data-week-heading]")).toHaveText(
    "Mon, 26 Oct – Sun, 1 Nov",
  );

  await explorer.locator('[data-view-button="month"]').click();
  await expect(explorer.locator("[data-month-body] tr")).toHaveCount(31);
  await expect(explorer.locator("[data-month-download]")).toHaveAttribute(
    "href",
    "/timetables/carlow-october-2026.pdf",
  );

  await explorer.locator("[data-month-picker]").selectOption("2026-11");
  await expect(explorer.locator("[data-month-body] tr")).toHaveCount(30);
  await expect(explorer.locator("[data-month-heading]")).toHaveText(
    "November 2026",
  );
  await expect(explorer.locator("[data-month-download]")).toHaveAttribute(
    "href",
    "/timetables/carlow-november-2026.pdf",
  );
});

test("every branded monthly timetable PDF is downloadable", async ({
  request,
}) => {
  for (const month of timetableMonths) {
    const response = await request.get(month.pdf);
    expect(response.ok(), `${month.pdf} returned ${response.status()}`).toBe(
      true,
    );
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const body = await response.body();
    expect(body.subarray(0, 4).toString()).toBe("%PDF");
    expect(body.byteLength).toBeGreaterThan(10_000);
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
