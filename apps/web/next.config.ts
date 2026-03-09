import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orchka/ui", "@orchka/nodes"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/workflows",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
