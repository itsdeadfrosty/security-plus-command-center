import type { NextConfig } from "next";

// Static export: the app is fully client-side (local-first, IndexedDB), so it
// can be hosted on any static host (GitHub Pages, Netlify, Cloudflare Pages).
// Set NEXT_PUBLIC_BASE_PATH when hosting under a sub-path (GitHub Pages: /<repo>).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
