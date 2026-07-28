import type { Metadata } from "next";
import { Anton, Sarabun } from "next/font/google";
import "./globals.css";

/* Root layout — Next บังคับให้มีตัวนี้ ไม่งั้น not-found.tsx และ error boundary
   ใช้งานไม่ได้ (จะตกไปหน้า 404 ขาวดำมาตรฐานแทน)
   <html>/<body> อยู่ที่นี่ที่เดียว layout ย่อย (locale/admin) ห้ามเรนเดอร์ซ้ำ */

/* ฟอนต์ไทยแบบมีหัว — Sarabun (มาตรฐานเอกสารราชการไทย อ่านง่าย มีน้ำหนักครบ) */
const thaiFont = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-thai",
  display: "swap",
});

/* ฟอนต์ดิสเพลย์ทรงโปสเตอร์ — ใช้กับตัวอักษรยักษ์ภาษาอังกฤษเท่านั้น
   (หัว hero, ตัวอักษรฉากหลัง, แถบ marquee, เลขสถิติ, เลข 404) */
const displayFont = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMC — ศูนย์วิจัยเมืองอัจฉริยะ | สจล.",
  description:
    "ศูนย์วิจัยเมืองอัจฉริยะ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${thaiFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
