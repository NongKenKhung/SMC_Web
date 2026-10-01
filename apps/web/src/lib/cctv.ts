/* กล้องวงจรปิดของจริง — เขตเทศบาลเมืองฉะเชิงเทรา 40 จุด
 *
 * ที่มา: CHACHOENGSAO SMART CITY — ศูนย์ข้อมูลการจราจรอัจฉริยะ
 *        https://sites.google.com/view/ccs-cctv
 * สตรีมเป็น HLS อยู่บนเซิร์ฟเวอร์ของมูลนิธิ ITIC และเปิด Access-Control-Allow-Origin: *
 * จึงเล่นจากโดเมนของเราได้โดยตรง ไม่ต้องทำพร็อกซี
 *
 * ชื่อและรหัสกล้องคัดมาจากหน้า "รวมทุกจุด" ของเว็บต้นทาง (ตรวจแล้วครบ 40 จุด)
 * พิกัดมาจากฟีดกล้องของ ITIC ที่แผนที่ live.iticfoundation.org ใช้ (camera.longdo.com/feed)
 * เทียบรหัส ccsNN แล้วตรงครบ 40 ตัว และชื่อในฟีดตรงกับชื่อของเราทุกตัว
 * ถ้าต้นทางเพิ่ม/ย้ายกล้อง ต้องมาปรับรายการนี้ด้วยมือ เพราะเขาไม่มี API ให้ดึง
 */

export interface CctvCamera {
  /** รหัสสตรีมของต้นทาง เช่น ccs03 */
  id: string;
  /** ชื่อมุมกล้อง */
  nameTh: string;
  /** ทิศทาง/รายละเอียดเพิ่ม (ถ้ามี) */
  noteTh?: string;
  /** พิกัดจากฟีดกล้องของ ITIC (camera.longdo.com/feed) — ไม่มีในเว็บ Google Sites */
  lat: number;
  lng: number;
}

export interface CctvGroup {
  key: string;
  titleTh: string;
  cameras: CctvCamera[];
}

export const CCTV_BASE = "https://camerai1.iticfoundation.org/hls";
export const streamUrl = (id: string) => `${CCTV_BASE}/${id}.m3u8`;

/** เครดิตตามที่เว็บต้นทางระบุไว้เอง — ต้องแสดงให้ครบทุกหน่วยงาน ไม่เลือกแสดงเฉพาะบางราย */
export const CCTV_SOURCE = {
  siteTh: "ศูนย์ข้อมูลการจราจรอัจฉริยะ จังหวัดฉะเชิงเทรา",
  siteEn: "Chachoengsao Smart City — Intelligent Traffic Information Center",
  url: "https://sites.google.com/view/ccs-cctv",
  areaTh: "เขตเทศบาลเมืองฉะเชิงเทรา",
  areaEn: "Chachoengsao Municipality",
  partnersTh: [
    "สำนักงานเมืองอัจฉริยะจังหวัดฉะเชิงเทรา",
    "เทศบาลเมืองฉะเชิงเทรา",
    "กองบังคับการตำรวจภูธรจังหวัดฉะเชิงเทรา",
    "บริษัท โตโยต้า มอเตอร์ (ประเทศไทย) จำกัด",
    "มูลนิธิศูนย์ข้อมูลจราจรอัจฉริยะไทย (ITIC)",
  ],
  partnersEn: [
    "Chachoengsao Smart City Office",
    "Chachoengsao Municipality",
    "Chachoengsao Provincial Police",
    "Toyota Motor Thailand Co., Ltd.",
    "Intelligent Traffic Information Center Foundation (ITIC)",
  ],
} as const;

