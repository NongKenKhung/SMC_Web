import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["th", "en"];
const DEFAULT_LOCALE = "th";

/** เส้นทางที่ไม่ใช่หน้าเว็บสองภาษา — ปล่อยผ่านตามเดิม */
const SKIP = /^\/(admin|api|uploads|_next)(\/|$)/;

/** เติมภาษานำหน้าให้ URL ที่ยังไม่มี
 *  / → /th และ /อะไรก็ตาม → /th/อะไรก็ตาม
 *  ผลพลอยได้: URL ที่พิมพ์ผิดจะไปจบที่หน้า 404 ของเว็บ (มี header/footer)
 *  แทนหน้าเปล่าขาวดำของ Next */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SKIP.test(pathname)) return NextResponse.next();

  const seg = pathname.split("/")[1] ?? "";
  if (LOCALES.includes(seg)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  /* ข้ามไฟล์ static ทั้งหมด (ชื่อที่มีนามสกุล) เพื่อไม่ให้ไป redirect รูป/ฟอนต์ */
  matcher: ["/((?!_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
