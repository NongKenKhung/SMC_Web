import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getPost, mediaUrl } from "@/lib/api";
import { dict, fmtDate, isLocale, pick } from "@/lib/i18n";

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;

  const post = await getPost(slug);
  if (!post) notFound();

  const title = pick(post, "title", locale);

  return (
    <main>
      <PageBanner
        title={t.blog.title}
        crumbs={[
          { label: t.common.home, href: base },
          { label: t.nav.blog, href: `${base}/blog` },
          { label: title.slice(0, 40) + (title.length > 40 ? "…" : "") },
        ]}
      />

      <section className="sec">
        <div className="container post-single">
          <div className="post-meta reveal in">
            <span className={`badge${post.category === "WORK" ? " b-navy" : ""}`}>
              {t.categories[post.category] ?? post.category}
            </span>
            <span>{fmtDate(post.publishedAt, locale)}</span>
          </div>
          <h2 className="reveal in">{title}</h2>
          {post.coverImage && (
            <p><img src={mediaUrl(post.coverImage)!} alt="" style={{ borderRadius: 16 }} /></p>
          )}
          <div className="prose reveal in" style={{ margin: 0, maxWidth: "none" }}>
            <p>{pick(post, "excerpt", locale)}</p>
            <p>{pick(post, "body", locale)}</p>
          </div>
          <p style={{ marginTop: 40 }}>
            <Link className="btn btn-navy" href={`${base}/blog`}>{t.blog.backToList}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
