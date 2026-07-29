import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { FxInit, RevealInit, ToTop } from "@/components/Ux";
import { getContent, getSolutionsTree, type ContactContent } from "@/lib/api";
import { isLocale, LOCALES } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";

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
  const en = locale === "en";
  const title = en
    ? "SMC — Smart City Research Center | KMITL"
    : "SMC — ศูนย์วิจัยเมืองอัจฉริยะ | สจล.";
  const description = en
    ? "Smart City Research Center, King Mongkut's Institute of Technology Ladkrabang — turning research into real-world solutions with government and private partners."
    : "ศูนย์วิจัยเมืองอัจฉริยะ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง พัฒนาโซลูชันจากงานวิจัยสู่การใช้งานจริง ร่วมกับหน่วยงานภาครัฐและเอกชน";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { th: "/th", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME[locale as "th" | "en"] ?? SITE_NAME.th,
      locale: en ? "en_US" : "th_TH",
      url: `${SITE_URL}/${locale}`,
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
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
