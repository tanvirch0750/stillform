import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  outputFileTracingIncludes: {
    '/*': ['./site/**/*.html', './reference-manifest.json'],
  },
};

export default config;
