"use client";

import { useCallback, useEffect, useState } from "react";
import AttachmentEditor from "@/components/admin/AttachmentEditor";
import RichText from "@/components/admin/RichText";
import Upload from "@/components/admin/Upload";
import { adminFetch, type AdminPost } from "@/lib/admin";
import { slugFrom, slugify } from "@/lib/slug";

const CATS = [
  { v: "ACTIVITY", label: "กิจกรรม" },
  { v: "NEWS", label: "ข่าว" },
  { v: "WORK", label: "ผลงาน" },
];

type FormState = Partial<AdminPost> & { titleTh: string; slug: string; category: string };

const EMPTY: FormState = {
  titleTh: "", titleEn: "", slug: "", category: "ACTIVITY",
  excerptTh: "", excerptEn: "", bodyTh: "", bodyEn: "",
  coverImage: "", published: true,
  publishedAt: new Date().toISOString().slice(0, 10),
};

export default function AdminPosts() {
  const [rows, setRows] = useState<AdminPost[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  /* ถ้าผู้ใช้พิมพ์ slug เองแล้ว หยุดสร้างอัตโนมัติ — ไม่ทับของที่ตั้งใจตั้ง */
  const [slugTouched, setSlugTouched] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  const load = useCallback(() => {
    adminFetch<AdminPost[]>("/admin/posts").then(setRows).catch(() => {});
  }, []);
  useEffect(load, [load]);

  function openEdit(r: AdminPost) {
    setEditingId(r.id);
    setSlugTouched(true); // ของเดิมมี slug แล้ว ห้ามเขียนทับ
    setForm({ ...r, publishedAt: r.publishedAt.slice(0, 10) });
    setMsg({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = {
      slug: form.slug, titleTh: form.titleTh, titleEn: form.titleEn ?? "",
      excerptTh: form.excerptTh ?? "", excerptEn: form.excerptEn ?? "",
      bodyTh: form.bodyTh ?? "", bodyEn: form.bodyEn ?? "",
      coverImage: form.coverImage ?? "", category: form.category,
      published: !!form.published, publishedAt: form.publishedAt,
    };
    try {
      if (editingId) {
        await adminFetch(`/admin/posts/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setMsg({ ok: "บันทึกแล้ว" });
        setForm(null);
      } else {
        /* เพิ่งสร้างใหม่ — ยังไม่ปิดฟอร์ม แต่สลับเป็นโหมดแก้ไขของโพสต์ที่เพิ่งได้
           เพราะการแนบไฟล์ต้องรู้ id ก่อน ถ้าปิดไปผู้ใช้ต้องมาเปิดแก้ไขเองอีกรอบ */
        const created = await adminFetch<AdminPost>("/admin/posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEditingId(created.id);
        setSlugTouched(true);
        setForm({ ...created, publishedAt: created.publishedAt.slice(0, 10) });
        setMsg({ ok: "บันทึกแล้ว — ตอนนี้แนบรูปและไฟล์ด้านล่างได้เลย" });
      }
      load();
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    }
  }

  async function remove(r: AdminPost) {
    if (!confirm(`ลบโพสต์ "${r.titleTh.slice(0, 40)}"?`)) return;
    await adminFetch(`/admin/posts/${r.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <h1>กิจกรรม &amp; ข่าว</h1>
      <p className="sub">โพสต์ทั้งหมด — 3 โพสต์ล่าสุดที่เผยแพร่จะขึ้นหน้าแรกอัตโนมัติ</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card">
        <div className="adm-actions" style={{ marginBottom: 14 }}>
          <button className="adm-btn" onClick={() => { setEditingId(null); setSlugTouched(false); setForm({ ...EMPTY }); setMsg({}); }}>
            + เขียนโพสต์ใหม่
          </button>
        </div>
        <table className="adm-table">
          <thead>
            <tr><th>หัวข้อ</th><th>หมวด</th><th>วันที่</th><th>สถานะ</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.titleTh}</td>
                <td><span className="pill cat">{CATS.find((c) => c.v === r.category)?.label ?? r.category}</span></td>
                <td>{new Date(r.publishedAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</td>
                <td><span className={`pill ${r.published ? "on" : "off"}`}>{r.published ? "เผยแพร่" : "ฉบับร่าง"}</span></td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn ghost sm" onClick={() => openEdit(r)}>แก้ไข</button>
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
          <h2>{editingId ? "แก้ไขโพสต์" : "เขียนโพสต์ใหม่"}</h2>
          <form className="adm-form" onSubmit={save}>
            <div className="row2">
              <div>
                <label>หัวข้อ (ไทย) *</label>
                <input
                  value={form.titleTh}
                  onChange={(e) => {
                    const titleTh = e.target.value;
                    const auto = !editingId && !slugTouched;
                    setForm({ ...form, titleTh, ...(auto ? { slug: slugFrom(titleTh, form.titleEn) } : {}) });
                  }}
                  required
                />
              </div>
              <div>
                <label>หัวข้อ (อังกฤษ)</label>
                <input
                  value={form.titleEn ?? ""}
                  onChange={(e) => {
                    const titleEn = e.target.value;
                    const auto = !editingId && !slugTouched;
                    setForm({ ...form, titleEn, ...(auto ? { slug: slugFrom(form.titleTh, titleEn) } : {}) });
                  }}
                />
              </div>
            </div>
            <div className="row3">
              <div>
                <label>slug (ที่อยู่หน้าเว็บ)</label>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: slugify(e.target.value) });
                  }}
                  required
                  pattern="[a-z0-9-]+"
                />
                <p className="adm-note">
                  {editingId
                    ? "เปลี่ยนแล้วลิงก์เดิมที่เคยส่งให้คนอื่นจะเข้าไม่ได้"
                    : "สร้างให้อัตโนมัติจากหัวข้อ — แก้เองได้ถ้าต้องการ"}
                  {form.slug ? ` · /blog/${form.slug}` : ""}
                </p>
              </div>
              <div>
                <label>หมวด</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label>วันที่เผยแพร่</label>
                <input type="date" value={form.publishedAt ?? ""} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
              </div>
            </div>
            <div className="row2">
              <div>
                <label>สรุปย่อ (ไทย)</label>
                <textarea value={form.excerptTh ?? ""} onChange={(e) => setForm({ ...form, excerptTh: e.target.value })} />
              </div>
              <div>
                <label>สรุปย่อ (อังกฤษ)</label>
                <textarea value={form.excerptEn ?? ""} onChange={(e) => setForm({ ...form, excerptEn: e.target.value })} />
              </div>
            </div>
            <div>
              <label>เนื้อหาเต็ม (ไทย)</label>
              <RichText
                value={form.bodyTh ?? ""}
                onChange={(html) => setForm({ ...form, bodyTh: html })}
                placeholder="เขียนเนื้อหาโพสต์ จัดหัวข้อ ใส่รายการ แทรกรูปจากคลังสื่อได้"
              />
            </div>
            <div>
              <label>เนื้อหาเต็ม (อังกฤษ)</label>
              <RichText
                value={form.bodyEn ?? ""}
                onChange={(html) => setForm({ ...form, bodyEn: html })}
                placeholder="English content (optional)"
              />
            </div>
            <div>
              <label>รูปปก</label>
              <Upload value={form.coverImage} onDone={(url) => setForm({ ...form, coverImage: url })} />
            </div>
            <label className="check">
              <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              เผยแพร่
            </label>

            {/* ไฟล์แนบ — บันทึกทันทีเมื่อกด ไม่ต้องรอ "บันทึก" ของฟอร์ม */}
            <div style={{ display: "grid", gap: 14 }}>
              <AttachmentEditor ownerType="POST" ownerId={editingId ? String(editingId) : ""} role="GALLERY" />
              <AttachmentEditor ownerType="POST" ownerId={editingId ? String(editingId) : ""} role="DOWNLOAD" />
            </div>
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
