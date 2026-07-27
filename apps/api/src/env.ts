/* โหลด .env รวมจาก root ของ monorepo (sml-web/.env)
   ต้อง import ไฟล์นี้เป็นบรรทัดแรกของ main.ts
   วิธีหา: ไต่จากตำแหน่งไฟล์ขึ้นไปทีละชั้นจนเจอ .env ตัวแรก
   (ทนต่อโครงสร้าง build ที่เปลี่ยน เช่น dist/ กับ dist/src/) */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

let dir = __dirname;
for (let i = 0; i < 6; i++) {
  const candidate = join(dir, ".env");
  if (existsSync(candidate)) {
    config({ path: candidate });
    break;
  }
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
