import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages / any static host
  output: "export",

  // Image optimization requires a server — disable for static export
  images: {
    unoptimized: true,
  },

  // Trailing slash makes static hosts serve /path/index.html for /path
  trailingSlash: true,
};

export default nextConfig;
