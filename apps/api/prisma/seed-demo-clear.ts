/* ล้างข้อมูลตัวอย่างที่ seed-demo ใส่ไว้ — เรียกด้วย: pnpm db:seed:demo:clear
   ลบเฉพาะโซลูชัน/พาร์ทเนอร์/ข่าว/บล็อกเนื้อหา ไม่แตะผู้ดูแลระบบ ข้อความหลัก
   และไม่แตะข้อความที่ผู้เข้าชมส่งเข้ามาทางฟอร์มติดต่อ */
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(__dirname, "../../../.env") }); /* .env รวมที่ root */

import { PrismaClient } from "@prisma/client";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOADS_DIR
  ? resolve(process.env.UPLOADS_DIR)
  : join(process.cwd(), "uploads");

async function main() {
  /* ไฟล์แนบผูกกับโซลูชัน/ข่าวที่กำลังจะลบ — เก็บชื่อไฟล์ไว้ลบบนดิสก์ด้วย
     (ไม่มีคลังสื่อกลางแล้ว ถ้าไม่ลบตรงนี้ไฟล์จะค้างโดยไม่มีหน้าไหนมองเห็น) */
  const media = await prisma.media.findMany({ select: { id: true, storedName: true, url: true } });

  const [posts, partners, solutions, blocks, attachments] = await Promise.all([
    prisma.post.deleteMany({}),
    prisma.partner.deleteMany({}),
    prisma.solution.deleteMany({}),
    prisma.block.deleteMany({}),
    prisma.attachment.deleteMany({}),
  ]);
  await prisma.media.deleteMany({});

  let files = 0;
  for (const m of media) {
    const stored = m.storedName ?? m.url.split("/").pop() ?? "";
    if (!stored) continue;
    await rm(join(UPLOAD_DIR, stored), { force: true }).catch(() => undefined);
    files++;
  }

  /* ค่าที่แต่งขึ้นซึ่งฝังอยู่ใน SiteContent — ตัวเลขผลงานใน hero กับเบอร์โทรที่ต่อท้ายว่า (ตัวอย่าง)
     ล้างทิ้งด้วย ไม่งั้นเว็บจะยังโชว์ตัวเลขที่ไม่จริงให้หน่วยงานเห็น */
  const stripSample = (s: string) => s.replace(/\s*\((ตัวอย่าง|sample)\)\s*$/i, "").trim();
  let cleaned = 0;
  for (const key of ["home.hero", "site.contact"]) {
    const row = await prisma.siteContent.findUnique({ where: { key } });
    if (!row) continue;
    const fix = (json: string | null) => {
      if (!json) return json;
      try {
        const v = JSON.parse(json) as Record<string, unknown>;
        if (key === "home.hero" && Array.isArray(v.stats) && v.stats.length) v.stats = [];
        if (key === "site.contact" && typeof v.phone === "string") v.phone = stripSample(v.phone);
        return JSON.stringify(v);
      } catch {
        return json; /* ไม่ใช่ JSON ก็ปล่อยไว้ */
      }
    };
    const valueTh = fix(row.valueTh);
    const valueEn = fix(row.valueEn);
    if (valueTh !== row.valueTh || valueEn !== row.valueEn) {
      await prisma.siteContent.update({ where: { key }, data: { valueTh, valueEn } });
      cleaned++;
    }
  }

  console.log(
    `✅ ล้างข้อมูลตัวอย่างแล้ว — โซลูชัน ${solutions.count}, พาร์ทเนอร์ ${partners.count}, ` +
      `ข่าว ${posts.count}, บล็อกเนื้อหา ${blocks.count}, ไฟล์แนบ ${attachments.count}, ` +
      `ไฟล์บนดิสก์ ${files}, ข้อความหลักที่ล้างค่าตัวอย่าง ${cleaned}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
