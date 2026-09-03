import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getPageMedia, getSolutionsTree } from "@/lib/api";
import SolutionIcon from "@/components/SolutionIcon";
import { dict, isLocale, pick } from "@/lib/i18n";


const ArrowR = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default async function SolutionsHub({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;
  const nodes = (await getSolutionsTree()) ?? [];
  const pageMedia = await getPageMedia("solutions");

  return (
    <main>
      <PageBanner
        poster={pageMedia?.poster}
        title={t.solutions.title}
        en="Solutions"
        crumbs={[{ label: t.common.home, href: base }, { label: t.solutions.title }]}
      />

      <section className="sec">
        <span className="ghost-head">Products</span>
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Our Solutions</span>
            <h2>
              {locale === "th" ? <>โซลูชันและผลิตภัณฑ์ <span className="grad">ของศูนย์</span></> : <>Our <span className="grad">solutions &amp; products</span></>}
            </h2>
            <p className="lead">{t.solutions.lead}</p>
          </div>

          {nodes.length === 0 && <p className="empty-note reveal">{t.empty.solutions}</p>}

          <div className="cat-grid">
            {nodes.map((cat, i) => {
              /* หน่วงเหลื่อมกันแค่ 3 ใบแรกพอ — ถ้าไล่ทีละใบครบ 18 ใบจะรอนานเกินไป */
              const cls = `card cat-card glow reveal${i && i < 4 ? ` d${i}` : ""}`;
              const head = (
                <>
                  <div className="cat-circle"><SolutionIcon name={cat.icon} index={i} /></div>
                  <h3>{pick(cat, "name", locale)}</h3>
                  {/* ไม่ได้กรอกคำอธิบาย = ไม่ต้องเว้นที่ว่างไว้ */}
                  {pick(cat, "summary", locale) && <p>{pick(cat, "summary", locale)}</p>}
                </>
              );

              /* มีรายการย่อย = การ์ดหมวด ต้องกดเข้าแต่ละรายการได้ทีละอัน
                 ไม่มีรายการย่อย = ตัวการ์ดเองคือระบบ กดได้ทั้งใบ
                 (สองแบบนี้ห้ามรวมกัน — <a> ซ้อน <a> เป็น HTML ที่ผิด) */
              return cat.children.length > 0 ? (
                <article className={cls} key={cat.id}>
                  {head}
                  <div className="cat-list">
                    {cat.children.map((c) => (
                      <Link href={`${base}/solutions/${c.slug}`} key={c.id}>
                        {pick(c, "name", locale)} <ArrowR />
                      </Link>
                    ))}
                  </div>
                </article>
              ) : (
                <Link className={cls} href={`${base}/solutions/${cat.slug}`} key={cat.id}>
                  {head}
                  <span className="cat-go">{t.common.readMore} <ArrowR /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec-tight">
        <div className="container">
          <div className="cta-band reveal">
            <div>
              <h3>{t.solutions.ctaTitle}</h3>
              <p>{t.solutions.ctaLead}</p>
            </div>
            <Link className="btn" href={`${base}/contact`}>{t.solutions.ctaBtn}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
