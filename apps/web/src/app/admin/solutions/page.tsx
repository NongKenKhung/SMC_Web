"use client";

import { useCallback, useEffect, useState } from "react";
import AttachmentEditor from "@/components/admin/AttachmentEditor";
import RichText from "@/components/admin/RichText";
import Upload from "@/components/admin/Upload";
import { adminFetch, type AdminSolution } from "@/lib/admin";

type FormState = Partial<AdminSolution> & { nameTh: string; slug: string };

const EMPTY: FormState = {
  nameTh: "", nameEn: "", slug: "", summaryTh: "", summaryEn: "",
  bodyTh: "", bodyEn: "", coverImage: "", parentId: null, order: 0, published: true,
};

export default function AdminSolutions() {
  const [rows, setRows] = useState<AdminSolution[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  const load = useCallback(() => {
    adminFetch<AdminSolution[]>("/admin/solutions").then(setRows).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const cats = rows.filter((r) => r.parentId === null);
  const childrenOf = (id: number) =>
    rows.filter((r) => r.parentId === id).sort((a, b) => a.order - b.order);

  function openCreate(parentId: number | null) {
    setEditingId(null);
    setForm({ ...EMPTY, parentId });
    setMsg({});
  }
  function openEdit(r: AdminSolution) {
    setEditingId(r.id);
    setForm({ ...r });
    setMsg({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = {
      slug: form.slug, nameTh: form.nameTh, nameEn: form.nameEn ?? "",
      summaryTh: form.summaryTh ?? "", summaryEn: form.summaryEn ?? "",
      bodyTh: form.bodyTh ?? "", bodyEn: form.bodyEn ?? "",
      coverImage: form.coverImage ?? "",
      parentId: form.parentId ?? undefined,
      order: Number(form.order ?? 0),
      published: !!form.published,
    };
    try {
      if (editingId) {
        await adminFetch(`/admin/solutions/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/admin/solutions", { method: "POST", body: JSON.stringify(payload) });
      }
      setMsg({ ok: "บันทึกแล้ว — หน้าเว็บและเมนู dropdown อัปเดตทันที" });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    }
  }

  async function remove(r: AdminSolution) {
    const kids = childrenOf(r.id).length;
    if (!confirm(`ลบ "${r.nameTh}"${kids ? ` และหัวข้อย่อย ${kids} รายการ` : ""}?`)) return;
    await adminFetch(`/admin/solutions/${r.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <h1>Solutions</h1>
      <p className="sub">หมวดและหัวข้อย่อย — เมนู dropdown บนเว็บ generate จากรายการนี้อัตโนมัติ</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card">
        <div className="adm-actions" style={{ marginBottom: 14 }}>
          <button className="adm-btn" onClick={() => openCreate(null)}>+ เพิ่มหมวดใหม่</button>
        </div>
        <table className="adm-table">
          <thead>
            <tr><th>ชื่อ</th><th>slug</th><th>ลำดับ</th><th>สถานะ</th><th></th></tr>
          </thead>
          <tbody>
            {cats.map((cat) => (
              <FragmentRows
                key={cat.id}
                cat={cat}
                items={childrenOf(cat.id)}
                onEdit={openEdit}
                onDelete={remove}
                onAddChild={() => openCreate(cat.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="adm-card">
          <h2>{editingId ? `แก้ไข: ${form.nameTh}` : form.parentId ? "เพิ่มหัวข้อย่อย" : "เพิ่มหมวดใหม่"}</h2>
          <form className="adm-form" onSubmit={save}>
            <div className="row2">
              <div>
                <label>ชื่อ (ไทย) *</label>
                <input value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} required />
              </div>
              <div>
                <label>ชื่อ (อังกฤษ)</label>
                <input value={form.nameEn ?? ""} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
              </div>
            </div>
            <div className="row3">
              <div>
                <label>slug (ใช้ใน URL, a-z ตัวเลข ขีด) *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required pattern="[a-z0-9-]+" />
              </div>
              <div>
                <label>อยู่ในหมวด</label>
                <select
                  value={form.parentId ?? ""}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">— เป็นหมวดหลัก —</option>
                  {cats.filter((c) => c.id !== editingId).map((c) => (
                    <option key={c.id} value={c.id}>{c.nameTh}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>ลำดับ</label>
                <input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="row2">
              <div>
                <label>สรุปย่อ (ไทย)</label>
                <textarea value={form.summaryTh ?? ""} onChange={(e) => setForm({ ...form, summaryTh: e.target.value })} />
              </div>
              <div>
                <label>สรุปย่อ (อังกฤษ)</label>
                <textarea value={form.summaryEn ?? ""} onChange={(e) => setForm({ ...form, summaryEn: e.target.value })} />
              </div>
            </div>
            <div>
              <label>เนื้อหา (ไทย)</label>
              <RichText
                value={form.bodyTh ?? ""}
                onChange={(html) => setForm({ ...form, bodyTh: html })}
                placeholder="พิมพ์เนื้อหา จัดหัวข้อ ใส่รายการ แทรกรูปจากคลังสื่อได้"
              />
            </div>
            <div>
              <label>เนื้อหา (อังกฤษ)</label>
              <RichText
                value={form.bodyEn ?? ""}
                onChange={(html) => setForm({ ...form, bodyEn: html })}
                placeholder="English content (optional)"
              />
            </div>
            <div>
              <label>รูปประกอบ</label>
              <Upload value={form.coverImage} onDone={(url) => setForm({ ...form, coverImage: url })} />
            </div>
            <label className="check">
              <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              เผยแพร่ (แสดงบนเว็บ)
            </label>

            {/* ไฟล์แนบ — บันทึกทันทีเมื่อกด ไม่ต้องรอ "บันทึก" ของฟอร์ม */}
            <div style={{ display: "grid", gap: 14 }}>
              <AttachmentEditor ownerType="SOLUTION" ownerId={editingId ? String(editingId) : ""} role="POSTER" />
              <AttachmentEditor ownerType="SOLUTION" ownerId={editingId ? String(editingId) : ""} role="GALLERY" />
              <AttachmentEditor ownerType="SOLUTION" ownerId={editingId ? String(editingId) : ""} role="DOWNLOAD" />
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

function FragmentRows({
  cat, items, onEdit, onDelete, onAddChild,
}: {
  cat: AdminSolution;
  items: AdminSolution[];
  onEdit: (r: AdminSolution) => void;
  onDelete: (r: AdminSolution) => void;
  onAddChild: () => void;
}) {
  const row = (r: AdminSolution, indent: boolean) => (
    <tr key={r.id}>
      <td className={indent ? "indent" : ""} style={indent ? {} : { fontWeight: 600 }}>
        {indent ? "└ " : ""}{r.nameTh}
      </td>
      <td><code>/{r.slug}</code></td>
      <td>{r.order}</td>
      <td>
        <span className={`pill ${r.published ? "on" : "off"}`}>
          {r.published ? "เผยแพร่" : "ซ่อน"}
        </span>
      </td>
      <td>
        <div className="adm-actions">
          {!indent && <button className="adm-btn ghost sm" onClick={onAddChild}>+ หัวข้อย่อย</button>}
          <button className="adm-btn ghost sm" onClick={() => onEdit(r)}>แก้ไข</button>
          <button className="adm-btn danger sm" onClick={() => onDelete(r)}>ลบ</button>
        </div>
      </td>
    </tr>
  );
  return (
    <>
      {row(cat, false)}
      {items.map((c) => row(c, true))}
    </>
  );
}
