import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Exclude heavy native-binary packages from file tracing.
    // 'sharp' and '@img' are the primary cause of "Collecting build traces"
    // hanging on Vercel's build VMs — they are not needed for this app.
    outputFileTracingExcludes: {
      '*': ['node_modules/sharp', 'node_modules/@img'],
    },
  },
};

export default nextConfig;
