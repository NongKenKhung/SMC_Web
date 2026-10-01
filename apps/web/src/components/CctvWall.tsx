"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapPointView } from "./CctvMap";

/* Leaflet แตะ window ตั้งแต่ import — ต้องโหลดฝั่งเบราว์เซอร์เท่านั้น
   ระหว่างรอแสดงกรอบเปล่าขนาดเท่าแผนที่ ไม่ให้หน้ากระตุกตอนแผนที่โผล่ */
const CctvMap = dynamic(() => import("./CctvMap"), {
  ssr: false,
  loading: () => <div className="cmap"><div className="cmap-canvas cmap-loading" /></div>,
});

export interface WallCamera {
  id: string;
  nameTh: string;
  noteTh?: string;
  groupTitleTh: string;
  lat: number;
  lng: number;
  /** true = ต้นทางตอบรับ · false = ต้นทางแจ้งว่าไม่มีสตรีม · null = ตรวจไม่ได้
   *  ทั้งสามแบบกดดูได้หมด ค่านี้ใช้แค่ขึ้นป้ายบอกล่วงหน้า */
  health: boolean | null;
}

/** เล่นสตรีม HLS หนึ่งตัว
 *
 *  Safari เล่น .m3u8 ได้เอง เบราว์เซอร์อื่นต้องใช้ hls.js
 *  โหลด hls.js แบบ dynamic import เพื่อไม่ให้ไปถ่วงหน้าอื่นที่ไม่มีวิดีโอ
 *
 *  ข้อผิดพลาดของ hls.js มีทั้งแบบกู้คืนได้และกู้ไม่ได้ ของเดิมผมเหมารวมว่า fatal = จบ
 *  ทั้งที่ fatal ชนิด network/media มีวิธีกู้ในตัวอยู่แล้ว ถ้าไม่เรียกก็เท่ากับยอมแพ้เร็วเกินไป
 */
