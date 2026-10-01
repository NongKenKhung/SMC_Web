#!/usr/bin/env bash
# อัปเดตเว็บบนเซิร์ฟเวอร์ (VM) — สำรองข้อมูลก่อน แล้วดึงโค้ด build สตาร์ตใหม่ และตรวจผล
#
# รันบน VM ที่โฟลเดอร์โปรเจกต์:   bash deploy/update.sh
#
# ตัวเลือก (ตั้งไว้หน้าคำสั่ง เช่น  FORCE=1 bash deploy/update.sh):
#   FORCE=1         build ใหม่แม้ไม่มีโค้ดใหม่ให้ดึง
#   SKIP_BACKUP=1   ข้ามการสำรองข้อมูล (ไม่แนะนำ — รอบที่มี migration ควรสำรองเสมอ)
#
# สิ่งที่สคริปต์นี้ "ไม่ทำ" โดยเจตนา:
#   - ไม่ลบ volume และไม่ใช้ docker system prune — เครื่องนี้มีเว็บและฐานข้อมูลของงานอื่นอยู่ด้วย
#   - ไม่ import ข้อมูลทับ (deploy/import-data.sh) — ข้อมูลบนเว็บจริงคือชุดล่าสุด
#   - ไม่แตะ nginx ของเครื่อง

