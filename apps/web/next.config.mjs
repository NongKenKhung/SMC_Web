import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/* โหลด .env รวมจาก root ของ monorepo (sml-web/.env) */
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
