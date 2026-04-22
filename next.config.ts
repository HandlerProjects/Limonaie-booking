import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lelimonaieincentro.it',
      },
      {
        protocol: 'https',
        hostname: 'yzxwdsftbauhdmasiqoh.supabase.co',
      },
    ],
  },
};

export default nextConfig;
