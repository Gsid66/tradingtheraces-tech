/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for better error detection during development
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: [], // Add external image domains here if needed
    formats: ['image/webp'],
  },
  
  // Environment variables that should be available on the client side
  // (prefix with NEXT_PUBLIC_ in .env files)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Optional: Add custom headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig