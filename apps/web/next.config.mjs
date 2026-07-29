import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/* โหลด .env รวมจาก root ของ monorepo (sml-web/.env) */
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../.env") });

/* ต้นทางไฟล์อัปโหลด = origin ของ API (ตัด /api ท้ายออก) */
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/api$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  /* รูปที่แทรกใน rich text ถูกเก็บเป็น path สัมพัทธ์ "/uploads/xxx"
     (ตัว sanitize ฝั่งเซิร์ฟเวอร์บังคับรูปแบบนี้เพื่อกันรูปจากเว็บนอก)
     เบราว์เซอร์จึงไปขอที่ origin ของเว็บ ไม่ใช่ของ API → ต้อง proxy ต่อให้ */
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` }];
  },
};

export default nextConfig;
