import { Controller, Get, Injectable, Module, NotFoundException, Param } from "@nestjs/common";
import { AttachmentsService, MediaModule } from "../media/media.module";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class SolutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachments: AttachmentsService,
  ) {}

  /** โครงต้นไม้ 2 ชั้น (หมวด → หัวข้อย่อย) สำหรับเมนู dropdown และหน้า hub */
  async findTree() {
    const rows = await this.prisma.solution.findMany({
      where: { parentId: null, published: true },
      orderBy: { order: "asc" },
      select: {
        id: true, slug: true, nameTh: true, nameEn: true,
        summaryTh: true, summaryEn: true, icon: true, order: true, price: true,
        children: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: {
            id: true, slug: true, nameTh: true, nameEn: true,
            summaryTh: true, summaryEn: true, icon: true, order: true, price: true,
          },
        },
      },
    });
    return rows.map((r) => ({
      ...r,
      price: toNumber(r.price),
      children: r.children.map((c) => ({ ...c, price: toNumber(c.price) })),
    }));
  }

  async findBySlug(slug: string) {
    const solution = await this.prisma.solution.findFirst({
      where: { slug, published: true },
      include: {
        parent: { select: { slug: true, nameTh: true, nameEn: true } },
        children: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: { slug: true, nameTh: true, nameEn: true, summaryTh: true, summaryEn: true },
        },
      },
    });
    if (!solution) throw new NotFoundException(`ไม่พบ solution: ${slug}`);
    // แนบ poster / แกลเลอรี / ไฟล์ดาวน์โหลด (Phase 6A)
    const media = await this.attachments.grouped("SOLUTION", String(solution.id));
    return { ...solution, price: toNumber(solution.price), ...media };
  }
}

/** Prisma คืน Decimal เป็นอ็อบเจ็กต์ decimal.js ซึ่ง JSON.stringify แปลงเป็น "สตริง"
 *  ฝั่งเว็บจะได้ค่าที่ต้องแปลงเองทุกที่ จึงแปลงเป็นตัวเลขตั้งแต่ตรงนี้ครั้งเดียว
 *  (ราคาหลักล้านยังห่างจาก Number.MAX_SAFE_INTEGER มาก ไม่มีปัญหาความแม่นยำ) */
function toNumber(v: unknown): number | null {
  return v == null ? null : Number(v);
}

@Controller("solutions")
export class SolutionsController {
  constructor(private readonly service: SolutionsService) {}

  @Get()
  tree() {
    return this.service.findTree();
  }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }
}

@Module({
  imports: [MediaModule], // ต้องมี ไม่งั้น inject AttachmentsService ไม่ได้ตอน runtime
  providers: [SolutionsService],
  controllers: [SolutionsController],
})
export class SolutionsModule {}