export const CCTV_GROUPS: CctvGroup[] = [
  {
    key: "thep-siri", titleTh: "สามแยกเทพคุณากร – สิริโสธร",
    cameras: [
      { id: "ccs03", nameTh: "สามแยกเทพคุณากร–สิริโสธร", noteTh: "มุ่งหน้าชลบุรี", lat: 13.666082, lng: 101.049833 },
      { id: "ccs05", nameTh: "สามแยกเทพคุณากร–สิริโสธร", noteTh: "มุ่งหน้าเมืองฉะเชิงเทรา", lat: 13.666521, lng: 101.049914 },
      { id: "ccs06", nameTh: "สามแยกเทพคุณากร–สิริโสธร", noteTh: "ถ.เทพคุณากร", lat: 13.666241, lng: 101.05013 },
    ],
  },
  {
    key: "thep-bangphra", titleTh: "สามแยกเทพคุณากร – วัดบางพระ",
    cameras: [
      { id: "ccs01", nameTh: "สามแยกเทพคุณากร–วัดบางพระ", noteTh: "มุ่งหน้าถนนสิริโสธร", lat: 13.668798, lng: 101.054985 },
      { id: "ccs00", nameTh: "สามแยกเทพคุณากร–วัดบางพระ", noteTh: "มุ่งหน้าวัดโสธรฯ", lat: 13.668868, lng: 101.055112 },
      { id: "ccs02", nameTh: "สามแยกเทพคุณากร–วัดบางพระ", noteTh: "มุ่งหน้าวัดบางพระ", lat: 13.668772, lng: 101.055088 },
    ],
  },
  {
    key: "wat-sothon", titleTh: "วัดโสธรวรารามวรวิหาร – ถ.เทพคุณากร",
    cameras: [
      { id: "ccs22", nameTh: "โค้งหน้าวัดโสธรวรารามฯ", lat: 13.674739, lng: 101.0683 },
      { id: "ccs23", nameTh: "หน้าวัดโสธรวรารามฯ", lat: 13.674679, lng: 101.068113 },
      { id: "ccs24", nameTh: "หน้า รร.วัดโสธรวรารามฯ", lat: 13.674152, lng: 101.065047 },
      { id: "ccs25", nameTh: "ซ.เทพคุณากร 5", lat: 13.671455, lng: 101.060082 },
    ],
  },
  {
    key: "wongwian", titleTh: "วงเวียนอนุสาวรีย์พระยาศรีสุนทรโวหาร",
    cameras: [
      { id: "ccs09", nameTh: "วงเวียนหน้าอนุสาวรีย์ฯ", noteTh: "มุ่งหน้า ถ.ศรีโสธร", lat: 13.675771, lng: 101.069525 },
      { id: "ccs08", nameTh: "วงเวียนหน้าอนุสาวรีย์ฯ", lat: 13.675823, lng: 101.069337 },
      { id: "ccs07", nameTh: "วงเวียนหน้าอนุสาวรีย์ฯ", noteTh: "มุ่งหน้า ถ.เทพคุณากร", lat: 13.67577, lng: 101.069223 },
      { id: "ccs12", nameTh: "วงเวียนหน้าอนุสาวรีย์ฯ", noteTh: "มุ่งหน้า ถ.ศรีโสธรตัดใหม่", lat: 13.675971, lng: 101.069332 },
    ],
  },
  {
    key: "sisothon-mai", titleTh: "ทางแยก–ทางร่วม ถ.ศรีโสธรตัดใหม่",
    cameras: [
      { id: "ccs13", nameTh: "หน้าบิ๊กซี 2", noteTh: "มุ่งหน้าวงเวียน", lat: 13.682048, lng: 101.06698 },
      { id: "ccs14", nameTh: "หน้าบิ๊กซี 2", noteTh: "มุ่งหน้า ถ.มหาจักรพรรดิ์", lat: 13.682385, lng: 101.066834 },
      { id: "ccs28", nameTh: "ถ.ประชาสรรค์", lat: 13.680634, lng: 101.067516 },
      { id: "ccs29", nameTh: "ศรีโสธรตัดใหม่ 15", lat: 13.681103, lng: 101.067445 },
      { id: "ccs26", nameTh: "ศรีโสธรตัดใหม่ 18", noteTh: "มุมที่ 1", lat: 13.677821, lng: 101.068766 },
      { id: "ccs27", nameTh: "ศรีโสธรตัดใหม่ 18", noteTh: "มุมที่ 2", lat: 13.677849, lng: 101.06855 },
    ],
  },
  {
    key: "phraya-si", titleTh: "สามแยก ถ.พระยาศรีสุนทร – ถ.ศรีโสธรตัดใหม่",
    cameras: [
      { id: "ccs15", nameTh: "สามแยก ถ.พระยาศรีสุนทร", noteTh: "มุ่งหน้า ถ.มหาจักรพรรดิ์", lat: 13.682974, lng: 101.066568 },
      { id: "ccs16", nameTh: "สามแยก ถ.พระยาศรีสุนทร", noteTh: "มุ่งหน้าวงเวียนฯ", lat: 13.682826, lng: 101.066627 },
    ],
  },
  {
    key: "na-mueang", titleTh: "สามแยกหน้าเมือง – ศาลากลางจังหวัด",
    cameras: [
      { id: "ccs30", nameTh: "สามแยก ถ.หน้าเมือง", lat: 13.684452, lng: 101.066003 },
      { id: "ccs42", nameTh: "ศาลากลางจังหวัดฉะเชิงเทรา", lat: 13.687447, lng: 101.069754 },
    ],
  },
  {
    key: "em-on", titleTh: "ถ.ศรีโสธรตัดใหม่ – ถ.เอมอรอุทิศ",
    cameras: [
      { id: "ccs19", nameTh: "ถ.เอมอรอุทิศ 1", noteTh: "จุดที่ 1", lat: 13.68863, lng: 101.064225 },
      { id: "ccs31", nameTh: "ถ.เอมอรอุทิศ 1", noteTh: "จุดที่ 2", lat: 13.688769, lng: 101.064194 },
      { id: "ccs17", nameTh: "ถ.เอมอรอุทิศ 2", noteTh: "มุ่งหน้า ถ.มหาจักรพรรดิ์", lat: 13.68781, lng: 101.06456 },
      { id: "ccs18", nameTh: "ถ.เอมอรอุทิศ 2", noteTh: "มุ่งหน้าวงเวียน", lat: 13.687533, lng: 101.064666 },
      { id: "ccs34", nameTh: "ศรีโสธรตัดใหม่ 4/1", noteTh: "มุมที่ 1", lat: 13.691199, lng: 101.063778 },
      { id: "ccs35", nameTh: "ศรีโสธรตัดใหม่ 4/1", noteTh: "มุมที่ 2", lat: 13.69115, lng: 101.063695 },
      { id: "ccs32", nameTh: "ศรีโสธรตัดใหม่ 5", noteTh: "มุมที่ 1", lat: 13.690287, lng: 101.063849 },
      { id: "ccs33", nameTh: "ศรีโสธรตัดใหม่ 5", noteTh: "มุมที่ 2", lat: 13.690047, lng: 101.063881 },
    ],
  },
  {
    key: "mahachak", titleTh: "สามแยกศรีโสธรตัดใหม่ – มหาจักรพรรดิ์",
    cameras: [
      { id: "ccs20", nameTh: "สามแยกศรีโสธรตัดใหม่–มหาจักรพรรดิ์", noteTh: "มุ่งหน้ากรุงเทพฯ", lat: 13.694272, lng: 101.063341 },
      { id: "ccs21", nameTh: "สามแยกศรีโสธรตัดใหม่–มหาจักรพรรดิ์", noteTh: "มุ่งหน้าเข้าเมือง", lat: 13.694234, lng: 101.063591 },
      { id: "ccs36", nameTh: "สามแยกศรีโสธรตัดใหม่–มหาจักรพรรดิ์", noteTh: "มุมที่ 1", lat: 13.694297, lng: 101.063514 },
      { id: "ccs37", nameTh: "สามแยกศรีโสธรตัดใหม่–มหาจักรพรรดิ์", noteTh: "มุมที่ 2", lat: 13.694346, lng: 101.063315 },
    ],
  },
  {
    key: "thetsaban", titleTh: "เทศบาลเมืองฯ – มหาจักรพรรดิ์",
    cameras: [
      { id: "ccs38", nameTh: "สามแยกเทศบาล–ถ.มหาจักรพรรดิ์", noteTh: "มุมที่ 1", lat: 13.692547, lng: 101.070987 },
      { id: "ccs39", nameTh: "สามแยกเทศบาล–ถ.มหาจักรพรรดิ์", noteTh: "มุมที่ 2", lat: 13.692571, lng: 101.070902 },
      { id: "ccs40", nameTh: "หน้า รร.เทพประสิทธิ์วิทยา", noteTh: "มุมที่ 1", lat: 13.691591, lng: 101.070533 },
      { id: "ccs41", nameTh: "หน้า รร.เทพประสิทธิ์วิทยา", noteTh: "มุมที่ 2", lat: 13.691665, lng: 101.070586 },
    ],
  },
];

