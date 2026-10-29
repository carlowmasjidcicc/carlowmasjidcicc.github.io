import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://carlowmasjid.ie",
  output: "static",
  build: {
    format: "file",
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
        "font-src 'self'",
        "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
        "frame-src https://www.google.com",
        "form-action 'self' https://formspree.io",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: ["'self'", "https://www.googletagmanager.com"],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        page === "https://carlowmasjid.ie/" || page.endsWith(".html"),
      customPages: [
        "https://carlowmasjid.ie/about.html",
        "https://carlowmasjid.ie/activities.html",
        "https://carlowmasjid.ie/contact.html",
        "https://carlowmasjid.ie/madrasa.html",
        "https://carlowmasjid.ie/prayer-times.html",
        "https://carlowmasjid.ie/privacy.html",
        "https://carlowmasjid.ie/projects.html",
      ],
    }),
  ],
  compressHTML: true,
});
