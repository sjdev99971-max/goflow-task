/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 't.me' },
      { protocol: 'https', hostname: '**.telegram.org' }
    ]
  },
  experimental: { serverActions: { bodySizeLimit: '5mb' } }
}
module.exports = nextConfig
