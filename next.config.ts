import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = isDev ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: ws: data: blob:" : [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    "https://va.vercel-scripts.com",
    "https://vercel-scripts.com",
    "https://cloud.umami.is",
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: res.cloudinary.com https://*.githubusercontent.com https://*.googleusercontent.com https://cdn.discordapp.com https://media.discordapp.net",
  "font-src 'self'",
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "https://vitals.vercel-insights.com",
    "https://va.vercel-scripts.com",
    "https://cloud.umami.is",
    "https://gateway.umami.is",
  ].join(" "),
  [
    "frame-src 'self'",
    "https://*.supabase.co",
    "https://accounts.google.com",
    "https://discord.com",
  ].join(" "),
  [
    "form-action 'self'",
    "https://*.supabase.co",
    "https://accounts.google.com",
    "https://discord.com",
  ].join(" "),
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: isDev ? ["192.168.0.69"] : [],
  cacheComponents: true,
  // Partial prefetching: Links prefetch only the static shell of a route, so
  // category navigation is instant without prefetching every filter combo.
  partialPrefetching: true,
  // Catalog data freshness (seconds). stale = served directly; revalidate =
  // background SWR window; expire = hard cutoff. On-demand revalidation via
  // /api/revalidate overrides time-based expiry for all of these.
  cacheLife: {
    // Listings + sound tests + home page sections. ~60s fresh.
    catalog: { stale: 60, revalidate: 300, expire: 3600 },
    // Filter facet data (brands/vendors/specs/price bounds). ~5min fresh.
    filters: { stale: 300, revalidate: 300, expire: 3600 },
    // Switch picker list. ~10min fresh.
    options: { stale: 600, revalidate: 600, expire: 7200 },
  },
  devIndicators: false,
  poweredByHeader: false,
  serverExternalPackages: ['playwright', 'cheerio'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Only hosts the CSP `img-src` allow-list already trusts. `next/image`
    // re-hosts external URLs as same-origin /_next/image requests, so the CSP
    // alone would not stop the optimizer from fetching arbitrary domains — the
    // wildcard here did that for free while paying to process any image.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.discordapp.net" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;