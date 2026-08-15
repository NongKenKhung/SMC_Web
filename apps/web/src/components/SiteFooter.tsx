import Link from "next/link";
import type { ContactContent, SolutionNode } from "@/lib/api";
import { dict, pick, type Locale } from "@/lib/i18n";

/* คอลัมน์ในฟุตเตอร์ไม่ควรยาวเกินคอลัมน์อื่น — เกินนี้ให้ไปดูต่อที่หน้ารวม */
const FOOTER_MAX = 6;

const Icon = {
  pin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 1.9.6 3 .7a2 2 0 0 1 1.6 2z" />
    </svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" />
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
};

export default function SiteFooter({
  locale,
  tree,
  contact,
}: {
  locale: Locale;
  tree: SolutionNode[];
  contact: ContactContent | null;
}) {
  const t = dict(locale);
  const base = `/${locale}`;
  /* ยังไม่มีระบบไหนใส่ราคา = ไม่ต้องลิงก์ไปหน้าเปล่า (เกณฑ์เดียวกับเมนูบนสุด) */
  const hasPricing = tree.some((c) => c.price != null || c.children.some((k) => k.price != null));
  const links = [
    { href: base, label: t.nav.home },
    { href: `${base}/solutions`, label: t.nav.solutions },
    ...(hasPricing ? [{ href: `${base}/pricing`, label: t.nav.pricing }] : []),
    { href: `${base}/partners`, label: t.nav.partners },
    { href: `${base}/blog`, label: t.nav.blog },
    { href: `${base}/about`, label: t.nav.about },
    { href: `${base}/contact`, label: t.nav.contact },
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <span className="logo-chip"><img src="/logo.png" alt="SMC" /></span>
            <p className="footer-desc">{t.footer.desc}</p>
          </div>
          <div>
            <h5>{t.footer.menu}</h5>
            <ul className="f-links">
              {links.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          {/* ยังไม่มีโซลูชัน = ไม่ต้องขึ้นหัวข้อคอลัมน์เปล่า */}
          {tree.length > 0 && (
            <div>
              <h5>{t.footer.solutions}</h5>
              <ul className="f-links">
                {tree.slice(0, FOOTER_MAX).map((s) => (
                  <li key={s.id}>
                    <Link href={`${base}/solutions/${s.slug}`}>{pick(s, "name", locale)}</Link>
                  </li>
                ))}
                {tree.length > FOOTER_MAX && (
                  <li>
                    <Link href={`${base}/solutions`}>{t.common.viewAll} →</Link>
                  </li>
                )}
              </ul>
            </div>
          )}
          <div>
            <h5>{t.footer.contact}</h5>
            <ul className="f-contact">
              {[
                { icon: Icon.pin, value: contact?.address },
                { icon: Icon.phone, value: contact?.phone },
                { icon: Icon.mail, value: contact?.email },
                { icon: Icon.clock, value: contact?.hours },
              ]
                .filter((i) => i.value?.trim())
                .map((i) => (
                  <li key={i.value}>{i.icon} {i.value}</li>
                ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
