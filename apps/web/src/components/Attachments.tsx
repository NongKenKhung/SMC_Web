"use client";

import { useEffect, useState } from "react";
import { downloadUrl, mediaUrl, type AttachmentItem } from "@/lib/api";
import { dict, type Locale } from "@/lib/i18n";

const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

const pickText = (item: AttachmentItem, base: "caption" | "alt", locale: Locale) =>
  (locale === "en" ? item[`${base}En`] : item[`${base}Th`]) ?? item[`${base}Th`] ?? "";

/** แกลเลอรีรูป + กดดูขนาดเต็ม (lightbox) */
export function Gallery({ items, locale }: { items: AttachmentItem[]; locale: Locale }) {
  const t = dict(locale);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  if (!items.length) return null;

  return (
    <section className="sec soft-sec">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">Gallery</span>
          <h2>{t.media.galleryTitle}</h2>
        </div>
        <div className="gal-grid">
          {items.map((g, i) => (
            <button key={g.id} className="gal-item reveal" onClick={() => setOpen(i)}>
              <img src={mediaUrl(g.url) ?? ""} alt={pickText(g, "alt", locale)} loading="lazy" />
              {pickText(g, "caption", locale) && <span>{pickText(g, "caption", locale)}</span>}
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <div className="gal-light" onClick={() => setOpen(null)}>
          <button className="gal-close" aria-label={t.media.close} onClick={() => setOpen(null)}>&times;</button>
          {items.length > 1 && (
            <button
              className="gal-nav prev"
              aria-label={t.media.prev}
              onClick={(e) => { e.stopPropagation(); setOpen((i) => (i! - 1 + items.length) % items.length); }}
            >‹</button>
          )}
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={mediaUrl(items[open].url) ?? ""} alt={pickText(items[open], "alt", locale)} />
            {pickText(items[open], "caption", locale) && <figcaption>{pickText(items[open], "caption", locale)}</figcaption>}
          </figure>
          {items.length > 1 && (
            <button
              className="gal-nav next"
              aria-label={t.media.next}
              onClick={(e) => { e.stopPropagation(); setOpen((i) => (i! + 1) % items.length); }}
            >›</button>
          )}
        </div>
      )}
    </section>
  );
}

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
  </svg>
);
const DownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

/** รายการไฟล์ให้ดาวน์โหลด */
export function DownloadList({ items, locale }: { items: AttachmentItem[]; locale: Locale }) {
  const t = dict(locale);
  if (!items.length) return null;

  return (
    <section className="sec">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">Documents</span>
          <h2>{t.media.downloadsTitle}</h2>
          <p className="lead">{t.media.downloadsLead}</p>
        </div>
        <ul className="dl-list">
          {items.map((f) => (
            <li key={f.id} className="reveal">
              <a href={downloadUrl(f.mediaId)}>
                <span className="dl-ico"><FileIcon /></span>
                <span className="dl-body">
                  <b>{pickText(f, "caption", locale) || f.filename}</b>
                  <small>{f.filename.split(".").pop()?.toUpperCase()} · {fmtSize(f.size)}</small>
                </span>
                <span className="dl-btn"><DownIcon /> {t.media.download}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** โบรชัว — รูปทั้งหน้าเรียงต่อกัน กดดูขนาดเต็มได้เหมือนแกลเลอรี
 *  ใช้แทนเนื้อหาแบบข้อความ จึงกินความกว้างเต็มและไม่มีหัวข้อกำกับ */
export function Brochure({ items, locale }: { items: AttachmentItem[]; locale: Locale }) {
  const t = dict(locale);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  if (!items.length) return null;

  return (
    <section className="sec broch-sec">
      <div className="container broch-wrap">
        {items.map((b, i) => (
          <figure className="broch-page reveal" key={b.id}>
            <button type="button" onClick={() => setOpen(i)} aria-label={`${i + 1}`}>
              <img src={mediaUrl(b.url) ?? ""} alt={pickText(b, "alt", locale)} loading={i < 2 ? "eager" : "lazy"} />
            </button>
            {pickText(b, "caption", locale) && <figcaption>{pickText(b, "caption", locale)}</figcaption>}
          </figure>
        ))}
      </div>

      {open !== null && (
        <div className="gal-light" onClick={() => setOpen(null)}>
          <button className="gal-close" aria-label={t.media.close} onClick={() => setOpen(null)}>&times;</button>
          <img
            src={mediaUrl(items[open].url) ?? ""}
            alt={pickText(items[open], "alt", locale)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
