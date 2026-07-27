import { Controller, Get, Injectable, Module, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** คืนค่า content เป็น object (แปลงจาก JSON string ใน DB) */
  async findByKey(key: string) {
    const row = await this.prisma.siteContent.findUnique({ where: { key } });
    if (!row) throw new NotFoundException(`ไม่พบเนื้อหา: ${key}`);
    return {
      key: row.key,
      valueTh: row.valueTh ? JSON.parse(row.valueTh) : null,
      valueEn: row.valueEn ? JSON.parse(row.valueEn) : null,
      updatedAt: row.updatedAt,
    };
  }
}

@Controller("content")
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get(":key")
  byKey(@Param("key") key: string) {
    return this.service.findByKey(key);
  }
}

@Module({
  providers: [ContentService],
  controllers: [ContentController],
})
export class ContentModule {}
