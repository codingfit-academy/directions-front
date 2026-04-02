import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Docker 경량 빌드에 필요
  allowedDevOrigins: ['*'], // 모든 개발 호스트 허용
};

export default nextConfig;
