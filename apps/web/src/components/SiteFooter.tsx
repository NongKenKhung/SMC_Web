import Link from "next/link";
import type { ContactContent, SolutionNode } from "@/lib/api";
import { dict, pick, type Locale } from "@/lib/i18n";

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
  const links = [
    { href: base, label: t.nav.home },
    { href: `${base}/solutions`, label: t.nav.solutions },
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
            <div className="socials">
              <a href="#" aria-label="Facebook">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.3-1.6 1.7-1.6h1.5V3.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.6V13h2.7v8h3.2z" /></svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.6 4 12 4 12 4s-4.6 0-7.7.2c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.4.8 11.3v1.7c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.6 1 1.9.2 7.5.2 7.5.2s4.6 0 7.7-.2c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.7c0-1.9-.2-3.8-.2-3.8zM9.8 15.1V8.9l6.2 3.1-6.2 3.1z" /></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 21H3V8.5h3.5V21zM4.7 7A2 2 0 1 1 4.8 3a2 2 0 0 1-.1 4zM21 21h-3.4v-6.1c0-1.5-.5-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V21h-3.4V8.5h3.4v1.5c.5-.7 1.3-1.8 3.1-1.8 2.3 0 4.2 1.5 4.2 4.8V21z" /></svg>
              </a>
            </div>
          </div>
          <div>
            <h5>{t.footer.menu}</h5>
            <ul className="f-links">
              {links.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5>{t.footer.solutions}</h5>
            <ul className="f-links">
              {tree.map((s) => (
                <li key={s.id}>
                  <Link href={`${base}/solutions/${s.slug}`}>{pick(s, "name", locale)}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5>{t.footer.contact}</h5>
            <ul className="f-contact">
              {contact && (
                <>
                  <li>{Icon.pin} {contact.address}</li>
                  <li>{Icon.phone} {contact.phone}</li>
                  <li>{Icon.mail} {contact.email}</li>
                  <li>{Icon.clock} {contact.hours}</li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t.footer.rights}</span>
          <span className="mock-tag">{t.footer.mockTag}</span>
        </div>
      </div>
    </footer>
  );
}
