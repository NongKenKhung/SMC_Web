"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dict, type Locale } from "@/lib/i18n";

export interface PriceRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
}

type Key = "name" | "category" | "price";
type Dir = "asc" | "desc";

export default function PriceTable({ rows, locale }: { rows: PriceRow[]; locale: Locale }) {
  const t = dict(locale);
  /* เริ่มที่เรียงชื่อ ก→ฮ / A→Z ตามที่ผู้ใช้ขอ กดหัวคอลัมน์เพื่อเรียงตามราคาหรือหมวดได้ */
  const [key, setKey] = useState<Key>("name");
  const [dir, setDir] = useState<Dir>("asc");

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const sorted = useMemo(() => {
    /* เทียบข้อความด้วย localeCompare — เรียงไทยกับอังกฤษปนกันได้ถูกต้อง
       ตัวเลขเทียบตรง ๆ ห้ามใช้ localeCompare ไม่งั้น 90,000 จะมาก่อน 9,950,000 */
    const cmp = (a: PriceRow, b: PriceRow) =>
      key === "price"
        ? a.price - b.price
        : a[key].localeCompare(b[key], locale === "th" ? "th" : "en");
    return [...rows].sort((a, b) => (dir === "asc" ? cmp(a, b) : -cmp(a, b)));
  }, [rows, key, dir, locale]);

  function toggle(next: Key) {
    if (next === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setKey(next);
      /* ราคาเริ่มจากมากไปน้อย ส่วนข้อความเริ่มจาก ก→ฮ / A→Z ตามที่คนคาด */
      setDir(next === "price" ? "desc" : "asc");
    }
  }

  const arrow = (k: Key) => (key === k ? (dir === "asc" ? "▲" : "▼") : "");
  const aria = (k: Key) => (key === k ? (dir === "asc" ? "ascending" : "descending") : "none");

  return (
    <>
      <div className="price-wrap reveal">
        <table className="price-table">
          <thead>
            <tr>
              {([
                ["name", t.pricing.colName, ""],
                ["category", t.pricing.colCategory, ""],
                ["price", t.pricing.colPrice, "price-num"],
              ] as [Key, string, string][]).map(([k, label, cls]) => (
                <th key={k} className={cls} aria-sort={aria(k)}>
                  <button type="button" className="price-sort" onClick={() => toggle(k)}>
                    {label} <span aria-hidden="true">{arrow(k)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/${locale}/solutions/${r.slug}`}>{r.name}</Link>
                </td>
                <td className="price-cat">{r.category}</td>
                <td className="price-num">{money.format(r.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="price-note reveal">{t.pricing.note}</p>
    </>
  );
}
