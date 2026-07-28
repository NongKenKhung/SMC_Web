"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css"; /* จำเป็น — ตั้ง height:auto ให้ html/body ตามที่ Lenis ต้องการ */
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** เก็บ instance ไว้ให้ส่วนอื่นเรียกใช้ (เช่น ปุ่มกลับขึ้นบนสุด) */
let lenisRef: Lenis | null = null;
export const getLenis = () => lenisRef;

/* React เรียก effect ของคอมโพเนนต์ลูกก่อนพ่อ — ตัวที่อยู่ในหน้า (เช่น SectionSnap)
   จึงทำงานก่อน layout สร้าง Lenis เสร็จ ต้องมีช่องให้รอจนกว่าจะพร้อม */
const waiting = new Set<(l: Lenis) => void>();

/** เรียก cb เมื่อ Lenis พร้อม (ถ้าพร้อมอยู่แล้วจะเรียกทันที)
 *  คืนฟังก์ชันสำหรับยกเลิกการรอ */
export function onLenisReady(cb: (l: Lenis) => void) {
  if (lenisRef) {
    cb(lenisRef);
    return () => {};
  }
  waiting.add(cb);
  return () => waiting.delete(cb);
}

/** การเลื่อนแบบนุ่ม (inertial scroll) — ให้ความรู้สึกเดียวกับเว็บ KMITL Expo
 *  ปิดอัตโนมัติเมื่อผู้ใช้ตั้งค่าระบบว่าลดการเคลื่อนไหว (prefers-reduced-motion)
 *  ถ้าไม่ทำงานด้วยเหตุใดก็ตาม หน้าเว็บจะกลับไปใช้การเลื่อนปกติของเบราว์เซอร์ */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let lenis: Lenis;
    try {
      lenis = new Lenis({
        autoRaf: true,       // ให้ Lenis คุมลูปวาดภาพเอง — ทนกว่าเขียน RAF เอง
        duration: 1.05,      // หน่วงพอให้ลื่น แต่ไม่ช้าจนอึดอัด
        easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)), // ชะลอตอนท้าย
        smoothWheel: true,
        touchMultiplier: 1.6, // มือถือใช้การเลื่อนของระบบ ไม่หน่วง
      });
    } catch {
      return; // สร้างไม่สำเร็จ → ใช้การเลื่อนปกติของเบราว์เซอร์
    }
    lenisRef = lenis;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }
    /* ปลุกตัวที่รออยู่ (เช่น SectionSnap ในหน้าแรก) */
    waiting.forEach((cb) => cb(lenis));
    waiting.clear();

    /* กลับมาที่แท็บนี้อีกครั้ง / ขนาดจอเปลี่ยน → คำนวณระยะใหม่ กันตำแหน่งเพี้ยน */
    const resync = () => lenis.resize();
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("resize", resync);

    /* ลิงก์ที่ชี้ไปยัง #id ในหน้าเดียวกัน ให้เลื่อนแบบนุ่มด้วย */
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const target = id && document.getElementById(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("resize", resync);
      lenis.destroy();
      lenisRef = null;
    };
  }, []);

  /* เปลี่ยนหน้าแล้วต้องกลับไปบนสุดทันที — ไม่งั้น Lenis ค้างตำแหน่งเดิม */
  useEffect(() => {
    lenisRef?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
