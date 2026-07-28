"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminFetch, type AdminPost, type AdminSolution,
} from "@/lib/admin";
import {
  DEFAULT_STYLE, downloadBlob, drawQr, qrFileName, qrSvg, type QrStyle,
} from "@/lib/qr";

/* หน้าอื่น ๆ ที่ไม่ได้มาจากฐานข้อมูล */
const STATIC_PAGES = [
  { path: "", label: "หน้าแรก" },
  { path: "/solutions", label: "โซลูชันทั้งหมด" },
  { path: "/partners", label: "พาร์ทเนอร์" },
  { path: "/blog", label: "กิจกรรม & ข่าว" },
  { path: "/about", label: "เกี่ยวกับศูนย์" },
  { path: "/contact", label: "ติดต่อเรา" },
];

/* จำค่า base URL ไว้ เพราะเครื่อง admin มักเป็น localhost
   แต่ QR ต้องชี้ไปโดเมนจริงถึงจะสแกนจากมือถือได้ */
const BASE_KEY = "sml_qr_base";

type Target = { path: string; label: string };

export default function AdminQr() {
  const [sols, setSols] = useState<AdminSolution[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [base, setBase] = useState("");
  const [locale, setLocale] = useState<"th" | "en">("th");
  const [path, setPath] = useState("");
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [sheet, setSheet] = useState<{ label: string; img: string }[] | null>(null);
  const [busy, setBusy] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  /* โหลดโลโก้ไว้ล่วงหน้า เพื่อวาดทับกลาง QR ได้ทันที */
  useEffect(() => {
    const img = new Image();
    img.src = "/logo.png";
    logoRef.current = img;
  }, []);

  useEffect(() => {
    setBase(localStorage.getItem(BASE_KEY) || window.location.origin);
    adminFetch<AdminSolution[]>("/admin/solutions").then(setSols).catch(() => {});
    adminFetch<AdminPost[]>("/admin/posts").then(setPosts).catch(() => {});
  }, []);

  const saveBase = (v: string) => {
    setBase(v);
    localStorage.setItem(BASE_KEY, v.replace(/\/+$/, ""));
  };

  /* รายการปลายทางทั้งหมด แยกกลุ่มให้เลือกง่าย */
  const groups = useMemo(() => {
    const byParent = (id: number | null) =>
      sols.filter((s) => s.parentId === id).sort((a, b) => a.order - b.order);
    const solItems: Target[] = [];
    for (const top of byParent(null)) {
      solItems.push({ path: `/solutions/${top.slug}`, label: top.nameTh });
      for (const child of byParent(top.id)) {
        solItems.push({ path: `/solutions/${child.slug}`, label: `— ${child.nameTh}` });
      }
    }
    return {
      หน้าเว็บ: STATIC_PAGES,
      "โซลูชัน & ผลงาน": solItems,
      "กิจกรรม & ข่าว": posts
        .filter((p) => p.published)
        .map((p) => ({ path: `/blog/${p.slug}`, label: p.titleTh })),
    } as Record<string, Target[]>;
  }, [sols, posts]);

  const url = useCustom
    ? custom.trim()
    : `${base.replace(/\/+$/, "")}/${locale}${path}`;

  const currentLabel = useMemo(() => {
    for (const items of Object.values(groups)) {
      const hit = items.find((i) => i.path === path);
      if (hit) return hit.label.replace(/^— /, "");
    }
    return "";
  }, [groups, path]);

  /* วาดตัวอย่างใหม่ทุกครั้งที่ปลายทางหรือรูปแบบเปลี่ยน */
  const redraw = useCallback(async () => {
    const host = previewRef.current;
    if (!host) return;
    if (!url || !/^https?:\/\/.+/.test(url)) {
      host.innerHTML = "";
      return;
    }
    try {
      const canvas = await drawQr(url, { ...style, size: 520 }, logoRef.current);
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      host.replaceChildren(canvas);
      setMsg((m) => (m.err ? {} : m));
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "สร้าง QR ไม่สำเร็จ" });
    }
  }, [url, style]);

  useEffect(() => {
    void redraw();
  }, [redraw]);

  async function downloadPng() {
    try {
      const canvas = await drawQr(url, style, logoRef.current);
      canvas.toBlob((b) => {
        if (b) downloadBlob(b, qrFileName(url, "png"));
      }, "image/png");
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ" });
    }
  }

  async function downloadSvg() {
    try {
      const svg = await qrSvg(url, style);
      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), qrFileName(url, "svg"));
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ" });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMsg({ ok: "คัดลอกลิงก์แล้ว" });
    } catch {
      setMsg({ err: "คัดลอกไม่สำเร็จ — ก๊อปจากช่องลิงก์ด้านบนได้เลย" });
    }
  }

  /* สร้างแผ่นป้าย QR ของทุกโซลูชัน เอาไว้พิมพ์ไปติดบูธ */
  async function buildSheet() {
    setBusy(true);
    setMsg({});
    try {
      const items = groups["โซลูชัน & ผลงาน"];
      if (!items.length) {
        setMsg({ err: "ยังไม่มีโซลูชันในระบบ" });
        return;
      }
      const out: { label: string; img: string }[] = [];
      for (const it of items) {
        const label = it.label.replace(/^— /, "");
        const canvas = await drawQr(
          `${base.replace(/\/+$/, "")}/${locale}${it.path}`,
          { ...style, size: 600, caption: "" },
          logoRef.current,
        );
        out.push({ label, img: canvas.toDataURL("image/png") });
      }
      setSheet(out);
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "สร้างแผ่นป้ายไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  const set = <K extends keyof QrStyle>(k: K, v: QrStyle[K]) =>
    setStyle((s) => ({ ...s, [k]: v }));

  const badBase = !/^https?:\/\/.+/.test(base);
  const isLocal = /localhost|127\.0\.0\.1/.test(base);

  return (
    <>
      <h1>QR Code</h1>
      <p className="sub">
        สร้าง QR ให้ผู้เข้าชมสแกนเข้าดูโครงการหรือผลงานในเว็บได้ทันที — ดาวน์โหลดไปใช้กับป้าย
        โปสเตอร์ หรือเอกสารได้เลย
      </p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="qr-layout">
        {/* ---------- ฝั่งตั้งค่า ---------- */}
        <div className="adm-card">
          <h2>เลือกปลายทาง</h2>
          <div className="adm-form">
            <div>
              <label>ที่อยู่เว็บไซต์ (โดเมนจริงที่ผู้ใช้เข้าถึงได้)</label>
              <input
                value={base}
                onChange={(e) => saveBase(e.target.value)}
                placeholder="https://smc.kmitl.ac.th"
              />
              {badBase && <p className="qr-warn">ต้องขึ้นต้นด้วย http:// หรือ https://</p>}
              {!badBase && isLocal && (
                <p className="qr-warn">
                  ตอนนี้ชี้ไปเครื่องตัวเอง (localhost) — สแกนจากมือถือจะเปิดไม่ได้
                  ก่อนพิมพ์จริงให้ใส่โดเมนจริงก่อน
                </p>
              )}
            </div>

            <div className="row2">
              <div>
                <label>ภาษา</label>
                <select value={locale} onChange={(e) => setLocale(e.target.value as "th" | "en")}>
                  <option value="th">ไทย (/th)</option>
                  <option value="en">อังกฤษ (/en)</option>
                </select>
              </div>
              <div>
                <label>หน้าปลายทาง</label>
                <select
                  value={useCustom ? "__custom" : path}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__custom") setUseCustom(true);
                    else {
                      setUseCustom(false);
                      setPath(v);
                    }
                  }}
                >
                  {Object.entries(groups).map(([label, items]) => (
                    <optgroup key={label} label={label}>
                      {items.map((i) => (
                        <option key={i.path} value={i.path}>{i.label}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__custom">— ใส่ลิงก์เอง —</option>
                </select>
              </div>
            </div>

            {useCustom && (
              <div>
                <label>ลิงก์ที่ต้องการ</label>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            <div>
              <label>ลิงก์ที่ QR จะพาไป</label>
              <input value={url} readOnly className="qr-url" />
            </div>
          </div>

          <h2 style={{ marginTop: 26 }}>รูปแบบ</h2>
          <div className="adm-form">
            <div>
              <label>ข้อความใต้ QR (เว้นว่างได้)</label>
              <input
                value={style.caption}
                onChange={(e) => set("caption", e.target.value)}
                placeholder={currentLabel || "เช่น สแกนดูรายละเอียดโครงการ"}
              />
              {currentLabel && !style.caption && (
                <button
                  type="button"
                  className="adm-btn ghost sm"
                  style={{ marginTop: 8 }}
                  onClick={() => set("caption", currentLabel)}
                >
                  ใช้ชื่อหน้า “{currentLabel}”
                </button>
              )}
            </div>
            <div className="row3">
              <div>
                <label>สีจุด</label>
                <input type="color" value={style.dark} onChange={(e) => set("dark", e.target.value)} />
              </div>
              <div>
                <label>สีพื้น</label>
                <input type="color" value={style.light} onChange={(e) => set("light", e.target.value)} />
              </div>
              <div>
                <label>ขนาดไฟล์ PNG</label>
                <select value={style.size} onChange={(e) => set("size", Number(e.target.value))}>
                  <option value={512}>512 px (เว็บ)</option>
                  <option value={1024}>1024 px (ทั่วไป)</option>
                  <option value={2048}>2048 px (งานพิมพ์)</option>
                </select>
              </div>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={style.logo}
                onChange={(e) => set("logo", e.target.checked)}
              />
              ใส่โลโก้ศูนย์ตรงกลาง
            </label>
            <p className="qr-note">
              ใส่โลโก้แล้วยังสแกนติด เพราะตั้งระดับกู้คืนข้อมูลไว้สูงสุด (กู้ได้ถึง 30%)
              — แต่ควรลองสแกนดูก่อนสั่งพิมพ์จำนวนมากทุกครั้ง
            </p>
          </div>
        </div>

        {/* ---------- ฝั่งตัวอย่าง ---------- */}
        <div className="adm-card">
          <h2>ตัวอย่าง</h2>
          <div className="qr-preview" ref={previewRef} />
          <div className="adm-actions" style={{ marginTop: 16 }}>
            <button className="adm-btn" onClick={downloadPng} disabled={badBase && !useCustom}>
              ดาวน์โหลด PNG
            </button>
            <button className="adm-btn ghost" onClick={downloadSvg} disabled={badBase && !useCustom}>
              ดาวน์โหลด SVG
            </button>
            <button className="adm-btn ghost" onClick={copyLink}>คัดลอกลิงก์</button>
          </div>
          <p className="qr-note" style={{ marginTop: 12 }}>
            SVG เหมาะกับงานพิมพ์ที่สุด ขยายเท่าไหร่ก็ไม่แตก (เป็นเวกเตอร์ล้วน
            จึงไม่มีโลโก้กับข้อความใต้ QR)
          </p>
        </div>
      </div>

      {/* ---------- แผ่นป้ายรวม ---------- */}
      <div className="adm-card" style={{ marginTop: 18 }}>
        <h2>แผ่นป้าย QR ทุกโซลูชัน</h2>
        <p className="qr-note" style={{ marginBottom: 14 }}>
          สร้าง QR ของทุกโซลูชันพร้อมกัน แล้วสั่งพิมพ์เป็นแผ่นเดียว เอาไปตัดติดหน้าบูธหรือชิ้นงานได้
        </p>
        <div className="adm-actions">
          <button className="adm-btn" onClick={buildSheet} disabled={busy || badBase}>
            {busy ? "กำลังสร้าง…" : "สร้างแผ่นป้าย"}
          </button>
          {sheet && (
            <>
              <button className="adm-btn ghost" onClick={() => window.print()}>สั่งพิมพ์</button>
              <button className="adm-btn ghost" onClick={() => setSheet(null)}>ล้าง</button>
            </>
          )}
        </div>
        {sheet && (
          <div className="qr-sheet">
            {sheet.map((s) => (
              <figure key={s.label}>
                <img src={s.img} alt={`QR ${s.label}`} />
                <figcaption>{s.label}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
