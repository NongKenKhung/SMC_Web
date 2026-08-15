import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brochure, DownloadList, Gallery } from "@/components/Attachments";
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
  /* ไม่มีค่าเริ่มต้นฝังในโค้ด — ไม่ได้กรอกก็ไม่ต้องแสดง section นี้ */
  const features = featBlocks.map((b) => ({
    title: blockText(b, "title", locale),
    body: blockText(b, "body", locale),
    html: true,
  }));

  const name = pick(sol, "name", locale);
  const isCategory = sol.children.length > 0;
  /* หน้าโบรชัว = ใช้รูปแทนเนื้อหาทั้งหมด จึงข้ามเนื้อหา/ฟีเจอร์/แกลเลอรี
     เหลือแค่หัวเรื่อง รูปโบรชัว และไฟล์ดาวน์โหลด */
  const brochure = sol.layout === "BROCHURE" ? (sol.brochure ?? []) : [];
  const isBrochure = brochure.length > 0;

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
            {pick(sol, "summary", locale) && (
              <p className="lead">{pick(sol, "summary", locale)}</p>
            )}
          </div>
          {/* ไม่ได้ใส่รูป = ไม่ต้องมีกรอบรูปเปล่า | โบรชัวไม่ต้องมีรูปเปิดซ้ำ */}
          {!isBrochure && (sol.poster || sol.coverImage) && (
            <div className="detail-hero reveal">
              {sol.poster ? (
                <img src={mediaUrl(sol.poster.url)!} alt={sol.poster.altTh ?? name} />
              ) : (
                <img src={mediaUrl(sol.coverImage)!} alt={name} />
              )}
            </div>
          )}
          {!isBrochure && pick(sol, "body", locale) && (
            <div className="reveal" style={{ marginTop: 42 }}>
              <RichContent html={pick(sol, "body", locale)} />
            </div>
          )}
        </div>
      </section>

      {/* โบรชัว — รูปทั้งหน้าเรียงต่อกัน */}
      <Brochure items={brochure} locale={locale} />

      {/* หมวด → รายการหัวข้อย่อย | หัวข้อย่อย → ฟีเจอร์ */}
      {isCategory && sol.children.length > 0 ? (
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
                  {pick(c, "summary", locale) && <p>{pick(c, "summary", locale)}</p>}
                  <Link className="more" href={`${base}/solutions/${c.slug}`}>
                    {t.common.readMore} <ArrowR />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : !isCategory && !isBrochure && features.length > 0 ? (
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
      ) : null}

      {/* แกลเลอรี + ไฟล์ดาวน์โหลด (จัดการผ่าน admin) */}
      {/* ภาพประกอบใช้กับหน้าแบบข้อความเท่านั้น */}
      <Gallery items={isBrochure ? [] : (sol.gallery ?? [])} locale={locale} />
      <DownloadList items={sol.downloads ?? []} locale={locale} />

    </main>
  );
}
