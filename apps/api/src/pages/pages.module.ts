/* ค่าประจำ "หน้า" ของเว็บ (home/about/solutions/partners/blog/contact)
   Phase 6A: ใช้เก็บ poster ของ hero/banner เท่านั้น
   Phase 6C จะขยายเป็น SEO (title/description/OG) + วิดีโอ + แผนที่ */
import { Controller, Get, Module, Param } from "@nestjs/common";
import { AttachmentsService, MediaModule } from "../media/media.module";

export const PAGE_SLUGS = [
  "home", "about", "solutions", "partners", "blog", "contact",
] as const;

@Controller("pages")
export class PagesController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get(":slug")
  async bySlug(@Param("slug") slug: string) {
    const media = await this.attachments.grouped("PAGE", slug);
    return { slug, ...media };
  }
}

@Module({ imports: [MediaModule], controllers: [PagesController] })
export class PagesModule {}
