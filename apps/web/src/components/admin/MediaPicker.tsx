"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch, fileSize, mediaUrl, type AdminMedia } from "@/lib/admin";

/** modal เลือกไฟล์จากคลังสื่อ หรืออัปโหลดใหม่ — ใช้ซ้ำได้ทุกที่ที่ต้องเลือกไฟล์ */
export default function MediaPicker({
  open,
  kind = "ANY",
  onClose,
  onPick,
}: {
  open: boolean;
  kind?: "IMAGE" | "FILE" | "ANY";
  onClose: () => void;
  onPick: (media: AdminMedia) => void;
}) {
  const [items, setItems] = useState<AdminMedia[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (kind !== "ANY") qs.set("kind", kind);
    if (q.trim()) qs.set("q", q.trim());
    try {
      setItems(await adminFetch<AdminMedia[]>(`/admin/media?${qs}`));
    } catch {
      /* adminFetch จัดการ 401 ให้แล้ว */
    }
  }, [kind, q]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  /* ปิดด้วย Esc */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const media = await adminFetch<AdminMedia>("/admin/media", { method: "POST", body: fd });
      onPick(media); // อัปโหลดแล้วเลือกให้เลย
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (!open) return null;

  const accept = kind === "IMAGE" ? "image/*" : kind === "FILE" ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" : undefined;

  return (
    <div className="mp-overlay" onClick={onClose}>
      <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mp-head">
          <b>คลังสื่อ</b>
          <input
            className="mp-search"
            placeholder="ค้นหาชื่อไฟล์..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            /* กัน Enter ไป submit ฟอร์มที่ครอบ modal อยู่ */
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          />
          {/* ต้องระบุ type="button" ทุกปุ่ม — modal นี้ถูกวางในฟอร์ม
              ถ้าไม่ระบุ ปุ่มจะกลายเป็น submit แล้วไปบันทึก/ปิดฟอร์มแทน */}
          <button type="button" className="adm-btn sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "กำลังอัปโหลด..." : "+ อัปโหลดใหม่"}
          </button>
          <button type="button" className="adm-btn ghost sm" onClick={onClose}>ปิด</button>
          <input ref={input} type="file" accept={accept} hidden onChange={upload} />
        </div>

        {err && <p className="adm-msg-err" style={{ margin: "0 0 12px" }}>{err}</p>}

        {items.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>
            ยังไม่มีไฟล์ในคลัง — กด &quot;อัปโหลดใหม่&quot; เพื่อเพิ่มไฟล์แรก
            {kind === "IMAGE" && " (รับเฉพาะรูป: jpg, png, webp, gif)"}
            {kind === "FILE" && " (รับเอกสาร: pdf, doc/docx, xls/xlsx, ppt/pptx, zip)"}
          </p>
        ) : (
          <div className="mp-grid">
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                className="mp-item"
                title={m.filename}
                onClick={() => {
                  onPick(m);
                  onClose();
                }}
              >
                {m.kind === "IMAGE" ? (
                  <img src={mediaUrl(m.url) ?? ""} alt={m.altTh ?? ""} />
                ) : (
                  <span className="mp-file">{m.filename.split(".").pop()?.toUpperCase()}</span>
                )}
                <span className="mp-name">{m.filename}</span>
                <span className="mp-size">{fileSize(m.size)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
