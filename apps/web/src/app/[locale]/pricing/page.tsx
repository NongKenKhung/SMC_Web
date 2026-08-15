import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import PriceTable, { type PriceRow } from "@/components/PriceTable";
import { getPageMedia, getSolutionsTree } from "@/lib/api";
import { dict, isLocale, pick, type Locale } from "@/lib/i18n";

/** แบนทุกชั้นของต้นไม้ให้เป็นรายการเดียว แล้วเก็บเฉพาะตัวที่กรอกราคาไว้
 *  หมวดก็มีราคาได้ถ้าอยากขายเป็นแพ็กเกจ จึงไม่ตัดชั้นบนทิ้ง (หมวดเองใช้ชื่อตัวเองเป็นหมวด) */
function pricedRows(tree: Awaited<ReturnType<typeof getSolutionsTree>>, locale: Locale): PriceRow[] {
  const out: PriceRow[] = [];
  for (const node of tree ?? []) {
    const catName = pick(node, "name", locale);
    if (node.price != null) {
      out.push({ id: node.id, slug: node.slug, name: catName, category: catName, price: node.price });
    }
    for (const child of node.children) {
      if (child.price != null) {
        out.push({
          id: child.id, slug: child.slug,
          name: pick(child, "name", locale), category: catName, price: child.price,
        });
      }
    }
  }
  return out;
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;
  const tree = await getSolutionsTree();
  const rows = pricedRows(tree, locale);
  const pageMedia = await getPageMedia("pricing");

  return (
    <main>
      <PageBanner
        poster={pageMedia?.poster}
        title={t.pricing.title}
        en="Pricing"
        crumbs={[{ label: t.common.home, href: base }, { label: t.nav.pricing }]}
      />

      <section className="sec">
        <span className="ghost-head">Pricing</span>
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Price List</span>
            <h2>
              {t.pricing.heading1} <span className="grad">{t.pricing.heading2}</span>
            </h2>
            <p className="lead">{t.pricing.lead}</p>
          </div>

          {rows.length === 0 ? (
            <p className="empty-note reveal">{t.empty.pricing}</p>
          ) : (
            <PriceTable rows={rows} locale={locale} />
          )}
        </div>
      </section>

      <section className="sec-tight">
        <div className="container">
          <div className="cta-band reveal">
            <div>
              <h3>{t.pricing.ctaTitle}</h3>
              <p>{t.pricing.ctaLead}</p>
            </div>
            <Link className="btn" href={`${base}/contact`}>{t.pricing.ctaBtn}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
