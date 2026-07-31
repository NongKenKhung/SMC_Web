import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getPageMedia, getSolutionsTree } from "@/lib/api";
import { dict, isLocale, pick } from "@/lib/i18n";

const CIRCLE_ICONS = [
  <svg key="0" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="3" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></svg>,
  <svg key="1" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h2M9 14h2M13 10h2M13 14h2M11 21v-4h2v4" /></svg>,
  <svg key="2" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></svg>,
];

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
  const tree = (await getSolutionsTree()) ?? [];
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

          {tree.length === 0 && <p className="empty-note reveal">{t.empty.solutions}</p>}

          <div className="cat-grid">
            {tree.map((cat, i) => (
              <article className={`card cat-card glow reveal${i ? ` d${i}` : ""}`} key={cat.id}>
                <div className="cat-circle">{CIRCLE_ICONS[i % CIRCLE_ICONS.length]}</div>
                <h3>{pick(cat, "name", locale)}</h3>
                <p>{pick(cat, "summary", locale)}</p>
                <div className="cat-list">
                  {cat.children.map((c) => (
                    <Link href={`${base}/solutions/${c.slug}`} key={c.id}>
                      {pick(c, "name", locale)} <ArrowR />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
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
