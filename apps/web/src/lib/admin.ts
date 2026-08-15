"use client";

/** helpers ฝั่ง admin — token + fetch พร้อม Authorization */

/* หน้า admin ทำงานในเบราว์เซอร์อย่างเดียว จึงยิงไปที่ origin เดียวกับที่เปิดอยู่
   แล้วให้ Next ส่งต่อไป API — ใช้ได้ทั้ง localhost, IP ในวง LAN และโดเมนจริง */
export const API = "/api";

const TOKEN_KEY = "sml_admin_token";

export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** เรียก API แบบแนบ token — ถ้า 401 จะเด้งไปหน้า login ให้เอง */
export async function adminFetch<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: `Bearer ${getToken() ?? ""}`,
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/admin/login";
    throw new ApiError(401, "unauthorized");
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = Array.isArray(body.message) ? body.message.join(", ") : body.message ?? msg;
    } catch { /* ignore */ }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

/** แปลง path รูปจาก API (/uploads/..) เป็น URL เต็ม */
export const mediaUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : path;

/* ---------- types ฝั่ง admin ---------- */
export interface AdminSolution {
  id: number; slug: string; parentId: number | null; order: number;
  published: boolean; icon: string | null; layout: string;
  nameTh: string; nameEn: string | null;
  summaryTh: string | null; summaryEn: string | null;
  bodyTh: string | null; bodyEn: string | null;
  coverImage: string | null;
  /** ราคา (บาท) — null = ยังไม่กำหนด API แปลง Decimal เป็นตัวเลขให้แล้ว */
  price: number | null;
}
export interface AdminPartner {
  id: number; name: string; captionTh: string | null; captionEn: string | null; logoUrl: string | null;
  websiteUrl: string | null; order: number; published: boolean;
}
export interface AdminPost {
  id: number; slug: string; category: string;
  titleTh: string; titleEn: string | null;
  excerptTh: string | null; excerptEn: string | null;
  bodyTh: string | null; bodyEn: string | null;
  coverImage: string | null; published: boolean; publishedAt: string;
}
export interface AdminMessage {
  id: number; name: string; org: string | null; email: string;
  phone: string | null; topic: string | null; message: string;
  createdAt: string; readAt: string | null;
}
export interface AdminBlock {
  id: number;
  group: string;
  order: number;
  published: boolean;
  icon: string | null;
  titleTh: string;
  titleEn: string | null;
  subtitleTh: string | null;
  subtitleEn: string | null;
  bodyTh: string | null; // HTML ที่ sanitize แล้วฝั่งเซิร์ฟเวอร์
  bodyEn: string | null;
  image: string | null;
  meta: string | null;
}

export interface AdminMedia {
  id: number;
  filename: string;
  storedName: string | null;
  url: string;
  mime: string;
  size: number;
  kind: string; // IMAGE | FILE
  width: number | null;
  height: number | null;
  altTh: string | null;
  altEn: string | null;
  createdAt: string;
}
export interface AdminAttachment {
  id: number;
  mediaId: number;
  ownerType: string; // SOLUTION | POST | PAGE
  ownerId: string;
  role: string; // GALLERY | DOWNLOAD | POSTER
  order: number;
  captionTh: string | null;
  captionEn: string | null;
  media: AdminMedia;
}

/** แปลงขนาดไฟล์เป็นข้อความอ่านง่าย */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface AdminContentRow {
  key: string;
  valueTh: Record<string, unknown> | null;
  valueEn: Record<string, unknown> | null;
}
