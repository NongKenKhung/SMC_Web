"use client";

/* แผนที่จุดกล้องวงจรปิด — Leaflet ล้วน ไม่ใช้ react-leaflet (ไม่ต้องเพิ่มแพ็กเกจอีกตัวเพื่องานแค่นี้)
 *
 * ไฟล์นี้ต้องถูกโหลดผ่าน next/dynamic แบบ ssr: false เท่านั้น
 * เพราะ Leaflet แตะ window ตั้งแต่ตอน import — render ฝั่งเซิร์ฟเวอร์จะพังทันที
 *
 * หมุดเป็น DivIcon (HTML+CSS) ไม่ใช้รูปหมุดเริ่มต้นของ Leaflet
 * เพราะรูปเริ่มต้นอ้าง path ที่ bundler ย้ายไปแล้ว จะขึ้นเป็นรูปแตก */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

export interface MapCam {
  id: string;
  nameTh: string;
  noteTh?: string;
  health: boolean | null;
}
export interface MapPointView {
  key: string;
  lat: number;
  lng: number;
  cams: MapCam[];
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** สถานะของหมุดจากกล้องในหมุด: ทุกตัวไม่มีสัญญาณ = off · บางตัว = part · ที่เหลือ = on */
const pointState = (p: MapPointView) => {
  const down = p.cams.filter((c) => c.health === false).length;
  return down === p.cams.length ? "off" : down > 0 ? "part" : "on";
};

function icon(p: MapPointView, active: boolean) {
  const n = p.cams.length;
  return L.divIcon({
    className: "",
    html: `<span class="cmap-pin is-${pointState(p)}${active ? " is-active" : ""}">
             <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true"><path d="M3 7h11v10H3zM14 10l6-3v10l-6-3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
             ${n > 1 ? `<b>${n}</b>` : ""}
           </span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

/** ไอคอนกลุ่มหมุด — ตัวเลขคือจำนวน "กล้อง" ในกลุ่ม ไม่ใช่จำนวนหมุด (ผู้ใช้สนใจกล้อง) */
function clusterIcon(cluster: L.MarkerCluster) {
  const cams = cluster.getAllChildMarkers().reduce((n, m) => n + ((m.options as { camCount?: number }).camCount ?? 1), 0);
  const size = cams >= 10 ? 46 : 40;
  return L.divIcon({
    className: "",
    html: `<span class="cmap-cluster" style="width:${size}px;height:${size}px">${cams}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function popupHtml(p: MapPointView, labels: { view: string; offline: string }) {
  const rows = p.cams.map((c) => `
    <button type="button" class="cmap-cam${c.health === false ? " is-off" : ""}" data-cam="${esc(c.id)}">
      <span>${esc(c.nameTh)}${c.noteTh ? `<em>${esc(c.noteTh)}</em>` : ""}</span>
      <i>${c.health === false ? esc(labels.offline) : esc(labels.view)} ›</i>
    </button>`).join("");
  return `<div class="cmap-pop">${rows}</div>`;
}

export default function CctvMap({
  points,
  activeId,
  focus,
  onPick,
  labels,
}: {
  points: MapPointView[];
  /** กล้องที่กำลังเปิดดูอยู่ — หมุดของกล้องนี้จะถูกไฮไลต์ */
  activeId: string | null;
  /** กล้องที่ต้องการให้แผนที่บินไปหา (เช่น ทางแยกที่เลือกในรายการข้าง ๆ)
   *  มี n กำกับ เพื่อให้กดทางแยกเดิมซ้ำแล้วแผนที่ยังบินกลับไปได้ */
  focus: { ids: string[]; n: number } | null;
  onPick: (id: string) => void;
  labels: { view: string; offline: string; hint: string };
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<string, { marker: L.Marker; point: MapPointView }>());
  /* เก็บ callback ล่าสุดไว้ใน ref — ตัวดักคลิกในป๊อปอัปผูกครั้งเดียวตอนสร้างแผนที่
     ถ้าอ้าง onPick ตรง ๆ จะติดค่าตอนแรกตลอดไป (stale closure) */
  const pick = useRef(onPick);
  pick.current = onPick;

  /* สร้างแผนที่ครั้งเดียว */
  useEffect(() => {
    if (!box.current) return;
    const map = L.map(box.current, {
      /* ปิดซูมด้วยล้อเมาส์ไว้ก่อน ไม่งั้นผู้ใช้เลื่อนหน้าผ่านแผนที่แล้วแผนที่ซูมแทน
         เปิดให้เมื่อคลิกในแผนที่แล้ว (ตั้งใจจะใช้แผนที่จริง) */
      scrollWheelZoom: false,
      attributionControl: true,
    });
    map.on("click focus", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());

    /* แผ่นแผนที่ของ OpenStreetMap — ไม่ต้องใช้ key แสดงชื่อถนนภาษาไทยตามข้อมูลท้องถิ่น
     *
     * เดิมใช้ CARTO แต่ปี 2026 CARTO บังคับ key แล้ว แผ่นที่ได้กลับมาเป็นรูปลายน้ำ "API KEY REQ"
     * ทั้งที่ HTTP 200 และรูปโหลดสำเร็จ — ตรวจแค่สถานะจะหลงว่าใช้ได้ ต้องดูด้วยตา
     *
     * เงื่อนไขของ OSM (operations.osmfoundation.org/policies/tiles): ต้องแสดงเครดิต
     * เบราว์เซอร์ต้องส่ง Referer (ค่าเริ่มต้นส่งให้อยู่แล้ว อย่าตั้ง Referrer-Policy: no-referrer ทั้งเว็บ)
     * และห้ามใช้หนักแบบแอปกระจายใหญ่ — ถ้าคนเข้าเยอะขึ้นมาก ให้สมัคร key ฟรีของ MapTiler / Longdo
     * แล้วเปลี่ยน URL บรรทัดนี้บรรทัดเดียว */
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    /* ปุ่มในป๊อปอัปเป็น HTML ธรรมดา ไม่ใช่ React — ผูกคลิกตอนป๊อปอัปเปิด */
    map.on("popupopen", (e) => {
      e.popup.getElement()?.querySelectorAll<HTMLButtonElement>("button[data-cam]").forEach((b) => {
        b.onclick = () => { map.closePopup(); pick.current(b.dataset.cam!); };
      });
    });

    /* รวมหมุดที่อยู่ใกล้กันบนจอเป็นวงเดียว — ตอนเห็นทั้งเมือง หมุดหนึ่งกินพื้นที่ราว 300 ม.
       แต่กล้องห่างกันแค่ 100–300 ม. ถ้าไม่รวม หมุดกลางเมืองซ้อนกันจนกดแยกไม่ได้
       ซูมถึงระดับถนน (17) แล้วแยกเป็นหมุดเดี่ยวทั้งหมด */
    const group = L.markerClusterGroup({
      maxClusterRadius: 44,
      disableClusteringAtZoom: 17,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: clusterIcon,
    });
    map.addLayer(group);
    groupRef.current = group;

    mapRef.current = map;
    /* กล่องแผนที่อาจถูกจัดขนาดหลังจาก Leaflet วัดไปแล้ว (ฟอนต์โหลดช้า, reveal animation)
       ถ้าไม่สั่งวัดใหม่ แผ่นแผนที่จะขึ้นไม่เต็มกรอบ เหลือพื้นเทาเป็นแถบ */
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(box.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; groupRef.current = null; markers.current.clear(); };
  }, []);

  /* วาดหมุดใหม่เมื่อรายการจุดเปลี่ยน (เช่น สถานะกล้องอัปเดต) */
  useEffect(() => {
    const map = mapRef.current, group = groupRef.current;
    if (!map || !group) return;
    group.clearLayers();
    markers.current.clear();
    for (const p of points) {
      const marker = L.marker([p.lat, p.lng], {
        icon: icon(p, false),
        title: p.cams.map((c) => c.nameTh).join(" / "),
        keyboard: true,
        riseOnHover: true,
        /* จำนวนกล้องในหมุดนี้ — ให้ไอคอนกลุ่มนับเป็นกล้อง ไม่ใช่นับเป็นหมุด */
        camCount: p.cams.length,
      } as L.MarkerOptions)
        .bindPopup(popupHtml(p, labels), { closeButton: true, maxWidth: 300, minWidth: 220 });
      group.addLayer(marker);
      markers.current.set(p.key, { marker, point: p });
    }
    if (points.length) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [36, 36], maxZoom: 16 });
    }
  }, [points, labels]);

  /* บินไปหาทางแยกที่เลือก — ซูมถึง 17 ซึ่งเป็นระดับที่วงรวมหมุดแตกออกหมดแล้ว จึงเห็นทุกมุมกล้อง */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const hits = [...markers.current.values()].filter(({ point }) => point.cams.some((c) => focus.ids.includes(c.id)));
    if (!hits.length) return;
    const bounds = L.latLngBounds(hits.map(({ marker }) => marker.getLatLng()));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17, animate: false });
    else map.flyToBounds(bounds, { padding: [70, 70], maxZoom: 17, duration: 0.7 });
  }, [focus]);

  /* ไฮไลต์หมุดของกล้องที่เปิดอยู่ และเลื่อนแผนที่ไปหาถ้าอยู่นอกจอ */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach(({ marker, point }) => {
      const active = !!activeId && point.cams.some((c) => c.id === activeId);
      marker.setIcon(icon(point, active));
      marker.setZIndexOffset(active ? 1000 : 0);
      /* หมุดที่ถูกรวมในกลุ่มจะมองไม่เห็น — สั่งซูมจนแยกออกมา ผู้ใช้ปิดหน้าต่างวิดีโอแล้วจะเห็นตำแหน่งทันที */
      if (active && groupRef.current) groupRef.current.zoomToShowLayer(marker);
    });
  }, [activeId]);

  return (
    <div className="cmap">
      <div ref={box} className="cmap-canvas" role="region" aria-label={labels.hint} />
      <p className="cmap-hint">{labels.hint}</p>
    </div>
  );
}
