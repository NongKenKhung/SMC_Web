# Deploy บน Google Cloud — Compute Engine VM + Docker

รันทั้งสแตก (Postgres + API + Web) ด้วย Docker บน VM ตัวเดียว โครงเดียวกับที่รันบนเครื่องพัฒนา
จึง**ไม่ต้องแก้โค้ด** และไฟล์ที่ admin อัปโหลดยังเก็บบนดิสก์ได้ตามปกติ

> ทำไมไม่ใช้ Cloud Run: ดิสก์ของ Cloud Run เป็นแบบชั่วคราว ไฟล์ที่อัปโหลดจะหายเมื่อ container
> รีสตาร์ตหรือ scale ต้องแก้โค้ดให้เก็บลง Cloud Storage ก่อน

---

## 1. สร้าง VM

```bash
gcloud compute instances create smc-web \
  --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --tags=http-server \
  --zone=asia-southeast1-a
```

เปิดพอร์ต 80 (ทำครั้งเดียวต่อโปรเจกต์):

```bash
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 --target-tags=http-server
```

ดิสก์ 30GB เผื่อไว้: ไฟล์อัปโหลดตอนนี้ 67 MB, image ราว 2 GB, ฐานข้อมูลเล็กมาก

## 2. ติดตั้ง Docker บน VM

```bash
gcloud compute ssh smc-web --zone=asia-southeast1-a
```

บน VM:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit
```

ออกแล้ว ssh เข้าใหม่อีกครั้งเพื่อให้สิทธิ์ docker มีผล

## 3. ส่งโค้ดขึ้น VM

ถ้า repo อยู่บน GitHub:

```bash
git clone <url ของ repo> ~/smc && cd ~/smc
```

หรือส่งจากเครื่องตัวเอง (ข้ามพวก node_modules ที่ไม่ต้องใช้):

```bash
gcloud compute scp --recurse --compress \
  Dockerfile docker-compose.prod.yml package.json package-lock.json apps packages deploy \
  smc-web:~/smc/ --zone=asia-southeast1-a
```

## 4. ตั้งค่า .env บน VM

สร้างไฟล์ `~/smc/.env`:

```bash
DB_NAME=sml
DB_PASSWORD=<สุ่มรหัสยาว ๆ>
JWT_SECRET=<สุ่มยาวอย่างน้อย 32 ตัว>

# ต้องเป็นที่อยู่จริงที่คนเข้าใช้ — ค่านี้ถูกฝังตอน build เปลี่ยนทีหลังต้อง build ใหม่
NEXT_PUBLIC_SITE_URL=http://<ip ของ vm>

# บัญชีผู้ดูแลชุดแรก (ใช้เฉพาะตอนยังไม่มีบัญชีในฐานข้อมูล)
ADMIN_EMAIL=admin@smc.local
ADMIN_PASSWORD=<ตั้งรหัสที่ยาวอย่างน้อย 10 ตัว>

# อีเมลแจ้งเตือนฟอร์มติดต่อ — เว้นว่าง = เก็บลงฐานข้อมูลอย่างเดียว ไม่ส่งอีเมล
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
CONTACT_NOTIFY_TO=

# ถ้าจะวาง reverse proxy ไว้หน้า 80 ค่อยเปลี่ยนพอร์ตนี้
# WEB_PORT=8080
```

สร้างค่าสุ่มได้ด้วย `openssl rand -base64 32`

## 5. สตาร์ตสแตก

```bash
cd ~/smc
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

ครั้งแรกใช้เวลา build หลายนาที ระบบจะรัน migration และสร้างบัญชีผู้ดูแลให้อัตโนมัติ
เปิด `http://<ip ของ vm>` ได้เลย (ยังไม่มีข้อมูล)

## 6. ย้ายข้อมูลจากเครื่องพัฒนา

**บนเครื่องตัวเอง** — ดัมป์ฐานข้อมูลและบีบอัดไฟล์อัปโหลด:

