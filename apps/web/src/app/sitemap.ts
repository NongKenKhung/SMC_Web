import type { MetadataRoute } from "next";
import { getPosts, getSolutionsTree } from "@/lib/api";
import { LOCALES } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

/** เสิร์ฟที่ /sitemap.xml — ทุกหน้า × สองภาษา พร้อมลิงก์ข้ามภาษา (hreflang)
 *  ถ้า API ล่ม จะเหลือเฉพาะหน้าคงที่ ไม่พังทั้งไฟล์ */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, posts] = await Promise.all([getSolutionsTree(), getPosts()]);

  const staticPaths = ["", "/solutions", "/partners", "/blog", "/about", "/contact"];

  /* โซลูชันมีทั้งหมวดแม่และหัวข้อย่อย — เก็บให้ครบทั้งสองชั้น */
  const solutionPaths = (tree ?? []).flatMap((s) => [
    `/solutions/${s.slug}`,
    ...s.children.map((c) => `/solutions/${c.slug}`),
  ]);

  const postEntries = (posts ?? []).map((p) => ({
    path: `/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
  }));

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    const add = (path: string, lastModified?: Date, priority = 0.7) => {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: lastModified ?? new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : priority,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]),
          ),
        },
      });
    };
    staticPaths.forEach((p) => add(p, undefined, p === "" ? 1 : 0.8));
    solutionPaths.forEach((p) => add(p));
    postEntries.forEach((p) => add(p.path, p.lastModified, 0.6));
  }
  return entries;
}
