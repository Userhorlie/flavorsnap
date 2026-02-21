import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { i18n } = require("./next-i18next.config");

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  i18n,
};

export default nextConfig;
