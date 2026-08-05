"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch, fileSize, mediaUrl, type AdminAttachment } from "@/lib/admin";

type Role = "GALLERY" | "DOWNLOAD" | "POSTER";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip";

const LABEL: Record<Role, { title: string; hint: string; add: string; accept: string }> = {
  POSTER: {
    title: "รูปหลัก (poster)",
    hint: "ใช้เป็นภาพพื้นหลัง/ภาพเปิดของรายการนี้ — มีได้รูปเดียว ใส่ใหม่จะแทนที่ของเดิม",
    add: "อัปโหลดรูปหลัก",
    accept: IMAGE_ACCEPT,
  },
  GALLERY: {
    title: "แกลเลอรีรูป",
    hint: "ใส่ได้หลายรูป จัดลำดับได้ — แสดงเป็นแกลเลอรีในหน้าเว็บ",
    add: "+ อัปโหลดรูป",
    accept: IMAGE_ACCEPT,
  },
  DOWNLOAD: {
    title: "ไฟล์ดาวน์โหลด",
    hint: "เอกสารให้ผู้เข้าชมดาวน์โหลด (pdf, doc/docx, xls/xlsx, ppt/pptx, zip)",
    add: "+ อัปโหลดไฟล์",
    accept: FILE_ACCEPT,
  },
};

/** จัดการไฟล์แนบของรายการหนึ่ง (solution / post / หน้า) แยกตาม role */
export default function AttachmentEditor({
  ownerType,
  ownerId,
  role,
}: {
  ownerType: "SOLUTION" | "POST" | "PAGE";
  ownerId: string;
  role: Role;
}) {
  const meta = LABEL[role];
  const [items, setItems] = useState<AdminAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const all = await adminFetch<AdminAttachment[]>(
        `/admin/attachments?ownerType=${ownerType}&ownerId=${encodeURIComponent(ownerId)}`,
      );
      setItems(all.filter((a) => a.role === role).sort((a, b) => a.order - b.order));
    } catch {
      /* 401 จัดการแล้ว */
    }
  }, [ownerType, ownerId, role]);

  useEffect(() => {
    if (ownerId) load();
  }, [ownerId, load]);

  /** อัปโหลดแล้วแนบเข้ารายการนี้ในคำขอเดียว — ไฟล์ผูกกับรายการโดยตรง ไม่มีคลังกลาง */
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("ownerType", ownerType);
      fd.append("ownerId", ownerId);
      fd.append("role", role);
      await adminFetch("/admin/attachments/upload", { method: "POST", body: fd });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(id: number) {
    if (!confirm("ลบไฟล์นี้? ไฟล์จะถูกลบออกจากเครื่องด้วย")) return;
    await adminFetch(`/admin/attachments/${id}`, { method: "DELETE" });
    load();
  }

  async function saveCaption(a: AdminAttachment, captionTh: string) {
    await adminFetch(`/admin/attachments/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({ captionTh }),
    });
  }

  /** สลับตำแหน่งกับตัวข้าง ๆ แล้วบันทึกลำดับใหม่ทั้งชุด */
  async function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    await adminFetch("/admin/attachments/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids: next.map((x) => x.id) }),
    });
  }

  /* ยังไม่มี id = ยังไม่ได้บันทึกครั้งแรก ผูกไฟล์เข้ากับอะไรไม่ได้
     บอกให้ชัดว่าต้องทำอะไรต่อ ไม่ใช่ปล่อยกล่องว่างให้งง */
  if (!ownerId) {
    return (
      <div className="att-box att-locked">
        <b>{meta.title}</b>
        <p className="att-hint">
          กด “บันทึก” ด้านล่างก่อน แล้วช่องนี้จะเปิดให้แนบไฟล์ทันที (ฟอร์มจะไม่ปิด)
        </p>
      </div>
    );
  }

  return (
    <div className="att-box">
      <div className="att-head">
        <b>{meta.title}</b>
        <button
          type="button"
          className="adm-btn ghost sm"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {busy ? "กำลังอัปโหลด…" : meta.add}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={meta.accept}
          hidden
          onChange={upload}
        />
      </div>
      <p className="sub" style={{ margin: "0 0 10px" }}>{meta.hint}</p>
      {err && <p className="adm-msg-err" style={{ margin: "0 0 10px" }}>{err}</p>}

      {items.length === 0 ? (
        <p className="sub" style={{ margin: 0, opacity: 0.7 }}>ยังไม่มี</p>
      ) : (
        <ul className="att-list">
          {items.map((a, i) => (
            <li key={a.id}>
              {a.media.kind === "IMAGE" ? (
                <img src={mediaUrl(a.media.url) ?? ""} alt="" />
              ) : (
                <span className="att-ext">{a.media.filename.split(".").pop()?.toUpperCase()}</span>
              )}
              <div className="att-info">
                <span className="att-name">{a.media.filename}</span>
                <span className="sub">{fileSize(a.media.size)}</span>
                <input
                  className="att-caption"
                  placeholder="คำบรรยาย (ไม่บังคับ)"
                  defaultValue={a.captionTh ?? ""}
                  onBlur={(e) => saveCaption(a, e.target.value)}
                />
              </div>
              <div className="att-actions">
                {role !== "POSTER" && (
                  <>
                    <button type="button" className="adm-btn ghost sm" disabled={i === 0} onClick={() => move(i, -1)} title="เลื่อนขึ้น">↑</button>
                    <button type="button" className="adm-btn ghost sm" disabled={i === items.length - 1} onClick={() => move(i, 1)} title="เลื่อนลง">↓</button>
                  </>
                )}
                <button type="button" className="adm-btn danger sm" onClick={() => remove(a.id)}>ลบ</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
