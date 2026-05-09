import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "athfcofvmcnrescfcdyb.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB. Our largest accepted upload is 10 MB (resume PDF);
      // headshot/photo cap is 5 MB. 12 MB gives headroom for FormData overhead.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
