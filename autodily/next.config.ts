import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["child_process", "basic-ftp", "csv-parse"],
};

export default nextConfig;
