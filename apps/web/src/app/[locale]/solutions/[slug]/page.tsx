import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getSolution, mediaUrl } from "@/lib/api";
import { dict, isLocale, pick } from "@/lib/i18n";

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

  const name = pick(sol, "name", locale);
  const isCategory = sol.children.length > 0;

  return (
    <main>
      <PageBanner
        title={name}
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
            {sol.coverImage ? (
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
            <div className="prose reveal" style={{ marginTop: 42 }}>
              <p>{pick(sol, "body", locale)}</p>
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
                <article className={`card reveal${i ? ` d${i}` : ""}`} key={c.slug}>
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
              {FEATURES[locale].map((f, i) => (
                <article className={`card feat reveal${i % 3 ? ` d${i % 3}` : ""}`} key={f.title}>
                  <div className="num">{i + 1}</div>
                  <h4>{f.title}</h4>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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