export const ALL_CAMERAS = CCTV_GROUPS.flatMap((g) =>
  g.cameras.map((c) => ({ ...c, groupKey: g.key, groupTitleTh: g.titleTh })),
);

/* ---------- ตรวจว่ากล้องไหนยังส่งภาพอยู่ ----------
 * กล้องล่มเป็นเรื่องปกติของงานนี้ แต่ผลตรวจเป็นได้ 3 แบบ ไม่ใช่ 2:
 *   true  = ต้นทางตอบ 200 ใช้ได้แน่
 *   false = ต้นทางตอบไม่ใช่ 200 (เช่น 404) คือกล้องนั้นหยุดส่งจริง
 *   null  = ตรวจไม่ได้ เช่น หมดเวลา เน็ตเราสะดุด หรือยิงพร้อมกันเยอะจนบางอันไม่ทัน
 *
 * **ต้องแยก null ออกจาก false** ครั้งก่อนผมรวบให้หมดเวลา = กล้องเสีย แล้วล็อกไม่ให้กด
 * ผลคือกล้องที่ดูได้บนเว็บต้นทางกลับกดไม่ได้บนเว็บเรา ซึ่งแย่กว่าปล่อยให้กดแล้วค่อยแจ้งว่าต่อไม่ติด
 * หลักคือ: ไม่มั่นใจ ให้ผู้ใช้ได้ลอง อย่าตัดสินใจแทน
 */
