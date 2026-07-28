import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { FxInit, RevealInit, ToTop } from "@/components/Ux";
import { getContent, getSolutionsTree, type ContactContent } from "@/lib/api";
import { isLocale, LOCALES } from "@/lib/i18n";

/* <html>/<body> และฟอนต์อยู่ที่ app/layout.tsx (root) — ที่นี่ห่อด้วย div เท่านั้น */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "en"
        ? "SMC — Smart City Research Center | KMITL"
        : "SMC — ศูนย์วิจัยเมืองอัจฉริยะ | สจล.",
    description:
      locale === "en"
        ? "Smart City Research Center, King Mongkut's Institute of Technology Ladkrabang"
        : "ศูนย์วิจัยเมืองอัจฉริยะ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [tree, contact] = await Promise.all([
    getSolutionsTree(),
    getContent<ContactContent>("site.contact", locale),
  ]);

  return (
    /* lang อยู่ตรงนี้เพราะ <html> เป็นของ root layout ที่เปลี่ยนตามภาษาไม่ได้
       site-body = เปิดเอฟเฟกต์เฉพาะหน้าเว็บผู้เข้าชม (ฟิล์มเกรน ฯลฯ) ไม่แตะหน้า admin */
    <div lang={locale} className="site-body">
      {/* การเลื่อนแบบนุ่ม — ใช้เฉพาะหน้าเว็บผู้เข้าชม ไม่ใช้ในหน้า admin ที่ต้องกรอกข้อมูล */}
      <Suspense fallback={null}>
        <SmoothScroll />
      </Suspense>
      {/* ไฟส่องตามเมาส์บนการ์ด (.glow) */}
      <FxInit />
      <SiteHeader locale={locale} tree={tree ?? []} />
      {children}
      <SiteFooter locale={locale} tree={tree ?? []} contact={contact} />
      <ToTop />
      {/* useSearchParams ใน RevealInit ต้องอยู่ใต้ Suspense ตามข้อกำหนด Next */}
      <Suspense fallback={null}>
        <RevealInit />
      </Suspense>
    </div>
  );
}
