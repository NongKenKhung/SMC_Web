import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getPosts, mediaUrl } from "@/lib/api";
import { dict, fmtDate, isLocale, pick } from "@/lib/i18n";

const CATS = ["ACTIVITY", "NEWS", "WORK"] as const;

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { category } = await searchParams;
  const t = dict(locale);
  const base = `/${locale}`;

  const active = category && (CATS as readonly string[]).includes(category) ? category : undefined;
  const posts = (await getPosts({ category: active, take: 30 })) ?? [];

  return (
    <main>
      <PageBanner
        title={t.blog.title}
        crumbs={[{ label: t.common.home, href: base }, { label: t.nav.blog }]}
      />

      <section className="sec">
        <div className="container">
          <div className="filter-row reveal">
            <Link href={`${base}/blog`} className={`filter-chip${!active ? " active" : ""}`}>
              {t.blog.all}
            </Link>
            {CATS.map((c) => (
              <Link
                key={c}
                href={`${base}/blog?category=${c}`}
                className={`filter-chip${active === c ? " active" : ""}`}
              >
                {t.categories[c]}
              </Link>
            ))}
          </div>

          <div className="post-grid">
            {posts.map((p, i) => (
              <Link href={`${base}/blog/${p.slug}`} key={p.id} className={`post-card reveal${i % 3 ? ` d${i % 3}` : ""}`}>
                <div className={`thumb t${p.id % 6}`}>
                  {p.coverImage ? (
                    <img src={mediaUrl(p.coverImage)!} alt="" />
                  ) : (
                    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h2M9 14h2M13 10h2M13 14h2M11 21v-4h2v4" />
                    </svg>
                  )}
                </div>
                <div className="post-body">
                  <div className="post-meta">
                    <span className={`badge${p.category === "WORK" ? " b-navy" : ""}`}>
                      {t.categories[p.category] ?? p.category}
                    </span>
                    <span>{fmtDate(p.publishedAt, locale)}</span>
                  </div>
                  <h3>{pick(p, "title", locale)}</h3>
                  <p className="post-x">{pick(p, "excerpt", locale)}</p>
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--muted)" }}>
              {locale === "th" ? "ยังไม่มีโพสต์ในหมวดนี้" : "No posts in this category yet."}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