function Player({ id, label, onDead }: { id: string; label: string; onDead: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const src = `https://camerai1.iticfoundation.org/hls/${id}.m3u8`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let hls: { destroy: () => void } | null = null;
    let dead = false;
    let recovers = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    /* เว้นจังหวะก่อนลองใหม่ ไม่ยิงรัว
       กล้องที่หยุดส่งจริงจะตอบ 404 ทันที ถ้าลองต่อกันรวดเดียวจะจบใน ~100 มิลลิวินาที
       ผู้ใช้กดปุ่ม "ลองใหม่" แล้วเห็นแค่ข้อความเดิมกะพริบ นึกว่าปุ่มเสีย
       หน่วงไว้ทำให้เห็นสถานะ "กำลังเชื่อมต่อ" จริง ๆ และไม่ถล่มเซิร์ฟเวอร์ต้นทางด้วย */
    const later = (fn: () => void, ms: number) => { timers.push(setTimeout(() => { if (!dead) fn(); }, ms)); };

    const ready = () => { if (!dead) setLoading(false); };
    /* ต้องเช็ค dead ทุกทางที่แจ้งว่าเล่นไม่ได้
       ตอน hls.destroy() ตัวเก่ายังยิง ERROR ออกมาได้อีก ถ้าไม่กันไว้ มันจะไปสั่งให้
       player ตัวใหม่ที่เพิ่งสร้าง (ตอนกดลองใหม่) กลายเป็นล้มเหลวทันที จนปุ่มลองใหม่ไม่มีผล */
    const fail = () => { if (!dead) onDead(); };

    /* เลือก hls.js ก่อนเสมอ แล้วค่อยตกมาที่ตัวเล่นในตัวของเบราว์เซอร์
       เดิมผมเช็ค canPlayType() ก่อน ซึ่งพลาด เพราะหลายเบราว์เซอร์ตอบ "maybe"
       ทั้งที่เล่นได้บ้างไม่ได้บ้าง พอเข้าทางนั้นแล้วตรรกะลองใหม่ทั้งหมดของเราถูกข้ามไป
       (เจอตอนทดสอบ: เบราว์เซอร์ที่ใช้ทดสอบตอบ "maybe" จึงไม่เคยโหลด hls.js เลย)
       hls.js ให้พฤติกรรมเหมือนกันทุกเบราว์เซอร์และบอกสาเหตุที่ล้มเหลวได้ละเอียดกว่า */
    import("hls.js").then(({ default: Hls }) => {
      if (dead) return;

      if (!Hls.isSupported()) {
        /* ส่วนใหญ่คือ Safari บน iOS ที่ไม่มี MSE แต่เล่น HLS ได้เองอยู่แล้ว */
        if (!el.canPlayType("application/vnd.apple.mpegurl")) { fail(); return; }
        el.src = src;
        el.addEventListener("loadeddata", ready);
        el.addEventListener("error", fail);
        return;
      }

      const h = new Hls({ liveDurationInfinity: true });
      hls = h;
      /* ต้องผูกตัวดักเหตุการณ์ "ก่อน" สั่งโหลด ไม่งั้นข้อผิดพลาดที่เกิดทันที
         (เช่น กล้องที่หยุดส่งภาพ ซึ่งตอบกลับมาเร็วมาก) จะหลุดไปก่อนที่เราจะดักทัน */
      h.on(Hls.Events.MANIFEST_PARSED, () => { ready(); el.play().catch(() => {}); });
      h.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        /* ลองกู้ก่อน 3 ครั้ง แล้วค่อยยอมแพ้ — สตรีมสดสะดุดเป็นเรื่องปกติ */
        if (recovers < 3 && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          recovers++;
          later(() => {
            /* โหลด playlist ไม่สำเร็จ ต้องสั่ง loadSource ใหม่
               startLoad() ใช้ได้เฉพาะตอนที่ playlist ผ่านมาแล้วแต่ไฟล์วิดีโอสะดุด */
            if (String(data.details).toLowerCase().includes("manifest")) h.loadSource(src);
            else h.startLoad();
          }, 900);
          return;
        }
        if (recovers < 3 && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          recovers++; later(() => h.recoverMediaError(), 900); return;
        }
        fail();
      });
      h.loadSource(src);
      h.attachMedia(el);
    }).catch(fail);

    return () => {
      dead = true;
      el.removeEventListener("loadeddata", ready);
      el.removeEventListener("error", fail);
      timers.forEach(clearTimeout);
      hls?.destroy();
    };
  }, [id, src, onDead]);

  return (
    <div className="cctv-stage">
      {loading && <span className="cctv-loading">กำลังเชื่อมต่อ…</span>}
      {/* muted + playsInline จำเป็นสำหรับการเล่นอัตโนมัติบนมือถือ
          กล้องจราจรไม่มีเสียงอยู่แล้ว */}
      <video ref={ref} controls autoPlay muted playsInline aria-label={label} />
    </div>
  );
}

