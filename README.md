# Carlow Masjid

The official website of Carlow Islamic Cultural Centre, built as a static Astro
site for GitHub Pages.

## Development

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Quality and production commands:

```sh
npm run check
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Content

Shared contact details, navigation, programme information and outbound donation
links live in [`src/data/site.ts`](src/data/site.ts). Update that file once
rather than changing individual pages.

Operational information follows a no-guessing policy:

- Prayer times are reproduced only from supplied, verified timetables.
- Jama’ah and Jumu’ah times are not implied when the source does not include them.
- Bank details are published only after the latest account is confirmed.
- Unverified schedules include a direct contact fallback.
- Dated notices should be removed or updated when they expire.

Page templates live in `src/pages/`, shared components in `src/components/`,
and the visual system in `src/styles/global.css`.

### Prayer timetable

[`src/data/prayer-times.ts`](src/data/prayer-times.ts) contains the 457 verified
daily rows from October 2026 through December 2027. The values are prayer starts
and sunrise in `Europe/Dublin` wall-clock time; they are not jama’ah times.

`npm run generate:prayer-pdfs` creates the 15 branded, downloadable PDFs in
`public/timetables/`. The normal build runs this generator automatically so the
website and PDFs always use the same source data.

## Deployment

`.github/workflows/deploy.yml` builds the Astro site and publishes it with
`actions/deploy-pages` whenever `main` is updated.

GitHub Pages must use **Settings → Pages → Source: GitHub Actions**. If the
source is left as "Deploy from a branch", GitHub also runs the legacy Jekyll
builder against this repository. Astro components start with `---` fences, which
Jekyll treats as YAML front matter and rejects (for example
`ThemeSwitcher.astro` and `MobileActions.astro`).

A root `.nojekyll` file disables that Jekyll pass. The built site also includes
`public/.nojekyll` so GitHub serves Astro's `_astro/` assets. The custom domain
is `carlowmasjid.ie`, kept in both root `CNAME` (picked up by GitHub Pages) and
`public/CNAME` (copied into the deployed site).

Google Analytics is consent-first and remains unloaded until a visitor opts in.
The contact page embeds Google Maps for Carlow Masjid. The website does not
embed social widgets or payment scripts. The contact form posts to the existing
public Formspree endpoint only after a visitor submits it.