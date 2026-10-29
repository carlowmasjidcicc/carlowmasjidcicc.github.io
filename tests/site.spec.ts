import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  addDays,
  prayerTimetable,
  prayerTimetableMeta,
  timetableColumns,
  timetableMonths,
} from "../src/data/prayer-times";
import { site } from "../src/data/site";
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

test("GitHub Pages skips Jekyll and keeps the custom domain", async () => {
  const rootCname = (
    await readFile(new URL("../CNAME", import.meta.url), "utf8")
  ).trim();
  const publicCname = (
    await readFile(new URL("../public/CNAME", import.meta.url), "utf8")
  ).trim();

  expect(rootCname).toBe("carlowmasjid.ie");
  expect(publicCname).toBe("carlowmasjid.ie");
  await access(new URL("../.nojekyll", import.meta.url));
  await access(new URL("../public/.nojekyll", import.meta.url));
});

test("the verified prayer dataset is complete and unchanged", () => {
  expect(prayerTimetable).toHaveLength(457);
  expect(
    createHash("sha256")
      .update(JSON.stringify(prayerTimetable))
      .digest("hex"),
  ).toBe("9a2a253a834fb0743a5c37d281f499353b85b0b6d960cbb44f010299a3a3f5eb");

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
    "2027-02": 28,
    "2027-03": 31,
    "2027-04": 30,
    "2027-05": 31,
    "2027-06": 30,
    "2027-07": 31,
    "2027-08": 31,
    "2027-09": 30,
    "2027-10": 31,
    "2027-11": 30,
    "2027-12": 31,
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
    date: "2027-12-31",
    fajr: "06:44",
    sunrise: "08:37",
    dhuhr: "12:32",
    asr: "14:07",
    maghrib: "16:24",
    isha: "18:11",
  });
  expect(
    prayerTimetable.find(({ date }) => date === "2027-03-25"),
  ).toMatchObject({ fajr: "04:44" });
  expect(
    prayerTimetable.find(({ date }) => date === "2027-07-20"),
  ).toMatchObject({ isha: "23:02" });
  expect(timetableMonths).toHaveLength(15);
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
  expect(getPrayerState(new Date("2028-01-01T12:00:00Z"))).toBeNull();
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

test("the footer credits the website designer", async ({ page }) => {
  for (const route of ["/index.html", "/contact.html"]) {
    await page.goto(route);
    const credit = page.locator('footer a[href="https://nalam.me"]');
    await expect(credit).toHaveText("Nazmul Alam");
    await expect(credit).toHaveAttribute("target", "_blank");
    await expect(credit).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.locator("footer")).toContainText(
      "Website designed & maintained by",
    );
  }
});

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

  await explorer.locator("[data-month-picker]").selectOption("2027-12");
  await expect(explorer.locator("[data-month-body] tr")).toHaveCount(31);
  await expect(explorer.locator("[data-month-heading]")).toHaveText(
    "December 2027",
  );
  await expect(explorer.locator("[data-month-download]")).toHaveAttribute(
    "href",
    "/timetables/carlow-december-2027.pdf",
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

test("the contact page shows the Carlow Masjid Google Map", async ({
  page,
}) => {
  await page.route(/https:\/\/www\.google\.com\/maps\/embed.*/, async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Map test</title>",
    });
  });
  await page.goto("/contact.html");

  const frame = page.locator("[data-map-frame]");
  await expect(page.locator("[data-load-map]")).toHaveCount(0);
  await expect(page.locator("[data-map-placeholder]")).toHaveCount(0);
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("src", site.mapEmbedUrl);
  await expect(frame).toHaveAttribute("src", /52\.8350646/);
  await expect(page.locator(".map-directions")).toHaveAttribute(
    "href",
    site.directionsUrl,
  );
  expect(site.directionsUrl).toContain(`query_place_id=${site.mapPlaceId}`);
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

test("the historical team roster is present with shared contact details", async ({
  page,
}) => {
  await page.goto("/about.html");

  const team = page.locator("#our-team");
  await expect(team.locator(".team-card")).toHaveCount(6);

  for (const member of [
    "Hafid Tribak",
    "Muhammad Yousaf",
    "Ahmed Ghirfani",
    "Abderrahim Elaasri",
    "Sayed Alam",
    "Nazmul Alam",
  ]) {
    await expect(team.getByRole("heading", { name: member })).toBeVisible();
  }

  await expect(team.getByText("Imam", { exact: true })).toBeVisible();
  await expect(team.getByText("Trustee", { exact: true })).toBeVisible();
  await expect(team.getByText("Treasurer", { exact: true })).toBeVisible();
  await expect(team.getByText("Technical Specialist", { exact: true })).toBeVisible();
  await expect(team.locator('a[href="mailto:info@carlowmasjid.ie"]')).toHaveCount(
    6,
  );
});

test("light, dark and system themes apply and persist", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/index.html");

  const root = page.locator("html");
  const light = page.locator('[data-theme-option="light"]');
  const dark = page.locator('[data-theme-option="dark"]');
  const system = page.locator('[data-theme-option="system"]');

  await expect(root).toHaveAttribute("data-theme-preference", "system");
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(system).toHaveAttribute("aria-pressed", "true");

  await dark.click();
  await expect(root).toHaveAttribute("data-theme-preference", "dark");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("cicc-theme-preference"),
    ),
  ).toBe("dark");

  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  await light.click();
  await expect(root).toHaveAttribute("data-theme", "light");
  await system.click();
  await expect(root).toHaveAttribute("data-theme-preference", "system");
  await expect(root).toHaveAttribute("data-theme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(system).toHaveAttribute("aria-pressed", "true");
});

test("every page remains accessible in dark mode", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.addInitScript(() => {
    window.localStorage.setItem("cicc-theme-preference", "dark");
  });

  for (const route of routes) {
    await page.goto(route);
    const accessibilityScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      accessibilityScan.violations,
      `${route}\n${JSON.stringify(accessibilityScan.violations, null, 2)}`,
    ).toEqual([]);
  }
});

test("the madrasa page does not publish a timetable", async ({ page }) => {
  await page.goto("/madrasa.html");

  await expect(page.getByText("Weekday learning times.")).toHaveCount(0);
  await expect(page.getByText("4:00pm")).toHaveCount(0);
  await expect(page.getByText("5:30pm")).toHaveCount(0);
  await expect(page.getByText("6:45pm")).toHaveCount(0);
});