```bash
bash deploy/export-data.sh
```

ได้ `deploy/data/database.sql` กับ `deploy/data/uploads.tar.gz` แล้วส่งขึ้น VM:

```bash
gcloud compute scp --recurse --compress deploy/data smc-web:~/smc/deploy/ --zone=asia-southeast1-a
```

**บน VM** — นำเข้า:

```bash
cd ~/smc && bash deploy/import-data.sh
```

สคริปต์จะเขียนทับฐานข้อมูลบนเซิร์ฟเวอร์ด้วยข้อมูลจากเครื่องคุณ คัดลอกไฟล์อัปโหลดเข้าที่เก็บถาวร
แล้วรีสตาร์ตให้ ตอนจบจะพิมพ์จำนวนแถวและจำนวนไฟล์ให้ตรวจ

---

## อัปเดตเว็บทีหลัง

```bash
cd ~/smc && git pull
docker compose -f docker-compose.prod.yml up -d --build
```

ข้อมูลและไฟล์อัปโหลดอยู่ใน Docker volume จึงไม่หายตอน build ใหม่

## สำรองข้อมูล

ฐานข้อมูลกับไฟล์อัปโหลดอยู่บน VM ตัวเดียว ถ้า VM หายข้อมูลหายด้วย — ตั้ง cron สำรองไว้:

```bash
# ทุกวันตีสอง เก็บย้อนหลัง 14 วัน
0 2 * * * cd ~/smc && docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres -d sml --no-owner --no-acl | gzip > ~/backup/db-$(date +\%F).sql.gz \
  && find ~/backup -name 'db-*.sql.gz' -mtime +14 -delete
```

ไฟล์อัปโหลดสำรองด้วย `docker compose -f docker-compose.prod.yml cp api:/data/uploads ~/backup/uploads-$(date +%F)`
หรือใช้ snapshot ของดิสก์ VM ผ่าน Google Cloud ก็ได้

---

## ใช้โดเมน k-sml.com (Cloudflare) + HTTPS

nginx รับ HTTPS ที่ VM แล้วส่งต่อให้ Next ในเครือข่ายภายใน ใบรับรองใช้ **Cloudflare Origin
Certificate** ไม่ใช่ Let's Encrypt เพราะอายุ 15 ปีไม่ต้องต่อ และไม่ต้องเปิดพอร์ต 80 ให้
ACME challenge (ซึ่งทำไม่ได้อยู่แล้วเมื่อเปิด proxy ของ Cloudflare)

### 1. จอง static ip แล้วชี้ DNS

```bash
gcloud compute addresses create smc-web-ip --region=asia-southeast1
```

ที่ Cloudflare → DNS เพิ่ม 2 record ชี้มาที่ ip นั้น **เปิด proxy (เมฆสีส้ม) ทั้งคู่**

| Type | Name | Content |
|---|---|---|
| A | `k-sml.com` | `<ip ของ vm>` |
| A | `www` | `<ip ของ vm>` |

### 2. สร้างใบรับรอง

Cloudflare → SSL/TLS → **Origin Server** → Create Certificate
ใส่ hostname `k-sml.com` และ `*.k-sml.com` อายุ 15 ปี

คัดลอกสองก้อนที่ได้ไปวางบน VM:

```bash
mkdir -p ~/smc/deploy/certs
nano ~/smc/deploy/certs/origin.pem       # ก้อน Origin Certificate
nano ~/smc/deploy/certs/origin-key.pem   # ก้อน Private Key
chmod 600 ~/smc/deploy/certs/origin-key.pem
```

จากนั้นตั้ง SSL/TLS → Overview → encryption mode เป็น **Full (strict)**

> ใบรับรองชนิดนี้เบราว์เซอร์ไม่เชื่อถือโดยตรง มีแต่ Cloudflare ที่เชื่อ
> **ห้ามปิด proxy (เมฆเทา)** ไม่งั้นผู้เข้าชมจะเจอหน้าเตือนใบรับรองไม่ปลอดภัย

