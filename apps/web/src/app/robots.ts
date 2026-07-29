import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** เสิร์ฟที่ /robots.txt — ห้ามเก็บหน้า admin และไฟล์อัปโหลด */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/uploads"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
