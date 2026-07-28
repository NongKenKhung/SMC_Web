# เฟส 6 — Rich CMS (ปรับแต่งเว็บได้มากขึ้นผ่าน admin)

เป้าหมาย: ให้ทีมศูนย์วิจัยแก้เว็บได้เองเกือบทั้งหมด — ใส่ poster, แนบไฟล์, แกลเลอรีรูป,
จัดรูปแบบข้อความ, ใส่วิดีโอ/แผนที่, จัดการทีมและผลงานตีพิมพ์ โดยไม่ต้องแก้โค้ด

แบ่งเป็น 4 เฟสย่อย ทำเรียงกันได้ (แต่ละเฟสจบในตัว ใช้งานได้ทันที)

---

## 6A — สื่อ & ไฟล์ (ฐานของทุกอย่าง)

### ความสามารถ
| # | ความสามารถ | ใช้ที่ไหน |
|---|---|---|
| 1 | **คลังสื่อกลาง** — หน้ารวมไฟล์ที่เคยอัปโหลด ค้นหา/ลบ/แก้ alt เลือกใช้ซ้ำได้ | เมนู admin ใหม่ "คลังสื่อ" |
| 2 | **แนบไฟล์ดาวน์โหลด** — PDF/Word/Excel/PPT/ZIP แนบกับ solution/post | ปุ่มดาวน์โหลดพร้อมไอคอน+ขนาดไฟล์ |
| 3 | **แกลเลอรีหลายรูป** — ใส่หลายรูปต่อรายการ ลากจัดลำดับ ใส่คำบรรยาย | หน้า solution detail / post |
| 4 | **Poster / รูปพื้นหลัง** — อัปโหลดรูปพื้นหลัง hero และ banner แต่ละหน้า | แทน gradient เดิม (ถ้าไม่ใส่ = ใช้ gradient) |

### โครงข้อมูล (Prisma)

```prisma
model Media {                      // ขยายจากของเดิม
  id         Int      @id @default(autoincrement())
  filename   String                // ชื่อไฟล์ตอนอัปโหลด (ใช้เป็นชื่อตอนดาวน์โหลด)
  url        String                // /uploads/xxx
  mime       String
  size       Int
  kind       String   @default("IMAGE")   // IMAGE | FILE
  width      Int?
  height     Int?
  altTh      String?
  altEn      String?
  createdAt  DateTime @default(now())
  attachments Attachment[]
}

model Attachment {                 // ตารางกลาง: ผูก media เข้ากับรายการอะไรก็ได้
  id         Int    @id @default(autoincrement())
  mediaId    Int
  media      Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  ownerType  String                // SOLUTION | POST | PAGE
  ownerId    String                // id ของ solution/post หรือ slug ของหน้า
  role       String                // GALLERY | DOWNLOAD | POSTER
  order      Int    @default(0)
  captionTh  String?
  captionEn  String?

  @@index([ownerType, ownerId, role, order])
}
```

> ใช้ตารางเดียวคุมทั้ง แกลเลอรี/ไฟล์แนบ/poster — เพิ่มชนิดใหม่ภายหลังแค่เพิ่มค่า `role`

### API
- public: endpoint เดิม (`/solutions/:slug`, `/posts/:slug`, `/pages/:slug`) ส่ง `gallery[]`, `downloads[]`, `poster` มาด้วย
- admin: `GET/DELETE/PATCH /admin/media`, `POST /admin/attachments`, `PATCH /admin/attachments/reorder`, `DELETE /admin/attachments/:id`

### กติกาอัปโหลด (ความปลอดภัย)
| ชนิด | นามสกุลที่รับ | ขนาดสูงสุด |
|---|---|---|
| รูป | jpg, jpeg, png, webp, gif | 5 MB |
| ไฟล์ | pdf, doc(x), xls(x), ppt(x), zip | 20 MB |

- ตรวจทั้ง mimetype **และ** นามสกุล (กันเปลี่ยนนามสกุลหลอก)
- **ไม่รับ SVG** (ฝัง script ได้ → XSS) ถ้าจำเป็นต้องรับ ให้ sanitize ก่อนเก็บ
- ไฟล์ดาวน์โหลดเสิร์ฟด้วย `Content-Disposition: attachment` (เปิดในเบราว์เซอร์ไม่ได้ = กันไฟล์อันตราย)
- ชื่อไฟล์บนดิสก์สุ่มเสมอ (ทำอยู่แล้ว) เก็บชื่อจริงไว้ใน DB

### UI ที่ต้องสร้าง
- `MediaPicker` — modal เลือกจากคลัง/อัปโหลดใหม่ (ใช้ซ้ำได้ทุกที่)
- `AttachmentList` — ลิสต์ไฟล์แนบ ลากจัดลำดับ ใส่คำบรรยาย ลบ
- `GalleryEditor` — เหมือนข้างบนแต่แสดงเป็น thumbnail grid

---

## 6B — Rich text + เนื้อหายืดหยุ่น

### ความสามารถ
1. **Editor จัดรูปแบบได้** (TipTap): ตัวหนา/เอียง, หัวข้อ H2-H3, ลิสต์, ลิงก์, อ้างอิง, แทรกรูปจากคลังสื่อ, ตาราง
2. **ย้ายเนื้อหาที่ยัง hardcode เข้ามาแก้ได้** — 3 บทบาทศูนย์, เทคโนโลยี 4 ด้าน (accordion), timeline หน้า About, ฟีเจอร์ 6 ข้อของ solution

