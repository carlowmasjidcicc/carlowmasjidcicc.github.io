import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://carlowmasjid.ie",
  output: "static",
  build: {
    format: "file",
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
