/* Admin CRUD ทั้งหมด — ทุก controller ครอบด้วย JwtAuthGuard
   (เฟสถัดไปถ้าไฟล์โตค่อยแยกเป็น feature ละไฟล์) */
import {
  Body, Controller, Delete, Get, Module, Param,
  ParseIntPipe, Patch, Post, Put, UseGuards,
} from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";

/* ---------- DTOs ---------- */
class SolutionDto {
  @IsString() @MinLength(1) @MaxLength(80)
  slug!: string;

  @IsString() @MinLength(1) @MaxLength(200)
  nameTh!: string;

  @IsOptional() @IsString() @MaxLength(200)
  nameEn?: string;

  @IsOptional() @IsString()
  summaryTh?: string;

  @IsOptional() @IsString()
  summaryEn?: string;

  @IsOptional() @IsString()
  bodyTh?: string;

  @IsOptional() @IsString()
  bodyEn?: string;

  @IsOptional() @IsString() @MaxLength(300)
  coverImage?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  parentId?: number | null;

  @IsOptional() @Type(() => Number) @IsInt()
  order?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
class SolutionPatchDto extends SolutionDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80)
  declare slug: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  declare nameTh: string;
}

class PartnerDto {
  @IsString() @MinLength(1) @MaxLength(160)
  name!: string;

  @IsOptional() @IsString() @MaxLength(160)
  caption?: string;

  @IsOptional() @IsString() @MaxLength(300)
  logoUrl?: string;

  @IsOptional() @IsString() @MaxLength(300)
  websiteUrl?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  order?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
class PartnerPatchDto extends PartnerDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160)
  declare name: string;
}

class PostDto {
  @IsString() @MinLength(1) @MaxLength(120)
  slug!: string;

  @IsString() @MinLength(1) @MaxLength(300)
  titleTh!: string;

  @IsOptional() @IsString() @MaxLength(300)
  titleEn?: string;

  @IsOptional() @IsString()
  excerptTh?: string;

  @IsOptional() @IsString()
  excerptEn?: string;

  @IsOptional() @IsString()
  bodyTh?: string;

  @IsOptional() @IsString()
  bodyEn?: string;

  @IsOptional() @IsString() @MaxLength(300)
  coverImage?: string;

  @IsIn(["ACTIVITY", "NEWS", "WORK"])
  category!: string;

  @IsOptional() @IsString()
  publishedAt?: string;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
class PostPatchDto extends PostDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  declare slug: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(300)
  declare titleTh: string;

  @IsOptional() @IsIn(["ACTIVITY", "NEWS", "WORK"])
  declare category: string;
}

class ContentDto {
  @IsOptional()
  valueTh?: unknown;

  @IsOptional()
  valueEn?: unknown;
}

/* ---------- Solutions ---------- */
@UseGuards(JwtAuthGuard)
@Controller("admin/solutions")
export class AdminSolutionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.solution.findMany({
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
    });
  }

  @Post()
  create(@Body() dto: SolutionDto) {
    return this.prisma.solution.create({ data: { ...dto } });
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: SolutionPatchDto) {
    return this.prisma.solution.update({ where: { id }, data: { ...dto } });
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.prisma.solution.deleteMany({ where: { parentId: id } });
    await this.prisma.solution.delete({ where: { id } });
    return { ok: true };
  }
}

/* ---------- Partners ---------- */
@UseGuards(JwtAuthGuard)
@Controller("admin/partners")
export class AdminPartnersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.partner.findMany({ orderBy: { order: "asc" } });
  }

  @Post()
  create(@Body() dto: PartnerDto) {
    return this.prisma.partner.create({ data: { ...dto } });
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: PartnerPatchDto) {
    return this.prisma.partner.update({ where: { id }, data: { ...dto } });
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.prisma.partner.delete({ where: { id } });
    return { ok: true };
  }
}

/* ---------- Posts ---------- */
@UseGuards(JwtAuthGuard)
@Controller("admin/posts")
export class AdminPostsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.post.findMany({ orderBy: { publishedAt: "desc" } });
  }

  @Post()
  create(@Body() dto: PostDto) {
    const { publishedAt, ...rest } = dto;
    return this.prisma.post.create({
      data: { ...rest, ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}) },
    });
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: PostPatchDto) {
    const { publishedAt, ...rest } = dto;
    return this.prisma.post.update({
      where: { id },
      data: { ...rest, ...(publishedAt ? { publishedAt: new Date(publishedAt) } : {}) },
    });
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }
}

/* ---------- Site content ---------- */
@UseGuards(JwtAuthGuard)
@Controller("admin/content")
export class AdminContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const rows = await this.prisma.siteContent.findMany();
    return rows.map((r) => ({
      key: r.key,
      valueTh: r.valueTh ? JSON.parse(r.valueTh) : null,
      valueEn: r.valueEn ? JSON.parse(r.valueEn) : null,
      updatedAt: r.updatedAt,
    }));
  }

  @Put(":key")
  async upsert(@Param("key") key: string, @Body() dto: ContentDto) {
    const data = {
      valueTh: dto.valueTh !== undefined ? JSON.stringify(dto.valueTh) : undefined,
      valueEn: dto.valueEn !== undefined ? JSON.stringify(dto.valueEn) : undefined,
    };
    await this.prisma.siteContent.upsert({
      where: { key },
      update: data,
      create: { key, valueTh: data.valueTh ?? null, valueEn: data.valueEn ?? null },
    });
    return { ok: true };
  }
}

/* ---------- กล่องข้อความติดต่อ ---------- */
@UseGuards(JwtAuthGuard)
@Controller("admin/messages")
export class AdminMessagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Patch(":id/read")
  async markRead(@Param("id", ParseIntPipe) id: number) {
    await this.prisma.contactMessage.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.prisma.contactMessage.delete({ where: { id } });
    return { ok: true };
  }
}

/* คลังสื่อ + ไฟล์แนบ ย้ายไปอยู่ที่ src/media/media.module.ts แล้ว (Phase 6A) */

@Module({
  controllers: [
    AdminSolutionsController,
    AdminPartnersController,
    AdminPostsController,
    AdminContentController,
    AdminMessagesController,
  ],
})
export class AdminModule {}
