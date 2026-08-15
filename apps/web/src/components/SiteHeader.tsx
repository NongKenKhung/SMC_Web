"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SolutionNode } from "@/lib/api";
import { dict, pick, type Locale } from "@/lib/i18n";

const CaretDown = () => (
  <svg className="caret" viewBox="0 0 16 16" fill="none">
    <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CaretRight = () => (
  <svg className="caret-r" viewBox="0 0 16 16" fill="none">
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SiteHeader({
  locale,
  tree,
}: {
  locale: Locale;
  tree: SolutionNode[];
}) {
  const t = dict(locale);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [openSub, setOpenSub] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ปิด drawer เมื่อเปลี่ยนหน้า */
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const base = `/${locale}`;
  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);

  /* ยังไม่มีโซลูชันในระบบ = ไม่ต้องมีเมนูย่อย ไม่งั้นจะเปิดกล่องเปล่าออกมา */
  const hasSolutions = tree.length > 0;
  const hasPricing = tree.some((c) => c.price != null || c.children.some((k) => k.price != null));

  const links = [
    { href: base, label: t.nav.home },
    /* ราคาไม่ได้อยู่ระดับบนแล้ว — ย้ายไปเป็นรายการแรกในเมนูย่อยของโซลูชันด้านล่าง */
    { href: `${base}/solutions`, label: t.nav.solutions, sub: hasSolutions || hasPricing },
    { href: `${base}/partners`, label: t.nav.partners },
    { href: `${base}/blog`, label: t.nav.blog },
    { href: `${base}/about`, label: t.nav.about },
    { href: `${base}/contact`, label: t.nav.contact },
  ];

  const otherLocale = locale === "th" ? "en" : "th";
  const switchHref = (to: Locale) =>
    pathname.replace(/^\/(th|en)/, `/${to}`) || `/${to}`;

  return (
    <>
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container nav-wrap">
          <Link className="brand" href={base}>
            <img src="/logo.png" alt="SMC — Smart City Research Center, KMITL" />
          </Link>
          <nav className="main-nav" aria-label="เมนูหลัก">
            <ul className="menu">
              {links.map((l) =>
                l.sub ? (
                  <li className="has-sub" key={l.href}>
                    <Link href={l.href} className={isActive(l.href) ? "active" : ""}>
                      {l.label} <CaretDown />
                    </Link>
                    {/* รายการยาวเกิน 8 = แตกสองคอลัมน์ ไม่งั้นเมนูสูงเกินจอ */}
                    <ul className={`sub${tree.length > 8 ? " wide" : ""}`}>
                      {/* ตารางราคาอยู่หัวเมนู คั่นจากรายการหมวดด้วยเส้นประ */}
                      {hasPricing && (
                        <li className="sub-lead">
                          <Link href={`${base}/pricing`}>{t.nav.pricingAll}</Link>
                        </li>
                      )}
                      {tree.map((cat) => (
                        <li key={cat.id}>
                          <Link href={`${base}/solutions/${cat.slug}`}>
                            {pick(cat, "name", locale)}
                            {cat.children.length > 0 && <CaretRight />}
                          </Link>
                          {cat.children.length > 0 && (
                            <ul className="sub2">
                              {cat.children.map((c) => (
                                <li key={c.id}>
                                  <Link href={`${base}/solutions/${c.slug}`}>
                                    {pick(c, "name", locale)}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link href={l.href} className={isActive(l.href) ? "active" : ""}>
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="nav-right">
            <div className="lang">
              <Link href={switchHref("th")} className={locale === "th" ? "active" : ""}>TH</Link>
              <Link href={switchHref("en")} className={locale === "en" ? "active" : ""}>EN</Link>
            </div>
            <button className="burger" aria-label="เปิดเมนู" onClick={() => setDrawer(true)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer มือถือ */}
      <div className={`overlay${drawer ? " show" : ""}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer${drawer ? " open" : ""}`}>
        <div className="drawer-head">
          <span className="logo-chip"><img src="/logo.png" alt="SMC" /></span>
          <button className="drawer-close" aria-label="ปิดเมนู" onClick={() => setDrawer(false)}>
            &times;
          </button>
        </div>
        <nav>
          <ul className="d-menu">
            {links.map((l) =>
              l.sub ? (
                <li key={l.href} className={openSub ? "d-open" : ""}>
                  <button className="d-acc" onClick={() => setOpenSub(!openSub)}>
                    {l.label} <CaretDown />
                  </button>
                  <ul className="d-sub">
                    {hasPricing && (
                      <li className="sub-lead">
                        <Link href={`${base}/pricing`}>{t.nav.pricingAll}</Link>
                      </li>
                    )}
                    {tree.map((cat) => (
                      <li key={cat.id}>
                        <Link href={`${base}/solutions/${cat.slug}`}>
                          {pick(cat, "name", locale)}
                          {cat.children.length > 0 &&
                            ` — ${cat.children.map((c) => pick(c, "name", locale).split(" ")[0]).join(" / ")}`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ),
            )}
            <li>
              <Link href={switchHref(otherLocale)}>
                {locale === "th" ? "English version" : "ภาษาไทย"}
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
