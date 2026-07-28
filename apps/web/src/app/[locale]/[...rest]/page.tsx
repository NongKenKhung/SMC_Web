import { notFound } from "next/navigation";

/* จับทุก URL ใต้ /th และ /en ที่ไม่ตรงหน้าไหนเลย แล้วส่งเข้าหน้า 404 ของภาษานั้น
   (ถ้าไม่มีตัวนี้ จะตกไปใช้ 404 ระดับราก ซึ่งไม่มี header/footer) */
export default function CatchAll(): never {
  notFound();
}
