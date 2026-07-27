"use client";

/** helpers ฝั่ง admin — token + fetch พร้อม Authorization */

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const API_ORIGIN = API.replace(/\/api$/, "");

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
  !path ? null : path.startsWith("http") ? path : `${API_ORIGIN}${path}`;

/* ---------- types ฝั่ง admin ---------- */
export interface AdminSolution {
  id: number; slug: string; parentId: number | null; order: number;
  published: boolean; icon: string | null;
  nameTh: string; nameEn: string | null;
  summaryTh: string | null; summaryEn: string | null;
  bodyTh: string | null; bodyEn: string | null;
  coverImage: string | null;
}
export interface AdminPartner {
  id: number; name: string; caption: string | null; logoUrl: string | null;
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
export interface AdminContentRow {
  key: string;
  valueTh: Record<string, unknown> | null;
  valueEn: Record<string, unknown> | null;
}