export type CamHealth = boolean | null;

const TTL_MS = 60_000;
let cache: { at: number; map: Record<string, CamHealth> } | null = null;
let inflight: Promise<Record<string, CamHealth>> | null = null;

async function probe(id: string): Promise<[string, CamHealth]> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(streamUrl(id), { method: "GET", cache: "no-store", signal: ctl.signal });
    clearTimeout(timer);
    return [id, res.ok ? true : false];
  } catch {
    return [id, null]; // ไม่รู้ ไม่ใช่เสีย
  }
}

export async function getCameraStatus(): Promise<Record<string, CamHealth>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const pairs = await Promise.all(ALL_CAMERAS.map((c) => probe(c.id)));
      const map = Object.fromEntries(pairs) as Record<string, CamHealth>;
      cache = { at: Date.now(), map };
      return map;
    } catch {
      /* ตรวจทั้งชุดไม่สำเร็จ = ไม่รู้สถานะอะไรเลย ให้ทุกตัวกดได้ไว้ก่อน
         ห้ามทำให้หน้าพังหรือกล้องหายไปทั้งกระดาน เพราะแค่เช็คสถานะไม่ผ่าน */
      return {} as Record<string, CamHealth>;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/* ---------- รวมกล้องที่อยู่จุดเดียวกันเป็นหมุดเดียว ----------
 * แยกเดียวมักมี 2–3 มุมกล้อง พิกัดห่างกันไม่กี่เมตร ถ้าปักหมุดแยก หมุดจะซ้อนทับจนกดตัวล่างไม่ได้
 * จึงรวมกล้องที่ห่างกันไม่เกิน 20 เมตรเป็นหมุดเดียว แล้วให้เลือกมุมกล้องจากในหมุด
 * (40 กล้อง → 29 หมุด ตอนเขียน)
 */
export interface MapPoint<C extends { id: string; lat: number; lng: number } = CctvCamera> {
  key: string;
  lat: number;
  lng: number;
  cams: C[];
}

const metersBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6_371_000, rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export function groupByPosition<C extends { id: string; lat: number; lng: number }>(cams: C[], meters = 20): MapPoint<C>[] {
  const points: MapPoint<C>[] = [];
  for (const c of cams) {
    const hit = points.find((p) => metersBetween(p, c) <= meters);
    if (hit) hit.cams.push(c);
    else points.push({ key: c.id, lat: c.lat, lng: c.lng, cams: [c] });
  }
  return points;
}