export default function CctvWall({
  cameras,
  points,
  groups,
  labels,
}: {
  cameras: WallCamera[];
  /** กล้องที่รวมตามตำแหน่งแล้ว (groupByPosition) — เก็บเฉพาะ id ส่วนข้อมูลกล้องดึงจาก cameras */
  points: Array<{ key: string; lat: number; lng: number; ids: string[] }>;
  /** ทางแยก (ตาม CCTV_GROUPS) — ใช้เป็นรายการนำทางข้างแผนที่ */
  groups: Array<{ key: string; titleTh: string; ids: string[] }>;
  labels: {
    offline: string; view: string; watch: string;
    close: string; failed: string; retry: string;
    mapHint: string; panelTitle: string; angles: string;
  };
}) {
  const [open, setOpen] = useState<string | null>(null);
  /* นับรอบการลองเล่น — เพิ่มค่าแล้ว Player ถูกสร้างใหม่ทั้งตัว จึงเริ่มต่อใหม่จริง ๆ */
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const current = cameras.find((c) => c.id === open) ?? null;

  const close = useCallback(() => setOpen(null), []);
  const markDead = useCallback(() => setFailed(true), []);

  /* กล้องล่าสุดที่เปิดดู — ไฮไลต์หมุดค้างไว้หลังปิดหน้าต่าง ให้รู้ว่าเพิ่งดูจุดไหนไป */
  const [lastId, setLastId] = useState<string | null>(null);
  const openCam = useCallback((id: string) => {
    setOpen(id); setLastId(id); setFailed(false); setAttempt((n) => n + 1);
  }, []);

  const byId = useMemo(() => new Map(cameras.map((c) => [c.id, c])), [cameras]);
  const mapPoints: MapPointView[] = useMemo(
    () => points.map((p) => ({
      key: p.key, lat: p.lat, lng: p.lng,
      cams: p.ids.map((id) => byId.get(id)!).filter(Boolean)
        .map((c) => ({ id: c.id, nameTh: c.nameTh, noteTh: c.noteTh, health: c.health })),
    })),
    [points, byId],
  );
  /* labels เป็นอ็อบเจกต์ใหม่ทุก render ถ้าส่งตรง ๆ แผนที่จะวาดหมุดใหม่หมดทุกครั้งที่ state เปลี่ยน */
  const mapLabels = useMemo(
    () => ({ view: labels.view, offline: labels.offline, hint: labels.mapHint }),
    [labels.view, labels.offline, labels.mapHint],
  );
  const retry = () => { setFailed(false); setAttempt((n) => n + 1); };

  /* รายการทางแยก: เปิดได้ทีละแยก และกดแล้วแผนที่บินไปหาแยกนั้น */
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ ids: string[]; n: number } | null>(null);
  const toggleGroup = (g: { key: string; ids: string[] }) => {
    const opening = openGroup !== g.key;
    setOpenGroup(opening ? g.key : null);
    if (opening) setFocus({ ids: g.ids, n: Date.now() });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, close]);

  return (
    <>
      {/* แผนที่เป็นทางเข้าหลัก + รายการทางแยกแบบพับได้ข้าง ๆ
          เดิมมีการ์ดกล้องครบ 40 ใบต่อท้ายแผนที่ ซ้ำกับหมุดและยาวจนรก จึงย่อเหลือ 10 ทางแยก */}
      <div className="cctv-layout">
        <CctvMap points={mapPoints} activeId={lastId} focus={focus} onPick={openCam} labels={mapLabels} />

        <aside className="cctv-panel" aria-label={labels.panelTitle}>
          <h4>{labels.panelTitle}</h4>
          <ul>
            {groups.map((g) => {
              const cams = g.ids.map((id) => byId.get(id)).filter((c): c is WallCamera => !!c);
              const down = cams.filter((c) => c.health === false).length;
              const state = down === 0 ? "on" : down === cams.length ? "off" : "part";
              const isOpen = openGroup === g.key;
              /* ทุกมุมในแยกชื่อเดียวกัน = แสดงแค่ทิศทาง ไม่ต้องพิมพ์ชื่อแยกซ้ำทุกบรรทัด */
              const sameName = cams.every((c) => c.nameTh === cams[0]?.nameTh);
              return (
                <li key={g.key} className={`cctv-group${isOpen ? " is-open" : ""}`}>
                  <button type="button" className="cctv-group-head" aria-expanded={isOpen} onClick={() => toggleGroup(g)}>
                    <i className={`cctv-dot is-${state}`} aria-hidden="true" />
                    <span>{g.titleTh}</span>
                    <em>{cams.length} {labels.angles}</em>
                  </button>
                  {isOpen && (
                    <div className="cctv-angles">
                      {cams.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`cctv-angle${c.health === false ? " is-off" : ""}${lastId === c.id ? " is-last" : ""}`}
                          onClick={() => openCam(c.id)}
                        >
                          <span>
                            {sameName ? (c.noteTh ?? c.nameTh) : c.nameTh}
                            {!sameName && c.noteTh && <small>{c.noteTh}</small>}
                          </span>
                          {/* กล้องที่ไม่พบสัญญาณยังกดได้ — กลับมาได้ทุกเมื่อ และผลตรวจเก่าได้ถึงหนึ่งนาที */}
                          <b>{c.health === false ? labels.offline : labels.watch}</b>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      {current && (
        <div className="cctv-modal" onClick={close} role="dialog" aria-modal="true" aria-label={current.nameTh}>
          <div className="cctv-modal-inner" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <b>{current.nameTh}{current.noteTh ? ` · ${current.noteTh}` : ""}</b>
                <span>{current.groupTitleTh}</span>
              </div>
              <button type="button" onClick={close} aria-label={labels.close}>&times;</button>
            </header>
            {failed ? (
              <p className="cctv-failed">
                {labels.failed}
                <button type="button" className="cctv-retry" onClick={retry}>{labels.retry}</button>
              </p>
            ) : (
              <Player key={`${current.id}-${attempt}`} id={current.id} label={current.nameTh} onDead={markDead} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