# ห่อทั้งหมดไว้ใน main() แล้วค่อยเรียกที่บรรทัดสุดท้าย
# เพราะ bash อ่านสคริปต์ทีละช่วงระหว่างรัน ถ้าขั้น "ดึงโค้ด" ด้านล่างแก้ไฟล์นี้กลางทาง
# บรรทัดที่เหลือจะเพี้ยน — ห่อแบบนี้ bash ต้องอ่านทั้งไฟล์จนจบก่อนเริ่มทำงาน
main() {
  set -euo pipefail
  cd "$(dirname "$0")/.."

  local COMPOSE=(docker compose -f docker-compose.prod.yml)
  say()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
  ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
  warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
  die()  { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
  # อ่านค่าจาก .env — ทนทั้งเครื่องหมายคำพูดและ CRLF (ไฟล์อาจถูกแก้มาจาก Windows)
  envval() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r"'"'" | xargs; }

  # ---------- 0) ตรวจก่อนเริ่ม ----------
  say "0/6 ตรวจก่อนเริ่ม"
  [ -f .env ] || die "ไม่พบ .env — ต้องรันที่โฟลเดอร์โปรเจกต์บนเซิร์ฟเวอร์ (เช่น ~/smc)"
  local DB_NAME WEB_PORT BRANCH PREV FREE_GB
  DB_NAME="$(envval DB_NAME)"; DB_NAME="${DB_NAME:-sml}"
  WEB_PORT="$(envval WEB_PORT)"; WEB_PORT="${WEB_PORT:-80}"
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  PREV="$(git rev-parse --short HEAD)"
  # หลังสั่งย้อนกลับด้วย git checkout <commit> จะไม่ได้อยู่บน branch ไหน — ดึงโค้ดต่อไม่ได้
  [ "$BRANCH" != HEAD ] || die "ตอนนี้อยู่ที่ commit $PREV ไม่ได้อยู่บน branch (น่าจะเพิ่งย้อนกลับ) — สั่ง git checkout <ชื่อ branch> ก่อน"
  ok "branch $BRANCH · commit ปัจจุบัน $PREV · ฐานข้อมูล $DB_NAME · พอร์ตเว็บ $WEB_PORT"

  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    git status --short --untracked-files=no | sed 's/^/    /'
    die "มีไฟล์ถูกแก้บนเซิร์ฟเวอร์ — ดึงโค้ดแล้วจะชนกัน ดูด้วย git diff ก่อน แล้วค่อยรันใหม่"
  fi

  FREE_GB=$(df -BG --output=avail . | tail -1 | tr -dc '0-9')
  if [ "${FREE_GB:-0}" -lt 4 ]; then
    warn "พื้นที่ว่างเหลือ ${FREE_GB}GB — ล้างแคชการ build ของ docker ก่อน (ไม่แตะ volume หรือข้อมูล)"
    docker builder prune -f >/dev/null
    FREE_GB=$(df -BG --output=avail . | tail -1 | tr -dc '0-9')
    [ "$FREE_GB" -ge 4 ] || die "พื้นที่ว่างเหลือ ${FREE_GB}GB ไม่พอ build (ต้องมีอย่างน้อย 4GB) — ขยายดิสก์ก่อน"
  fi
  ok "พื้นที่ว่าง ${FREE_GB}GB"

  # ---------- 1) ดูว่ามีอะไรใหม่ ----------
  say "1/6 ดูว่ามีอะไรใหม่บน origin/$BRANCH"
  git fetch --quiet origin "$BRANCH"
  local NEW
  NEW=$(git rev-list --count HEAD..FETCH_HEAD)
  if [ "$NEW" -eq 0 ] && [ "${FORCE:-0}" != 1 ]; then
    ok "ไม่มีโค้ดใหม่ — ไม่ต้องทำอะไร (ถ้าจะ build ใหม่อยู่ดี ใช้ FORCE=1)"
    exit 0
  fi
  git log --oneline HEAD..FETCH_HEAD | sed 's/^/    /'
  # เก็บผลใส่ตัวแปรก่อน ไม่ใช้ grep -q ต่อท่อตรง ๆ — ภายใต้ pipefail ถ้า grep -q เจอแล้วปิดท่อก่อน
  # git diff จะถูกตัดท่อ ทั้งสายนับเป็นล้มเหลว แล้วสคริปต์จะสรุปผิดว่าไม่มี migration
  local MIG
  MIG=$(git diff --name-only HEAD FETCH_HEAD | grep 'prisma/migrations/.*migration.sql' || true)
  if [ -n "$MIG" ]; then
    warn "รอบนี้มี migration ฐานข้อมูล (จะรันอัตโนมัติตอน api เริ่ม):"
    printf '%s\n' "$MIG" | sed 's/^/      /'
  fi

  # ---------- 2) สำรองข้อมูล ----------
  say "2/6 สำรองข้อมูล"
  local BK=""
  if [ "${SKIP_BACKUP:-0}" = 1 ]; then
    warn "ข้าม (SKIP_BACKUP=1)"
  else
    BK="$HOME/backup/predeploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BK"
    # --clean --if-exists: เอาไฟล์นี้คืนทับฐานข้อมูลเดิมได้ตรง ๆ โดยไม่ต้องลบฐานทิ้งก่อน
    if ! "${COMPOSE[@]}" exec -T db pg_dump -U postgres -d "$DB_NAME" --no-owner --no-acl --clean --if-exists \
         | gzip > "$BK/db.sql.gz"; then
      rm -rf "$BK"  # ไม่ทิ้งไฟล์สำรองเปล่าไว้ให้เข้าใจผิดว่ามีของสำรอง
      die "สำรองฐานข้อมูลไม่สำเร็จ — หยุดไว้ก่อน ยังไม่ deploy (container db รันอยู่ไหม: docker compose -f docker-compose.prod.yml ps)"
    fi
    gzip -t "$BK/db.sql.gz" || die "ไฟล์สำรองฐานข้อมูลเสีย — หยุดไว้ก่อน ยังไม่ deploy"
    # ไฟล์สำรองที่ไม่มีตารางเลย แปลว่าดัมป์ผิดฐาน — อย่าเดินต่อโดยเชื่อว่ามีของสำรอง
    [ "$(gunzip -c "$BK/db.sql.gz" | grep -c 'CREATE TABLE')" -gt 0 ] \
      || die "ไฟล์สำรองไม่มีตารางเลย — ชื่อฐานข้อมูล '$DB_NAME' อาจไม่ตรงกับของจริง"
    # ไฟล์อัปโหลดไม่ถูก migration แตะ ถ้าสำรองไม่ได้ (เช่น api ไม่ได้รันอยู่) ให้เตือนแล้วไปต่อ
    if "${COMPOSE[@]}" exec -T api tar -czf - -C /data uploads > "$BK/uploads.tar.gz" 2>/dev/null; then
      ok "ไฟล์อัปโหลด"
    else
      rm -f "$BK/uploads.tar.gz"; warn "สำรองไฟล์อัปโหลดไม่ได้ (api ไม่ได้รันอยู่?) — ฐานข้อมูลสำรองแล้ว ไปต่อ"
    fi
    ok "เก็บไว้ที่ $BK ($(du -sh "$BK" | cut -f1))"
  fi

  # ---------- 3) ดึงโค้ด ----------
  say "3/6 ดึงโค้ด"
  # ข้อความจาก git ด้านบนบอกสาเหตุจริง — มักเป็นไฟล์ที่ไม่ได้อยู่ใน git ขวางอยู่ หรือประวัติแยกจาก origin
  git merge --ff-only --quiet FETCH_HEAD \
    || die "ดึงโค้ดไม่สำเร็จ — ดูข้อความของ git ด้านบน (ยังไม่ได้ build หรือเปลี่ยนอะไรบนเว็บ)"
  local NOW
  NOW="$(git rev-parse --short HEAD)"
  ok "$PREV → $NOW"

  # ---------- 4) build + สตาร์ตใหม่ ----------
  say "4/6 build และสตาร์ตใหม่ — ระหว่าง build เว็บเดิมยังเปิดให้ใช้อยู่ (ใช้เวลาหลายนาที)"
  "${COMPOSE[@]}" up -d --build

  # ---------- 5) รอ api พร้อม ----------
  say "5/6 รอระบบพร้อม (api รัน migration ก่อนเริ่ม)"
  local code="000" i
  for i in $(seq 1 60); do
    # ยิงผ่านพอร์ตของเว็บ — ได้ทดสอบทั้ง web และการส่งต่อ /api ไปที่ api ในครั้งเดียว
    code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "http://127.0.0.1:$WEB_PORT/api/solutions" || true)
    [ "$code" = 200 ] && break
    sleep 5
  done
  "${COMPOSE[@]}" logs --no-color api 2>/dev/null \
    | grep -E "migration|Migration|No pending|Error|error" | tail -6 | sed 's/^/    /' || true
  if [ "$code" != 200 ]; then
    "${COMPOSE[@]}" logs --no-color --tail 40 api | sed 's/^/    /'
    rollback_help "$PREV" "$BK" "$DB_NAME"
    die "api ไม่พร้อมภายใน 5 นาที (ได้ HTTP $code) — ดู log ด้านบน"
  fi
  ok "api ตอบ 200"

  # ---------- 6) ตรวจหน้าเว็บ ----------
  say "6/6 ตรวจหน้าเว็บ"
  local FAILED=0 path
  for path in /th /en /th/solutions /th/partners /api/solutions; do
    code=$(curl -s -o /dev/null -m 30 -w '%{http_code}' "http://127.0.0.1:$WEB_PORT$path" || true)
    if [ "$code" = 200 ]; then ok "$path → $code"; else warn "$path → $code"; FAILED=1; fi
  done

  # ลบเฉพาะ image ไม่มีชื่อที่ค้างจาก build รอบก่อน — ไม่แตะ volume, container หรือ image ของงานอื่น
  docker image prune -f >/dev/null && ok "ล้าง image เก่าที่ไม่ได้ใช้แล้ว"

  if [ "$FAILED" = 1 ]; then
    rollback_help "$PREV" "$BK" "$DB_NAME"
    die "มีหน้าที่ไม่ตอบ 200 — ตรวจด้วย: docker compose -f docker-compose.prod.yml logs --tail 80 web"
  fi
  printf '\n\033[1;32m✓ อัปเดตเสร็จ: %s → %s\033[0m\n' "$PREV" "$NOW"
  rollback_help "$PREV" "$BK" "$DB_NAME"
}

# วิธีย้อนกลับ — พิมพ์ทุกครั้ง จะได้มีคำสั่งพร้อมใช้ถ้าเจอปัญหาทีหลัง
rollback_help() {
  local prev="$1" bk="$2" db="$3"
  printf '\n  ถ้าต้องย้อนกลับ:\n'
  printf '    โค้ด:   git checkout %s && docker compose -f docker-compose.prod.yml up -d --build\n' "$prev"
  printf '            (กลับมาใช้ branch ล่าสุดทีหลังด้วย git checkout -)\n'
  if [ -n "$bk" ]; then
    printf '    ฐานข้อมูล (เฉพาะกรณีจำเป็น — migration ที่เพิ่มคอลัมน์อย่างเดียว โค้ดเก่ายังใช้ต่อได้ ไม่ต้องคืน):\n'
    printf '            gunzip -c %s/db.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d %s\n' "$bk" "$db"
  fi
}

main "$@"
