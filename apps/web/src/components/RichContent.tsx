import { mediaUrl, type BlockItem } from "@/lib/api";
import { type Locale } from "@/lib/i18n";

/** แสดง HTML จาก rich text editor
 *  ปลอดภัยเพราะ HTML ทุกชิ้นถูก sanitize ที่เซิร์ฟเวอร์ก่อนเก็บลงฐานข้อมูลแล้ว
 *  (apps/api/src/common/sanitize.ts — ตัดแท็ก script, event handler, javascript URL,
 *   iframe และรูปที่ไม่ได้มาจากคลังสื่อของเราเอง)
 *  ถ้าเนื้อหาไม่ใช่ HTML (ข้อความล้วนจากข้อมูลเก่า) จะห่อ <p> ให้อัตโนมัติ */
export default function RichContent({
  html,
  className = "prose",
}: {
  html?: string | null;
  className?: string;
}) {
  if (!html || !html.trim()) return null;
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(html);
  const safe = looksLikeHtml ? html : `<p>${html}</p>`;
  return <div className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}

/** เลือกข้อความตามภาษาแบบ fallback เป็นไทยเมื่อไม่มีฉบับอังกฤษ */
export function blockText(b: BlockItem, base: "title" | "subtitle" | "body", locale: Locale) {
  const en = b[`${base}En` as const];
  const th = b[`${base}Th` as const];
  return (locale === "en" && en ? en : th) ?? "";
}

/** รูปของ block (ถ้ามี) เป็น URL เต็ม */
export const blockImage = (b: BlockItem) => mediaUrl(b.image);
