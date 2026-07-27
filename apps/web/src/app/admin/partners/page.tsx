"use client";

import { useCallback, useEffect, useState } from "react";
import Upload from "@/components/admin/Upload";
import { adminFetch, mediaUrl, type AdminPartner } from "@/lib/admin";

type FormState = Partial<AdminPartner> & { name: string };

const EMPTY: FormState = { name: "", caption: "", logoUrl: "", websiteUrl: "", order: 0, published: true };

export default function AdminPartners() {
  const [rows, setRows] = useState<AdminPartner[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  const load = useCallback(() => {
    adminFetch<AdminPartner[]>("/admin/partners").then(setRows).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = {
      name: form.name, caption: form.caption ?? "", logoUrl: form.logoUrl ?? "",
      websiteUrl: form.websiteUrl ?? "", order: Number(form.order ?? 0), published: !!form.published,
    };
    try {
      if (editingId) {
        await adminFetch(`/admin/partners/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/admin/partners", { method: "POST", body: JSON.stringify(payload) });
      }
      setMsg({ ok: "บันทึกแล้ว" });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    }
  }

  async function remove(r: AdminPartner) {
    if (!confirm(`ลบพาร์ทเนอร์ "${r.name}"?`)) return;
    await adminFetch(`/admin/partners/${r.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <h1>พาร์ทเนอร์</h1>
      <p className="sub">โลโก้หน่วยงานที่แสดงในหน้า Partner และหน้าแรก (เรียงตามลำดับ)</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card">
        <div className="adm-actions" style={{ marginBottom: 14 }}>
          <button className="adm-btn" onClick={() => { setEditingId(null); setForm({ ...EMPTY, order: rows.length + 1 }); setMsg({}); }}>
            + เพิ่มพาร์ทเนอร์
          </button>
        </div>
        <table className="adm-table">
          <thead>
            <tr><th>โลโก้</th><th>ชื่อ</th><th>คำอธิบาย</th><th>ลำดับ</th><th>สถานะ</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.logoUrl
                    ? <img src={mediaUrl(r.logoUrl) ?? ""} alt="" style={{ height: 36, borderRadius: 6 }} />
                    : <span className="pill off">ไม่มีรูป</span>}
                </td>
                <td>{r.name}</td>
                <td>{r.caption}</td>
                <td>{r.order}</td>
                <td><span className={`pill ${r.published ? "on" : "off"}`}>{r.published ? "แสดง" : "ซ่อน"}</span></td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn ghost sm" onClick={() => { setEditingId(r.id); setForm({ ...r }); setMsg({}); }}>แก้ไข</button>
                    <button className="adm-btn danger sm" onClick={() => remove(r)}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="adm-card">
          <h2>{editingId ? `แก้ไข: ${form.name}` : "เพิ่มพาร์ทเนอร์"}</h2>
          <form className="adm-form" onSubmit={save}>
            <div className="row3">
              <div>
                <label>ชื่อหน่วยงาน *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label>คำอธิบายสั้น</label>
                <input value={form.caption ?? ""} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
              </div>
              <div>
                <label>ลำดับ</label>
                <input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label>เว็บไซต์ (คลิกโลโก้แล้วเปิด)</label>
              <input value={form.websiteUrl ?? ""} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label>โลโก้</label>
              <Upload value={form.logoUrl} onDone={(url) => setForm({ ...form, logoUrl: url })} />
            </div>
            <label className="check">
              <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              แสดงบนเว็บ
            </label>
            <div className="adm-actions">
              <button className="adm-btn" type="submit">บันทึก</button>
              <button className="adm-btn ghost" type="button" onClick={() => setForm(null)}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
