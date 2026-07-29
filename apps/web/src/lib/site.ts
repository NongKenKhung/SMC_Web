/** ที่อยู่เว็บไซต์จริง — ใช้กับ sitemap, robots และลิงก์แชร์โซเชียล
 *  ตอน deploy ต้องตั้ง NEXT_PUBLIC_SITE_URL เป็นโดเมนจริง
 *  ไม่งั้น Google จะเก็บลิงก์ localhost ไปแสดงในผลค้นหา */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"
).replace(/\/+$/, "");

export const SITE_NAME = {
  th: "SMC — ศูนย์วิจัยเมืองอัจฉริยะ สจล.",
  en: "SMC — Smart City Research Center, KMITL",
} as const;
