# Image เดียวใช้ได้ทั้ง api และ web — compose สั่งคนละคำสั่งกัน
# ใช้ bookworm-slim (glibc) ไม่ใช่ alpine เพราะ prisma engine กับ sharp
# มี prebuilt binary สำหรับ glibc ครบกว่า ไม่ต้องคอมไพล์เอง
FROM node:24-bookworm-slim AS base
# openssl จำเป็นสำหรับ prisma query engine
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- ติดตั้ง dependency ----------
FROM base AS deps
# คัดลอกเฉพาะไฟล์ที่กำหนด dependency ก่อน เพื่อให้ layer นี้ถูกแคชไว้
# ตราบใดที่ dependency ไม่เปลี่ยน (แก้โค้ดแล้ว build ใหม่จะเร็ว)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# postinstall ที่ root สั่ง prisma generate จึงต้องมี schema อยู่ก่อน npm ci
COPY apps/api/prisma apps/api/prisma
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ค่าสองตัวนี้ถูกฝังลงไปตอน build ไม่ใช่ตอนรัน — เปลี่ยนทีหลังต้อง build ใหม่
#   NEXT_PUBLIC_SITE_URL : ใช้ใน sitemap / canonical / ลิงก์แชร์
#   NEXT_PUBLIC_API_URL  : ปลายทางของ rewrite /api และ /uploads (ชื่อ service ใน compose)
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3100
ARG NEXT_PUBLIC_API_URL=http://api:4000/api
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

# สร้าง /data/uploads ไว้ใน image พร้อมเจ้าของเป็น node
# docker จะคัดลอกสิทธิ์ของโฟลเดอร์นี้ไปตั้งให้ named volume ตอนสร้างครั้งแรก
# ถ้าไม่ทำ volume จะเป็นของ root แล้วโปรเซสที่รันเป็น node เขียนไฟล์อัปโหลดไม่ได้
RUN mkdir -p /data/uploads && chown -R node:node /data/uploads
USER node

# compose จะ override คำสั่งนี้ตาม service
CMD ["node", "apps/api/dist/src/main.js"]
