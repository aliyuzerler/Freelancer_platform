/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output produces a minimal server bundle for the Docker image.
  output: 'standalone',
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
