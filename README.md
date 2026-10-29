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

- Prayer and Jumu'ah times are published only from a centre-verified timetable.
- Conflicting bank details are not displayed.
- Unverified schedules include a direct contact fallback.
- Dated notices should be removed or updated when they expire.

Page templates live in `src/pages/`, shared components in `src/components/`,
and the visual system in `src/styles/global.css`.

## Deployment

`.github/workflows/deploy.yml` builds and deploys the site whenever `main` is
updated. In the repository's **Settings → Pages** screen, set the source to
**GitHub Actions** once before the first deployment. The custom domain is
preserved through `public/CNAME`.

The website intentionally avoids analytics, embedded maps, social widgets and
payment scripts. The contact form posts to the existing public Formspree form
endpoint only after a visitor submits it.