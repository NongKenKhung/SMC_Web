"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dict, isLocale, type Locale } from "@/lib/i18n";

/** หน้าจอ 404 — ใช้ร่วมกันทั้งตัวระดับราก (URL มั่ว) และตัวในเส้นทางภาษา
 *  Next ไม่ส่ง params ให้ not-found ของเส้นทางแบบไดนามิก ([locale])
 *  จึงต้องอ่านภาษาจาก path เอง */
export default function NotFoundView() {
  const pathname = usePathname() ?? "";
  const seg = pathname.split("/")[1] ?? "";
  const locale: Locale = isLocale(seg) ? seg : "th";
  const t = dict(locale);
  const base = `/${locale}`;

  const links = [
    { href: `${base}/solutions`, label: t.nav.solutions },
    { href: `${base}/blog`, label: t.nav.blog },
    { href: `${base}/partners`, label: t.nav.partners },
    { href: `${base}/about`, label: t.nav.about },
    { href: `${base}/contact`, label: t.nav.contact },
  ];

  return (
    <main>
      <section className="nf">
        <div className="dots" />
        <span className="orb orb-a" aria-hidden="true" />
        <span className="orb orb-b" aria-hidden="true" />
        <span className="nf-ghost" aria-hidden="true">Not Found</span>

        <div className="container nf-inner">
          <span className="nf-eyebrow">{t.notFound.eyebrow}</span>
          <p className="nf-code" aria-hidden="true">404</p>
          <h1>{t.notFound.title}</h1>
          <p className="nf-lead">{t.notFound.lead}</p>

          <div className="nf-cta">
            <Link href={base} className="btn btn-primary">{t.notFound.backHome}</Link>
            <Link href={`${base}/contact`} className="btn btn-ghost">{t.notFound.contact}</Link>
          </div>

          <p className="nf-quick-label">{t.notFound.quickLinks}</p>
          <nav className="nf-links" aria-label={t.notFound.quickLinks}>
            {links.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
