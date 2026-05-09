import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Supabase storage hostname for next/image remotePatterns. Derived from
// NEXT_PUBLIC_SUPABASE_URL so the same config works across environments.
function supabaseStorageHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseStorageHost();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    serverActions: {
      // Default is 1MB. Our largest accepted upload is 10 MB (resume PDF);
      // headshot/photo cap is 5 MB. 12 MB gives headroom for FormData overhead.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/render/image/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
