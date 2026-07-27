import "./env"; /* โหลด .env รวมจาก root — ต้องมาก่อน import อื่นทั้งหมด */
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { UPLOAD_DIR } from "./admin/admin.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(UPLOAD_DIR, { prefix: "/uploads" });
  app.setGlobalPrefix("api");
  // dev: สะท้อน origin ที่เรียกมา (localhost ทุกพอร์ต) | production: ล็อกด้วย WEB_ORIGIN
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 SML API: http://localhost:${port}/api`);
}
bootstrap();
