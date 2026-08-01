import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = isDev ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: ws: data: blob:" : [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    "https://cloud.umami.is",
    "https://va.vercel-scripts.com",
    "https://vercel-scripts.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: res.cloudinary.com https://*.githubusercontent.com https://*.googleusercontent.com https://cdn.discordapp.com https://media.discordapp.net",
  "font-src 'self'",
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "https://cloud.umami.is",
    "https://vitals.vercel-insights.com",
    "https://va.vercel-scripts.com",
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
  devIndicators: false,
  poweredByHeader: false,
  serverExternalPackages: ['playwright', 'cheerio'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "https", hostname: "res.cloudinary.com" },
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