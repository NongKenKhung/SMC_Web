import CctvWall from "@/components/CctvWall";
import { ALL_CAMERAS, CCTV_CREDITS, CCTV_GROUPS, CCTV_SOURCE, getCameraStatus, groupByPosition } from "@/lib/cctv";
import { dict, type Locale } from "@/lib/i18n";

/** แผนที่ + ภาพสดกล้องวงจรปิด สำหรับฝังในหน้าโซลูชันที่ตั้ง widget = "cctv"
 *
 *  เป็น server component — ตรวจสถานะกล้องฝั่งเซิร์ฟเวอร์ (แคช 60 วิ ใน getCameraStatus)
 *  แล้วส่งให้ CctvWall ที่เป็น client component วาดแผนที่และเล่นวิดีโอ
 *  หน้าโซลูชันเรียก API แบบ no-store ทุกครั้งอยู่แล้ว สถานะกล้องจึงสดตามการเปิดหน้า */
export default async function CctvSection({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const en = locale === "en";

  const status = await getCameraStatus();
  /* ไม่มีผลตรวจ = ไม่รู้ ไม่ใช่เสีย — ปล่อย null ไว้ให้กดได้ตามปกติ */
  const cameras = ALL_CAMERAS.map((c) => ({ ...c, health: status[c.id] ?? null }));
  const down = cameras.filter((c) => c.health === false).length;
  /* รวมกล้องที่อยู่แยกเดียวกันเป็นหมุดเดียว — ส่งไปแค่ id ไม่ส่งข้อมูลกล้องซ้ำสองชุด */
  const points = groupByPosition(cameras).map((g) => ({ key: g.key, lat: g.lat, lng: g.lng, ids: g.cams.map((c) => c.id) }));
  const groups = CCTV_GROUPS.map((g) => ({ key: g.key, titleTh: g.titleTh, ids: g.cameras.map((c) => c.id) }));

  /* ตัวเลขทุกตัวนับจากข้อมูลจริง ไม่ได้พิมพ์ไว้ — กล้องเพิ่ม/ล่ม ตัวเลขเปลี่ยนตามเอง */
  const stats = [
    { value: cameras.length, label: t.cctv.statCameras },
    { value: points.length, label: t.cctv.statPoints },
    { value: groups.length, label: t.cctv.statJunctions },
    { value: cameras.length - down, label: t.cctv.statLive, live: true },
  ];

  return (
    <section className="sec soft-sec">
      <div className="container">
        <div className="sec-head reveal">
          <span className="eyebrow">{t.cctv.eyebrow}</span>
          <h2>{t.cctv.title}</h2>
          <p className="lead">{en ? CCTV_SOURCE.areaEn : CCTV_SOURCE.areaTh}</p>
        </div>

        <dl className="cctv-stats reveal">
          {stats.map((s) => (
            <div key={s.label} className={s.live ? "is-live" : undefined}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        <CctvWall
          cameras={cameras}
          points={points}
          groups={groups}
          labels={{
            offline: t.cctv.offline, view: t.cctv.view, watch: t.cctv.watch,
            close: t.cctv.close, failed: t.cctv.failed, retry: t.cctv.retry,
            mapHint: t.cctv.mapHint, panelTitle: t.cctv.panelTitle, angles: t.cctv.angles,
          }}
        />

        {/* โลโก้หน่วยงานร่วมพัฒนา — ชื่อเต็มอยู่ใน alt (โปรแกรมอ่านหน้าจอ) และ title (ชี้เมาส์) */}
        <aside className="cctv-credit reveal">
          <h4>{t.cctv.sourceTitle}</h4>
          <ul className="cctv-logos">
            {CCTV_CREDITS.map((c) => {
              const name = en ? c.nameEn : c.nameTh;
              return (
                <li key={c.src}>
                  <img
                    src={c.src} alt={name} title={name}
                    width={c.width} height={c.height}
                    style={{ "--shown": `${c.shown}px` } as React.CSSProperties}
                    loading="lazy" decoding="async"
                  />
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </section>
  );
}
