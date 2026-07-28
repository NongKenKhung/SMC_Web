"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API, setToken } from "@/lib/admin";

export default function AdminLogin() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      setToken(body.accessToken);
      router.replace("/admin");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <span className="logo-chip"><img src="/logo.png" alt="SMC" /></span>
        <h1>SMC Admin</h1>
        <p className="sub">ระบบจัดการเนื้อหาเว็บไซต์ศูนย์</p>
        <form className="adm-form" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email">อีเมล</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div>
            <label htmlFor="password">รหัสผ่าน</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {err && <p className="adm-msg-err">{err}</p>}
          <button className="adm-btn" type="submit" disabled={busy}>
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
