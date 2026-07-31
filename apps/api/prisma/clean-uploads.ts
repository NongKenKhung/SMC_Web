/* ล้างไฟล์กำพร้าในโฟลเดอร์อัปโหลด — เรียกด้วย: pnpm db:clean:uploads
   ไฟล์กำพร้า = ไฟล์ที่อยู่บนดิสก์แต่ไม่มีแถว Media อ้างถึง
   เกิดได้จากตอนอัปโหลดค้างกลางคัน หรือข้อมูลถูกลบด้วยวิธีที่ไม่ผ่าน API
   ไม่มีคลังสื่อกลางแล้ว จึงไม่มีหน้าไหนมองเห็นไฟล์พวกนี้ ต้องมีสคริปต์ไว้เก็บกวาด

   ใส่ --dry-run เพื่อดูรายการก่อนโดยไม่ลบจริง */
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(__dirname, "../../../.env") }); /* .env รวมที่ root */

import { PrismaClient } from "@prisma/client";
import { readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOADS_DIR
  ? resolve(process.env.UPLOADS_DIR)
  : join(process.cwd(), "uploads");

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!existsSync(UPLOAD_DIR)) {
    console.log(`ไม่มีโฟลเดอร์ ${UPLOAD_DIR} — ไม่ต้องทำอะไร`);
    return;
  }

  const files = await readdir(UPLOAD_DIR);
  const media = await prisma.media.findMany({ select: { storedName: true, url: true } });
  /* ชื่อไฟล์ที่ระบบรู้จัก — เผื่อแถวเก่าที่ไม่มี storedName ให้ดึงจากท้าย url */
  const known = new Set(
    media.map((m) => m.storedName ?? m.url.split("/").pop() ?? "").filter(Boolean),
  );

  const orphans = files.filter((f) => !known.has(f));
  if (orphans.length === 0) {
    console.log(`ไม่มีไฟล์กำพร้า — บนดิสก์ ${files.length} ไฟล์ ตรงกับในฐานข้อมูลทั้งหมด`);
    return;
  }

  let bytes = 0;
  for (const f of orphans) {
    const s = await stat(join(UPLOAD_DIR, f)).catch(() => null);
    const kb = s ? Math.round(s.size / 1024) : 0;
    bytes += s?.size ?? 0;
    console.log(`${dryRun ? "จะลบ" : "ลบ"}: ${f} (${kb} KB)`);
    if (!dryRun) await rm(join(UPLOAD_DIR, f), { force: true }).catch(() => undefined);
  }

  console.log(
    `\n${dryRun ? "พบ" : "ลบแล้ว"} ${orphans.length} ไฟล์ รวม ${Math.round(bytes / 1024)} KB` +
      (dryRun ? " — เอา --dry-run ออกเพื่อลบจริง" : ""),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
