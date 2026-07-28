"use client";

import { usePathname } from "next/navigation";
import { dict, isLocale, type Locale } from "@/lib/i18n";

/** หน้าจอ 404 — ใช้ร่วมกันทั้งตัวระดับราก (URL มั่ว) และตัวในเส้นทางภาษา
 *  ไม่มีปุ่มกดกลางหน้า — ใช้เมนูด้านบนไปหน้าอื่นได้อยู่แล้ว
 *  Next ไม่ส่ง params ให้ not-found ของเส้นทางแบบไดนามิก ([locale])
 *  จึงต้องอ่านภาษาจาก path เอง */
export default function NotFoundView() {
  const pathname = usePathname() ?? "";
  const seg = pathname.split("/")[1] ?? "";
  const locale: Locale = isLocale(seg) ? seg : "th";
  const t = dict(locale);

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
        </div>
      </section>
    </main>
  );
}
