"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch, clearToken, getToken } from "@/lib/admin";

const NAV = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/solutions", label: "Solutions" },
  { href: "/admin/posts", label: "กิจกรรม & ข่าว" },
  { href: "/admin/partners", label: "พาร์ทเนอร์" },
  { href: "/admin/media", label: "คลังสื่อ" },
  { href: "/admin/content", label: "ข้อความหน้าเว็บ" },
  { href: "/admin/messages", label: "กล่องข้อความ" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    adminFetch<{ name: string; email: string }>("/auth/me")
      .then((u) => {
        setUser(u);
        setReady(true);
      })
      .catch(() => { /* adminFetch เด้งไป login ให้แล้ว */ });
  }, [isLogin, pathname, router]);

  /* ปิดเมนูมือถือเมื่อเปลี่ยนหน้า */
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isLogin) return <>{children}</>;
  if (!ready) return null;

  return (
    <div className="adm-wrap">
      <aside className={`adm-side${navOpen ? " nav-open" : ""}`}>
        <span className="logo-chip"><img src="/logo.png" alt="SMC" /></span>
        <button
          className="adm-burger"
          aria-label={navOpen ? "ปิดเมนู" : "เปิดเมนู"}
          onClick={() => setNavOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <nav className="adm-nav">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setNavOpen(false)}
              className={
                (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href))
                  ? "active"
                  : ""
              }
            >
              {n.label}
            </Link>
          ))}
          <a href="/th" target="_blank" rel="noreferrer">↗ เปิดดูหน้าเว็บ</a>
          <div className="spacer" />
          {user && <div className="adm-user">{user.name}<br />{user.email}</div>}
          <button
            className="adm-logout"
            onClick={() => {
              clearToken();
              router.replace("/admin/login");
            }}
          >
            ออกจากระบบ
          </button>
        </nav>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
