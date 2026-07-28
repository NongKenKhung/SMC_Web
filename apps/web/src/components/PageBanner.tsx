import Link from "next/link";
import { mediaUrl, type AttachmentItem } from "@/lib/api";

/** Banner หัวหน้าใน — ถ้ามี poster จะใช้รูปเป็นพื้นหลัง (ไม่มีก็ใช้ gradient เดิม) */
export default function PageBanner({
  title,
  crumbs,
  poster,
}: {
  title: string;
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
      <h1>{title}</h1>
      <p className="crumb">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && " · "}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <b>{c.label}</b>}
          </span>
        ))}
      </p>
    </section>
  );
}
