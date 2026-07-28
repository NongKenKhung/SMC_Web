/* ทำความสะอาด HTML จาก rich text editor ก่อนเก็บลงฐานข้อมูล (Phase 6B)
   หลักการ: **ห้ามเชื่อ HTML ที่ส่งมาจาก client เด็ดขาด**
   - ฝั่ง editor กรองให้แล้วก็จริง แต่ผู้ไม่หวังดีเรียก API ตรงได้ (มี token หรือ token รั่ว)
   - ที่นี่คือด่านสุดท้ายก่อนข้อมูลถูกเก็บและถูกนำไป render ด้วย dangerouslySetInnerHTML */
import sanitizeHtml from "sanitize-html";

/** โดเมนของรูปที่ยอมให้ฝังได้ — ปกติคือไฟล์ในคลังสื่อของเราเอง (/uploads/)
 *  กันรูปจากภายนอกที่ใช้เป็น tracking pixel หรือถูกเปลี่ยนเนื้อหาภายหลัง */
const ALLOWED_IMG = /^\/uploads\/[\w.-]+$/;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li",
    "blockquote", "code", "pre",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  // อนุญาตเฉพาะ scheme ที่ปลอดภัย — ตัด javascript:, data:, vbscript: ทิ้ง
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  // ตัดแท็กที่ไม่อยู่ในรายการทิ้งทั้งเนื้อหา (ไม่ใช่แค่ถอดแท็ก)
  nonTextTags: ["style", "script", "textarea", "option", "noscript", "iframe", "object", "embed"],
  transformTags: {
    /* ลิงก์: ประกอบ attribute ใหม่จากศูนย์เสมอ — ห้าม spread ของเดิม
       เพราะผู้ส่งยัด target="_blank" rel="opener" มาเองได้ (tabnabbing)
       และต้อง trim ก่อนตรวจ เพราะ " https://evil.com" เบราว์เซอร์ตัดช่องว่างแล้วไปจริง
       แต่ regex จะไม่ match ทำให้ไม่ได้ rel ป้องกัน */
    a: (_tagName, attribs) => {
      const href = (attribs.href ?? "").trim();
      const external = /^https?:\/\//i.test(href);
      return {
        tagName: "a",
        attribs: {
          href,
          ...(attribs.title ? { title: attribs.title } : {}),
          ...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {}),
        },
      };
    },
  },
  // กัน payload ที่แอบใส่ </html> เพื่อหลอกให้ตัวแยกวิเคราะห์หยุดกรองกลางคัน
  enforceHtmlBoundary: true,
  exclusiveFilter: (frame) => {
    // ทิ้ง <img> ที่ src ไม่ใช่ไฟล์ในคลังสื่อของเรา
    if (frame.tag === "img") {
      const src = frame.attribs.src ?? "";
      return !ALLOWED_IMG.test(src);
    }
    return false;
  },
};

/** URL รูปภายใน: ยอมเฉพาะไฟล์ในคลังสื่อของเราเอง (กัน tracking pixel / เนื้อหาที่ถูกเปลี่ยนภายหลัง)
 *  คืน "" เมื่อค่าไม่ผ่าน เพื่อให้ผู้ใช้เห็นว่าไม่ถูกบันทึก แทนที่จะเงียบ ๆ เก็บของอันตราย */
export function cleanInternalUrl(v?: string | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = v.trim();
  if (s === "") return "";
  return ALLOWED_IMG.test(s) ? s : "";
}

/** URL ภายนอก: ยอมเฉพาะ http/https — ตัด javascript:, data:, vbscript: และ //evil.com */
export function cleanExternalUrl(v?: string | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = v.trim();
  if (s === "") return "";
  return /^https?:\/\/[^\s]+$/i.test(s) ? s : "";
}

/** คืน HTML ที่ปลอดภัยแล้ว (undefined/null → undefined เพื่อไม่ไปเขียนทับค่าเดิมโดยไม่ตั้งใจ) */
export function cleanHtml(html?: string | null): string | undefined {
  if (html === undefined || html === null) return undefined;
  if (html === "") return "";
  return sanitizeHtml(html, OPTIONS);
}

/** ทำความสะอาดหลาย field ในอ็อบเจกต์เดียว (ใช้กับ DTO ก่อนบันทึก)
 *  คืนอ็อบเจกต์ใหม่ ไม่แก้ของเดิม และคง field ที่ไม่ได้ส่งมาให้เป็น undefined เหมือนเดิม
 *  หมายเหตุ: ต้องผูก generic กับ `object` ไม่ใช่ `Record<string, unknown>`
 *  เพราะ DTO เป็น class ซึ่งไม่มี index signature (TS2345) */
export function cleanHtmlFields<T extends object>(
  dto: T,
  fields: readonly (keyof T & string)[],
): T {
  const out = { ...dto } as Record<string, unknown>;
  for (const f of fields) {
    const v = out[f];
    if (typeof v === "string") {
      out[f] = cleanHtml(v);
    }
  }
  return out as T;
}
