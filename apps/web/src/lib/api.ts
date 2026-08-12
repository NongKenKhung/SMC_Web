/** Data layer — เรียก NestJS API ฝั่ง server component */

/* ฝั่งเซิร์ฟเวอร์ (server component) ต้องใช้ URL เต็มเพราะเรียกจากใน Node
   ฝั่งเบราว์เซอร์ใช้เส้นทางสัมพัทธ์ "/api" แล้วให้ Next ส่งต่อไป API ให้
   — เบราว์เซอร์จึงยิงมาที่ origin เดียวกับที่เปิดอยู่ ไม่ว่าจะเป็น localhost, IP ในวง LAN
   หรือโดเมนจริง โดยไม่ต้อง build ใหม่ และไม่ติด CORS */
const API_INTERNAL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const API = typeof window === "undefined" ? API_INTERNAL : "/api";

export interface SolutionNode {
  id: number;
  slug: string;
  nameTh: string;
  nameEn: string | null;
  summaryTh: string | null;
  summaryEn?: string | null;
  icon: string | null;
  order: number;
  children: Omit<SolutionNode, "children">[];
}

/* ---------- Block: เนื้อหารายการซ้ำ ๆ ที่แก้ผ่าน admin (Phase 6B) ---------- */
export interface BlockItem {
  id: number;
  group: string;
  order: number;
  icon: string | null;
  titleTh: string;
  titleEn: string | null;
  subtitleTh: string | null;
  subtitleEn: string | null;
  bodyTh: string | null; // HTML ที่ผ่าน sanitize ฝั่งเซิร์ฟเวอร์แล้ว
  bodyEn: string | null;
  image: string | null;
  meta: string | null;
}

/* ---------- ไฟล์แนบ (Phase 6A) ---------- */
export interface AttachmentItem {
  id: number;
  mediaId: number;
  url: string;
  filename: string;
  mime: string;
  size: number;
  altTh: string | null;
  altEn: string | null;
  captionTh: string | null;
  captionEn: string | null;
  order: number;
}
export interface WithAttachments {
  poster?: AttachmentItem | null;
  gallery?: AttachmentItem[];
  downloads?: AttachmentItem[];
  /** หน้าโบรชัว — รูปเต็มหน้าเรียงต่อกัน ใช้แทนเนื้อหาแบบข้อความ */
  brochure?: AttachmentItem[];
}

export interface SolutionDetail extends WithAttachments {
  id: number;
  slug: string;
  /** TEXT = หน้าเนื้อหาปกติ | BROCHURE = รูปโบรชัวเต็มหน้า */
  layout: string;
  nameTh: string;
  nameEn: string | null;
  summaryTh: string | null;
  summaryEn: string | null;
  bodyTh: string | null;
  bodyEn: string | null;
  coverImage: string | null;
  parent: { slug: string; nameTh: string; nameEn: string | null } | null;
  children: { slug: string; nameTh: string; nameEn: string | null; summaryTh: string | null }[];
}

export interface Partner {
  id: number;
  name: string;
  captionTh: string | null;
  captionEn: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
}

export interface PostItem {
  id: number;
  slug: string;
  titleTh: string;
  titleEn: string | null;
  excerptTh: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
}

export interface PostDetail extends PostItem, WithAttachments {
  bodyTh: string | null;
  bodyEn: string | null;
}

export interface PageMedia extends WithAttachments {
  slug: string;
}

export interface HeroContent {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  lead: string;
  stats: { value: string; label: string }[];
}

export interface ContactContent {
  address: string;
  phone: string;
  email: string;
  hours: string;
}

export interface AboutContent {
  vision: string;
  missions: string[];
}

/** ลิงก์ฝังจากภายนอก (แก้ได้ที่ admin) — ปล่อยว่าง = ไม่แสดงส่วนนั้นเลย */
export interface EmbedContent {
  /** ลิงก์ YouTube หรือ Vimeo */
  videoUrl: string;
  /** หัวข้อเหนือวิดีโอบนหน้าแรก */
  videoTitle: string;
  /** พิกัด "13.7276,100.7791" หรือชื่อสถานที่ สำหรับแผนที่หน้า Contact */
  mapQuery: string;
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getSolutionsTree = () => get<SolutionNode[]>("/solutions");
export const getSolution = (slug: string) => get<SolutionDetail>(`/solutions/${slug}`);
export const getPartners = () => get<Partner[]>("/partners");
export const getPosts = (opts?: { category?: string; take?: number }) => {
  const q = new URLSearchParams();
  if (opts?.category) q.set("category", opts.category);
  if (opts?.take) q.set("take", String(opts.take));
  const qs = q.toString();
  return get<PostItem[]>(`/posts${qs ? `?${qs}` : ""}`);
};
export const getPost = (slug: string) => get<PostDetail>(`/posts/${slug}`);
/** ดึงเนื้อหาหลายชุดในครั้งเดียว เช่น getBlocks(["home.pillars", "home.techs"]) */
export const getBlocks = async (groups: string[]) => {
  const res = await get<Record<string, BlockItem[]>>(`/blocks?groups=${groups.map(encodeURIComponent).join(",")}`);
  return res ?? {};
};

/** poster ของ banner/hero แต่ละหน้า (Phase 6A) */
export const getPageMedia = (slug: string) => get<PageMedia>(`/pages/${slug}`);
/** ลิงก์ดาวน์โหลดที่บังคับให้บันทึกไฟล์ + ใช้ชื่อไฟล์เดิม
 *  ต้องเป็นเส้นทางสัมพัทธ์เสมอ — ลิงก์นี้ถูก render ฝั่งเซิร์ฟเวอร์ลงไปใน HTML
 *  ถ้าใช้ตัวแปร API จะได้ origin ของเซิร์ฟเวอร์ติดไป แล้วคนที่เปิดจากเครื่องอื่นกดโหลดไม่ได้ */
export const downloadUrl = (mediaId: number) => `/api/media/${mediaId}/download`;
/** ดึง content ตามภาษา — ถ้าไม่มีคำแปลอังกฤษจะ fallback เป็นไทย */
export const getContent = async <T,>(
  key: string,
  locale: "th" | "en" = "th",
): Promise<T | null> => {
  const row = await get<{ valueTh: T | null; valueEn: T | null }>(`/content/${key}`);
  if (!row) return null;
  return (locale === "en" && row.valueEn) ? row.valueEn : row.valueTh;
};


/** path รูปจากระบบ admin — คงเป็นเส้นทางสัมพัทธ์ "/uploads/.." ไว้เสมอ
 *  Next มี rewrite ส่งต่อไปยัง API ให้แล้ว การใส่ origin เต็มจะทำให้เปิดจากเครื่องอื่นไม่ได้
 *  (HTML ที่ render ฝั่งเซิร์ฟเวอร์จะฝัง localhost ติดไปด้วย) */
export const mediaUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : path;
