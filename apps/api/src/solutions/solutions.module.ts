import { Controller, Get, Injectable, Module, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class SolutionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** โครงต้นไม้ 2 ชั้น (หมวด → หัวข้อย่อย) สำหรับเมนู dropdown และหน้า hub */
  findTree() {
    return this.prisma.solution.findMany({
      where: { parentId: null, published: true },
      orderBy: { order: "asc" },
      select: {
        id: true, slug: true, nameTh: true, nameEn: true,
        summaryTh: true, summaryEn: true, icon: true, order: true,
        children: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: {
            id: true, slug: true, nameTh: true, nameEn: true,
            summaryTh: true, summaryEn: true, icon: true, order: true,
          },
        },
      },
    });
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
    return solution;
  }
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
  providers: [SolutionsService],
  controllers: [SolutionsController],
})
export class SolutionsModule {}
