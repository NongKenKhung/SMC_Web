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
