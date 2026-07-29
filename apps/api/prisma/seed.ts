/* Seed ตั้งต้น — ใส่เฉพาะสิ่งที่ระบบต้องมีถึงจะใช้งานได้
   ไม่มีข้อมูลตัวอย่าง (โซลูชัน/พาร์ทเนอร์/ข่าว) และไม่มีตัวเลขที่แต่งขึ้น
   เนื้อหาจริงกรอกผ่าน /admin — อยากได้ชุดตัวอย่างไว้ลองเล่นให้รัน `pnpm db:seed:demo`
   รันซ้ำได้: ผู้ดูแลระบบใช้ upsert ส่วนข้อความหลักจะใส่ให้เฉพาะคีย์ที่ยังไม่มี
   (ไม่ทับของที่แก้ผ่าน admin ไปแล้ว) */
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(__dirname, "../../../.env") }); /* .env รวมที่ root */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  /* ---------- ผู้ดูแลระบบ ---------- */
  await prisma.user.upsert({
    where: { email: "admin@sml.local" },
    update: { name: "SMC Admin" },
    create: {
      email: "admin@sml.local",
      passwordHash: await bcrypt.hash("ChangeMe123!", 10),
      name: "SMC Admin",
      role: "ADMIN",
    },
  });

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

  console.log("✅ Seed ตั้งต้นเสร็จ — ผู้ดูแล 1 คน, ข้อความหลัก 3 ชุด (ไม่มีข้อมูลตัวอย่าง)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
