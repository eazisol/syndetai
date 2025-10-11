/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  compiler: {
    emotion: true,
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