### 3. แก้ .env

```bash
NEXT_PUBLIC_SITE_URL=https://k-sml.com   # ถูกฝังตอน build — เปลี่ยนแล้วต้อง --build
WEB_PORT=127.0.0.1:8081                  # ปล่อย 80/443 ให้ nginx และไม่เปิด 3100 ออกนอกเครื่อง
```

### 4. สตาร์ตพร้อมชั้น TLS

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tls.yml up -d --build
```

### 5. ปิดทางเข้าตรงที่ไม่ผ่าน Cloudflare

ตอนนี้ใครรู้ ip ก็เข้าเว็บตรงได้โดยข้าม Cloudflare ให้จำกัดพอร์ต 80/443 ไว้เฉพาะ
[ช่วง ip ของ Cloudflare](https://www.cloudflare.com/ips/):

```bash
gcloud compute firewall-rules delete allow-http --quiet
gcloud compute firewall-rules create allow-cloudflare \
  --allow=tcp:80,tcp:443 --target-tags=http-server \
  --source-ranges=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,\
141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,\
198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22
```

### ที่ตั้งค่าไว้ให้แล้วใน [deploy/nginx.conf](deploy/nginx.conf)

- `http` เด้งไป `https` และ `www` เด้งมาโดเมนหลัก (กัน SEO แตกเป็นสองที่อยู่)
- `client_max_body_size 25m` — **สำคัญ** ค่าเริ่มต้นของ nginx คือ 1 MB
  ถ้าไม่ตั้ง การอัปโหลดโบรชัว (เพดาน 15 MB) จะโดน 413 ตั้งแต่ที่ nginx โดย API ไม่เห็นคำขอเลย
- `real_ip_header CF-Connecting-IP` + ช่วง ip ของ Cloudflare — ให้เห็น ip จริงของผู้เข้าชม
  ไม่งั้นทุกคนจะเป็น ip เดียวกัน แล้วตัวจำกัดจำนวนครั้งของฟอร์มติดต่อจะกลายเป็นโควตารวมทั้งเว็บ
- แคชยาวสำหรับ `/uploads/*` และ `/_next/static/*` (ชื่อไฟล์ไม่ซ้ำอยู่แล้ว)

> ต้องตั้ง `TRUST_PROXY` ใน `.env` ด้วยถ้าโครงสร้าง proxy เปลี่ยนไปจากนี้ —
> ค่าเริ่มต้นคือเชื่อ header ที่ตัวหน้าส่งมา ซึ่งถูกต้องเมื่อปิดทางเข้าตรงตามข้อ 5 แล้ว

## แก้ปัญหา

| อาการ | ตรวจ |
|---|---|
| เว็บขึ้นแต่ไม่มีข้อมูล | `docker compose -f docker-compose.prod.yml logs api` ดูว่า migration ผ่านไหม |
| รูปโบรชัวไม่ขึ้น | `docker compose -f docker-compose.prod.yml exec api ls /data/uploads \| wc -l` ต้องได้จำนวนไฟล์ |
| ล็อกอิน admin ไม่ได้ | ตั้ง `ADMIN_PASSWORD` ใน `.env` → `up -d` → `docker compose -f docker-compose.prod.yml exec api node apps/api/dist/prisma/admin-password.js` (เว้น `ADMIN_PASSWORD` ว่างไว้จะสุ่มรหัสให้แล้วพิมพ์บนหน้าจอครั้งเดียว) |
| อยากล้างไฟล์กำพร้า | `docker compose -f docker-compose.prod.yml exec api node apps/api/dist/prisma/clean-uploads.js` |
| แก้ `NEXT_PUBLIC_SITE_URL` แล้วไม่เปลี่ยน | ต้อง `up -d --build` ไม่ใช่แค่ `restart` |
