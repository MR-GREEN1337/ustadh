import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'images.pexels.com',
      'upload.wikimedia.org',
      'npr.brightspotcdn.com',
      'd3d00swyhr67nd.cloudfront.net',
      'the-public-domain-review.imgix.net',
    ],
  },
};

export default nextConfig;
