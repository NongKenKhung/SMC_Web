import { NextRequest, NextResponse } from "next/server";

/** เปิด / → ไปภาษาไทย (default locale) */
export function middleware(req: NextRequest) {
  return NextResponse.redirect(new URL("/th", req.url));
}

export const config = {
  matcher: ["/"],
};
