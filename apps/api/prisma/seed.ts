/* Seed ข้อมูลตัวอย่างสองภาษา (TH/EN) — รันซ้ำได้ จะอัปเดตข้อมูล mock เดิมให้เป็นชุดล่าสุด
   (ระวัง: ถ้าแก้ข้อมูลผ่าน admin แล้วมารัน seed ซ้ำ ข้อมูล mock ชุดนี้จะทับของเดิม) */
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

  /* ---------- Solutions (หมวด A/B/C — ชื่อชั่วคราว) ---------- */
  const mkSolution = async (
    slug: string,
    nameTh: string,
    nameEn: string,
    order: number,
    parentId: number | null,
    summaryTh: string,
    summaryEn: string,
  ) => {
    const data = {
      nameTh, nameEn, order, parentId, summaryTh, summaryEn,
      bodyTh: "เนื้อหารายละเอียดของระบบ (ตัวอย่าง) — แก้ไขได้จากระบบ admin",
      bodyEn: "Detailed description of the system (sample) — editable via admin",
    };
    return prisma.solution.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
  };

  const a = await mkSolution(
    "solution-a", "Solution A (ชื่อชั่วคราว)", "Solution A (placeholder)", 1, null,
    "คำอธิบายภาพรวมของหมวด A ว่าครอบคลุมระบบอะไรบ้าง เหมาะกับหน่วยงานแบบไหน",
    "Overview of category A — what systems it covers and who it is for",
  );
  const b = await mkSolution(
    "solution-b", "Solution B (ชื่อชั่วคราว)", "Solution B (placeholder)", 2, null,
    "คำอธิบายภาพรวมของหมวด B ว่าครอบคลุมระบบอะไรบ้าง เหมาะกับหน่วยงานแบบไหน",
    "Overview of category B — what systems it covers and who it is for",
  );
  const c = await mkSolution(
    "solution-c", "Solution C (ชื่อชั่วคราว)", "Solution C (placeholder)", 3, null,
    "คำอธิบายภาพรวมของหมวด C ว่าครอบคลุมระบบอะไรบ้าง เหมาะกับหน่วยงานแบบไหน",
    "Overview of category C — what systems it covers and who it is for",
  );
  await mkSolution("a-1", "A-1 หัวข้อย่อยตัวอย่าง", "A-1 Sample subtopic", 1, a.id,
    "สรุปสั้น ๆ ของระบบ A-1", "Short summary of system A-1");
  await mkSolution("a-2", "A-2 หัวข้อย่อยตัวอย่าง", "A-2 Sample subtopic", 2, a.id,
    "สรุปสั้น ๆ ของระบบ A-2", "Short summary of system A-2");
  await mkSolution("b-1", "B-1 หัวข้อย่อยตัวอย่าง", "B-1 Sample subtopic", 1, b.id,
    "สรุปสั้น ๆ ของระบบ B-1", "Short summary of system B-1");
  await mkSolution("b-2", "B-2 หัวข้อย่อยตัวอย่าง", "B-2 Sample subtopic", 2, b.id,
    "สรุปสั้น ๆ ของระบบ B-2", "Short summary of system B-2");
  await mkSolution("c-1", "C-1 หัวข้อย่อยตัวอย่าง", "C-1 Sample subtopic", 1, c.id,
    "สรุปสั้น ๆ ของระบบ C-1", "Short summary of system C-1");

  /* ---------- Partners ---------- */
  const partners: Array<[string, string]> = [
    ["LOGO 01", "หน่วยงานภาครัฐ"],
    ["LOGO 02", "เทศบาล / อปท."],
    ["LOGO 03", "บริษัทเอกชน"],
    ["LOGO 04", "มหาวิทยาลัยพันธมิตร"],
    ["LOGO 05", "หน่วยงานวิจัย"],
    ["LOGO 06", "บริษัทเทคโนโลยี"],
    ["LOGO 07", "องค์กรระหว่างประเทศ"],
    ["LOGO 08", "หน่วยงานพาร์ทเนอร์"],
  ];
  if ((await prisma.partner.count()) === 0) {
    await prisma.partner.createMany({
      data: partners.map(([name, caption], i) => ({ name, caption, order: i + 1 })),
    });
  }

  /* ---------- Posts (กิจกรรม & ข่าวสาร) ---------- */
  const posts = [
    {
      slug: "smart-traffic-demo",
      category: "ACTIVITY",
      titleTh: "ทีม SMC สาธิตระบบจราจรอัจฉริยะให้เทศบาลตัวอย่าง พร้อมทดสอบในพื้นที่จริง",
      titleEn: "SMC team demonstrates the intelligent traffic system to a partner municipality",
      publishedAt: new Date("2026-03-12"),
    },
    {
      slug: "cctv-phase1-delivery",
      category: "WORK",
      titleTh: "ส่งมอบระบบกล้อง CCTV อัจฉริยะ เฟสที่ 1 ให้หน่วยงานความปลอดภัยเมือง",
      titleEn: "Smart CCTV system phase 1 delivered to the city safety authority",
      publishedAt: new Date("2026-02-28"),
    },
    {
      slug: "mou-smart-city",
      category: "NEWS",
      titleTh: "ลงนามความร่วมมือ (MOU) ด้านการพัฒนาเมืองอัจฉริยะกับหน่วยงานพันธมิตร",
      titleEn: "MOU signed with partner organizations on smart-city development",
      publishedAt: new Date("2026-01-15"),
    },
    {
      slug: "city-data-platform-workshop",
      category: "ACTIVITY",
      titleTh: "จัด Workshop อบรมการใช้งาน City Data Platform ให้เจ้าหน้าที่หน่วยงานท้องถิ่น",
      titleEn: "City Data Platform workshop for local government officers",
      publishedAt: new Date("2025-12-20"),
    },
    {
      slug: "center-visit",
      category: "ACTIVITY",
      titleTh: "ต้อนรับคณะศึกษาดูงานจากมหาวิทยาลัยพันธมิตร เยี่ยมชมศูนย์วิจัย",
      titleEn: "Welcoming a study visit from partner universities to the research center",
      publishedAt: new Date("2025-11-02"),
    },
    {
      slug: "digital-twin-launch",
      category: "WORK",
      titleTh: "เปิดตัวต้นแบบ Digital Twin ย่านนวัตกรรม จำลองเมืองเสมือนแบบเรียลไทม์",
      titleEn: "Launching the Digital Twin prototype of the innovation district",
      publishedAt: new Date("2025-10-14"),
    },
  ];
  for (const p of posts) {
    const data = {
      ...p,
      excerptTh: "สรุปเนื้อหาสั้น ๆ ของโพสต์ (ตัวอย่าง) แก้ไขได้จากระบบ admin",
      excerptEn: "Short summary of the post (sample) — editable via admin",
      bodyTh: "เนื้อหาเต็มของโพสต์ (ตัวอย่าง)",
      bodyEn: "Full post content (sample)",
    };
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
  }

  /* ---------- เนื้อหาหน้าเว็บ (key-value JSON สองภาษา) ---------- */
  const contents: Array<[string, unknown, unknown]> = [
    [
      "home.hero",
      {
        eyebrow: "Smart City Research Center · School of Engineering · KMITL",
        titleLine1: "ขับเคลื่อนเมืองอัจฉริยะ",
        titleLine2: "ด้วยงานวิจัยและนวัตกรรม",
        lead:
          "ศูนย์วิจัย Smart City แห่งสถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง พัฒนาโซลูชันจากงานวิจัยสู่การใช้งานจริง ร่วมกับหน่วยงานภาครัฐและเอกชน",
        stats: [
          { value: "12+", label: "โครงการที่ส่งมอบ" },
          { value: "8", label: "หน่วยงานพาร์ทเนอร์" },
          { value: "5", label: "จังหวัดที่ใช้งานจริง" },
        ],
      },
      {
        eyebrow: "Smart City Research Center · School of Engineering · KMITL",
        titleLine1: "Driving smart cities",
        titleLine2: "with research & innovation",
        lead:
          "The smart-city research center of King Mongkut's Institute of Technology Ladkrabang — turning research into real-world solutions with government and private partners.",
        stats: [
          { value: "12+", label: "Projects delivered" },
          { value: "8", label: "Partner organizations" },
          { value: "5", label: "Provinces in production" },
        ],
      },
    ],
    [
      "site.contact",
      {
        address: "คณะวิศวกรรมศาสตร์ สจล. เลขที่ 1 ซอยฉลองกรุง 1 เขตลาดกระบัง กรุงเทพฯ 10520",
        phone: "0-2329-8000 (ตัวอย่าง)",
        email: "kmitlsmartcity2024@gmail.com",
        hours: "จันทร์–ศุกร์ 09:00–17:00 น.",
      },
      {
        address: "Faculty of Engineering, KMITL, 1 Chalong Krung 1, Ladkrabang, Bangkok 10520",
        phone: "0-2329-8000 (sample)",
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
    await prisma.siteContent.upsert({
      where: { key },
      update: data,
      create: { key, ...data },
    });
  }

  /* ---------- Block: เนื้อหารายการซ้ำ ๆ ที่แก้ผ่าน admin ได้ (Phase 6B) ----------
     ใส่เฉพาะตอนที่กลุ่มนั้นยังว่าง — จะได้ไม่ทับของที่ทีมแก้ไปแล้ว */
  const seedBlocks = async (
    group: string,
    rows: Array<{ titleTh: string; titleEn?: string; subtitleTh?: string; subtitleEn?: string; bodyTh?: string; bodyEn?: string }>,
  ) => {
    if ((await prisma.block.count({ where: { group } })) > 0) return;
    await prisma.block.createMany({
      data: rows.map((r, i) => ({ ...r, group, order: i + 1 })),
    });
  };

  await seedBlocks("home.pillars", [
    {
      titleTh: "งานวิจัย", titleEn: "Research", subtitleTh: "Research", subtitleEn: "Research",
      bodyTh: "<p>พัฒนาองค์ความรู้ด้าน AI, IoT และ Data Analytics สำหรับบริบทเมืองไทย ตีพิมพ์และต่อยอดร่วมกับเครือข่ายวิชาการ</p>",
      bodyEn: "<p>Advancing AI, IoT and data analytics for the Thai urban context, published and extended with academic networks.</p>",
    },
    {
      titleTh: "นวัตกรรมต้นแบบ", titleEn: "Prototype", subtitleTh: "Prototype", subtitleEn: "Innovation",
      bodyTh: "<p>แปลงงานวิจัยเป็นระบบต้นแบบที่ติดตั้งใช้งานได้จริง ทดสอบในพื้นที่จริงร่วมกับหน่วยงานท้องถิ่น</p>",
      bodyEn: "<p>Turning research into deployable prototype systems, field-tested with local government partners.</p>",
    },
    {
      titleTh: "บริการวิชาการ", titleEn: "Academic Service", subtitleTh: "Service", subtitleEn: "Service",
      bodyTh: "<p>ให้คำปรึกษา ฝึกอบรม และถ่ายทอดเทคโนโลยีให้หน่วยงานรัฐ เอกชน และชุมชนที่ต้องการพัฒนาเมืองอัจฉริยะ</p>",
      bodyEn: "<p>Consulting, training and technology transfer for government, private sector and communities.</p>",
    },
  ]);

  await seedBlocks("home.techs", [
    {
      titleTh: "IoT & Sensor Network", titleEn: "IoT & Sensor Network",
      bodyTh: "<p>เครือข่ายเซนเซอร์เก็บข้อมูลเมืองแบบเรียลไทม์ ทั้งจราจร สิ่งแวดล้อม และพลังงาน เชื่อมต่อผ่าน LoRa / NB-IoT / 5G</p>",
      bodyEn: "<p>Real-time city sensing — traffic, environment and energy — connected over LoRa / NB-IoT / 5G.</p>",
    },
    {
      titleTh: "AI & Computer Vision", titleEn: "AI & Computer Vision",
      bodyTh: "<p>วิเคราะห์ภาพจากกล้อง CCTV ตรวจจับยานพาหนะ บุคคล และเหตุการณ์ผิดปกติ ประมวลผลได้แบบเรียลไทม์</p>",
      bodyEn: "<p>CCTV analytics detecting vehicles, people and anomalies in real time.</p>",
    },
    {
      titleTh: "Big Data & City Platform", titleEn: "Big Data & City Platform",
      bodyTh: "<p>แพลตฟอร์มรวมศูนย์ข้อมูลเมือง (City Data Platform) พร้อมแดชบอร์ดสำหรับผู้บริหารเมืองใช้ตัดสินใจ</p>",
      bodyEn: "<p>A centralized City Data Platform with dashboards for decision makers.</p>",
    },
    {
      titleTh: "Digital Twin & Simulation", titleEn: "Digital Twin & Simulation",
      bodyTh: "<p>แบบจำลองเมืองเสมือนสำหรับทดลองนโยบายและจำลองสถานการณ์ ก่อนลงทุนจริงในพื้นที่</p>",
      bodyEn: "<p>Virtual city models to test policies and scenarios before real investment.</p>",
    },
  ]);

  await seedBlocks("about.timeline", [
    {
      subtitleTh: "2564", subtitleEn: "2021", titleTh: "ก่อตั้งศูนย์วิจัย SMC", titleEn: "SMC founded",
      bodyTh: "<p>รวมทีมวิจัยด้าน AI / IoT ก่อตั้งศูนย์วิจัยเมืองอัจฉริยะที่ สจล.</p>",
      bodyEn: "<p>AI / IoT researchers founded the smart-city research center at KMITL.</p>",
    },
    {
      subtitleTh: "2565", subtitleEn: "2022", titleTh: "โครงการนำร่องแรก", titleEn: "First pilot project",
      bodyTh: "<p>ทดลองระบบจราจรอัจฉริยะร่วมกับเทศบาลตัวอย่าง เก็บข้อมูลและปรับปรุงระบบจากการใช้งานจริง</p>",
      bodyEn: "<p>Piloted an intelligent traffic system with a partner municipality, iterating from real usage.</p>",
    },
    {
      subtitleTh: "2566", subtitleEn: "2023", titleTh: "ขยายเครือข่ายความร่วมมือ", titleEn: "Growing partnerships",
      bodyTh: "<p>ลงนาม MOU กับหน่วยงาน 3 แห่ง และเปิดตัว City Data Platform เวอร์ชันแรก</p>",
      bodyEn: "<p>Signed MOUs with 3 organizations and launched the first City Data Platform.</p>",
    },
    {
      subtitleTh: "2567–ปัจจุบัน", subtitleEn: "2024–present", titleTh: "ขยายผลสู่ 5 จังหวัด", titleEn: "Scaling to 5 provinces",
      bodyTh: "<p>นำโซลูชัน Smart CCTV และระบบตรวจวัดสิ่งแวดล้อมไปติดตั้งใช้งานจริงในหลายพื้นที่</p>",
      bodyEn: "<p>Deployed Smart CCTV and environmental monitoring solutions across multiple areas.</p>",
    },
  ]);

  await seedBlocks("about.story", [
    {
      titleTh: "ย่อหน้าที่ 1", titleEn: "Paragraph 1",
      bodyTh: "<p>Smart City Research Center (SMC) ก่อตั้งขึ้นโดยทีมอาจารย์และนักวิจัย คณะวิศวกรรมศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง จากความตั้งใจที่จะนำงานวิจัยด้าน AI, IoT และข้อมูลเมือง ออกจากห้องวิจัยไปสู่การใช้งานจริง</p>",
      bodyEn: "<p>Smart City Research Center (SMC) was founded by faculty and researchers of the Faculty of Engineering, KMITL, with the intent of taking AI, IoT and urban-data research out of the research center and into the real world.</p>",
    },
    {
      titleTh: "ย่อหน้าที่ 2", titleEn: "Paragraph 2",
      bodyTh: "<p>ปัจจุบันศูนย์วิจัยทำงานร่วมกับเทศบาล หน่วยงานภาครัฐ และภาคเอกชนหลายแห่ง ทั้งโครงการนำร่องและโครงการติดตั้งจริง ครอบคลุมระบบจราจร ความปลอดภัย สิ่งแวดล้อม และแพลตฟอร์มข้อมูลเมือง</p>",
      bodyEn: "<p>Today the center works with municipalities, government agencies and private partners on both pilots and production deployments — covering traffic, safety, environment and city data platforms.</p>",
    },
  ]);

  const blockCount = await prisma.block.count();
  console.log(`✅ Seed เสร็จ (TH+EN): admin 1, solutions 8, partners 8, posts 6, contents 3, blocks ${blockCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
