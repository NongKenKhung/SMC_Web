#!/usr/bin/env bash
# นำข้อมูลที่ export มาจากเครื่องพัฒนาเข้าสแตกบนเซิร์ฟเวอร์
# รันที่ root ของโปรเจกต์บน VM:  bash deploy/import-data.sh
#
# ต้องสั่ง docker compose -f docker-compose.prod.yml up -d ให้สแตกขึ้นก่อน
set -euo pipefail

# รันแบบเปิด TLS ให้สั่ง: COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.tls.yml" bash deploy/import-data.sh
COMPOSE="docker compose ${COMPOSE_FILES:--f docker-compose.prod.yml}"
DIR="deploy/data"
# อ่าน DB_NAME จาก .env ให้ตรงกับที่ compose ใช้สร้างฐานข้อมูล
# ถ้าไม่อ่าน จะใช้ค่าเริ่มต้นซึ่งอาจไม่ตรงกับชื่อฐานข้อมูลจริงบนเซิร์ฟเวอร์
if [ -z "${DB_NAME:-}" ] && [ -f .env ]; then
  DB_NAME="$(grep -E '^DB_NAME=' .env | tail -1 | cut -d= -f2- | tr -d '"'"'"'' | xargs)"
fi
DB_NAME="${DB_NAME:-sml}"

[ -f "$DIR/database.sql" ]   || { echo "ไม่พบ $DIR/database.sql" >&2; exit 1; }
[ -f "$DIR/uploads.tar.gz" ] || { echo "ไม่พบ $DIR/uploads.tar.gz" >&2; exit 1; }

echo "ข้อมูลเดิมในฐานข้อมูลจะถูกเขียนทับ กด Ctrl+C ภายใน 5 วินาทีถ้ายังไม่ต้องการ"
sleep 5

echo "1/4 นำเข้าฐานข้อมูล..."
$COMPOSE exec -T db psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$DIR/database.sql" > /dev/null

echo "2/4 ส่งไฟล์อัปโหลดเข้า container..."
# ทำผ่าน container ที่ mount volume อยู่แล้ว จึงไม่ต้องรู้ชื่อ volume
# และไม่ต้อง mount path จากเครื่อง (ซึ่งมีปัญหาเรื่องรูปแบบ path บน Windows)
$COMPOSE cp "$DIR/uploads.tar.gz" api:/tmp/uploads.tar.gz

echo "3/4 แตกไฟล์ลงที่เก็บถาวร..."
$COMPOSE exec -T api sh -c '
  set -e
  tar -xzf /tmp/uploads.tar.gz -C /tmp
  cp -a /tmp/uploads/. /data/uploads/
  # ไฟล์ .tar.gz ถูก docker cp วางไว้ในนามของ root ส่วนโปรเซสนี้รันเป็น node จึงลบไม่ได้
  # ปล่อยไว้ได้ /tmp ของ container หายเองตอนรีสตาร์ตท้ายสคริปต์อยู่แล้ว
  rm -rf /tmp/uploads || true
'

echo "4/4 ตรวจผล..."
$COMPOSE exec -T db psql -U postgres -d "$DB_NAME" -At -c \
  "select '  solution=' || (select count(*) from \"Solution\") ||
          ' partner='  || (select count(*) from \"Partner\") ||
          ' media='    || (select count(*) from \"Media\") ||
          ' user='     || (select count(*) from \"User\");"
echo -n "  ไฟล์ในที่เก็บ: "
$COMPOSE exec -T api sh -c 'ls /data/uploads | wc -l'

echo
echo "รีสตาร์ตให้อ่านข้อมูลใหม่..."
$COMPOSE restart api web
echo "เสร็จแล้ว"
