/** Data layer — เรียก NestJS API ฝั่ง server component */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

export interface SolutionDetail {
  id: number;
  slug: string;
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
  caption: string | null;
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

export interface PostDetail extends PostItem {
  bodyTh: string | null;
  bodyEn: string | null;
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
/** ดึง content ตามภาษา — ถ้าไม่มีคำแปลอังกฤษจะ fallback เป็นไทย */
export const getContent = async <T,>(
  key: string,
  locale: "th" | "en" = "th",
): Promise<T | null> => {
  const row = await get<{ valueTh: T | null; valueEn: T | null }>(`/content/${key}`);
  if (!row) return null;
  return (locale === "en" && row.valueEn) ? row.valueEn : row.valueTh;
};

export const API_URL = API;

/** แปลง path รูปจากระบบ admin (/uploads/..) เป็น URL เต็มของ API */
export const mediaUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : `${API.replace(/\/api$/, "")}${path}`;
