import { Controller, DefaultValuePipe, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { AttachmentsService, MediaModule } from "../media/media.module";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attachments: AttachmentsService,
  ) {}

  findAll(category?: string, take = 20) {
    return this.prisma.post.findMany({
      where: {
        published: true,
        ...(category ? { category } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take,
      select: {
        id: true, slug: true, titleTh: true, titleEn: true,
        excerptTh: true, excerptEn: true, coverImage: true,
        category: true, publishedAt: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, published: true },
    });
    if (!post) throw new NotFoundException(`ไม่พบโพสต์: ${slug}`);
    // แนบ poster / แกลเลอรี / ไฟล์ดาวน์โหลด (Phase 6A)
    const media = await this.attachments.grouped("POST", String(post.id));
    return { ...post, ...media };
  }
}

@Controller("posts")
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Get()
  findAll(
    @Query("category") category?: string,
    @Query("take", new DefaultValuePipe(20), ParseIntPipe) take?: number,
  ) {
    return this.service.findAll(category, take);
  }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }
}

@Module({
  imports: [MediaModule],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
