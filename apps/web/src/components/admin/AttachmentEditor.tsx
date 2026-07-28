"use client";

import { useCallback, useEffect, useState } from "react";
import MediaPicker from "@/components/admin/MediaPicker";
import { adminFetch, fileSize, mediaUrl, type AdminAttachment } from "@/lib/admin";

type Role = "GALLERY" | "DOWNLOAD" | "POSTER";

const LABEL: Record<Role, { title: string; hint: string; add: string; kind: "IMAGE" | "FILE" }> = {
  POSTER: {
    title: "รูปหลัก (poster)",
    hint: "ใช้เป็นภาพพื้นหลัง/ภาพเปิดของรายการนี้ — มีได้รูปเดียว ใส่ใหม่จะแทนที่ของเดิม",
    add: "เลือกรูปหลัก",
    kind: "IMAGE",
  },
  GALLERY: {
    title: "แกลเลอรีรูป",
    hint: "ใส่ได้หลายรูป จัดลำดับได้ — แสดงเป็นแกลเลอรีในหน้าเว็บ",
    add: "+ เพิ่มรูป",
    kind: "IMAGE",
  },
  DOWNLOAD: {
    title: "ไฟล์ดาวน์โหลด",
    hint: "เอกสารให้ผู้เข้าชมดาวน์โหลด (pdf, doc/docx, xls/xlsx, ppt/pptx, zip)",
    add: "+ แนบไฟล์",
    kind: "FILE",
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
  const [picking, setPicking] = useState(false);
  const [err, setErr] = useState("");

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

  async function add(mediaId: number) {
    setErr("");
    try {
      await adminFetch("/admin/attachments", {
        method: "POST",
        body: JSON.stringify({ mediaId, ownerType, ownerId, role }),
      });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เพิ่มไฟล์ไม่สำเร็จ");
    }
  }

  async function remove(id: number) {
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

  if (!ownerId) {
    return (
      <div className="att-box">
        <b>{meta.title}</b>
        <p className="sub" style={{ margin: "4px 0 0" }}>บันทึกรายการนี้ก่อน แล้วจึงแนบไฟล์ได้</p>
      </div>
    );
  }

  return (
    <div className="att-box">
      <div className="att-head">
        <b>{meta.title}</b>
        <button type="button" className="adm-btn ghost sm" onClick={() => setPicking(true)}>
          {meta.add}
        </button>
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

      <MediaPicker
        open={picking}
        kind={meta.kind}
        onClose={() => setPicking(false)}
        onPick={(m) => add(m.id)}
      />
    </div>
  );
}
