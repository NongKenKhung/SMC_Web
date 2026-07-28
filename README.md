# SMC Web — Smart City Research Center (KMITL)

เว็บไซต์ศูนย์วิจัยเมืองอัจฉริยะ — monorepo
โลโก้: `apps/web/public/logo.png` (ตัวย่อ SMC)

## โครงสร้าง

```
apps/api          NestJS + Prisma  (REST API, พอร์ต 4000, prefix /api)
apps/web          Next.js          (เว็บ + หน้า admin ที่ /admin, พอร์ต 3100)
packages/shared   types ที่ใช้ร่วมกัน
```

ฐานข้อมูล: **PostgreSQL 16 ใน Docker** — container `sml-dev-db` พอร์ต **5430**
(แยกจาก container `sml_postgres` เดิมของเครื่องที่ใช้พอร์ต 5432 — อย่าสับสนกัน)

> พอร์ตนี้อยู่ใน `.env` **สองที่**: `DB_PORT` (docker-compose ใช้) และพอร์ตใน
> `DATABASE_URL` (Prisma/API ใช้) — แก้ต้องแก้ให้ตรงกันทั้งคู่ ไม่งั้น API จะขึ้น
> `Can't reach database server`

## ค่าตั้งค่า (.env ไฟล์เดียว)

ค่าตั้งค่าทั้งหมดอยู่ที่ **`.env` ที่ root** ไฟล์เดียว (ดูตัวอย่างที่ `.env.example`)
ทุกส่วนอ่านจากไฟล์นี้: docker-compose (DB), NestJS (`src/env.ts` ไต่หาไฟล์เอง),
Prisma CLI (ผ่าน `dotenv-cli` ใน scripts), Next.js (โหลดใน `next.config.mjs`)

> ห้ามสร้าง `.env` ย่อยใน `apps/*` อีก — ตัวไต่หาจะเจอไฟล์ย่อยก่อนไฟล์ root

## เริ่มใช้งาน (ครั้งแรก)

```bash
pnpm install
pnpm db:up                                       # สตาร์ท PostgreSQL (docker compose)
pnpm --filter @sml/api exec prisma migrate dev   # สร้างตาราง + ใส่ข้อมูลตัวอย่าง
```

## รัน dev

```bash
pnpm db:up      # ถ้า DB ยังไม่รัน (เปิดเครื่องใหม่ container จะขึ้นเองถ้า Docker เปิด)
pnpm dev        # รัน api (4000) + web (3100) พร้อมกัน
```

- เว็บ: http://localhost:3100
- Admin: http://localhost:3100/admin
- API ตัวอย่าง: http://localhost:4000/api/solutions

## บัญชีทดสอบ (seed)

- `admin@sml.local` / `ChangeMe123!`

## เฟสงาน

1. ✅ Scaffold: monorepo + Prisma schema + seed + API + หน้าเว็บ proof
2. ⬜ API ครบทุก endpoint + ฟอร์มติดต่อส่งอีเมล (กันสแปม)
3. ✅ แปลง mockup เป็นหน้าเว็บจริง + สองภาษา (th/en)
4. ✅ ระบบ admin (login, CRUD, อัปโหลดรูป)
5. ⬜ Deploy (PostgreSQL + Docker/VPS)