### โครงข้อมูล

```prisma
model Block {              // รายการซ้ำ ๆ ทุกชนิดใช้ตารางนี้ร่วมกัน
  id         Int     @id @default(autoincrement())
  group      String              // home.pillars | home.techs | about.timeline | solution.features:<id>
  order      Int     @default(0)
  published  Boolean @default(true)
  icon       String?             // ชื่อไอคอน หรือ url รูป
  titleTh    String
  titleEn    String?
  subtitleTh String?             // ใช้เป็น "ปี" ใน timeline / คำกำกับ
  subtitleEn String?
  bodyTh     String?
  bodyEn     String?
  image      String?
  meta       String?             // JSON เผื่อ field เฉพาะทาง

  @@index([group, order])
}
```

### ความปลอดภัย (สำคัญ)
HTML จาก editor ต้อง **sanitize ฝั่งเซิร์ฟเวอร์** ก่อนเก็บลง DB (ใช้ `sanitize-html`)
อนุญาตเฉพาะแท็กที่ต้องใช้ (p, h2-h4, strong, em, ul/ol/li, a, img, blockquote, table…)
ตัด `<script>`, `on*` handler, `javascript:` ทิ้ง — **ห้ามเชื่อ HTML จาก client เด็ดขาด**
ฝั่งแสดงผลใช้ `dangerouslySetInnerHTML` ได้เฉพาะกับ HTML ที่ผ่าน sanitize แล้วเท่านั้น

---

## 6C — วิดีโอ + แผนที่ + SEO

### ความสามารถ
1. **วิดีโอ** — ใส่ลิงก์ YouTube/Vimeo + รูป poster เอง (ตอนนี้เป็น placeholder)
2. **แผนที่** — ใส่พิกัด/ลิงก์ Google Maps ต่อสาขา (ตอนนี้เป็น placeholder)
3. **SEO ต่อหน้า** — title, description, OG image (ให้หน่วยงานค้นเจอใน Google + แชร์แล้วขึ้นรูปสวย)

### โครงข้อมูล

```prisma
model PageSetting {
  slug        String  @id          // home | about | solutions | partners | blog | contact
  titleTh     String?
  titleEn     String?
  descTh      String?
  descEn      String?
  ogImage     String?
  heroImage   String?              // poster ของ banner หน้านั้น (6A ใช้ร่วม)
  videoUrl    String?              // เฉพาะ home
  videoPoster String?
  mapEmbed    String?              // เฉพาะ contact
  updatedAt   DateTime @updatedAt
}
```

ฝั่ง Next.js ใช้ `generateMetadata()` ดึงค่าจากตารางนี้ต่อหน้า

---

## 6D — ทีม & ผลงานตีพิมพ์

```prisma
model TeamMember {
  id        Int     @id @default(autoincrement())
  nameTh    String
  nameEn    String?
  roleTh    String?              // ตำแหน่ง เช่น หัวหน้าศูนย์วิจัย
  roleEn    String?
  photo     String?
  email     String?
  bioTh     String?
  bioEn     String?
  links     String?              // JSON: {scholar, linkedin, website}
  order     Int     @default(0)
  published Boolean @default(true)
}

model Publication {
  id        Int     @id @default(autoincrement())
  titleTh   String
  titleEn   String?
  authors   String?
  venue     String?              // ชื่อวารสาร/งานประชุม
  year      Int?
  url       String?              // DOI หรือลิงก์ภายนอก
  fileUrl   String?              // ไฟล์ PDF จากคลังสื่อ
  order     Int     @default(0)
  published Boolean @default(true)
}
```

หน้าเว็บที่เพิ่ม: ส่วน "ทีมของเรา" ในหน้า About + หน้า/ส่วน "ผลงานตีพิมพ์"

---

## ลำดับที่แนะนำ

| เฟส | ได้อะไร | หมายเหตุ |
|---|---|---|
| **6A** | poster + แนบไฟล์ + แกลเลอรี + คลังสื่อ | ทำก่อน เพราะเฟสอื่นเรียกใช้ MediaPicker |
| **6B** | rich text + เนื้อหาที่ hardcode ย้ายเข้า admin | ต้องมี sanitize ให้เรียบร้อย |
| **6C** | วิดีโอ + แผนที่ + SEO | เล็กสุด ทำแทรกได้ตลอด |
| **6D** | ทีม + ผลงานตีพิมพ์ | เพิ่มหน้าใหม่ ไม่กระทบของเดิม |

## เช็กลิสต์ความปลอดภัยรวม
- [ ] ตรวจ mimetype + นามสกุล + ขนาดไฟล์ทุกการอัปโหลด
- [ ] ไม่รับ SVG (หรือ sanitize ก่อน)
- [ ] ไฟล์ดาวน์โหลดเสิร์ฟแบบ attachment ไม่ inline
- [ ] sanitize HTML จาก rich text ฝั่งเซิร์ฟเวอร์เสมอ
- [ ] ทุก endpoint admin อยู่หลัง JwtAuthGuard (ของเดิมทำแล้ว)
- [ ] ลบ media แล้วต้องลบไฟล์บนดิสก์ด้วย (กันขยะสะสม)
