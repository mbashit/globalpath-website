/** @type {import('next').NextConfig} */
const devScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

// Photos administrators upload in /admin live in Supabase's public site-media bucket.
let supabaseHost = "";
try {
  supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
} catch {}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Website photos (max 5 MB) are uploaded through admin server actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/site-media/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Robots-Tag", value: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? "index, follow" : "noindex, nofollow" },
          { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${devScriptPolicy}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-src 'self' https://calendly.com https://*.calendly.com https://calendar.google.com https://*.cal.com; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; upgrade-insecure-requests` },
        ],
      },
    ];
  },
};

export default nextConfig;
