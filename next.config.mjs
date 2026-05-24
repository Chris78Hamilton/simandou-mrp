/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    skipMiddlewareUrlNormalize: true,
  },
  env: {
    SUPABASE_BYPASS_PROXY: 'true',
  },
};

export default nextConfig;
