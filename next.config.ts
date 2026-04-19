import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.greenhouse.io' },
      { protocol: 'https', hostname: '**.lever.co' },
    ],
  },
}

export default nextConfig
