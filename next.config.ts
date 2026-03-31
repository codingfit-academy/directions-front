import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Docker 경량 빌드에 필요
};

export default nextConfig;
