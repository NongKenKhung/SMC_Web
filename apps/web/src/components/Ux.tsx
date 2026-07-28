"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getLenis } from "@/components/SmoothScroll";

/** ตัวเลขสถิติวิ่งจาก 0 ไปค่าจริงเมื่อเลื่อนมาเห็น (นับเฉพาะส่วนตัวเลข คงคำนำหน้า/ต่อท้ายไว้)
 *  เรนเดอร์ค่าจริงตั้งแต่แรก — ถ้า JS ไม่ทำงานหรือผู้ใช้ปิดการเคลื่อนไหว ก็ยังเห็นตัวเลขถูกต้อง */
export function Stat({ value }: { value: string }) {
  const ref = useRef<HTMLElement>(null);
  const [txt, setTxt] = useState(value);
  useEffect(() => {
    setTxt(value);
    const m = value.match(/^([^\d]*)(\d[\d,]*)(.*)$/);
    if (!m) return;
    const target = parseInt(m[2].replace(/,/g, ""), 10);
    if (!Number.isFinite(target) || target <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1400;
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3); // พุ่งตอนแรก ชะลอตอนท้าย
          setTxt(`${m[1]}${Math.round(target * eased).toLocaleString()}${m[3]}`);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return <b ref={ref}>{txt}</b>;
}

/** ไฟส่องตามตำแหน่งเมาส์บนการ์ดที่มี class .glow
 *  ตัวเดียวฟังทั้งหน้า (event delegation) แล้วเซ็ตพิกัดเป็น CSS variable ให้การ์ดใบนั้น */
export function FxInit() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement)?.closest?.(".glow") as HTMLElement | null;
      if (!card || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}

/** ปุ่มกลับขึ้นบนสุด */
export function ToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      className={`to-top${show ? " show" : ""}`}
      aria-label="กลับขึ้นด้านบน"
      onClick={() => {
        /* ถ้าเปิด smooth scroll อยู่ ต้องสั่งผ่านมัน ไม่งั้นจะกระตุก */
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

/** เปิดใช้ fade-in (.reveal → .in) ทุกครั้งที่เปลี่ยนหน้า
 *  ต้องฟัง searchParams ด้วย — หน้า blog กรองหมวดผ่าน ?category= (pathname ไม่เปลี่ยน)
 *  ไม่งั้นการ์ดชุดใหม่จะค้าง .reveal โดยไม่ถูกเติม .in (บั๊กการ์ดหาย) */
export function RevealInit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        /* ทยอยขึ้นทีละชิ้นตามลำดับที่โผล่เข้าจอ (stagger) — ดูมีจังหวะกว่าขึ้นพร้อมกันทั้งแถว */
        const shown = entries.filter((e) => e.isIntersecting);
        shown.forEach((e, i) => {
          const el = e.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      /* rootMargin ติดลบด้านล่าง = รอให้ชิ้นงานเข้ามาในจอจริง ๆ ก่อนค่อยเล่น */
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => {
      /* อยู่ในจออยู่แล้ว → โชว์ทันที (กันค้างตอนเปลี่ยน filter และลดกระพริบ)
         อยู่ใต้จอ → ค่อย fade-in ตอน scroll ถึงตามปกติ */
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      else io.observe(el);
    });
    return () => io.disconnect();
  }, [routeKey]);
  return null;
}

/** Accordion (เทคโนโลยีหลัก)
 *  item.html = true เมื่อ body เป็น HTML จาก rich text editor (ผ่าน sanitize ที่เซิร์ฟเวอร์แล้ว) */
export function Accordion({
  items,
}: {
  items: { title: string; body: string; html?: boolean }[];
}) {
  const [open, setOpen] = useState(0);
  return (
    <div className="acc">
      {items.map((it, i) => (
        <div className={`acc-item${open === i ? " open" : ""}`} key={it.title}>
          <button type="button" className="acc-btn" onClick={() => setOpen(open === i ? -1 : i)}>
            {it.title} <span className="acc-icon">+</span>
          </button>
          <div className="acc-panel">
            {it.html
              ? <div className="acc-body prose-sm" dangerouslySetInnerHTML={{ __html: it.body }} />
              : <p>{it.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
