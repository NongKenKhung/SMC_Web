"use client";

import type Lenis from "lenis";
import Snap from "lenis/snap";
import { useEffect } from "react";
import { onLenisReady } from "@/components/SmoothScroll";

/** เลื่อนหน้าแรกทีละส่วน (snap รายหัวข้อ)
 *
 *  เปิดเฉพาะจอใหญ่ เพราะบนมือถือแต่ละส่วนสูง 1.1–2.1 เท่าของจอ
 *  ถ้าบังคับ snap จะถูกดึงกลับจนอ่านเนื้อหาท่อนล่างไม่ได้
 *
 *  ส่วนที่สูงเกินจอจะได้จุดพักเพิ่มอีกจุดที่ "ท้ายส่วน" ผู้ใช้จึงเลื่อนเห็นครบ
 *  ไม่มีเนื้อหาไหนถูกข้ามไป */
export default function SectionSnap() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    /* จอสูงน้อยกว่า 700px ก็ไม่เปิด — แต่ละส่วนจะสูงเกินจอมากเกินไป */
    const wide = window.matchMedia("(min-width: 1025px) and (min-height: 700px)");

    let snap: Snap | null = null;
    let lenis: Lenis | null = null;

    const teardown = () => {
      snap?.destroy();
      snap = null;
      if (process.env.NODE_ENV !== "production") {
        delete (window as unknown as { __snapPoints?: number[] }).__snapPoints;
      }
    };

    const build = () => {
      teardown();
      if (reduce.matches || !wide.matches) return;
      const main = document.querySelector("main");
      if (!lenis || !main) return;

      snap = new Snap(lenis, {
        type: "mandatory",
        duration: 0.9,
        easing: (x) => 1 - Math.pow(1 - x, 3), // ชะลอตอนเข้าที่
        debounce: 280,                          // รอให้ผู้ใช้หยุดหมุนก่อนค่อยจัดเข้าที่
      });

      const vh = window.innerHeight;
      const points: number[] = [];
      const push = (v: number) => {
        const y = Math.max(0, Math.round(v));
        if (!points.some((p) => Math.abs(p - y) < 8)) points.push(y);
      };

      for (const el of Array.from(main.children) as HTMLElement[]) {
        const top = el.offsetTop;
        const h = el.offsetHeight;
        /* ส่วนเตี้ยมาก (เช่น แถบปิดท้าย) ไม่ควรเป็นจุดพักของตัวเอง */
        if (h < vh * 0.4) continue;
        push(top);
        /* hero ตรึงจออยู่แล้ว จุดพักกลางทางจะเห็นภาพเดิม ไม่มีประโยชน์ */
        if (el.classList.contains("hero-pin")) continue;
        if (h > vh + 40) push(top + h - vh);
      }
      /* จุดสุดท้าย: ท้ายหน้า เพื่อให้เห็นส่วนปิดท้ายและ footer เต็ม ๆ */
      push(document.documentElement.scrollHeight - vh);

      points.sort((a, b) => a - b).forEach((p) => snap!.add(p));
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __snapPoints?: number[] }).__snapPoints = points;
      }
    };

    /* ความสูงเปลี่ยนได้หลังรูป/ฟอนต์โหลดเสร็จ — คำนวณจุดพักใหม่เมื่อขนาดเปลี่ยน */
    let t = 0;
    const rebuild = () => {
      clearTimeout(t);
      t = window.setTimeout(build, 200);
    };

    /* รอจน layout สร้าง Lenis เสร็จก่อน (effect ของลูกทำงานก่อนพ่อ) */
    const stopWaiting = onLenisReady((l) => {
      lenis = l;
      build();
    });

    const ro = new ResizeObserver(rebuild);
    const main = document.querySelector("main");
    if (main) ro.observe(main);
    window.addEventListener("resize", rebuild);
    wide.addEventListener("change", rebuild);
    reduce.addEventListener("change", rebuild);

    return () => {
      stopWaiting();
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", rebuild);
      wide.removeEventListener("change", rebuild);
      reduce.removeEventListener("change", rebuild);
      teardown();
    };
  }, []);

  return null;
}
