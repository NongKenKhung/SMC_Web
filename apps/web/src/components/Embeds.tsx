import { SITE_NAME } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

/** แปลงลิงก์ YouTube/Vimeo แบบไหนก็ได้ ให้เป็น URL สำหรับฝัง
 *  คืน null ถ้าไม่ใช่ลิงก์ของสองเจ้านี้ — กันไม่ให้ฝังหน้าเว็บอะไรก็ได้ลงในเว็บเรา */
export function toEmbedUrl(raw?: string | null): string | null {
  const url = (raw ?? "").trim();
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v") ?? "";
      return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,20})$/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[2]}` : null;
  }
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
    return /^\d{6,12}$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

/** วิดีโอแนะนำศูนย์ — ไม่มีลิงก์ก็ไม่แสดงอะไรเลย */
export function VideoEmbed({ url, title }: { url?: string | null; title: string }) {
  const src = toEmbedUrl(url);
  if (!src) return null;
  return (
    <div className="embed-frame reveal">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/** แผนที่ที่ตั้งศูนย์ — รับได้ทั้งพิกัด "13.72,100.77" หรือชื่อสถานที่
 *  ใช้โหมด embed ของ Google Maps ที่ไม่ต้องใช้ API key */
export function MapEmbed({
  query,
  locale,
  title,
}: {
  query?: string | null;
  locale: Locale;
  title: string;
}) {
  const q = (query ?? "").trim();
  if (!q) return null;
  const src =
    `https://www.google.com/maps?q=${encodeURIComponent(q)}` +
    `&hl=${locale}&z=16&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return (
    <div className="embed-frame map reveal">
      <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <a className="embed-open" href={openUrl} target="_blank" rel="noopener noreferrer">
        {locale === "en" ? "Open in Google Maps" : "เปิดใน Google Maps"} ↗
      </a>
      <span className="sr-only">{SITE_NAME[locale]}</span>
    </div>
  );
}
