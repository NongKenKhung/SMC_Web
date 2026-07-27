import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { RevealInit, ToTop } from "@/components/Ux";
import { getContent, getSolutionsTree, type ContactContent } from "@/lib/api";
import { isLocale, LOCALES } from "@/lib/i18n";
import "../globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

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
    <html lang={locale} className={prompt.variable}>
      <body>
        <SiteHeader locale={locale} tree={tree ?? []} />
        {children}
        <SiteFooter locale={locale} tree={tree ?? []} contact={contact} />
        <ToTop />
        {/* useSearchParams ใน RevealInit ต้องอยู่ใต้ Suspense ตามข้อกำหนด Next */}
        <Suspense fallback={null}>
          <RevealInit />
        </Suspense>
      </body>
    </html>
  );
}
