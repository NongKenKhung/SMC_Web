/* ไอคอนของหมวดโซลูชัน — เลือกได้ที่ admin (ช่อง icon ของแต่ละหมวด)
   เก็บเป็น "ชื่อคีย์" ไม่ใช่ตัว svg เพื่อให้เปลี่ยนรูปวาดทีหลังได้โดยไม่ต้องแก้ข้อมูล
   ไม่ได้เลือกไว้ = วนใช้ไอคอนตามลำดับการ์ดเหมือนเดิม */
const S = {
  width: 42, height: 42, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

export const SOLUTION_ICONS: Record<string, { label: string; path: React.ReactNode }> = {
  server: {
    label: "เซิร์ฟเวอร์ / ข้อมูล",
    path: <><rect x="7" y="2" width="10" height="20" rx="3" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></>,
  },
  city: {
    label: "เมือง / อาคาร",
    path: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h2M9 14h2M13 10h2M13 14h2M11 21v-4h2v4" /></>,
  },
  media: {
    label: "สื่อ / วิดีโอ",
    path: <><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></>,
  },
  water: {
    label: "น้ำ",
    path: <path d="M12 2.7s6 6.6 6 10.6a6 6 0 0 1-12 0c0-4 6-10.6 6-10.6z" />,
  },
  air: {
    label: "อากาศ / ลม",
    path: <><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h9" /></>,
  },
  device: {
    label: "ครุภัณฑ์ / อุปกรณ์",
    path: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  },
  product: {
    label: "ผลิตภัณฑ์ / กล่อง",
    path: <><path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
  },
  app: {
    label: "แอปพลิเคชัน",
    path: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>,
  },
  sensor: {
    label: "เซนเซอร์ / สัญญาณ",
    path: <><circle cx="12" cy="12" r="2.2" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4" /><path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" /></>,
  },
  chart: {
    label: "แดชบอร์ด / กราฟ",
    path: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  },
};

/** ลำดับไอคอนสำรอง ใช้เมื่อหมวดนั้นยังไม่ได้เลือกไอคอนไว้ */
const FALLBACK = ["server", "city", "media"];

export default function SolutionIcon({ name, index = 0 }: { name?: string | null; index?: number }) {
  const key = name && SOLUTION_ICONS[name] ? name : FALLBACK[index % FALLBACK.length];
  return <svg {...S}>{SOLUTION_ICONS[key].path}</svg>;
}
