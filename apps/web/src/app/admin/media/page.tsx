"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch, fileSize, mediaUrl, type AdminMedia } from "@/lib/admin";

const KINDS = [
  { v: "", label: "ทั้งหมด" },
  { v: "IMAGE", label: "รูปภาพ" },
  { v: "FILE", label: "เอกสาร" },
];

export default function AdminMediaLibrary() {
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (kind) qs.set("kind", kind);
    if (q.trim()) qs.set("q", q.trim());
    try {
      setItems(await adminFetch<AdminMedia[]>(`/admin/media?${qs}`));
    } catch {
      /* 401 จัดการแล้ว */
    }
  }, [kind, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setMsg({});
    setBusy(true);
    let done = 0;
    const errors: string[] = [];
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        await adminFetch<AdminMedia>("/admin/media", { method: "POST", body: fd });
        done++;
      } catch (e) {
        errors.push(`${file.name}: ${e instanceof Error ? e.message : "ผิดพลาด"}`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    setMsg(errors.length ? { err: errors.join(" · "), ok: done ? `อัปโหลดสำเร็จ ${done} ไฟล์` : undefined } : { ok: `อัปโหลดสำเร็จ ${done} ไฟล์` });
    load();
  }

  async function remove(m: AdminMedia) {
    if (!confirm(`ลบ "${m.filename}"?\nถ้าไฟล์นี้ถูกใช้อยู่ในหน้าใด จะถูกถอดออกจากหน้านั้นด้วย`)) return;
    await adminFetch(`/admin/media/${m.id}`, { method: "DELETE" });
    load();
  }

  async function saveAlt(m: AdminMedia, altTh: string) {
    await adminFetch(`/admin/media/${m.id}`, { method: "PATCH", body: JSON.stringify({ altTh }) });
  }

  return (
    <>
      <h1>คลังสื่อ</h1>
      <p className="sub">ไฟล์ทั้งหมดที่อัปโหลดไว้ — เลือกใช้ซ้ำได้ทุกหน้า (รูป 5 MB / เอกสาร 20 MB ต่อไฟล์)</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card">
        <div className="mp-head" style={{ marginBottom: 16 }}>
          <b style={{ marginRight: "auto" }}>{items.length} ไฟล์</b>
          <select className="mp-search" value={kind} onChange={(e) => setKind(e.target.value)} style={{ minWidth: 130 }}>
            {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
          </select>
          <input className="mp-search" placeholder="ค้นหาชื่อไฟล์..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="adm-btn" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "กำลังอัปโหลด..." : "+ อัปโหลดไฟล์"}
          </button>
          <input ref={input} type="file" multiple hidden onChange={upload} />
        </div>

        {items.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>ยังไม่มีไฟล์ — กด &quot;อัปโหลดไฟล์&quot; เพื่อเริ่ม (เลือกหลายไฟล์พร้อมกันได้)</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>ไฟล์</th><th>ชื่อ</th><th>คำอธิบายรูป (alt)</th><th>ขนาด</th><th>วันที่</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.kind === "IMAGE" ? (
                      <img src={mediaUrl(m.url) ?? ""} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <span className="pill off">{m.filename.split(".").pop()?.toUpperCase()}</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 240, wordBreak: "break-word" }}>{m.filename}</td>
                  <td>
                    {m.kind === "IMAGE" ? (
                      <input
                        className="att-caption"
                        placeholder="อธิบายรูปสั้น ๆ (ช่วย SEO + ผู้พิการทางสายตา)"
                        defaultValue={m.altTh ?? ""}
                        onBlur={(e) => saveAlt(m, e.target.value)}
                      />
                    ) : (
                      <span className="sub">—</span>
                    )}
                  </td>
                  <td>{fileSize(m.size)}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</td>
                  <td>
                    <div className="adm-actions">
                      <a className="adm-btn ghost sm" href={mediaUrl(m.url) ?? "#"} target="_blank" rel="noreferrer">เปิด</a>
                      <button className="adm-btn danger sm" onClick={() => remove(m)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
