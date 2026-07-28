import NotFoundView from "@/components/NotFoundView";

/* 404 ในเส้นทางภาษา — ใช้เมื่อหน้าเรียก notFound() เช่น slug ที่ไม่มีอยู่จริง
   ตัวนี้เรนเดอร์ใน layout ของภาษา จึงมี header/footer ครบ */
export default function LocaleNotFound() {
  return <NotFoundView />;
}
