import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { MapEmbed } from "@/components/Embeds";
import PageBanner from "@/components/PageBanner";
import { getContent, getPageMedia, type ContactContent, type EmbedContent } from "@/lib/api";
import { dict, isLocale } from "@/lib/i18n";

const Icon = {
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 1.9.6 3 .7a2 2 0 0 1 1.6 2z" />
    </svg>
  ),
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
    </svg>
  ),
  pin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;
  const [contact, embed] = await Promise.all([
    getContent<ContactContent>("site.contact", locale),
    getContent<EmbedContent>("site.embed", locale),
  ]);
  const pageMedia = await getPageMedia("contact");

  return (
    <main>
      <PageBanner
        poster={pageMedia?.poster}
        title={t.contact.title}
        en="Contact"
        crumbs={[{ label: t.common.home, href: base }, { label: t.nav.contact }]}
      />

      <section className="sec">
        <span className="ghost-head">Message</span>
        <div className="container contact-grid">
          <div>
            <div className="sec-head left reveal">
              <span className="eyebrow">Contact Us</span>
              <h2>
                {t.contact.heading1} <span className="grad">SMC</span>
              </h2>
              <p className="lead">{t.contact.lead}</p>
            </div>
            <div className="info-grid reveal d1">
              <div className="info-item">
                <div className="i-icon">{Icon.phone}</div>
                <h4>{t.contact.phone}</h4>
                <p>{contact?.phone}</p>
              </div>
              <div className="info-item">
                <div className="i-icon">{Icon.mail}</div>
                <h4>{t.contact.email}</h4>
                <p>{contact?.email}</p>
              </div>
              <div className="info-item">
                <div className="i-icon">{Icon.pin}</div>
                <h4>{t.contact.address}</h4>
                <p>{contact?.address}</p>
              </div>
              <div className="info-item">
                <div className="i-icon">{Icon.clock}</div>
                <h4>{t.contact.hours}</h4>
                <p>{contact?.hours}</p>
              </div>
            </div>
          </div>

          <ContactForm locale={locale} />
        </div>

        <div className="container">
          {/* แผนที่จริง — ตั้งพิกัด/ชื่อสถานที่ได้ที่ admin ไม่ใส่ก็ไม่แสดง */}
          <MapEmbed query={embed?.mapQuery} locale={locale} title={t.contact.mapTitle} />
        </div>
      </section>
    </main>
  );
}
