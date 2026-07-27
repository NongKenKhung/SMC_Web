import Link from "next/link";

/** Banner หัวหน้าใน (พื้นกรมท่า + จุดเหลือง + breadcrumb) */
export default function PageBanner({
  title,
  crumbs,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <section className="page-banner">
      <div className="dots" />
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
