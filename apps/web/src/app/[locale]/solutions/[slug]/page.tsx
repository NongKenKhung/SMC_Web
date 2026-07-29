import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadList, Gallery } from "@/components/Attachments";
import PageBanner from "@/components/PageBanner";
import RichContent, { blockText } from "@/components/RichContent";
import { getBlocks, getSolution, mediaUrl } from "@/lib/api";
import { dict, isLocale, pick } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

/* ชื่อโซลูชัน/สรุปย่อ ใช้เป็น title กับการ์ดแชร์โซเชียล */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const sol = await getSolution(slug);
  if (!sol) return {};
  const title = pick(sol, "name", locale);
  const description = pick(sol, "summary", locale);
  const cover = mediaUrl(sol.coverImage);
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/solutions/${slug}`,
      languages: { th: `/th/solutions/${slug}`, en: `/en/solutions/${slug}` },
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/${locale}/solutions/${slug}`,
      title,
      description,
      images: [{ url: cover ?? "/og.png" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [cover ?? "/og.png"] },
  };
}

/* ฟีเจอร์ mock 6 ข้อ — เนื้อหาจริงของแต่ละระบบจะมาจาก bodyTh/bodyEn (แก้ผ่าน admin เฟส 4) */
const FEATURES = {
  th: Array.from({ length: 6 }, (_, i) => ({
    title: `ชื่อฟีเจอร์ที่${["หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก"][i]}`,
    body: "คำอธิบายสั้น ๆ ว่าฟีเจอร์นี้ทำอะไร ให้ประโยชน์อย่างไรกับผู้ใช้งาน",
  })),
  en: Array.from({ length: 6 }, (_, i) => ({
    title: `Feature ${i + 1}`,
    body: "A short description of what this feature does and how it helps.",
  })),
};

const ArrowR = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default async function SolutionDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;

  const sol = await getSolution(slug);
  if (!sol) notFound();

  /* ฟีเจอร์ของ solution นี้ — แก้ผ่าน admin ได้ (กลุ่ม solution.features:<id>)
     ยังไม่มีข้อมูลก็ใช้รายการเริ่มต้นที่ฝังมากับระบบ */
  const featBlocks = (await getBlocks([`solution.features:${sol.id}`]))[`solution.features:${sol.id}`] ?? [];
  const features = featBlocks.length
    ? featBlocks.map((b) => ({ title: blockText(b, "title", locale), body: blockText(b, "body", locale), html: true }))
    : FEATURES[locale].map((f) => ({ ...f, html: false }));

  const name = pick(sol, "name", locale);
  const isCategory = sol.children.length > 0;

  return (
    <main>
      <PageBanner
        title={name}
        en="Solution"
        crumbs={[
          { label: t.common.home, href: base },
          { label: t.solutions.title, href: `${base}/solutions` },
          ...(sol.parent
            ? [{ label: pick(sol.parent, "name", locale), href: `${base}/solutions/${sol.parent.slug}` }]
            : []),
          { label: name },
        ]}
      />

      {/* แนะนำระบบ */}
      <section className="sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Solution &amp; Product</span>
            <h2><span className="grad">{name}</span></h2>
            <p className="lead">{pick(sol, "summary", locale)}</p>
          </div>
          <div className="detail-hero reveal">
            {sol.poster ? (
              <img src={mediaUrl(sol.poster.url)!} alt={sol.poster.altTh ?? name} />
            ) : sol.coverImage ? (
              <img src={mediaUrl(sol.coverImage)!} alt={name} />
            ) : (
              <>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#F9C846" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".9">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  <path d="M6 9l3 3 3-4 3 3 3-2" stroke="#F26B21" strokeWidth="1.6" />
                </svg>
                <span className="ph-label">{t.solutions.imgPlaceholder}</span>
              </>
            )}
          </div>
          {pick(sol, "body", locale) && (
            <div className="reveal" style={{ marginTop: 42 }}>
              <RichContent html={pick(sol, "body", locale)} />
            </div>
          )}
        </div>
      </section>

      {/* หมวด → รายการหัวข้อย่อย | หัวข้อย่อย → ฟีเจอร์ */}
      {isCategory ? (
        <section className="sec soft-sec">
          <div className="container">
            <div className="sec-head reveal">
              <span className="eyebrow">Solutions</span>
              <h2>{t.solutions.inCategory}</h2>
            </div>
            <div className="sol-grid">
              {sol.children.map((c, i) => (
                <article className={`card glow reveal${i ? ` d${i}` : ""}`} key={c.slug}>
                  <h3>{pick(c, "name", locale)}</h3>
                  <p>{pick(c, "summary", locale)}</p>
                  <Link className="more" href={`${base}/solutions/${c.slug}`}>
                    {t.common.readMore} <ArrowR />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="sec soft-sec">
          <div className="container">
            <div className="sec-head reveal">
              <span className="eyebrow">Features</span>
              <h2>{locale === "th" ? "ความสามารถของระบบ" : "System capabilities"}</h2>
            </div>
            <div className="feature-grid">
              {features.map((f, i) => (
                <article className={`card feat glow reveal${i % 3 ? ` d${i % 3}` : ""}`} key={`${f.title}-${i}`}>
                  <div className="num">{i + 1}</div>
                  <h4>{f.title}</h4>
                  {f.html ? <RichContent html={f.body} className="prose-sm" /> : <p>{f.body}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* แกลเลอรี + ไฟล์ดาวน์โหลด (จัดการผ่าน admin) */}
      <Gallery items={sol.gallery ?? []} locale={locale} />
      <DownloadList items={sol.downloads ?? []} locale={locale} />

      {/* CTA */}
      <section className="sec-tight">
        <div className="container">
          <div className="cta-band reveal">
            <div>
              <h3>{t.solutions.detailCta}</h3>
              <p>{t.solutions.detailCtaLead}</p>
            </div>
            <Link className="btn" href={`${base}/contact`}>{t.solutions.detailCtaBtn}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
