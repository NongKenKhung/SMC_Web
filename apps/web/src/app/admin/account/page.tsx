"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch, clearToken } from "@/lib/admin";

/* รหัสผ่านที่มากับระบบตอนติดตั้ง — เตือนให้เปลี่ยนถ้ายังใช้อยู่ */
const DEFAULT_PASSWORD = "ChangeMe123!";

export default function AdminAccount() {
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  useEffect(() => {
    adminFetch<{ name: string; email: string }>("/auth/me").then(setMe).catch(() => {});
  }, []);

  const usingDefault = current === DEFAULT_PASSWORD;
  const tooShort = next.length > 0 && next.length < 10;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current && next.length >= 10 && next === confirm && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMsg({});
    try {
      await adminFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      /* เปลี่ยนสำเร็จแล้วให้เข้าสู่ระบบใหม่ด้วยรหัสใหม่ — กันสับสนว่าตกลงใช้อันไหน */
      setMsg({ ok: "เปลี่ยนรหัสผ่านแล้ว กำลังพาไปเข้าสู่ระบบใหม่…" });
      setTimeout(() => {
        clearToken();
        router.replace("/admin/login");
      }, 1500);
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ" });
      setBusy(false);
    }
  }

  return (
    <>
      <h1>บัญชีของฉัน</h1>
      <p className="sub">เปลี่ยนรหัสผ่านที่ใช้เข้าระบบจัดการเนื้อหา</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card" style={{ maxWidth: 520 }}>
        <h2>ผู้ใช้ที่เข้าสู่ระบบอยู่</h2>
        <p className="sub" style={{ margin: "0 0 20px" }}>
          {me ? `${me.name} · ${me.email}` : "กำลังโหลด…"}
        </p>

        <form className="adm-form" onSubmit={submit}>
          <div>
            <label htmlFor="cur">รหัสผ่านปัจจุบัน</label>
            <input
              id="cur"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            {usingDefault && (
              <p className="adm-warn">
                นี่คือรหัสผ่านที่มากับระบบตอนติดตั้ง — ควรเปลี่ยนก่อนเปิดเว็บให้คนภายนอกเข้าถึง
              </p>
            )}
          </div>

          <div>
            <label htmlFor="new">รหัสผ่านใหม่</label>
            <input
              id="new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            {tooShort && <p className="adm-warn">ต้องยาวอย่างน้อย 10 ตัวอักษร</p>}
          </div>

          <div>
            <label htmlFor="confirm">พิมพ์รหัสผ่านใหม่อีกครั้ง</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {mismatch && <p className="adm-warn">รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน</p>}
          </div>

          <div className="adm-actions">
            <button className="adm-btn" type="submit" disabled={!canSubmit}>
              {busy ? "กำลังเปลี่ยน…" : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
          <p className="adm-note">
            เปลี่ยนเสร็จแล้วระบบจะให้เข้าสู่ระบบใหม่ด้วยรหัสผ่านใหม่
          </p>
        </form>
      </div>
    </>
  );
}
