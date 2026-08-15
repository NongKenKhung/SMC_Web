# ใบรับรองสำหรับ HTTPS

วางไฟล์สองไฟล์นี้ไว้ในโฟลเดอร์นี้บนเซิร์ฟเวอร์ (ห้าม commit เข้า git):

- `origin.pem`      — Origin Certificate จาก Cloudflare
- `origin-key.pem`  — Private Key คู่กัน

วิธีสร้าง: Cloudflare dashboard → SSL/TLS → Origin Server → Create Certificate
เลือก hostname `k-sml.com` และ `*.k-sml.com` อายุ 15 ปี

จากนั้นตั้ง SSL/TLS mode เป็น **Full (strict)** และเปิด proxy (เมฆสีส้ม) ไว้เสมอ
ใบรับรองชนิดนี้เบราว์เซอร์ไม่เชื่อถือโดยตรง มีแต่ Cloudflare ที่เชื่อ
