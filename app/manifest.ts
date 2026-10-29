import type { MetadataRoute } from "next";

// Lets phones add the site to the home screen and open it like an app (no browser bar).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kirayə Al — kirayeal.az",
    short_name: "kirayeal.az",
    description: "Ev, avtomobil, motosiklet və avadanlıq kirayəsi elanları.",
    lang: "az",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
