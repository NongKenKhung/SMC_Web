import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadList, Gallery } from "@/components/Attachments";
import PageBanner from "@/components/PageBanner";
import RichContent from "@/components/RichContent";
import { getPost, mediaUrl } from "@/lib/api";
import { dict, fmtDate, isLocale, pick } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

/* ชื่อเรื่อง/คำโปรยของโพสต์ ใช้เป็น title กับการ์ดแชร์โซเชียล */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = await getPost(slug);
  if (!post) return {};
  const title = pick(post, "title", locale);
  const description = pick(post, "excerpt", locale);
  const cover = mediaUrl(post.coverImage);
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: { th: `/th/blog/${slug}`, en: `/en/blog/${slug}` },
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/${locale}/blog/${slug}`,
      title,
      description,
      publishedTime: post.publishedAt,
      images: [{ url: cover ?? "/og.png" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [cover ?? "/og.png"] },
  };
}

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
        en="Story"
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
          <div className="reveal in">
            {pick(post, "excerpt", locale) && (
              <p className="post-lead">{pick(post, "excerpt", locale)}</p>
            )}
            <RichContent html={pick(post, "body", locale)} className="prose" />
          </div>
        </div>
      </section>

      {/* แกลเลอรี + ไฟล์ดาวน์โหลด (จัดการผ่าน admin) */}
      <Gallery items={post.gallery ?? []} locale={locale} />
      <DownloadList items={post.downloads ?? []} locale={locale} />

      <section className="sec-tight">
        <div className="container post-single">
          <Link className="btn btn-navy" href={`${base}/blog`}>{t.blog.backToList}</Link>
        </div>
      </section>
    </main>
  );
}
