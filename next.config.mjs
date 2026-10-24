/** @type {import('next').NextConfig} */

// FZ-13: baseline security headers for every response. The CSP is pragmatic
// ('unsafe-inline' for the Next.js hydration scripts) — tightening to a
// nonce-based CSP is a follow-up; the header still blocks frame-ancestors,
// object/embed, and base-uri hijacking today.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Ignored over plain HTTP in local dev; enforced by browsers on HTTPS.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal server bundle for the Docker image.
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    // Self-hosters can add their own S3/MinIO/CDN hostnames here.
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    // Keep large server-only deps out of the client bundle.
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
