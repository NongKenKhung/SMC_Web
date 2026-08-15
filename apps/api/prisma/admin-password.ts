/* ตั้ง/รีเซ็ตรหัสผ่านผู้ดูแลระบบ — เรียกด้วย: npm run db:admin:password
   ระบบไม่มีอีเมลกู้รหัสผ่าน คำสั่งนี้จึงเป็นทางเดียวที่กู้คืนได้เมื่อลืมรหัส

   ใช้รหัสจาก ADMIN_PASSWORD ใน .env ถ้าตั้งไว้ ไม่งั้นสุ่มให้แล้วพิมพ์ครั้งเดียว
   ระบุบัญชีอื่นได้ด้วย ADMIN_EMAIL (ค่าเริ่มต้นคือบัญชี ADMIN คนแรกที่เจอ) */
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(__dirname, "../../../.env") }); /* .env รวมที่ root */

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const MIN_PASSWORD = 10; /* ตรงกับที่ auth บังคับ */

async function main() {
  const wanted = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const user = wanted
    ? await prisma.user.findUnique({ where: { email: wanted } })
    : await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { id: "asc" } });

  if (!user) {
    console.error(
      wanted
        ? `ไม่พบบัญชี ${wanted} — ตรวจ ADMIN_EMAIL ใน .env หรือรัน npm run db:seed เพื่อสร้างบัญชีแรก`
        : "ยังไม่มีบัญชีผู้ดูแลระบบเลย — รัน npm run db:seed ก่อน",
    );
    process.exit(1);
  }

  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv && fromEnv.length < MIN_PASSWORD) {
    console.error(`ADMIN_PASSWORD สั้นเกินไป (${fromEnv.length} ตัว) — ต้องอย่างน้อย ${MIN_PASSWORD} ตัว`);
    process.exit(1);
  }
  const password = fromEnv || randomBytes(18).toString("base64url").slice(0, 20);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  console.log("\n" + "=".repeat(64));
  console.log(`ตั้งรหัสผ่านใหม่ให้ ${user.email} แล้ว`);
  if (fromEnv) {
    console.log("  (ใช้รหัสจาก ADMIN_PASSWORD ใน .env)");
  } else {
    console.log(`  รหัสผ่าน : ${password}`);
    console.log("จดไว้เดี๋ยวนี้ — รหัสนี้ไม่ถูกเก็บไว้ที่ไหนและจะไม่แสดงอีก");
  }
  console.log("=".repeat(64) + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
