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
    return [
      { source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` },
      /* เบราว์เซอร์ยิง /api มาที่ origin เดียวกับที่เปิดเว็บอยู่ แล้ว Next ส่งต่อให้
         ทำให้เปิดจาก localhost, IP ในวง LAN หรือโดเมนจริงได้โดยไม่ต้อง build ใหม่
         และไม่ต้องตั้ง CORS เพราะเบราว์เซอร์เห็นเป็น origin เดียวกัน */
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
    ];
  },
};

export default nextConfig;
