#!/usr/bin/env bash
# ดึงข้อมูลจากเครื่องพัฒนาออกมาเป็นไฟล์ เพื่อเอาขึ้นเซิร์ฟเวอร์
# รันที่ root ของโปรเจกต์บนเครื่องตัวเอง:  bash deploy/export-data.sh
set -euo pipefail

OUT="deploy/data"
CONTAINER="${DB_CONTAINER:-sml-dev-db}"
# อ่าน DB_NAME จาก .env ให้ตรงกับที่ compose ใช้สร้างฐานข้อมูล
# ถ้าไม่อ่าน จะใช้ค่าเริ่มต้นซึ่งอาจไม่ตรงกับชื่อฐานข้อมูลจริงบนเซิร์ฟเวอร์
if [ -z "${DB_NAME:-}" ] && [ -f .env ]; then
  DB_NAME="$(grep -E '^DB_NAME=' .env | tail -1 | cut -d= -f2- | tr -d '"'"'"'' | xargs)"
fi
DB_NAME="${DB_NAME:-sml}"

mkdir -p "$OUT"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "ไม่พบ container ฐานข้อมูล '$CONTAINER' — สั่ง npm run db:up ก่อน" >&2
  exit 1
fi

echo "1/2 ดัมป์ฐานข้อมูล..."
# --no-owner/--no-acl: ไม่ผูกกับชื่อ role ของเครื่องต้นทาง เพื่อ restore ที่อื่นได้
# --clean --if-exists: restore ทับของเดิมได้โดยไม่ต้องลบฐานทิ้งก่อน
docker exec "$CONTAINER" pg_dump -U postgres -d "$DB_NAME" \
  --no-owner --no-acl --clean --if-exists > "$OUT/database.sql"

echo "2/2 บีบอัดไฟล์อัปโหลด..."
tar -czf "$OUT/uploads.tar.gz" -C apps/api uploads

echo
echo "เสร็จแล้ว:"
ls -lh "$OUT" | awk 'NR>1 {printf "  %-16s %s\n", $9, $5}'
echo
echo "ขั้นต่อไป — คัดลอกขึ้นเซิร์ฟเวอร์:"
echo "  gcloud compute scp --recurse deploy/data <ชื่อ-vm>:~/smc/deploy/ --zone <โซน>"
