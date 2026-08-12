"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** เลื่อนหน้าจอไปที่ฟอร์มเมื่อเปิดขึ้นมา
 *
 *  หน้า admin วางฟอร์มไว้ใต้ตาราง พอรายการเยอะ (25 โซลูชัน = สูงกว่า 2600px)
 *  กด "แก้ไข" แล้วฟอร์มโผล่ใต้จอ ผู้ใช้ไม่เห็นอะไรเปลี่ยน นึกว่าปุ่มเสีย
 *
 *  วิธีใช้:
 *    const { formRef, focusForm } = useScrollToForm();
 *    <div className="adm-card" ref={formRef}> ... </div>
 *    เรียก focusForm() ทุกครั้งที่เปิดฟอร์ม (ทั้งเพิ่มใหม่และแก้ไข)
 */
export function useScrollToForm<T extends HTMLElement = HTMLDivElement>() {
  const formRef = useRef<T>(null);
  /* นับครั้งที่เปิด — ใช้เป็น trigger เพราะ state ของฟอร์มเปลี่ยนทุกครั้งที่พิมพ์
     ถ้าผูกกับตัวฟอร์มตรง ๆ จะเลื่อนจอรัวทุกตัวอักษร */
  const [openCount, setOpenCount] = useState(0);

  const focusForm = useCallback(() => setOpenCount((n) => n + 1), []);

  useEffect(() => {
    if (openCount === 0) return;
    /* effect ทำงานหลัง React ใส่ DOM แล้ว จึงเลื่อนได้เลย
       เลื่อนทันที ไม่ใช้ requestAnimationFrame และไม่ใช้ behavior: smooth
       เพราะทั้งสองอย่างถูกเบราว์เซอร์หยุดเมื่อแท็บไม่ได้แสดงผล การเลื่อนจะไม่เกิดขึ้นเลย
       (การกระโดดไปฟอร์มควรถึงทันทีอยู่แล้ว ไม่ต้องรออนิเมชัน) */
    /* ต้องระบุ instant ให้ชัด — globals.css ตั้ง html { scroll-behavior: smooth }
       ถ้าปล่อยเป็นค่าเริ่มต้นจะกลายเป็นเลื่อนแบบนุ่ม แล้วไม่เลื่อนเลยเมื่อแท็บถูกซ่อน */
    formRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [openCount]);

  return { formRef, focusForm };
}
