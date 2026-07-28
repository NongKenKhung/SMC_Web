import NotFoundView from "@/components/NotFoundView";

/* 404 ระดับราก — ใช้กับ URL ที่ไม่ตรงเส้นทางใดเลย
   อยู่นอก layout ของภาษา จึงไม่มี header/footer และต้องมีลิงก์กลับครบในตัว */
export default function RootNotFound() {
  return <NotFoundView />;
}
