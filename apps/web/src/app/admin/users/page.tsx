"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin";
import { useScrollToForm } from "@/components/admin/useScrollToForm";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const EMPTY = { email: "", name: "", password: "" };

export default function AdminUsers() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<{ email: string } | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const { formRef, focusForm } = useScrollToForm();

  const load = useCallback(() => {
    adminFetch<AdminUser[]>("/admin/users").then(setRows).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    adminFetch<{ email: string }>("/auth/me").then(setMe).catch(() => {});
  }, [load]);

  const tooShort = !!form && form.password.length > 0 && form.password.length < 10;
  const canSubmit = !!form && form.email && form.name && form.password.length >= 10 && !busy;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !canSubmit) return;
    setBusy(true);
    setMsg({});
    try {
      await adminFetch("/admin/users", { method: "POST", body: JSON.stringify(form) });
      setMsg({ ok: `เพิ่มผู้ดูแล ${form.email} แล้ว — แจ้งรหัสผ่านให้เจ้าตัวแล้วให้เปลี่ยนเองที่หน้า "บัญชีของฉัน"` });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "เพิ่มผู้ดูแลไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(u: AdminUser) {
    if (!confirm(`ลบผู้ดูแล "${u.name}" (${u.email})? เจ้าตัวจะเข้าระบบไม่ได้อีก`)) return;
    setMsg({});
    try {
      await adminFetch(`/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "ลบไม่สำเร็จ" });
    }
  }

  return (
    <>
      <h1>ผู้ดูแลระบบ</h1>
      <p className="sub">บัญชีที่เข้าใช้ระบบจัดการเนื้อหาได้ — ทุกบัญชีมีสิทธิ์เท่ากัน</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card">
        <div className="adm-actions" style={{ marginBottom: 14 }}>
          <button
            className="adm-btn"
            onClick={() => { setForm({ ...EMPTY }); focusForm(); setMsg({}); }}
          >
            + เพิ่มผู้ดูแล
          </button>
        </div>

        <table className="adm-table">
          <thead>
            <tr><th>ชื่อ</th><th>อีเมล</th><th>เพิ่มเมื่อ</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const isMe = me?.email === u.email;
              return (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    {isMe && <span className="lang-tag">คุณ</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</td>
                  <td>
                    <button
                      className="adm-btn danger sm"
                      disabled={isMe || rows.length <= 1}
                      title={
                        isMe
                          ? "ลบบัญชีที่กำลังใช้งานอยู่ไม่ได้"
                          : rows.length <= 1
                            ? "ต้องเหลือผู้ดูแลอย่างน้อย 1 คน"
                            : undefined
                      }
                      onClick={() => remove(u)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="sub">กำลังโหลด…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="adm-card" ref={formRef} style={{ marginTop: 18, maxWidth: 520 }}>
          <h2>เพิ่มผู้ดูแลใหม่</h2>
          <form className="adm-form" onSubmit={create}>
            <div>
              <label>ชื่อ-นามสกุล</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label>อีเมล (ใช้เข้าสู่ระบบ)</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label>รหัสผ่านตั้งต้น</label>
              <input
                type="text"
                autoComplete="off"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              {tooShort && <p className="adm-warn">ต้องยาวอย่างน้อย 10 ตัวอักษร</p>}
              <p className="adm-note">
                แสดงเป็นข้อความธรรมดาเพื่อให้คัดลอกไปแจ้งเจ้าตัวได้ — บอกให้เปลี่ยนรหัสเองทันทีที่เข้าระบบครั้งแรก
              </p>
            </div>
            <div className="adm-actions">
              <button className="adm-btn" type="submit" disabled={!canSubmit}>
                {busy ? "กำลังเพิ่ม…" : "เพิ่มผู้ดูแล"}
              </button>
              <button className="adm-btn ghost" type="button" onClick={() => setForm(null)}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
