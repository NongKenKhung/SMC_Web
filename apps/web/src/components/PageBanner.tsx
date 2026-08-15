import Link from "next/link";
import { mediaUrl, type AttachmentItem } from "@/lib/api";

/** Banner หัวหน้าใน — โทนเดียวกับ hero หน้าแรก:
 *  คำอังกฤษ + ชื่อหน้าภาษาไทย + แสงออโรรา
 *  ถ้ามี poster จะใช้รูปเป็นพื้นหลังแทนลายจุด */
export default function PageBanner({
  title,
  en,
  crumbs,
  poster,
}: {
  title: string;
  /** คำภาษาอังกฤษสั้น ๆ สำหรับตัวอักษรยักษ์ (เช่น "About Us") */
  en?: string;
  crumbs: { label: string; href?: string }[];
  poster?: AttachmentItem | null;
}) {
  return (
    <section className={`page-banner${poster ? " has-poster" : ""}`}>
      {poster ? (
        <>
          <img className="poster-img" src={mediaUrl(poster.url)!} alt={poster.altTh ?? ""} />
          <span className="poster-veil" />
        </>
      ) : (
        <div className="dots" />
      )}
      <span className="orb orb-a" aria-hidden="true" />
      <span className="orb orb-b" aria-hidden="true" />
      <div className="container pb-inner">
        <p className="crumb">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && " · "}
              {c.href ? <Link href={c.href}>{c.label}</Link> : <b>{c.label}</b>}
            </span>
          ))}
        </p>
        {en && <span className="pb-en">{en}</span>}
        <h1>{title}</h1>
      </div>
    </section>
  );
}
