/* Seed ตั้งต้น — ใส่เฉพาะสิ่งที่ระบบต้องมีถึงจะใช้งานได้
   ไม่มีข้อมูลตัวอย่าง (โซลูชัน/พาร์ทเนอร์/ข่าว) และไม่มีตัวเลขที่แต่งขึ้น
   เนื้อหาจริงกรอกผ่าน /admin — อยากได้ชุดตัวอย่างไว้ลองเล่นให้รัน `npm run db:seed:demo`
   รันซ้ำได้: ผู้ดูแลระบบใช้ upsert ส่วนข้อความหลักจะใส่ให้เฉพาะคีย์ที่ยังไม่มี
   (ไม่ทับของที่แก้ผ่าน admin ไปแล้ว) */
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(__dirname, "../../../.env") }); /* .env รวมที่ root */

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** ยาวเท่ากับที่ auth บังคับตอนตั้งรหัสผ่าน (MinLength 10) */
const MIN_PASSWORD = 10;

/** รหัสผ่านสุ่มสำหรับกรณีไม่ได้ตั้ง ADMIN_PASSWORD ไว้ */
function randomPassword(): string {
  return randomBytes(18).toString("base64url").slice(0, 20);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@smc.local").trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    /* มีบัญชีอยู่แล้ว = ห้ามแตะรหัสผ่าน ไม่งั้น seed ซ้ำจะรีเซ็ตรหัสที่ตั้งเองไปแล้ว
       (คำสั่งนี้ถูกเรียกอัตโนมัติตอน prisma migrate dev ด้วย) */
    await prisma.user.update({ where: { email }, data: { name: existing.name || "SMC Admin" } });
    console.log(`ผู้ดูแลระบบ: มี ${email} อยู่แล้ว — ไม่แตะรหัสผ่าน`);
    return;
  }

  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv && fromEnv.length < MIN_PASSWORD) {
    throw new Error(
      `ADMIN_PASSWORD สั้นเกินไป (${fromEnv.length} ตัว) — ระบบบังคับอย่างน้อย ${MIN_PASSWORD} ตัว ` +
        `ถ้าตั้งสั้นกว่านี้จะสร้างบัญชีได้แต่เปลี่ยนรหัสผ่านผ่านหน้า admin ไม่ผ่าน`,
    );
  }
  const password = fromEnv || randomPassword();

  await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10), name: "SMC Admin", role: "ADMIN" },
  });

  if (fromEnv) {
    console.log(`ผู้ดูแลระบบ: สร้าง ${email} แล้ว (รหัสผ่านจาก ADMIN_PASSWORD ใน .env)`);
  } else {
    /* พิมพ์ครั้งเดียวตรงนี้เท่านั้น — ไม่ได้เก็บไว้ที่ไหนอีก จดไว้ก่อนปิดหน้าจอ
       ถ้าพลาดไป ตั้งใหม่ได้ด้วย npm run db:admin:password */
    console.log("\n" + "=".repeat(64));
    console.log("สร้างบัญชีผู้ดูแลระบบแล้ว — ไม่ได้ตั้ง ADMIN_PASSWORD ไว้ จึงสุ่มให้");
    console.log(`  อีเมล    : ${email}`);
    console.log(`  รหัสผ่าน : ${password}`);
    console.log("จดไว้เดี๋ยวนี้ — รหัสนี้ไม่ถูกเก็บไว้ที่ไหนและจะไม่แสดงอีก");
    console.log("ลืมแล้วตั้งใหม่ได้ด้วย: npm run db:admin:password");
    console.log("=".repeat(64) + "\n");
  }
}

async function main() {
  await seedAdmin();

  /* ---------- ข้อความหลักของเว็บ ----------
     stats ปล่อยว่างไว้ — ตัวเลขผลงานต้องเป็นของจริง ให้กรอกเองที่ admin
     (หน้าเว็บจะไม่แสดงแถบสถิติจนกว่าจะมีข้อมูล) */
  const contents: Array<[string, unknown, unknown]> = [
    [
      "home.hero",
      {
        eyebrow: "Smart City Research Center · School of Engineering · KMITL",
        titleLine1: "ขับเคลื่อนเมืองอัจฉริยะ",
        titleLine2: "ด้วยงานวิจัยและนวัตกรรม",
        lead:
          "ศูนย์วิจัย Smart City แห่งสถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง พัฒนาโซลูชันจากงานวิจัยสู่การใช้งานจริง ร่วมกับหน่วยงานภาครัฐและเอกชน",
        stats: [],
      },
      {
        eyebrow: "Smart City Research Center · School of Engineering · KMITL",
        titleLine1: "Driving smart cities",
        titleLine2: "with research & innovation",
        lead:
          "The smart-city research center of King Mongkut's Institute of Technology Ladkrabang — turning research into real-world solutions with government and private partners.",
        stats: [],
      },
    ],
    [
      "site.contact",
      {
        address: "คณะวิศวกรรมศาสตร์ สจล. เลขที่ 1 ซอยฉลองกรุง 1 เขตลาดกระบัง กรุงเทพฯ 10520",
        phone: "0-2329-8000",
        email: "kmitlsmartcity2024@gmail.com",
        hours: "จันทร์–ศุกร์ 09:00–17:00 น.",
      },
      {
        address: "Faculty of Engineering, KMITL, 1 Chalong Krung 1, Ladkrabang, Bangkok 10520",
        phone: "0-2329-8000",
        email: "kmitlsmartcity2024@gmail.com",
        hours: "Mon–Fri 09:00–17:00",
      },
    ],
    [
      "about.main",
      {
        vision:
          "เป็นศูนย์วิจัยชั้นนำด้านเมืองอัจฉริยะของประเทศ ที่เปลี่ยนงานวิจัยให้กลายเป็นโซลูชันที่ใช้งานได้จริง",
        missions: [
          "วิจัยและพัฒนาเทคโนโลยี Smart City ที่เหมาะกับบริบทเมืองไทย",
          "ร่วมมือกับหน่วยงานรัฐและเอกชน นำนวัตกรรมไปติดตั้งใช้งานจริงในพื้นที่",
          "ผลิตบุคลากรและถ่ายทอดองค์ความรู้ด้านเมืองอัจฉริยะสู่สังคม",
        ],
      },
      {
        vision:
          "To be Thailand's leading smart-city research center, turning research into solutions that work in the real world.",
        missions: [
          "Research and develop smart-city technology suited to the Thai urban context",
          "Partner with government and industry to deploy innovation in real areas",
          "Develop people and transfer smart-city knowledge to society",
        ],
      },
    ],
  ];
  for (const [key, valueTh, valueEn] of contents) {
    const data = { valueTh: JSON.stringify(valueTh), valueEn: JSON.stringify(valueEn) };
    /* update ว่าง = ถ้ามีคีย์นี้อยู่แล้วปล่อยไว้ ไม่ทับของที่แก้ผ่าน admin */
    await prisma.siteContent.upsert({ where: { key }, update: {}, create: { key, ...data } });
  }

  console.log("✅ Seed ตั้งต้นเสร็จ — ข้อความหลัก 3 ชุด (ไม่มีข้อมูลตัวอย่าง)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
