import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getPageMedia, getPartners, mediaUrl } from "@/lib/api";
import { dict, isLocale, pick } from "@/lib/i18n";

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;
  const partners = (await getPartners()) ?? [];
  const pageMedia = await getPageMedia("partners");

  return (
    <main>
      <PageBanner
        poster={pageMedia?.poster}
        title={t.partners.title}
        en="Partners"
        crumbs={[{ label: t.common.home, href: base }, { label: t.nav.partners }]}
      />

      <section className="sec">
        <span className="ghost-head">Network</span>
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Our Partners</span>
            <h2>
              {t.partners.heading1} <span className="grad">{t.partners.heading2}</span>
            </h2>
            <p className="lead">{t.partners.lead}</p>
          </div>
          {partners.length === 0 && <p className="empty-note reveal">{t.empty.partners}</p>}

          <div className="logo-row wide reveal">
            {partners.map((p) => {
              const card = (
                <div className="logo-card glow" key={p.id}>
                  {p.logoUrl && <img src={mediaUrl(p.logoUrl)!} alt="" />}
                  {/* แสดงชื่อเสมอ ไม่ใช่เฉพาะตอนไม่มีโลโก้ — โลโก้บางอันไม่มีชื่อบริษัทอยู่ในรูป */}
                  <b>{p.name}</b>
                  {pick(p, "caption", locale) && <span>{pick(p, "caption", locale)}</span>}
                </div>
              );
              return p.websiteUrl ? (
                <a href={p.websiteUrl} target="_blank" rel="noreferrer" key={p.id}>{card}</a>
              ) : (
                card
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec-tight">
        <div className="container">
          <div className="cta-band reveal">
            <div>
              <h3>{t.partners.ctaTitle}</h3>
              <p>{t.partners.ctaLead}</p>
            </div>
            <Link className="btn" href={`${base}/contact`}>{t.common.contactUs}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
