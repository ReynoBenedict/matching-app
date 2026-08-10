import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['postgres', 'drizzle-orm'],
  },
}

export default nextConfig;
