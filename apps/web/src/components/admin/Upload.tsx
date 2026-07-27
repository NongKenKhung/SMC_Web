"use client";

import { useRef, useState } from "react";
import { adminFetch, mediaUrl } from "@/lib/admin";

/** ปุ่มอัปโหลดรูป — คืนค่า path (/uploads/..) ผ่าน onDone */
export default function Upload({
  value,
  onDone,
}: {
  value?: string | null;
  onDone: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminFetch<{ url: string }>("/admin/media", {
        method: "POST",
        body: fd,
      });
      onDone(res.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const src = mediaUrl(value);
  return (
    <div className="upl">
      {src ? <img src={src} alt="" /> : <span className="ph">ไม่มีรูป</span>}
      <button
        type="button"
        className="adm-btn ghost sm"
        onClick={() => input.current?.click()}
        disabled={busy}
      >
        {busy ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
      </button>
      {value && (
        <button type="button" className="adm-btn danger sm" onClick={() => onDone("")}>
          ลบรูป
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={onPick} />
      {err && <span style={{ color: "#b3261e", fontSize: ".78rem" }}>{err}</span>}
    </div>
  );
}
