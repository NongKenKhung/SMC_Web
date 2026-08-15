import "./env"; /* โหลด .env รวมจาก root — ต้องมาก่อน import อื่นทั้งหมด */
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { extname } from "node:path";
import { AppModule } from "./app.module";
import { IMAGE_EXTS, UPLOAD_DIR } from "./media/media.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(UPLOAD_DIR, {
    prefix: "/uploads",
    index: false,
    dotfiles: "deny",
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      // ไฟล์ที่ไม่ใช่รูป (pdf/office/zip) ห้ามเปิด inline — บังคับดาวน์โหลดเสมอ
      if (!IMAGE_EXTS.has(extname(filePath).toLowerCase())) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  });
  app.setGlobalPrefix("api");

  /* เบราว์เซอร์ไม่ได้ยิงมาที่ API ตรง ๆ — ยิงไปที่ Next แล้ว Next ส่งต่อมาให้
     ถ้าไม่บอก express ว่าอยู่หลัง proxy req.ip จะเป็น IP ของ Next (หรือของ Caddy/Cloudflare
     ตอน deploy) เหมือนกันหมดทุกคน ทำให้ตัวจำกัดจำนวนครั้งของฟอร์มติดต่อกลายเป็นโควตารวม
     ของทั้งเว็บ คนที่ 6 ใน 10 นาทีจะส่งไม่ได้ทั้งที่เป็นคนละคน
     ตั้งค่านี้แล้ว express จะอ่าน IP จริงจาก X-Forwarded-For ที่ตัวหน้าส่งต่อมา */
  app.set("trust proxy", process.env.TRUST_PROXY ?? true);

  // dev: สะท้อน origin ที่เรียกมา (localhost ทุกพอร์ต) | production: ล็อกด้วย WEB_ORIGIN
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 SMC API: http://localhost:${port}/api`);
}
bootstrap();
